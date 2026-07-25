import "server-only"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { restoreOrderInventory, selectOrderRowById, type StorefrontOrderRow } from "@/lib/storefront-orders"
import {
  assignAwb,
  cancelPickup,
  cancelShiprocketOrder,
  cancelShiprocketShipment,
  checkServiceability,
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
import { createOryCMSNotification } from "@/lib/orycms/notifications"
import { ensureShipmentAuditSchema, getShipmentByOrderId, listActiveShipmentsForTracking, serializeShipment, serializeShipmentEvent, listShipmentEvents, recordApiLog, SHIPMENT_SELECT } from "@/lib/shiprocket/shipments"
import { isInventoryRestoringStatus, isPreDispatch, mapShiprocketStatus } from "@/lib/shiprocket/status"
import type { OryCMSAuthUser } from "@/lib/orycms/auth"
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
 * Creates a Shiprocket shipment for a packed order: create adhoc order →
 * assign best courier (AWB) → persist shipment + first event +
 * advance order status. Idempotent: complete shipments short-circuit; partial
 * shipments retry missing AWB assignment without creating a duplicate order.
 */
export async function confirmAndCreateShipment(orderId: string, actor?: OryCMSAuthUser): Promise<FulfillmentResult> {
  await ensureShipmentAuditSchema()
  const existing = await getShipmentByOrderId(orderId)
  if (existing?.shiprocket_shipment_id && existing.awb_code) return refreshTracking(existing).catch(() => buildResult(existing))

  const settings = await getShiprocketSettings()
  if (!settings?.enabled) throw new ShiprocketError("Shiprocket is not enabled. Configure it in Settings first.", 400)
  if (!settings.pickupLocation) throw new ShiprocketError("Set a Shiprocket pickup location in Settings first.", 400)
  if (!settings.pickupPincode) throw new ShiprocketError("Set a Shiprocket pickup pincode in Settings first.", 400)

  const order = await selectOrderRowById(orderId)
  if (!order) throw new ShiprocketError("Order not found.", 404)
  if (order.status.toLowerCase() !== "packed") {
    throw new ShiprocketError("Mark the order as packed before creating a Shiprocket shipment.", 400)
  }
  const address = (order.shipping_address ?? {}) as NonNullable<OrderAddress>
  const deliveryPincode = String(address.pincode ?? "").replace(/\D/g, "")
  if (!/^\d{6}$/.test(deliveryPincode)) throw new ShiprocketError("Order shipping pincode is missing or invalid.", 400)
  validateShipmentOrderInput(order, settings)

  if (existing?.shiprocket_shipment_id) {
    const shipment = await completeAwbAndPickup({
      order,
      orderId,
      settings,
      shipment: existing,
      shiprocketShipmentId: existing.shiprocket_shipment_id,
      deliveryPincode,
      awbCode: existing.awb_code,
      courierName: existing.courier_name,
      courierId: existing.courier_id,
      shippingCharge: existing.shipping_charge === null ? null : Number(existing.shipping_charge),
      pickupScheduled: existing.pickup_scheduled_date ? String(existing.pickup_scheduled_date) : null,
      statusCode: existing.status_code,
      actorId: actor?.id ?? null,
    })
    await recordFirstEvent(shipment, "Shipment Created", shipment.status_code)
    await advanceOrderStatus(order, "Packed", "Shipment Created")
    if (shipment.awb_code) await enqueueNotification(orderId, "shipmentCreated")
    return refreshTracking(shipment).catch(() => buildResult(shipment))
  }

  await claimShipmentCreation(orderId, actor?.id ?? null)

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
  if (!shiprocketOrderId || !shiprocketShipmentId) {
    const error = new ShiprocketError("Shiprocket did not return order_id and shipment_id.", 502, created)
    await recordShipmentError(orderId, error)
    throw error
  }

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
    actorId: actor?.id ?? null,
    raw: created,
  })

  shipment = await completeAwbAndPickup({
    order,
    orderId,
    settings,
    shipment,
    shiprocketShipmentId,
    deliveryPincode,
    awbCode: created.awb_code ?? null,
    courierName: created.courier_name ?? null,
    courierId: created.courier_company_id != null ? String(created.courier_company_id) : null,
    shippingCharge: null,
    pickupScheduled: null,
    statusCode: created.status_code != null ? String(created.status_code) : null,
    actorId: actor?.id ?? null,
  })

  await recordFirstEvent(shipment, "Shipment Created", created.status_code != null ? String(created.status_code) : null)
  await advanceOrderStatus(order, "Packed", "Shipment Created")
  await createOryCMSNotification({
    type: "shipment",
    title: "Shipment Created",
    message: `Shipment created for order ${order.number}${shipment.awb_code ? ` · AWB ${shipment.awb_code}` : ""}.`,
    entityId: order.id,
    entityType: "shipment",
    targetUrl: `/admin/orders/${order.id}?highlight=${shipment.id}`,
  }).catch((error) => console.error("OryCMS notification failed", error))

  // Notify the customer that fulfillment has started (deduped downstream).
  await enqueueNotification(orderId, "shipmentCreated")

  return refreshTracking(shipment).catch(() => buildResult(shipment))
}

async function completeAwbAndPickup(input: {
  order: StorefrontOrderRow
  orderId: string
  settings: NonNullable<Awaited<ReturnType<typeof getShiprocketSettings>>>
  shipment: ShipmentRow
  shiprocketShipmentId: string
  deliveryPincode: string
  awbCode: string | null
  courierName: string | null
  courierId: string | null
  shippingCharge: number | null
  pickupScheduled: string | null
  statusCode: string | null
  actorId: string | null
}): Promise<ShipmentRow> {
  let { awbCode, courierName, courierId, shippingCharge, pickupScheduled } = input
  let shipment = input.shipment

  if (!awbCode) {
    try {
      if (!courierId) {
        const serviceability = await checkServiceability({
          pickupPincode: input.settings.pickupPincode!,
          deliveryPincode: input.deliveryPincode,
          weight: input.settings.packageWeightKg,
          cod: input.order.payment_method === "cash_on_delivery",
          context: { orderId: input.orderId, shipmentId: input.shipment.id },
        })
        const bestCourier = serviceability.data?.available_courier_companies?.[0]
        if (!bestCourier) throw new ShiprocketError("No Shiprocket courier is serviceable for this order pincode.", 422, serviceability)
        courierId = String(bestCourier.courier_company_id)
        courierName = bestCourier.courier_name ?? courierName
        shippingCharge = typeof bestCourier.rate === "number" ? bestCourier.rate : shippingCharge
      }

      const awb = await assignAwb(input.shiprocketShipmentId, courierId ?? undefined, { orderId: input.orderId, shipmentId: input.shipment.id })
      const data = awb.response?.data
      if (data) {
        awbCode = data.awb_code ?? awbCode
        courierName = data.courier_name ?? courierName
        courierId = data.courier_company_id != null ? String(data.courier_company_id) : courierId
        shippingCharge = typeof data.freight_charges === "number" ? data.freight_charges : shippingCharge
        pickupScheduled = normalizeDateForDb(data.pickup_scheduled_date) ?? pickupScheduled
      }
    } catch (error) {
      console.error("Shiprocket AWB assignment failed", error)
      await recordShipmentError(input.orderId, error)
      throw error
    }
  }

  if (awbCode && !input.shipment.awb_code) {
    shipment = await updateShipment(input.shipment.id, {
      awb_code: awbCode,
      tracking_number: awbCode,
      courier_name: courierName,
      courier_id: courierId,
      shipping_charge: shippingCharge,
      status: "awb_assigned",
      status_code: input.statusCode,
    })
  }

  return updateShipment(shipment.id, {
    awb_code: awbCode,
    tracking_number: awbCode,
    courier_name: courierName,
    courier_id: courierId,
    shipping_charge: shippingCharge,
    pickup_scheduled_date: normalizeDateForDb(pickupScheduled),
    pickup_status: pickupScheduled ? "scheduled" : shipment.pickup_status,
    status: awbCode ? "awb_assigned" : "created",
    status_code: input.statusCode,
    shipment_created_at: new Date().toISOString(),
    shipment_created_by_admin_id: input.actorId,
  })
}

async function claimShipmentCreation(orderId: string, actorId: string | null) {
  await ensureShipmentAuditSchema()
  const inserted = await orycmsPrisma.$queryRawUnsafe<{ id: string }[]>(
    `INSERT INTO storefront_shipments (order_id, status, shipment_created_at, shipment_created_by_admin_id)
     VALUES ($1::uuid, 'creating', now(), $2::uuid)
     ON CONFLICT (order_id) DO NOTHING
     RETURNING id`,
    orderId,
    actorId,
  )
  if (inserted[0]) return

  const retryClaim = await orycmsPrisma.$queryRawUnsafe<{ id: string }[]>(
    `UPDATE storefront_shipments
     SET status = 'creating',
         shipment_created_at = COALESCE(shipment_created_at, now()),
         shipment_created_by_admin_id = COALESCE(shipment_created_by_admin_id, $2::uuid),
         updated_at = now()
     WHERE order_id = $1::uuid
       AND shiprocket_shipment_id IS NULL
       AND lower(status) = 'error'
     RETURNING id`,
    orderId,
    actorId,
  )
  if (retryClaim[0]) return

  const current = await getShipmentByOrderId(orderId)
  if (current?.shiprocket_shipment_id) return
  throw new ShiprocketError("Shipment creation is already in progress. Refresh the order in a few seconds.", 409)
}

/**
 * Applies a tracking update (from webhook or polling) to a shipment: dedups on the
 * events unique key, appends the event, recomputes canonical order status, and
 * restores inventory when the parcel is cancelled/returned/refunded.
 */
export async function syncShipmentStatus(shipment: ShipmentRow, event: ShiprocketTrackingEvent): Promise<{ applied: boolean; orderStatus: string }> {
  const canonical = mapShiprocketStatus(event.statusCode, event.statusLabel)
  const inserted = await insertEventIfNew(shipment, event, canonical)
  const statusChanged = shipment.status.toLowerCase() !== canonical.toLowerCase()
  const meta = webhookShipmentMeta(event.raw)
  const returnMeta = isReturnManagementStatus(canonical) ? meta : null

  await updateShipment(shipment.id, {
    courier_name: meta.courierName,
    courier_id: meta.courierId,
    tracking_number: meta.trackingNumber,
    tracking_url: meta.trackingUrl,
    estimated_delivery_date: meta.estimatedDeliveryDate,
    pickup_scheduled_date: meta.pickupScheduledDate,
    return_status: returnMeta?.returnStatus ?? null,
    reverse_pickup_status: returnMeta?.reversePickupStatus ?? null,
    return_reason: returnMeta?.returnReason ?? null,
    return_updated_at: returnMeta?.returnUpdatedAt ?? null,
    status: canonical,
    status_code: event.statusCode,
  })

  await recordApiLog({
    orderId: shipment.order_id,
    shipmentId: shipment.id,
    direction: "status_change",
    endpoint: "shipment/status",
    method: "UPDATE",
    statusCode: null,
    ok: true,
    requestSummary: {
      previousStatus: shipment.status,
      nextStatus: canonical,
      webhookStatusCode: event.statusCode,
      webhookStatusLabel: event.statusLabel,
      insertedTimelineEvent: inserted,
    },
  })

  if (!inserted && !statusChanged) return { applied: false, orderStatus: canonical }

  const order = await selectOrderRowById(shipment.order_id)
  if (!order) return { applied: inserted, orderStatus: canonical }

  await advanceOrderStatus(order, canonical, event.activity ?? event.statusLabel)
  if (inserted) {
    await createOryCMSNotification({
      type: "shipment",
      title: canonical,
      message: `Order ${order.number}: ${event.activity ?? event.statusLabel}.`,
      entityId: shipment.order_id,
      entityType: "shipment",
      targetUrl: `/admin/orders/${shipment.order_id}?highlight=${shipment.id}`,
    }).catch((error) => console.error("OryCMS notification failed", error))
  }

  const previousCanonical = mapShiprocketStatus(shipment.status_code, shipment.status)
  if (isInventoryRestoringStatus(canonical) || (canonical === "Cancelled" && isPreDispatch(previousCanonical))) {
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
    case "Picked Up":
      return "shipped"
    case "Out for Delivery":
      return "outForDelivery"
    case "Delivered":
      return "delivered"
    case "Cancelled":
    case "RTO":
    case "RTO Delivered":
    case "Return Delivered":
    case "Returned":
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
  const scheduled = normalizeDateForDb(response.response?.pickup_scheduled_date ?? pickupDate) ?? null
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
  await ensureShipmentAuditSchema()
  await orycmsPrisma.$executeRawUnsafe(
    `INSERT INTO storefront_shipments (order_id, status, retry_count, last_error_code, last_error_message, last_retry_at)
     VALUES ($1::uuid, 'error', 1, $2, $3, now())
     ON CONFLICT (order_id) DO UPDATE SET
       status = 'error',
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
    const tracking = await getTrackingByAwb(shipment.awb_code, { orderId: shipment.order_id, shipmentId: shipment.id })
    if (tracking.trackUrl || tracking.etd) {
      await updateShipmentTrackingMeta(shipment.id, tracking.trackUrl, tracking.etd)
    }
    for (const event of tracking.events) {
      await syncShipmentStatus(shipment, event)
    }
  }
  const latest = await getShipmentByOrderId(shipment.order_id)
  return buildResult(latest ?? shipment)
}

export async function refreshActiveShipments(limit = 25): Promise<{ checked: number; refreshed: number; failed: number }> {
  const shipments = await listActiveShipmentsForTracking(limit)
  let refreshed = 0
  let failed = 0
  for (const shipment of shipments) {
    try {
      await refreshTracking(shipment)
      refreshed += 1
      await recordApiLog({
        orderId: shipment.order_id,
        shipmentId: shipment.id,
        direction: "sync",
        endpoint: "tracking/fallback",
        method: "GET",
        statusCode: 200,
        ok: true,
      })
    } catch (error) {
      failed += 1
      await recordApiLog({
        orderId: shipment.order_id,
        shipmentId: shipment.id,
        direction: "sync",
        endpoint: "tracking/fallback",
        method: "GET",
        statusCode: null,
        ok: false,
        errorMessage: error instanceof Error ? error.message : "Tracking fallback sync failed.",
      })
    }
  }
  return { checked: shipments.length, refreshed, failed }
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

function validateShipmentOrderInput(order: StorefrontOrderRow, settings: NonNullable<Awaited<ReturnType<typeof getShiprocketSettings>>>) {
  const contact = (order.contact ?? {}) as NonNullable<OrderContact>
  const address = (order.shipping_address ?? {}) as NonNullable<OrderAddress>
  const required = [
    [contact.firstName, "Customer first name"],
    [contact.lastName, "Customer last name"],
    [contact.email, "Customer email"],
    [contact.phone, "Customer phone"],
    [address.address1, "Shipping address line 1"],
    [address.city, "Shipping city"],
    [address.state, "Shipping state"],
    [address.pincode, "Shipping pincode"],
  ] as const
  for (const [value, label] of required) {
    if (!String(value ?? "").trim()) throw new ShiprocketError(`${label} is required before creating a shipment.`, 400)
  }
  if (!/^\S+@\S+\.\S+$/.test(String(contact.email))) throw new ShiprocketError("Customer email is invalid.", 400)
  if (!/^\d{10,15}$/.test(String(contact.phone).replace(/\D/g, ""))) throw new ShiprocketError("Customer phone is invalid.", 400)
  if (!/^\d{6}$/.test(String(address.pincode).replace(/\D/g, ""))) throw new ShiprocketError("Shipping pincode is invalid.", 400)
  if (![settings.packageLengthCm, settings.packageBreadthCm, settings.packageHeightCm, settings.packageWeightKg].every((value) => Number(value) > 0)) {
    throw new ShiprocketError("Package weight and dimensions must be configured before creating a shipment.", 400)
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
  actorId: string | null
  raw: unknown
}

async function insertShipment(input: InsertShipmentInput): Promise<ShipmentRow> {
  await ensureShipmentAuditSchema()
  const [row] = await orycmsPrisma.$queryRawUnsafe<ShipmentRow[]>(
    `INSERT INTO storefront_shipments (
       order_id, shiprocket_order_id, shiprocket_shipment_id, awb_code, tracking_number, courier_name, courier_id,
       status, status_code, shipment_created_at, shipment_created_by_admin_id, raw_response
     ) VALUES ($1::uuid, $2, $3, $4, $4, $5, $6, $7, $8, now(), $9::uuid, $10::jsonb)
     ON CONFLICT (order_id) DO UPDATE SET
       shiprocket_order_id = COALESCE(EXCLUDED.shiprocket_order_id, storefront_shipments.shiprocket_order_id),
       shiprocket_shipment_id = COALESCE(EXCLUDED.shiprocket_shipment_id, storefront_shipments.shiprocket_shipment_id),
       tracking_number = COALESCE(EXCLUDED.tracking_number, storefront_shipments.tracking_number),
       shipment_created_at = COALESCE(storefront_shipments.shipment_created_at, EXCLUDED.shipment_created_at),
       shipment_created_by_admin_id = COALESCE(storefront_shipments.shipment_created_by_admin_id, EXCLUDED.shipment_created_by_admin_id),
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
    input.actorId,
    JSON.stringify(input.raw ?? {}),
  )
  return row
}

type ShipmentUpdate = Partial<{
  awb_code: string | null
  tracking_number: string | null
  courier_name: string | null
  courier_id: string | null
  status: string
  status_code: string | null
  shipping_charge: number | null
  pickup_scheduled_date: string | null
  pickup_status: string | null
  pickup_token: string | null
  tracking_url: string | null
  estimated_delivery_date: string | null
  shipment_created_at: string | null
  shipment_created_by_admin_id: string | null
  return_status: string | null
  reverse_pickup_status: string | null
  return_reason: string | null
  return_updated_at: string | null
}>

async function updateShipment(shipmentId: string, update: ShipmentUpdate): Promise<ShipmentRow> {
  await ensureShipmentAuditSchema()
  // COALESCE keeps existing values when a field is passed as null/undefined, so a
  // status refresh never wipes an AWB or courier we already recorded.
  const [row] = await orycmsPrisma.$queryRawUnsafe<ShipmentRow[]>(
    `UPDATE storefront_shipments SET
       awb_code = COALESCE($2, awb_code),
       tracking_number = COALESCE($3, tracking_number),
       courier_name = COALESCE($4, courier_name),
       courier_id = COALESCE($5, courier_id),
       status = COALESCE($6, status),
       status_code = COALESCE($7, status_code),
       shipping_charge = COALESCE($8, shipping_charge),
       pickup_scheduled_date = COALESCE($9::timestamptz, pickup_scheduled_date),
       pickup_status = COALESCE($10, pickup_status),
       tracking_url = COALESCE($11, tracking_url),
       estimated_delivery_date = COALESCE($12::timestamptz, estimated_delivery_date),
       pickup_token = COALESCE($13, pickup_token),
       shipment_created_at = COALESCE(shipment_created_at, $14::timestamptz),
       shipment_created_by_admin_id = COALESCE(shipment_created_by_admin_id, $15::uuid),
       return_status = COALESCE($16, return_status),
       reverse_pickup_status = COALESCE($17, reverse_pickup_status),
       return_reason = COALESCE($18, return_reason),
       return_updated_at = COALESCE($19::timestamptz, return_updated_at),
       last_error_code = NULL,
       last_error_message = NULL,
       updated_at = now()
     WHERE id = $1::uuid
     RETURNING ${SHIPMENT_SELECT}`,
    shipmentId,
    update.awb_code ?? null,
    update.tracking_number ?? null,
    update.courier_name ?? null,
    update.courier_id ?? null,
    update.status ?? null,
    update.status_code ?? null,
    update.shipping_charge ?? null,
    update.pickup_scheduled_date ?? null,
    update.pickup_status ?? null,
    update.tracking_url ?? null,
    update.estimated_delivery_date ?? null,
    update.pickup_token ?? null,
    update.shipment_created_at ?? null,
    update.shipment_created_by_admin_id ?? null,
    update.return_status ?? null,
    update.reverse_pickup_status ?? null,
    update.return_reason ?? null,
    update.return_updated_at ?? null,
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
    normalizeDateForDb(etd),
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
  const dedupeStatusCode = statusCode ?? `label:${slug(status)}`
  const affected = await orycmsPrisma.$executeRawUnsafe(
    `INSERT INTO storefront_shipment_events (shipment_id, order_id, status, status_code, location, activity, occurred_at, raw)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7::timestamptz, $8::jsonb)
     ON CONFLICT ON CONSTRAINT storefront_shipment_events_dedupe_key DO NOTHING`,
    shipment.id,
    shipment.order_id,
    status,
    dedupeStatusCode,
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

function normalizeDateForDb(value: string | null | undefined) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function isReturnManagementStatus(status: string) {
  return ["Cancelled", "RTO", "RTO In Transit", "RTO Delivered", "Return Requested", "Return Picked Up", "Return Delivered", "Returned"].includes(status)
}

function webhookShipmentMeta(raw: unknown) {
  const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {}
  const returnStatus = firstString(value.return_status, value.rto_status, value.reverse_shipment_status, value.current_status, value.shipment_status, value.status) ?? null
  return {
    courierName: firstString(value.courier_name, value.courier, value.courier_company_name) ?? null,
    courierId: firstString(value.courier_id, value.courier_company_id) ?? null,
    trackingNumber: firstString(value.tracking_number, value.awb, value.awb_code) ?? null,
    trackingUrl: firstString(value.tracking_url, value.track_url) ?? null,
    estimatedDeliveryDate: normalizeDateForDb(firstString(value.estimated_delivery_date, value.etd, value.edd)),
    pickupScheduledDate: normalizeDateForDb(firstString(value.pickup_scheduled_date, value.pickup_date)),
    returnStatus,
    reversePickupStatus: firstString(value.reverse_pickup_status, value.pickup_status, value.return_pickup_status) ?? null,
    returnReason: firstString(value.return_reason, value.rto_reason, value.reason, value.remarks) ?? null,
    returnUpdatedAt: normalizeDateForDb(firstString(value.return_updated_at, value.current_timestamp, value.status_date, value.date)) ?? (returnStatus ? new Date().toISOString() : null),
  }
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (value === null || value === undefined) continue
    const str = String(value).trim()
    if (str.length > 0) return str
  }
  return undefined
}
