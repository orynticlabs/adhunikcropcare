import "server-only"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { restoreOrderInventory, selectOrderRowById, type StorefrontOrderRow } from "@/lib/storefront-orders"
import {
  assignAwb,
  cancelPickup,
  cancelShiprocketOrder,
  cancelShiprocketShipment,
  createShiprocketOrder,
  generateInvoice,
  generateLabel,
  generateManifest,
  getTrackingByAwb,
  requestPickup,
  reschedulePickup,
  ShiprocketError,
  type CreateOrderPayload,
} from "@/lib/shiprocket/client"
import { getShiprocketSettings } from "@/lib/shiprocket/settings"
import { enqueueJob } from "@/lib/shiprocket/jobs"
import { getShipmentByOrderId, serializeShipment, serializeShipmentEvent, listShipmentEvents, SHIPMENT_SELECT } from "@/lib/shiprocket/shipments"
import { isInventoryRestoringStatus, isPreDispatch, mapShiprocketStatus } from "@/lib/shiprocket/status"
import type { ShipmentRow, ShiprocketOrderStatus, ShiprocketTrackingEvent } from "@/lib/shiprocket/types"
import type { ShipmentNotificationType } from "@/lib/shiprocket/notification-settings"

type OrderContact = { email?: string; firstName?: string; lastName?: string; phone?: string } | null
type OrderAddress = { address1?: string; address2?: string; city?: string; pincode?: string; state?: string } | null
type OrderItem = { name?: string; price?: number; quantity?: number; qty?: number; size?: string; id?: string; productSlug?: string }

export type FulfillmentResult = {
  shipment: ReturnType<typeof serializeShipment>
  events: ReturnType<typeof serializeShipmentEvent>[]
  orderStatus: string
}

/**
 * Confirms an order and creates its Shiprocket shipment: create adhoc order →
 * assign best courier (AWB) → schedule pickup → persist shipment + first event +
 * advance order status. Idempotent: an existing shipment row short-circuits and
 * is returned as-is, so double-clicks / retries never create duplicates.
 */
export async function confirmAndCreateShipment(orderId: string): Promise<FulfillmentResult> {
  const existing = await getShipmentByOrderId(orderId)
  if (existing) return buildResult(existing)

  const settings = await getShiprocketSettings()
  if (!settings?.enabled) throw new ShiprocketError("Shiprocket is not enabled. Configure it in Settings first.", 400)
  if (!settings.pickupLocation) throw new ShiprocketError("Set a Shiprocket pickup location in Settings first.", 400)

  const order = await selectOrderRowById(orderId)
  if (!order) throw new ShiprocketError("Order not found.", 404)

  const payload = buildCreateOrderPayload(order, settings.pickupLocation, settings.channelId, {
    length: settings.packageLengthCm,
    breadth: settings.packageBreadthCm,
    height: settings.packageHeightCm,
    weight: settings.packageWeightKg,
  })

  let created
  try {
    created = await createShiprocketOrder(payload, { orderId })
  } catch (error) {
    // Persist the failure so the Order Details "Retry" button can show code + message + count.
    await recordShipmentError(orderId, error)
    throw error
  }
  const shiprocketOrderId = created.order_id != null ? String(created.order_id) : null
  const shiprocketShipmentId = created.shipment_id != null ? String(created.shipment_id) : null

  // Persist immediately after create so a later failure (AWB/pickup) is recoverable
  // and never loses the Shiprocket IDs we already spent an API call to obtain.
  let shipment = await insertShipment({
    orderId,
    shiprocketOrderId,
    shiprocketShipmentId,
    awbCode: created.awb_code ?? null,
    courierName: created.courier_name ?? null,
    courierId: created.courier_company_id != null ? String(created.courier_company_id) : null,
    status: "created",
    statusCode: created.status_code != null ? String(created.status_code) : null,
    raw: created,
  })

  let awbCode = created.awb_code ?? null
  let courierName = created.courier_name ?? null
  let courierId = created.courier_company_id != null ? String(created.courier_company_id) : null
  let shippingCharge: number | null = null
  let pickupScheduled: string | null = null

  if (shiprocketShipmentId) {
    try {
      const awb = await assignAwb(shiprocketShipmentId, courierId ?? undefined, { orderId, shipmentId: shipment.id })
      const data = awb.response?.data
      if (data) {
        awbCode = data.awb_code ?? awbCode
        courierName = data.courier_name ?? courierName
        courierId = data.courier_company_id != null ? String(data.courier_company_id) : courierId
        shippingCharge = typeof data.freight_charges === "number" ? data.freight_charges : shippingCharge
        pickupScheduled = data.pickup_scheduled_date ?? pickupScheduled
      }
    } catch (error) {
      console.error("Shiprocket AWB assignment failed", error)
    }

    if (awbCode) {
      try {
        const pickup = await requestPickup([shiprocketShipmentId], { orderId, shipmentId: shipment.id })
        pickupScheduled = pickup.response?.pickup_scheduled_date ?? pickupScheduled
      } catch (error) {
        console.error("Shiprocket pickup scheduling failed", error)
      }
    }
  }

  shipment = await updateShipment(shipment.id, {
    awb_code: awbCode,
    courier_name: courierName,
    courier_id: courierId,
    shipping_charge: shippingCharge,
    pickup_scheduled_date: pickupScheduled,
    pickup_status: pickupScheduled ? "scheduled" : shipment.pickup_status,
    status: awbCode ? "awb_assigned" : "created",
  })

  const orderStatus: ShiprocketOrderStatus = awbCode ? "Confirmed" : "Confirmed"
  await recordFirstEvent(shipment, awbCode ? "AWB assigned" : "Shipment created", created.status_code != null ? String(created.status_code) : null)
  await advanceOrderStatus(order, orderStatus, awbCode ? "shipment.awb_assigned" : "shipment.created")

  // Notify the customer that fulfillment has started (deduped downstream).
  await enqueueNotification(orderId, "shipmentCreated")

  return buildResult(shipment)
}

/**
 * Applies a tracking update (from webhook or polling) to a shipment: dedups on the
 * events unique key, appends the event, recomputes canonical order status, and
 * restores inventory when the parcel is cancelled/returned/refunded.
 */
export async function syncShipmentStatus(shipment: ShipmentRow, event: ShiprocketTrackingEvent): Promise<{ applied: boolean; orderStatus: string }> {
  const canonical = mapShiprocketStatus(event.statusCode, event.statusLabel)
  const inserted = await insertEventIfNew(shipment, event, canonical)

  await updateShipment(shipment.id, {
    status: canonical,
    status_code: event.statusCode,
  })

  const order = await selectOrderRowById(shipment.order_id)
  if (!order) return { applied: inserted, orderStatus: canonical }

  await advanceOrderStatus(order, canonical, `shipment.${slug(event.statusLabel)}`)

  if (isInventoryRestoringStatus(canonical)) {
    await restoreOrderInventory(order, `shipment.${slug(canonical)}`)
  }

  // Only notify on a genuinely new event so webhook replays don't re-send emails.
  if (inserted) {
    const notificationType = notificationTypeForStatus(canonical)
    if (notificationType) await enqueueNotification(shipment.order_id, notificationType)
  }

  return { applied: inserted, orderStatus: canonical }
}

/** Cancels a pre-dispatch shipment in Shiprocket, restores stock, and updates statuses. */
export async function cancelShipment(orderId: string): Promise<FulfillmentResult> {
  const shipment = await getShipmentByOrderId(orderId)
  if (!shipment) throw new ShiprocketError("No shipment exists for this order.", 404)
  const canonical = mapShiprocketStatus(shipment.status_code, shipment.status)
  if (!isPreDispatch(canonical)) throw new ShiprocketError("This shipment can no longer be cancelled (already dispatched).", 409)

  if (shipment.awb_code) {
    await cancelShiprocketShipment([shipment.awb_code], { orderId, shipmentId: shipment.id }).catch((error) => console.error("Shiprocket AWB cancel failed", error))
  } else if (shipment.shiprocket_order_id) {
    await cancelShiprocketOrder([shipment.shiprocket_order_id], { orderId, shipmentId: shipment.id }).catch((error) => console.error("Shiprocket order cancel failed", error))
  }

  const updated = await updateShipment(shipment.id, { status: "Cancelled", status_code: shipment.status_code })
  await recordEventRow(updated, "Cancelled", "Shipment cancelled by admin", null, null, new Date().toISOString())

  const order = await selectOrderRowById(orderId)
  if (order) {
    await advanceOrderStatus(order, "Cancelled", "shipment.cancelled")
    await restoreOrderInventory(order, "shipment.cancelled")
  }
  await enqueueNotification(orderId, "cancelled")

  return buildResult(updated)
}

/** Maps a canonical order status to the customer notification type, if any. */
function notificationTypeForStatus(status: ShiprocketOrderStatus): ShipmentNotificationType | null {
  switch (status) {
    case "Shipped":
      return "shipped"
    case "Out for Delivery":
      return "outForDelivery"
    case "Delivered":
      return "delivered"
    case "Cancelled":
      return "cancelled"
    default:
      return null
  }
}

/** Enqueues a customer shipment email; idempotent per (order, type). */
async function enqueueNotification(orderId: string, type: ShipmentNotificationType) {
  await enqueueJob({
    type: "send_notification",
    orderId,
    payload: { notificationType: type },
    dedupeKey: `notify:${orderId}:${type}`,
  }).catch((error) => console.error("Failed to enqueue shipment notification", error))
}

// --- Pickup management ---

export async function schedulePickup(orderId: string, pickupDate?: string): Promise<FulfillmentResult> {
  const shipment = await requireShipmentWithShiprocketId(orderId)
  const response = pickupDate
    ? await reschedulePickup([shipment.shiprocket_shipment_id!], pickupDate, { orderId, shipmentId: shipment.id })
    : await requestPickup([shipment.shiprocket_shipment_id!], { orderId, shipmentId: shipment.id })
  const scheduled = response.response?.pickup_scheduled_date ?? pickupDate ?? null
  const token = response.response?.pickup_token_number ?? null
  const updated = await updateShipment(shipment.id, {
    pickup_scheduled_date: scheduled,
    pickup_status: "scheduled",
    pickup_token: token,
  })
  await recordEventRow(updated, "Pickup scheduled", `Pickup scheduled${scheduled ? ` for ${scheduled}` : ""}`, null, null, new Date().toISOString())
  return buildResult(updated)
}

export async function cancelPickupForOrder(orderId: string): Promise<FulfillmentResult> {
  const shipment = await requireShipmentWithShiprocketId(orderId)
  await cancelPickup([shipment.shiprocket_shipment_id!], { orderId, shipmentId: shipment.id })
  const updated = await updateShipment(shipment.id, { pickup_status: "cancelled" })
  await recordEventRow(updated, "Pickup cancelled", "Pickup cancelled by admin", null, null, new Date().toISOString())
  return buildResult(updated)
}

// --- Documents (Shiprocket-generated) ---

export type DocumentKind = "invoice" | "label" | "manifest"

/**
 * Returns a stored document URL, generating it via Shiprocket on first request.
 * Idempotent unless `force` — repeated downloads reuse the saved URL.
 */
export async function ensureDocument(orderId: string, kind: DocumentKind, force = false): Promise<string> {
  const shipment = await getShipmentByOrderId(orderId)
  if (!shipment) throw new ShiprocketError("No shipment exists for this order.", 404)

  const existing = kind === "invoice" ? shipment.invoice_url : kind === "label" ? shipment.label_url : shipment.manifest_url
  if (existing && !force) return existing

  const ctx = { orderId, shipmentId: shipment.id }
  let url: string | null = null
  if (kind === "invoice") {
    if (!shipment.shiprocket_order_id) throw new ShiprocketError("Shiprocket order id missing for invoice.", 400)
    const res = await generateInvoice([shipment.shiprocket_order_id], ctx)
    url = res.invoice_url ?? null
  } else if (kind === "label") {
    if (!shipment.shiprocket_shipment_id) throw new ShiprocketError("Shipment id missing for label.", 400)
    const res = await generateLabel([shipment.shiprocket_shipment_id], ctx)
    url = res.label_url ?? null
  } else {
    if (!shipment.shiprocket_shipment_id) throw new ShiprocketError("Shipment id missing for manifest.", 400)
    const res = await generateManifest([shipment.shiprocket_shipment_id], ctx)
    url = res.manifest_url ?? null
  }
  if (!url) throw new ShiprocketError(`Shiprocket did not return a ${kind} URL.`, 502)

  const column = kind === "invoice" ? "invoice_url" : kind === "label" ? "label_url" : "manifest_url"
  await orycmsPrisma.$executeRawUnsafe(
    `UPDATE storefront_shipments SET ${column} = $2, updated_at = now() WHERE id = $1::uuid`,
    shipment.id,
    url,
  )
  return url
}

async function requireShipmentWithShiprocketId(orderId: string): Promise<ShipmentRow> {
  const shipment = await getShipmentByOrderId(orderId)
  if (!shipment) throw new ShiprocketError("No shipment exists for this order.", 404)
  if (!shipment.shiprocket_shipment_id) throw new ShiprocketError("Shipment has no Shiprocket shipment id yet.", 400)
  return shipment
}

/** Persists a create-shipment failure so the Order Details retry UI can display it. */
async function recordShipmentError(orderId: string, error: unknown): Promise<void> {
  const code = error instanceof ShiprocketError ? error.code : null
  const message = error instanceof Error ? error.message : "Shipment creation failed."
  await orycmsPrisma.$executeRawUnsafe(
    `INSERT INTO storefront_shipments (order_id, status, retry_count, last_error_code, last_error_message, last_retry_at)
     VALUES ($1::uuid, 'error', 1, $2, $3, now())
     ON CONFLICT (order_id) DO UPDATE SET
       retry_count = storefront_shipments.retry_count + 1,
       last_error_code = $2,
       last_error_message = $3,
       last_retry_at = now(),
       updated_at = now()`,
    orderId,
    code,
    message,
  )
}

/** Polls Shiprocket tracking for a shipment and applies any new events. */
export async function refreshTracking(shipment: ShipmentRow): Promise<FulfillmentResult> {
  if (shipment.awb_code) {
    try {
      const tracking = await getTrackingByAwb(shipment.awb_code)
      if (tracking.trackUrl || tracking.etd) {
        await updateShipmentTrackingMeta(shipment.id, tracking.trackUrl, tracking.etd)
      }
      for (const event of tracking.events) {
        await syncShipmentStatus(shipment, event)
      }
    } catch (error) {
      console.error("Shiprocket tracking refresh failed", error)
    }
  }
  const latest = await getShipmentByOrderId(shipment.order_id)
  return buildResult(latest ?? shipment)
}

async function buildResult(shipment: ShipmentRow): Promise<FulfillmentResult> {
  const events = await listShipmentEvents(shipment.id)
  const order = await selectOrderRowById(shipment.order_id)
  return {
    shipment: serializeShipment(shipment),
    events: events.map(serializeShipmentEvent),
    orderStatus: order?.status ?? shipment.status,
  }
}

function buildCreateOrderPayload(
  order: StorefrontOrderRow,
  pickupLocation: string,
  channelId: string | null,
  pkg: { length: number; breadth: number; height: number; weight: number },
): CreateOrderPayload {
  const contact = (order.contact ?? {}) as NonNullable<OrderContact>
  const address = (order.shipping_address ?? {}) as NonNullable<OrderAddress>
  const items = Array.isArray(order.items) ? (order.items as OrderItem[]) : []
  const orderItems = items.map((item, index) => {
    const units = Math.max(1, Math.floor(Number(item.quantity ?? item.qty ?? 1)))
    return {
      name: String(item.name ?? `Item ${index + 1}`).slice(0, 250),
      sku: String(item.productSlug ?? item.id ?? item.name ?? `SKU-${index + 1}`).slice(0, 100),
      units,
      selling_price: Math.max(0, Number(item.price ?? 0)),
    }
  })

  return {
    order_id: order.number,
    order_date: new Date(order.created_at).toISOString().slice(0, 19).replace("T", " "),
    pickup_location: pickupLocation,
    ...(channelId ? { channel_id: channelId } : {}),
    billing_customer_name: String(contact.firstName ?? "Customer"),
    billing_last_name: String(contact.lastName ?? ""),
    billing_address: String(address.address1 ?? ""),
    billing_address_2: String(address.address2 ?? ""),
    billing_city: String(address.city ?? ""),
    billing_pincode: String(address.pincode ?? ""),
    billing_state: String(address.state ?? ""),
    billing_country: "India",
    billing_email: String(contact.email ?? ""),
    billing_phone: String(contact.phone ?? ""),
    shipping_is_billing: true,
    order_items: orderItems.length > 0 ? orderItems : [{ name: order.number, sku: order.number, units: 1, selling_price: Number(order.total) }],
    payment_method: order.payment_method === "cash_on_delivery" ? "COD" : "Prepaid",
    sub_total: Number(order.subtotal) || Number(order.total),
    length: pkg.length,
    breadth: pkg.breadth,
    height: pkg.height,
    weight: pkg.weight,
  }
}

type InsertShipmentInput = {
  orderId: string
  shiprocketOrderId: string | null
  shiprocketShipmentId: string | null
  awbCode: string | null
  courierName: string | null
  courierId: string | null
  status: string
  statusCode: string | null
  raw: unknown
}

async function insertShipment(input: InsertShipmentInput): Promise<ShipmentRow> {
  const [row] = await orycmsPrisma.$queryRawUnsafe<ShipmentRow[]>(
    `INSERT INTO storefront_shipments (
       order_id, shiprocket_order_id, shiprocket_shipment_id, awb_code, courier_name, courier_id,
       status, status_code, raw_response
     ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
     ON CONFLICT (order_id) DO UPDATE SET
       shiprocket_order_id = COALESCE(EXCLUDED.shiprocket_order_id, storefront_shipments.shiprocket_order_id),
       shiprocket_shipment_id = COALESCE(EXCLUDED.shiprocket_shipment_id, storefront_shipments.shiprocket_shipment_id),
       status = EXCLUDED.status,
       status_code = COALESCE(EXCLUDED.status_code, storefront_shipments.status_code),
       last_error_code = NULL,
       last_error_message = NULL,
       updated_at = now()
     RETURNING ${SHIPMENT_SELECT}`,
    input.orderId,
    input.shiprocketOrderId,
    input.shiprocketShipmentId,
    input.awbCode,
    input.courierName,
    input.courierId,
    input.status,
    input.statusCode,
    JSON.stringify(input.raw ?? {}),
  )
  return row
}

type ShipmentUpdate = Partial<{
  awb_code: string | null
  courier_name: string | null
  courier_id: string | null
  status: string
  status_code: string | null
  shipping_charge: number | null
  pickup_scheduled_date: string | null
  pickup_status: string | null
  pickup_token: string | null
  tracking_url: string | null
}>

async function updateShipment(shipmentId: string, update: ShipmentUpdate): Promise<ShipmentRow> {
  // COALESCE keeps existing values when a field is passed as null/undefined, so a
  // status refresh never wipes an AWB or courier we already recorded.
  const [row] = await orycmsPrisma.$queryRawUnsafe<ShipmentRow[]>(
    `UPDATE storefront_shipments SET
       awb_code = COALESCE($2, awb_code),
       courier_name = COALESCE($3, courier_name),
       courier_id = COALESCE($4, courier_id),
       status = COALESCE($5, status),
       status_code = COALESCE($6, status_code),
       shipping_charge = COALESCE($7, shipping_charge),
       pickup_scheduled_date = COALESCE($8::timestamptz, pickup_scheduled_date),
       pickup_status = COALESCE($9, pickup_status),
       tracking_url = COALESCE($10, tracking_url),
       pickup_token = COALESCE($11, pickup_token),
       updated_at = now()
     WHERE id = $1::uuid
     RETURNING ${SHIPMENT_SELECT}`,
    shipmentId,
    update.awb_code ?? null,
    update.courier_name ?? null,
    update.courier_id ?? null,
    update.status ?? null,
    update.status_code ?? null,
    update.shipping_charge ?? null,
    update.pickup_scheduled_date ?? null,
    update.pickup_status ?? null,
    update.tracking_url ?? null,
    update.pickup_token ?? null,
  )
  return row
}

async function updateShipmentTrackingMeta(shipmentId: string, trackUrl: string | null, etd: string | null) {
  await orycmsPrisma.$executeRawUnsafe(
    `UPDATE storefront_shipments SET
       tracking_url = COALESCE($2, tracking_url),
       estimated_delivery_date = COALESCE($3::timestamptz, estimated_delivery_date),
       updated_at = now()
     WHERE id = $1::uuid`,
    shipmentId,
    trackUrl,
    etd,
  )
}

async function recordFirstEvent(shipment: ShipmentRow, activity: string, statusCode: string | null) {
  await recordEventRow(shipment, mapShiprocketStatus(statusCode, activity), activity, null, statusCode, new Date().toISOString())
}

async function insertEventIfNew(shipment: ShipmentRow, event: ShiprocketTrackingEvent, canonical: string): Promise<boolean> {
  return recordEventRow(shipment, canonical, event.activity ?? event.statusLabel, event.location, event.statusCode, event.occurredAt, event.raw)
}

/** Inserts a shipment event, returning false when the dedupe key already existed. */
async function recordEventRow(
  shipment: ShipmentRow,
  status: string,
  activity: string | null,
  location: string | null,
  statusCode: string | null,
  occurredAt: string,
  raw?: unknown,
): Promise<boolean> {
  const affected = await orycmsPrisma.$executeRawUnsafe(
    `INSERT INTO storefront_shipment_events (shipment_id, order_id, status, status_code, location, activity, occurred_at, raw)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7::timestamptz, $8::jsonb)
     ON CONFLICT ON CONSTRAINT storefront_shipment_events_dedupe_key DO NOTHING`,
    shipment.id,
    shipment.order_id,
    status,
    statusCode,
    location,
    activity,
    occurredAt,
    JSON.stringify(raw ?? {}),
  )
  return Number(affected) > 0
}

async function advanceOrderStatus(order: StorefrontOrderRow, status: ShiprocketOrderStatus, event: string) {
  await orycmsPrisma.$executeRawUnsafe(
    `UPDATE storefront_orders SET
       status = $2,
       shiprocket_status = $2,
       payment_timeline = payment_timeline || $3::jsonb
     WHERE id = $1::uuid`,
    order.id,
    status,
    JSON.stringify([{ at: new Date().toISOString(), event, status }]),
  )
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "") || "update"
}
