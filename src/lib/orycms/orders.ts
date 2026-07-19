import { orycmsPrisma } from "@/lib/orycms/prisma"
import { ensureStorefrontAuthSchema } from "@/lib/storefront-auth"
import { serializeOrder, type StorefrontOrderRow } from "@/lib/storefront-orders"

const ORDER_SELECT = `
  id, user_id, number, status, payment_status, payment_method, razorpay_order_id, razorpay_payment_id,
  razorpay_signature, refund_status, invoice_number, contact, shipping_address, delivery_method,
  subtotal, shipping_total, discount_total, reservation_expires_at, stock_released_at, cancelled_at,
  payment_timeline, tracking, invoice_url, items, total, created_at
`

export type OryCMSOrderDTO = ReturnType<typeof serializeOrder> & {
  customerEmail: string
  customerName: string
  totalItems: number
}

export async function listOryCMSOrders() {
  await ensureStorefrontAuthSchema()
  const orders = await orycmsPrisma.$queryRawUnsafe<StorefrontOrderRow[]>(
    `SELECT ${ORDER_SELECT} FROM storefront_orders ORDER BY created_at DESC`,
  )
  return orders.map(toOrderDTO)
}

export async function getOryCMSOrder(id: string) {
  await ensureStorefrontAuthSchema()
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
  return order ? toOrderDTO(order) : null
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
