import { orycmsPrisma } from "@/lib/orycms/prisma"
import { ensureStorefrontAuthSchema } from "@/lib/storefront-auth"
import { sendOrderConfirmationEmail, serializeOrder, type StorefrontOrderRow } from "@/lib/storefront-orders"
import { createOryCMSNotification } from "@/lib/orycms/notifications"
import { getShipmentByOrderId, listShipmentEvents, serializeShipment, serializeShipmentEvent } from "@/lib/shiprocket/shipments"
import type { OryCMSAuthUser } from "@/lib/orycms/auth"

const ORDER_SELECT = `
  id, user_id, number, status, payment_status, payment_method, razorpay_order_id, razorpay_payment_id,
  razorpay_signature, refund_status, invoice_number, contact, shipping_address, delivery_method,
  subtotal, shipping_total, discount_total, reservation_expires_at, confirmed_at,
  confirmed_by_admin_id, confirmed_by_admin_email, packed_at, packed_by_admin_id,
  packed_by_admin_email, stock_released_at, cancelled_at,
  payment_timeline, tracking, invoice_url, items, total, created_at
`

export type OryCMSOrderDTO = ReturnType<typeof serializeOrder> & {
  customerEmail: string
  customerName: string
  shipment?: ReturnType<typeof serializeShipment> | null
  totalItems: number
}

export type OryCMSOrderDetailDTO = OryCMSOrderDTO & {
  shipment: ReturnType<typeof serializeShipment> | null
  shipmentEvents: ReturnType<typeof serializeShipmentEvent>[]
  refunds: Array<{ razorpay_refund_id: string; amount: number; status: string; reason: string | null; created_at: string | null }>
}

export async function listOryCMSOrders() {
  await ensureStorefrontAuthSchema()
  await ensureOrderLifecycleAuditSchema()
  const orders = await orycmsPrisma.$queryRawUnsafe<StorefrontOrderRow[]>(
    `SELECT ${ORDER_SELECT} FROM storefront_orders ORDER BY created_at DESC`,
  )
  return Promise.all(orders.map(async (order) => {
    const shipment = await getShipmentByOrderId(order.id)
    return { ...toOrderDTO(order), shipment: shipment ? serializeShipment(shipment) : null }
  }))
}

export async function getOryCMSOrder(id: string): Promise<OryCMSOrderDetailDTO | null> {
  await ensureStorefrontAuthSchema()
  await ensureOrderLifecycleAuditSchema()
  const orders = isUuid(id)
    ? await orycmsPrisma.$queryRawUnsafe<StorefrontOrderRow[]>(
        `SELECT ${ORDER_SELECT} FROM storefront_orders WHERE id = $1::uuid OR number = $2 LIMIT 1`,
        id,
        id,
      )
    : await orycmsPrisma.$queryRawUnsafe<StorefrontOrderRow[]>(
        `SELECT ${ORDER_SELECT} FROM storefront_orders WHERE number = $1 LIMIT 1`,
        id,
      )
  const [order] = orders
  if (!order) return null
  const shipmentRow = await getShipmentByOrderId(order.id)
  const events = shipmentRow ? await listShipmentEvents(shipmentRow.id) : []
  const refunds = await listOrderRefunds(order.id)
  return {
    ...toOrderDTO(order),
    shipment: shipmentRow ? serializeShipment(shipmentRow) : null,
    shipmentEvents: events.map(serializeShipmentEvent),
    refunds,
  }
}

export async function confirmOryCMSOrder(id: string, actor: OryCMSAuthUser) {
  await ensureStorefrontAuthSchema()
  await ensureOrderLifecycleAuditSchema()
  const confirmed = await orycmsPrisma.$transaction(async (tx) => {
    const order = await getOrderForConfirmation(id, true, tx)
    if (!order) throw new Error("Order not found.")
    const currentStatus = order.status.toLowerCase()
    if (currentStatus === "confirmed") return order
    if (!["pending", "processing"].includes(currentStatus)) throw new Error(`Only pending orders can be confirmed. Current status: ${label(order.status)}.`)
    if (order.payment_method === "razorpay" && order.payment_status !== "paid") throw new Error("Online payment must be paid before confirming this order.")
    if (order.payment_method === "cash_on_delivery" && !["pending", "paid"].includes(order.payment_status)) throw new Error("Payment status is not valid for confirmation.")

    const reservedItems = order.stock_released_at ? await reserveOrderItems(order, tx) : await validateReservedOrderItems(order, tx)
    await tx.$executeRaw`
      UPDATE storefront_orders
      SET status = 'confirmed',
          confirmed_at = now(),
          confirmed_by_admin_id = ${actor.id}::uuid,
          confirmed_by_admin_email = ${actor.email},
          stock_released_at = NULL,
          reservation_expires_at = NULL,
          items = ${JSON.stringify(reservedItems)}::jsonb,
          payment_timeline = payment_timeline || ${JSON.stringify([{ at: new Date().toISOString(), event: "Order Confirmed", status: "confirmed" }])}::jsonb
      WHERE id = ${order.id}::uuid AND lower(status) IN ('pending', 'processing')
    `
    return await getOrderForConfirmation(order.id, false, tx) ?? order
  })
  if (confirmed) await sendOrderConfirmationEmail(confirmed).catch((error) => console.error("Order confirmation email failed", error))
  await createOryCMSNotification({
    type: "order",
    title: "Order Confirmed",
    message: `Order ${confirmed.number} confirmed by ${actor.email}.`,
    entityId: confirmed.id,
    entityType: "order",
    targetUrl: `/admin/orders/${confirmed.id}?highlight=${confirmed.id}`,
  }).catch((error) => console.error("OryCMS notification failed", error))
  return { orderStatus: "confirmed", order: await getOryCMSOrder(confirmed.id) }
}

export async function packOryCMSOrder(id: string, actor: OryCMSAuthUser) {
  await ensureStorefrontAuthSchema()
  await ensureOrderLifecycleAuditSchema()
  const packed = await orycmsPrisma.$transaction(async (tx) => {
    const order = await getOrderForConfirmation(id, true, tx)
    if (!order) throw new Error("Order not found.")
    const currentStatus = order.status.toLowerCase()
    if (currentStatus === "packed") return order
    if (currentStatus !== "confirmed") throw new Error(`Only confirmed orders can be packed. Current status: ${label(order.status)}.`)
    if (order.stock_released_at) throw new Error("Inventory is no longer reserved for this order.")
    const reservedItems = await validateReservedOrderItems(order, tx)
    await tx.$executeRaw`
      UPDATE storefront_orders
      SET status = 'packed',
          packed_at = now(),
          packed_by_admin_id = ${actor.id}::uuid,
          packed_by_admin_email = ${actor.email},
          items = ${JSON.stringify(reservedItems)}::jsonb,
          payment_timeline = payment_timeline || ${JSON.stringify([{ at: new Date().toISOString(), event: "Order Packed", status: "packed" }])}::jsonb
      WHERE id = ${order.id}::uuid AND lower(status) = 'confirmed'
    `
    return await getOrderForConfirmation(order.id, false, tx) ?? order
  })
  await createOryCMSNotification({
    type: "order",
    title: "Order Packed",
    message: `Order ${packed.number} packed by ${actor.email}.`,
    entityId: packed.id,
    entityType: "order",
    targetUrl: `/admin/orders/${packed.id}?highlight=${packed.id}`,
  }).catch((error) => console.error("OryCMS notification failed", error))
  return { orderStatus: "packed", order: await getOryCMSOrder(packed.id) }
}

function toOrderDTO(order: StorefrontOrderRow): OryCMSOrderDTO {
  const serialized = serializeOrder(order)
  const contact = asRecord(serialized.contact)
  const items = Array.isArray(serialized.items) ? serialized.items : []
  const firstName = text(contact.firstName)
  const lastName = text(contact.lastName)
  const email = text(contact.email)

  return {
    ...serialized,
    customerEmail: email,
    customerName: [firstName, lastName].filter(Boolean).join(" ") || email || "Guest customer",
    totalItems: items.reduce((sum, item) => {
      const quantity = typeof item === "object" && item ? Number((item as { quantity?: unknown; qty?: unknown }).quantity ?? (item as { qty?: unknown }).qty ?? 1) : 1
      return sum + (Number.isFinite(quantity) ? Math.max(1, quantity) : 1)
    }, 0),
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

async function listOrderRefunds(orderId: string) {
  const rows = await orycmsPrisma.$queryRawUnsafe<Array<{ razorpay_refund_id: string; amount: string | number; status: string; reason: string | null; created_at: Date | string | null }>>(
    `SELECT razorpay_refund_id, amount, status, reason, created_at
     FROM razorpay_refunds WHERE order_id = $1::uuid ORDER BY created_at DESC`,
    orderId,
  )
  return rows.map((row) => ({
    ...row,
    amount: Number(row.amount),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at ? String(row.created_at) : null,
  }))
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

type QueryClient = Pick<typeof orycmsPrisma, "$queryRaw" | "$queryRawUnsafe" | "$executeRaw">

async function ensureOrderLifecycleAuditSchema() {
  await orycmsPrisma.$executeRaw`
    ALTER TABLE storefront_orders
      ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ(6),
      ADD COLUMN IF NOT EXISTS confirmed_by_admin_id UUID,
      ADD COLUMN IF NOT EXISTS confirmed_by_admin_email TEXT,
      ADD COLUMN IF NOT EXISTS packed_at TIMESTAMPTZ(6),
      ADD COLUMN IF NOT EXISTS packed_by_admin_id UUID,
      ADD COLUMN IF NOT EXISTS packed_by_admin_email TEXT
  `
  await orycmsPrisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS storefront_orders_confirmed_at_idx ON storefront_orders (confirmed_at)
  `
  await orycmsPrisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS storefront_orders_packed_at_idx ON storefront_orders (packed_at)
  `
}

async function getOrderForConfirmation(id: string, lock = false, db: QueryClient = orycmsPrisma): Promise<StorefrontOrderRow | null> {
  const suffix = lock ? " FOR UPDATE" : ""
  const rows = isUuid(id)
    ? await db.$queryRawUnsafe<StorefrontOrderRow[]>(`SELECT ${ORDER_SELECT} FROM storefront_orders WHERE id = $1::uuid OR number = $2 LIMIT 1${suffix}`, id, id)
    : await db.$queryRawUnsafe<StorefrontOrderRow[]>(`SELECT ${ORDER_SELECT} FROM storefront_orders WHERE number = $1 LIMIT 1${suffix}`, id)
  return rows[0] ?? null
}

async function reserveOrderItems(order: StorefrontOrderRow, db: QueryClient) {
  const items = Array.isArray(order.items) ? order.items as OrderItem[] : []
  if (items.length === 0) throw new Error("Order has no items to reserve.")
  const reserved: OrderItem[] = []
  for (const item of aggregateItems(items)) {
    const slug = productSlug(item)
    const [product] = await db.$queryRaw<{ id: string; slug: string; stock_quantity: number }[]>`
      SELECT id, slug, stock_quantity FROM orycms_products
      WHERE (id::text = ${String(item.productId ?? "")} OR slug = ${slug} OR lower(name) = lower(${item.name ?? ""}))
        AND status = 'published' AND deleted_at IS NULL
      LIMIT 1
    `
    if (!product) throw new Error(`${item.name ?? "Product"} is not available.`)
    const quantity = Math.max(1, Math.floor(Number(item.quantity ?? item.qty ?? 1) || 1))
    const updated = await db.$executeRaw`
      UPDATE orycms_products
      SET stock_quantity = stock_quantity - ${quantity}, updated_at = now()
      WHERE id = ${product.id}::uuid AND stock_quantity >= ${quantity}
    `
    if (Number(updated) !== 1) throw new Error(`${item.name ?? "Product"} does not have enough stock.`)
    reserved.push({ ...item, quantity, productId: product.id, productSlug: product.slug })
  }
  return items.map((item) => {
    const found = reserved.find((reservedItem) => productSlug(reservedItem) === productSlug(item) || reservedItem.name === item.name)
    return found ? { ...item, productId: found.productId, productSlug: found.productSlug } : item
  })
}

type OrderItem = { id?: string; name?: string; productId?: string; productSlug?: string; quantity?: number; qty?: number }

async function validateReservedOrderItems(order: StorefrontOrderRow, db: QueryClient) {
  const items = Array.isArray(order.items) ? order.items as OrderItem[] : []
  if (items.length === 0) throw new Error("Order has no items to reserve.")
  for (const item of aggregateItems(items)) {
    const slug = productSlug(item)
    const [product] = await db.$queryRaw<{ id: string }[]>`
      SELECT id FROM orycms_products
      WHERE (id::text = ${String(item.productId ?? "")} OR slug = ${slug} OR lower(name) = lower(${item.name ?? ""}))
        AND status = 'published' AND deleted_at IS NULL
      LIMIT 1
    `
    if (!product) throw new Error(`${item.name ?? "Product"} is not available.`)
  }
  return order.items
}

function aggregateItems(items: OrderItem[]) {
  const map = new Map<string, OrderItem>()
  for (const item of items) {
    const quantity = Math.max(1, Math.floor(Number(item.quantity ?? item.qty ?? 1) || 1))
    const key = productSlug(item) || item.name || String(map.size)
    const existing = map.get(key)
    map.set(key, existing ? { ...existing, quantity: Math.max(1, Number(existing.quantity ?? existing.qty ?? 1)) + quantity } : { ...item, quantity })
  }
  return Array.from(map.values())
}

function productSlug(item: OrderItem) {
  return (item.productSlug ?? String(item.id ?? "").split("--")[0]) || String(item.name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}


function label(value: string) {
  return value.replace(/[_.]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * Number of orders placed since this admin last opened the Orders module. Backs the
 * live sidebar badge. A first-time admin (no view row) sees the total order count.
 */
export async function getUnreadOrderCount(userId: string): Promise<number> {
  await ensureStorefrontAuthSchema()
  const rows = await orycmsPrisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM storefront_orders o
    LEFT JOIN orycms_order_views v ON v.user_id = ${userId}::uuid
    WHERE v.last_viewed_at IS NULL OR o.created_at > v.last_viewed_at
  `
  return Number(rows[0]?.count ?? 0)
}

/** Marks all current orders as viewed for this admin, clearing the unread badge. */
export async function markOrdersViewed(userId: string): Promise<void> {
  await ensureStorefrontAuthSchema()
  await orycmsPrisma.$executeRaw`
    INSERT INTO orycms_order_views (user_id, last_viewed_at, updated_at)
    VALUES (${userId}::uuid, now(), now())
    ON CONFLICT (user_id) DO UPDATE SET last_viewed_at = now(), updated_at = now()
  `
}
