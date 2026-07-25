import crypto from "crypto"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { ensureStorefrontAuthSchema, normalizePhone, validateEmail } from "@/lib/storefront-auth"
import { emailBaseUrl, sendAdminEmail, sendEmail, sendOrderAdminNotifications } from "@/lib/email/mailer"
import { getEnabledOrderNotificationRecipients } from "@/lib/orycms/order-notification-emails"
import { createOryCMSNotification } from "@/lib/orycms/notifications"
import { notifyLowStockProduct } from "@/lib/orycms/low-stock"
import { validateCouponCode, recordDiscountUsage } from "@/lib/orycms/discounts"
import { getOryCMSCodRule, getCustomerCompletedOrderCount } from "@/lib/orycms/cod-rules"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function assertUuid(value: string, label = "id"): void {
  if (!UUID_RE.test(value)) throw new Error(`Invalid ${label}.`)
}

export type StorefrontPaymentMethod = "cash_on_delivery" | "razorpay"

type CheckoutItem = {
  id?: string
  image?: string
  img?: string
  name: string
  price: number
  quantity: number
  size?: string
}

type CheckoutPayload = {
  contact: { email: string; firstName: string; lastName: string; phone: string }
  coupon?: { code: string; discountId?: string; discountAmount?: number; type?: string; pct?: number } | null
  deliveryMethod: "standard" | "express"
  discountTotal: number
  items: CheckoutItem[]
  paymentMethod: StorefrontPaymentMethod
  shippingAddress: { address1: string; address2?: string; city: string; pincode: string; state: string }
  shippingTotal: number
  subtotal: number
  total: number
}

export type StorefrontOrderRow = {
  cancelled_at: Date | string | null
  contact: unknown
  coupon_code: string | null
  coupon_id: string | null
  created_at: Date | string
  delivery_method: string | null
  discount_total: string | number
  id: string
  invoice_number: string | null
  invoice_url: string | null
  items: unknown
  number: string
  payment_method: StorefrontPaymentMethod
  payment_status: string
  payment_timeline: unknown
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  razorpay_signature: string | null
  refund_status: string
  reservation_expires_at: Date | string | null
  confirmed_at?: Date | string | null
  confirmed_by_admin_id?: string | null
  confirmed_by_admin_email?: string | null
  packed_at?: Date | string | null
  packed_by_admin_id?: string | null
  packed_by_admin_email?: string | null
  shipping_address: unknown
  shipping_total: string | number
  status: string
  stock_released_at: Date | string | null
  subtotal: string | number
  total: string | number
  tracking: string | null
  user_id?: string
}

type CheckoutOrderResponse = {
  order: ReturnType<typeof serializeOrder>
  razorpay: null | {
    amount: number
    currency: "INR"
    keyId: string
    orderId: string | null
  }
}

const ORDER_SELECT = `
  id, user_id, number, status, payment_status, payment_method, razorpay_order_id, razorpay_payment_id,
  razorpay_signature, refund_status, invoice_number, contact, shipping_address, delivery_method,
  subtotal, shipping_total, discount_total, coupon_code, coupon_id, reservation_expires_at, stock_released_at, cancelled_at,
  payment_timeline, tracking, invoice_url, items, total, created_at
`

const RESERVATION_MINUTES = Math.max(1, Number(process.env.STOCK_RESERVATION_MINUTES ?? 15))

export async function createCheckoutOrder(userId: string, input: CheckoutPayload, idempotencyKey?: string | null): Promise<CheckoutOrderResponse> {
  await ensureStorefrontAuthSchema()
  await releaseExpiredStockReservations()
  if (idempotencyKey) {
    const saved = await getIdempotencyResponse(userId, "checkout-order", idempotencyKey)
    if (saved) return saved
  }

  const payload = normalizeCheckoutPayload(input)

  // Server-side COD minimum order enforcement
  if (payload.paymentMethod === "cash_on_delivery") {
    const { minOrdersRequired } = await getOryCMSCodRule()
    if (minOrdersRequired > 0) {
      const userOrderCount = await getCustomerCompletedOrderCount(userId)
      if (userOrderCount < minOrdersRequired) {
        throw new Error(`Cash on Delivery is only available after completing at least ${minOrdersRequired} order(s). You currently have ${userOrderCount} completed order(s).`)
      }
    }
  }

  // Server-side coupon re-validation
  let validatedCouponId: string | null = null
  let validatedCouponCode: string | null = null
  let validatedDiscountAmount = payload.discountTotal

  if (payload.coupon?.code) {
    const productSlugs = payload.items.map((item) => (item as { productSlug?: string }).productSlug ?? "").filter(Boolean)
    const [orderCountRow] = await orycmsPrisma.$queryRaw<{ cnt: bigint }[]>`
      SELECT COUNT(*) AS cnt FROM storefront_orders
      WHERE user_id = ${userId}::uuid AND payment_status = 'paid'
    `
    const orderCount = Number(orderCountRow?.cnt ?? 0)
    const shippingCost = payload.shippingTotal
    const result = await validateCouponCode(payload.coupon.code, {
      userId,
      subtotal: payload.subtotal,
      shippingTotal: shippingCost,
      productSlugs,
      orderCount,
    })
    if (!result.valid) throw new Error(result.message)
    validatedCouponId = result.discountId
    validatedCouponCode = result.code
    validatedDiscountAmount = result.discountAmount
  }

  // Recompute total using server-validated discount to prevent price manipulation
  const validatedTotal = money(payload.subtotal + payload.shippingTotal - validatedDiscountAmount)

  const number = await uniqueOrderNumber()
  const invoiceNumber = `INV-${number}`
  const initialPaymentStatus = payload.paymentMethod === "cash_on_delivery" ? "pending" : "pending_payment"
  const initialStatus = payload.paymentMethod === "cash_on_delivery" ? "processing" : "payment_pending"
  const reservationExpiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60_000)
  const reservedItems = await reserveStock(payload.items)
  let razorpayOrderId: string | null = null

  try {
    if (payload.paymentMethod === "razorpay") {
      const razorpayOrder = await createRazorpayOrder({ amount: validatedTotal, receipt: number })
      razorpayOrderId = razorpayOrder.id
    }

    const timeline = [timelineEvent(payload.paymentMethod === "razorpay" ? "order.created_pending_payment" : "order.created_cod", initialPaymentStatus)]
    const [order] = await orycmsPrisma.$queryRaw<StorefrontOrderRow[]>`
      INSERT INTO storefront_orders (
        user_id, number, status, payment_status, payment_method, razorpay_order_id, contact,
        shipping_address, delivery_method, subtotal, shipping_total, discount_total, coupon_code, coupon_id,
        invoice_number, reservation_expires_at, payment_timeline, items, total
      )
      VALUES (
        ${userId}::uuid, ${number}, ${initialStatus}, ${initialPaymentStatus}, ${payload.paymentMethod},
        ${razorpayOrderId}, ${JSON.stringify(payload.contact)}::jsonb, ${JSON.stringify(payload.shippingAddress)}::jsonb,
        ${payload.deliveryMethod}, ${payload.subtotal}, ${payload.shippingTotal}, ${validatedDiscountAmount},
        ${validatedCouponCode}, ${validatedCouponId}::uuid,
        ${invoiceNumber}, ${reservationExpiresAt}, ${JSON.stringify(timeline)}::jsonb,
        ${JSON.stringify(reservedItems)}::jsonb, ${validatedTotal}
      )
      RETURNING *
    `

    if (validatedCouponId && validatedCouponCode) {
      await recordDiscountUsage(validatedCouponId, userId, order.id, validatedDiscountAmount)
    }

    await recordTransaction(order.id, userId, payload.paymentMethod === "razorpay" ? "order.created" : "cod.placed", initialPaymentStatus, payload.total, {
      razorpayOrderId,
      rawPayload: { idempotencyKey },
    })
    await notifyLowStockForItems(reservedItems)
    await createOryCMSNotification({
      type: "order",
      title: "New Order",
      message: `Order ${order.number} placed · ${payload.paymentMethod} · ₹${Number(order.total).toFixed(2)}`,
      entityId: order.id,
      entityType: "order",
      targetUrl: `/admin/orders/${order.id}?highlight=${order.id}`,
    }).catch((error) => console.error("OryCMS notification failed", error))
    if (payload.paymentMethod === "cash_on_delivery") await sendOrderConfirmationEmail(order)

    const response = {
      order: serializeOrder(order),
      razorpay: payload.paymentMethod === "razorpay" ? {
        amount: Math.round(validatedTotal * 100),
        currency: "INR" as const,
        keyId: getRazorpayKeyId(),
        orderId: razorpayOrderId,
      } : null,
    }
    if (idempotencyKey) await saveIdempotencyResponse(userId, "checkout-order", idempotencyKey, order.id, response)
    return response
  } catch (error) {
    await releaseReservedStockItems(reservedItems)
    throw error
  }
}

export async function verifyRazorpayPayment(userId: string, input: {
  orderId: string
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}, idempotencyKey?: string | null) {
  assertUuid(input.orderId, "orderId")
  await ensureStorefrontAuthSchema()
  if (idempotencyKey) {
    const saved = await getIdempotencyResponse(userId, "checkout-verify", idempotencyKey)
    if (saved) return saved.order
  }
  const [existing] = await selectOrderForUser(input.orderId, userId)
  if (!existing || existing.razorpay_order_id !== input.razorpayOrderId) throw new Error("Order not found.")
  if (existing.payment_status === "paid" && existing.razorpay_payment_id === input.razorpayPaymentId) return serializeOrder(existing)
  const duplicate = await paymentAlreadyRecorded(input.razorpayPaymentId)
  if (duplicate && duplicate !== input.orderId) throw new Error("Payment was already used for another order.")
  if (!isValidRazorpaySignature(input.razorpayOrderId, input.razorpayPaymentId, input.razorpaySignature)) throw new Error("Payment verification failed.")

  const order = await markOrderPaid(existing.id, input.razorpayPaymentId, input.razorpaySignature, "checkout.verify")
  await sendOrderConfirmationEmail(order)
  const serialized = serializeOrder(order)
  if (idempotencyKey) await saveIdempotencyResponse(userId, "checkout-verify", idempotencyKey, order.id, { order: serialized })
  return serialized
}

export async function retryRazorpayPayment(userId: string, orderId: string) {
  assertUuid(orderId, "orderId")
  await ensureStorefrontAuthSchema()
  await releaseExpiredStockReservations()
  const [order] = await selectOrderForUser(orderId, userId)
  if (!order) throw new Error("Order not found.")
  if (order.payment_method !== "razorpay") throw new Error("This order is not an online payment order.")
  if (!["pending_payment", "failed"].includes(order.payment_status)) throw new Error("Payment retry is not available for this order.")
  if (["cancelled", "delivered", "shipped"].includes(order.status) || order.refund_status !== "none") throw new Error("Payment retry is disabled for this order.")

  let current = order
  if (order.stock_released_at) current = await reReserveOrderStock(order)
  let razorpayOrderId = current.razorpay_order_id
  if (!razorpayOrderId) {
    const razorpayOrder = await createRazorpayOrder({ amount: Number(current.total), receipt: current.number })
    razorpayOrderId = razorpayOrder.id
    const [updated] = await orycmsPrisma.$queryRaw<StorefrontOrderRow[]>`
      UPDATE storefront_orders
      SET razorpay_order_id = ${razorpayOrderId},
          payment_status = 'pending_payment',
          status = 'payment_pending',
          payment_timeline = payment_timeline || ${JSON.stringify([timelineEvent("payment.retry", "pending_payment")])}::jsonb
      WHERE id = ${orderId}::uuid AND user_id = ${userId}::uuid
      RETURNING *
    `
    current = updated
  }

  await recordTransaction(current.id, userId, "payment.retry", "pending_payment", Number(current.total), { razorpayOrderId })
  return {
    order: serializeOrder({ ...current, razorpay_order_id: razorpayOrderId }),
    razorpay: { amount: Math.round(Number(current.total) * 100), currency: "INR" as const, keyId: getRazorpayKeyId(), orderId: razorpayOrderId },
  }
}

export async function cancelOrder(userId: string, orderId: string) {
  await ensureStorefrontAuthSchema()
  const [order] = await selectOrderForUser(orderId, userId)
  if (!order) throw new Error("Order not found.")
  if (["cancelled", "shipped", "delivered"].includes(order.status)) throw new Error("This order cannot be cancelled.")
  const refundStatus = order.payment_status === "paid" ? "pending" : order.refund_status
  await releaseOrderStock(order)
  const [updated] = await orycmsPrisma.$queryRaw<StorefrontOrderRow[]>`
    UPDATE storefront_orders
    SET status = 'cancelled',
        cancelled_at = now(),
        refund_status = ${refundStatus},
        payment_timeline = payment_timeline || ${JSON.stringify([timelineEvent("order.cancelled", order.payment_status)])}::jsonb
    WHERE id = ${orderId}::uuid AND user_id = ${userId}::uuid
    RETURNING *
  `
  await recordTransaction(order.id, userId, "order.cancelled", order.payment_status, Number(order.total), { rawPayload: { refundStatus } })
  await sendOrderEventEmail(updated, "orderCancelled").catch((error) => console.error("Cancellation email failed", error))
  if (refundStatus === "pending") await sendOrderEventEmail(updated, "refundUpdate").catch((error) => console.error("Refund email failed", error))
  return serializeOrder(updated)
}

export async function cancelOrderByAdmin(orderId: string) {
  await ensureStorefrontAuthSchema()
  const order = await selectOrderRowById(orderId)
  if (!order) throw new Error("Order not found.")
  if (["cancelled", "shipped", "delivered"].includes(order.status.toLowerCase())) throw new Error("This order cannot be cancelled.")
  const refundStatus = order.payment_status === "paid" ? "pending" : order.refund_status
  await releaseOrderStock(order)
  const [updated] = await orycmsPrisma.$queryRaw<StorefrontOrderRow[]>`
    UPDATE storefront_orders
    SET status = 'cancelled',
        cancelled_at = now(),
        refund_status = ${refundStatus},
        payment_timeline = payment_timeline || ${JSON.stringify([timelineEvent("order.cancelled_by_admin", order.payment_status)])}::jsonb
    WHERE id = ${orderId}::uuid
    RETURNING *
  `
  await recordTransaction(order.id, order.user_id ?? null, "order.cancelled_by_admin", order.payment_status, Number(order.total), { rawPayload: { refundStatus } })
  await sendOrderEventEmail(updated, "orderCancelled").catch((error) => console.error("Cancellation email failed", error))
  if (refundStatus === "pending") await sendOrderEventEmail(updated, "refundUpdate").catch((error) => console.error("Refund email failed", error))
  return serializeOrder(updated)
}

export async function handleRazorpayWebhook(rawBody: string, signature: string | null) {
  await ensureStorefrontAuthSchema()
  if (!isValidWebhookSignature(rawBody, signature)) throw new Error("Invalid webhook signature.")
  const event = JSON.parse(rawBody) as {
    event?: string
    payload?: {
      payment?: { entity?: { amount?: number; id?: string; order_id?: string; status?: string } }
      refund?: { entity?: { amount?: number; id?: string; payment_id?: string; status?: string } }
    }
  }
  const name = event.event ?? "unknown"
  const payment = event.payload?.payment?.entity
  const refund = event.payload?.refund?.entity

  if (name === "payment.captured" && payment?.order_id && payment.id) {
    const [order] = await selectOrderByRazorpayOrderId(payment.order_id)
    if (order && order.payment_status !== "paid") {
      await markOrderPaid(order.id, payment.id, null, "webhook.payment.captured", event)
    }
    return
  }
  if (name === "payment.failed" && payment?.order_id) {
    const [order] = await selectOrderByRazorpayOrderId(payment.order_id)
    if (order && order.payment_status !== "paid") {
      await releaseOrderStock(order)
      const [updated] = await orycmsPrisma.$queryRaw<StorefrontOrderRow[]>`
        UPDATE storefront_orders
        SET payment_status = 'failed',
            status = 'payment_pending',
            payment_timeline = payment_timeline || ${JSON.stringify([timelineEvent("payment.failed", "failed")])}::jsonb
        WHERE id = ${order.id}::uuid
        RETURNING *
      `
      await recordTransaction(updated.id, updated.user_id ?? null, "payment.failed", "failed", Number(updated.total), { razorpayOrderId: payment.order_id, razorpayPaymentId: payment.id, rawPayload: event })
      await createOryCMSNotification({
        type: "payment",
        title: "Payment Failed",
        message: `Payment failed for order ${updated.number}.`,
        entityId: payment.id ?? updated.id,
        entityType: "payment",
        targetUrl: `/admin/payments?highlight=${encodeURIComponent(payment.id ?? updated.id)}`,
      }).catch((error) => console.error("OryCMS notification failed", error))
    }
    return
  }
  if (name === "refund.processed" && refund?.payment_id) {
    const [order] = await selectOrderByPaymentId(refund.payment_id)
    if (order) {
      const [updated] = await orycmsPrisma.$queryRaw<StorefrontOrderRow[]>`
        UPDATE storefront_orders
        SET payment_status = 'refunded',
            refund_status = 'processed',
            payment_timeline = payment_timeline || ${JSON.stringify([timelineEvent("refund.processed", "refunded")])}::jsonb
        WHERE id = ${order.id}::uuid
        RETURNING *
      `
      await recordTransaction(updated.id, updated.user_id ?? null, "refund.processed", "processed", Number(refund.amount ?? 0) / 100, { razorpayPaymentId: refund.payment_id, razorpayRefundId: refund.id, rawPayload: event })
      await createOryCMSNotification({
        type: "payment",
        title: "Refund Completed",
        message: `Refund completed for order ${updated.number}.`,
        entityId: refund.id ?? refund.payment_id,
        entityType: "refund",
        targetUrl: `/admin/payments/${encodeURIComponent(refund.payment_id)}?highlight=${encodeURIComponent(refund.id ?? refund.payment_id)}`,
      }).catch((error) => console.error("OryCMS notification failed", error))
      await sendOrderEventEmail(updated, "refundUpdate").catch((error) => console.error("Refund email failed", error))
    }
  }
}

export async function buildInvoicePdf(userId: string, orderId: string) {
  await ensureStorefrontAuthSchema()
  const [order] = await selectOrderForUser(orderId, userId)
  if (!order) throw new Error("Order not found.")
  return invoicePdfForOrder(order)
}

export async function buildAdminInvoicePdf(orderId: string) {
  await ensureStorefrontAuthSchema()
  const order = await selectOrderRowById(orderId)
  if (!order) throw new Error("Order not found.")
  return invoicePdfForOrder(order)
}

function invoicePdfForOrder(order: StorefrontOrderRow) {
  const lines = [
    "Adhunik Crop Care",
    `Invoice: ${order.invoice_number ?? `INV-${order.number}`}`,
    `Order: ${order.number}`,
    `Date: ${new Date(order.created_at).toLocaleDateString("en-IN")}`,
    `Payment: ${order.payment_method} / ${order.payment_status}`,
    `Total: INR ${Number(order.total).toFixed(2)}`,
  ]
  return {
    filename: `${order.invoice_number ?? order.number}.pdf`,
    bytes: makeSimplePdf(lines),
  }
}

export function serializeOrder(order: StorefrontOrderRow) {
  return {
    ...order,
    cancelled_at: order.cancelled_at instanceof Date ? order.cancelled_at.toISOString() : order.cancelled_at,
    confirmed_at: order.confirmed_at instanceof Date ? order.confirmed_at.toISOString() : order.confirmed_at,
    packed_at: order.packed_at instanceof Date ? order.packed_at.toISOString() : order.packed_at,
    created_at: order.created_at instanceof Date ? order.created_at.toISOString() : order.created_at,
    discount_total: Number(order.discount_total),
    reservation_expires_at: order.reservation_expires_at instanceof Date ? order.reservation_expires_at.toISOString() : order.reservation_expires_at,
    shipping_total: Number(order.shipping_total),
    stock_released_at: order.stock_released_at instanceof Date ? order.stock_released_at.toISOString() : order.stock_released_at,
    subtotal: Number(order.subtotal),
    total: Number(order.total),
  }
}

function normalizeCheckoutPayload(input: CheckoutPayload): CheckoutPayload {
  const contact = {
    email: String(input.contact?.email ?? "").trim().toLowerCase(),
    firstName: String(input.contact?.firstName ?? "").trim(),
    lastName: String(input.contact?.lastName ?? "").trim(),
    phone: normalizePhone(String(input.contact?.phone ?? "")),
  }
  const shippingAddress = {
    address1: String(input.shippingAddress?.address1 ?? "").trim(),
    address2: String(input.shippingAddress?.address2 ?? "").trim(),
    city: String(input.shippingAddress?.city ?? "").trim(),
    pincode: String(input.shippingAddress?.pincode ?? "").replace(/\D/g, "").slice(0, 6),
    state: String(input.shippingAddress?.state ?? "").trim(),
  }
  const items = Array.isArray(input.items) ? input.items.map((item) => ({
    id: String(item.id ?? item.name ?? ""),
    image: item.image ?? item.img ?? "",
    name: String(item.name ?? "").trim(),
    price: money(item.price),
    quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
    size: item.size ? String(item.size) : undefined,
  })) : []
  const subtotal = money(input.subtotal)
  const shippingTotal = money(input.shippingTotal)
  const discountTotal = money(input.discountTotal)
  const total = money(input.total)
  if (!contact.firstName || !contact.lastName) throw new Error("Name is required.")
  if (!validateEmail(contact.email)) throw new Error("Enter a valid email.")
  if (contact.phone.length < 10) throw new Error("Enter a valid mobile number.")
  if (!shippingAddress.address1 || !shippingAddress.city || !shippingAddress.state) throw new Error("Complete delivery address.")
  if (!/^\d{6}$/.test(shippingAddress.pincode)) throw new Error("Enter a valid pincode.")
  if (items.length === 0 || items.some((item) => !item.name || item.price <= 0)) throw new Error("Cart items are invalid.")
  if (subtotal <= 0 || total <= 0) throw new Error("Order total is invalid.")
  if (Math.abs(total - (subtotal + shippingTotal - discountTotal)) > 1) throw new Error("Order total mismatch.")
  if (input.paymentMethod !== "cash_on_delivery" && input.paymentMethod !== "razorpay") throw new Error("Select a valid payment method.")
  return { contact, coupon: input.coupon ?? null, deliveryMethod: input.deliveryMethod === "express" ? "express" : "standard", discountTotal, items, paymentMethod: input.paymentMethod, shippingAddress, shippingTotal, subtotal, total }
}

async function reserveStock(items: CheckoutItem[]) {
  const reserved: CheckoutItem[] = []
  for (const item of aggregateItems(items)) {
    const slug = productSlug(item)
    const [product] = await orycmsPrisma.$queryRaw<{ id: string; slug: string; stock_quantity: number }[]>`
      SELECT id, slug, stock_quantity FROM orycms_products
      WHERE (slug = ${slug} OR lower(name) = lower(${item.name})) AND status = 'published' AND deleted_at IS NULL
      LIMIT 1
    `
    if (!product) throw new Error(`${item.name} is not available.`)
    const updated = await orycmsPrisma.$executeRaw`
      UPDATE orycms_products
      SET stock_quantity = stock_quantity - ${item.quantity}, updated_at = now()
      WHERE id = ${product.id}::uuid AND stock_quantity >= ${item.quantity}
    `
    if (Number(updated) !== 1) {
      await releaseReservedStockItems(reserved)
      throw new Error(`${item.name} does not have enough stock.`)
    }
    reserved.push({ ...item, id: item.id, productId: product.id, productSlug: product.slug } as CheckoutItem & { productId: string; productSlug: string })
  }
  return items.map((item) => {
    const found = reserved.find((reservedItem) => productSlug(reservedItem) === productSlug(item) || reservedItem.name === item.name) as (CheckoutItem & { productId?: string; productSlug?: string }) | undefined
    return { ...item, productId: found?.productId, productSlug: found?.productSlug }
  })
}

async function notifyLowStockForItems(items: CheckoutItem[]) {
  const productIds = Array.from(new Set(items.map((item) => (item as CheckoutItem & { productId?: string }).productId).filter((id): id is string => Boolean(id))))
  for (const productId of productIds) {
    const [product] = await orycmsPrisma.$queryRaw<{ id: string; stock_quantity: number; name: string }[]>`
      SELECT id, stock_quantity, name FROM orycms_products WHERE id = ${productId}::uuid LIMIT 1
    `
    if (!product) continue
    await notifyLowStockProduct(product)
  }
}

async function reReserveOrderStock(order: StorefrontOrderRow) {
  const reservedItems = await reserveStock(Array.isArray(order.items) ? order.items as CheckoutItem[] : [])
  const [updated] = await orycmsPrisma.$queryRaw<StorefrontOrderRow[]>`
    UPDATE storefront_orders
    SET items = ${JSON.stringify(reservedItems)}::jsonb,
        stock_released_at = NULL,
        reservation_expires_at = ${new Date(Date.now() + RESERVATION_MINUTES * 60_000)},
        payment_timeline = payment_timeline || ${JSON.stringify([timelineEvent("stock.reserved_retry", order.payment_status)])}::jsonb
    WHERE id = ${order.id}::uuid
    RETURNING *
  `
  return updated
}

async function releaseExpiredStockReservations() {
  await ensureStorefrontAuthSchema()
  const orders = await orycmsPrisma.$queryRawUnsafe<StorefrontOrderRow[]>(
    `SELECT ${ORDER_SELECT} FROM storefront_orders
     WHERE payment_method = 'razorpay'
      AND payment_status IN ('pending_payment', 'failed')
      AND stock_released_at IS NULL
      AND reservation_expires_at IS NOT NULL
      AND reservation_expires_at < now()
     LIMIT 25`,
  )
  for (const order of orders) await releaseOrderStock(order, "stock.released_timeout")
}

/**
 * Restores reserved inventory for an order and marks it released (idempotent via
 * stock_released_at). Shared by the storefront cancel flow and Shiprocket
 * cancellation/RTO/refund handling so both paths use one implementation.
 */
export async function restoreOrderInventory(order: StorefrontOrderRow, event = "stock.restored") {
  return releaseOrderStock(order, event)
}

/** Loads a raw order row by id without user scoping — for admin/fulfillment use only. */
export async function selectOrderRowById(orderId: string): Promise<StorefrontOrderRow | null> {
  if (!UUID_RE.test(orderId)) return null
  await ensureStorefrontAuthSchema()
  const rows = await orycmsPrisma.$queryRawUnsafe<StorefrontOrderRow[]>(
    `SELECT ${ORDER_SELECT} FROM storefront_orders WHERE id = $1::uuid LIMIT 1`,
    orderId,
  )
  return rows[0] ?? null
}

async function releaseOrderStock(order: StorefrontOrderRow, event = "stock.released") {
  if (order.stock_released_at) return
  await releaseReservedStockItems(Array.isArray(order.items) ? order.items as CheckoutItem[] : [])
  await orycmsPrisma.$executeRaw`
    UPDATE storefront_orders
    SET stock_released_at = now(),
        payment_timeline = payment_timeline || ${JSON.stringify([timelineEvent(event, order.payment_status)])}::jsonb
    WHERE id = ${order.id}::uuid AND stock_released_at IS NULL
  `
}

async function releaseReservedStockItems(items: CheckoutItem[]) {
  for (const item of aggregateItems(items)) {
    const productId = (item as CheckoutItem & { productId?: string }).productId
    const slug = (item as CheckoutItem & { productSlug?: string }).productSlug ?? productSlug(item)
    if (productId) {
      await orycmsPrisma.$executeRaw`UPDATE orycms_products SET stock_quantity = stock_quantity + ${item.quantity}, updated_at = now() WHERE id = ${productId}::uuid`
    } else if (slug) {
      await orycmsPrisma.$executeRaw`UPDATE orycms_products SET stock_quantity = stock_quantity + ${item.quantity}, updated_at = now() WHERE slug = ${slug}`
    }
  }
}

async function markOrderPaid(orderId: string, paymentId: string, signature: string | null, event: string, rawPayload?: unknown) {
  const [order] = await orycmsPrisma.$queryRaw<StorefrontOrderRow[]>`
    UPDATE storefront_orders
    SET payment_status = 'paid',
        status = 'processing',
        refund_status = 'none',
        razorpay_payment_id = COALESCE(razorpay_payment_id, ${paymentId}),
        razorpay_signature = COALESCE(razorpay_signature, ${signature}),
        payment_timeline = payment_timeline || ${JSON.stringify([timelineEvent(event, "paid")])}::jsonb
    WHERE id = ${orderId}::uuid
    RETURNING *
  `
  await recordTransaction(order.id, order.user_id ?? null, event, "paid", Number(order.total), { razorpayOrderId: order.razorpay_order_id, razorpayPaymentId: paymentId, rawPayload })
  return order
}

async function recordTransaction(orderId: string, userId: string | null, event: string, status: string, amount: number | null, input: { razorpayOrderId?: string | null; razorpayPaymentId?: string | null; razorpayRefundId?: string | null; rawPayload?: unknown } = {}) {
  await orycmsPrisma.$executeRaw`
    INSERT INTO storefront_payment_transactions (order_id, user_id, event, status, amount, razorpay_order_id, razorpay_payment_id, razorpay_refund_id, raw_payload)
    VALUES (${orderId}::uuid, ${userId ? `${userId}` : null}::uuid, ${event}, ${status}, ${amount}, ${input.razorpayOrderId ?? null}, ${input.razorpayPaymentId ?? null}, ${input.razorpayRefundId ?? null}, ${JSON.stringify(input.rawPayload ?? {})}::jsonb)
  `
}

export async function sendOrderConfirmationEmail(order: StorefrontOrderRow) {
  const contact = order.contact as { email?: string; firstName?: string } | null
  const recipient = contact?.email
  if (!recipient) return
  const [existing] = await orycmsPrisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM storefront_email_logs WHERE order_id = ${order.id}::uuid AND type = 'order_confirmation' LIMIT 1
  `
  if (existing) return
  await Promise.all([
    sendOrderEventEmail(order, "orderPlaced"),
    sendAdminEmail({ firstName: contact?.firstName, orderNumber: order.number, template: "orderPlaced", total: Number(order.total), unsubscribeUrl: "" }),
  ]).catch((error) => console.error("Order SMTP email failed", error))
  await sendConfiguredAdminOrderNotifications(order).catch((error) => console.error("Admin order notification failed", error))
  let status = "skipped"
  let providerId: string | null = null
  if (process.env.RESEND_API_KEY && process.env.ORDER_EMAIL_FROM) {
    const response = await fetch("https://api.resend.com/emails", {
      body: JSON.stringify({
        from: process.env.ORDER_EMAIL_FROM,
        to: recipient,
        subject: `Adhunik Crop Care order ${order.number}`,
        html: `<p>Hello ${contact?.firstName ?? ""},</p><p>Your order <strong>${order.number}</strong> is confirmed.</p><p>Total: ₹${Number(order.total).toFixed(2)}</p>`,
      }),
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      method: "POST",
    })
    const json = await response.json().catch(() => ({})) as { id?: string }
    status = response.ok ? "sent" : "failed"
    providerId = json.id ?? null
  }
  await orycmsPrisma.$executeRaw`
    INSERT INTO storefront_email_logs (order_id, type, recipient, provider_id, status)
    VALUES (${order.id}::uuid, 'order_confirmation', ${recipient}, ${providerId}, ${status})
    ON CONFLICT (order_id, type) DO NOTHING
  `
}

async function sendConfiguredAdminOrderNotifications(order: StorefrontOrderRow) {
  const recipients = await getEnabledOrderNotificationRecipients()
  if (recipients.length === 0) return { skipped: true }
  const contact = order.contact as { email?: string; firstName?: string; lastName?: string; phone?: string } | null
  const customerName = [contact?.firstName, contact?.lastName].filter(Boolean).join(" ")
  return sendOrderAdminNotifications(recipients, {
    adminOrderUrl: `${emailBaseUrl()}/admin/orders/${order.id}`,
    customerEmail: contact?.email,
    customerName: customerName || undefined,
    mobileNumber: contact?.phone,
    orderDate: new Date(order.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    orderNumber: order.number,
    orderStatus: order.status,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    total: Number(order.total),
  })
}

async function sendOrderEventEmail(order: StorefrontOrderRow, template: "orderPlaced" | "orderCancelled" | "refundUpdate") {
  const contact = order.contact as { email?: string; firstName?: string } | null
  if (!contact?.email) return { skipped: true }
  return sendEmail({
    firstName: contact.firstName,
    orderNumber: order.number,
    refundStatus: order.refund_status,
    template,
    to: contact.email,
    total: Number(order.total),
    unsubscribeUrl: "",
    userId: order.user_id,
  })
}

async function getIdempotencyResponse(userId: string, endpoint: string, key: string) {
  const [row] = await orycmsPrisma.$queryRaw<{ response: unknown }[]>`
    SELECT response FROM storefront_idempotency_keys WHERE key = ${key} AND user_id = ${userId}::uuid AND endpoint = ${endpoint} LIMIT 1
  `
  return row?.response as CheckoutOrderResponse | null
}

async function saveIdempotencyResponse(userId: string, endpoint: string, key: string, orderId: string, response: unknown) {
  await orycmsPrisma.$executeRaw`
    INSERT INTO storefront_idempotency_keys (key, user_id, endpoint, order_id, response)
    VALUES (${key}, ${userId}::uuid, ${endpoint}, ${orderId}::uuid, ${JSON.stringify(response)}::jsonb)
    ON CONFLICT (key) DO NOTHING
  `
}

async function selectOrderForUser(orderId: string, userId: string) {
  return orycmsPrisma.$queryRawUnsafe<StorefrontOrderRow[]>(`SELECT ${ORDER_SELECT} FROM storefront_orders WHERE id = $1::uuid AND user_id = $2::uuid LIMIT 1`, orderId, userId)
}

async function selectOrderByRazorpayOrderId(razorpayOrderId: string) {
  return orycmsPrisma.$queryRawUnsafe<StorefrontOrderRow[]>(`SELECT ${ORDER_SELECT} FROM storefront_orders WHERE razorpay_order_id = $1 LIMIT 1`, razorpayOrderId)
}

async function selectOrderByPaymentId(paymentId: string) {
  return orycmsPrisma.$queryRawUnsafe<StorefrontOrderRow[]>(`SELECT ${ORDER_SELECT} FROM storefront_orders WHERE razorpay_payment_id = $1 LIMIT 1`, paymentId)
}

async function paymentAlreadyRecorded(paymentId: string) {
  const [row] = await orycmsPrisma.$queryRaw<{ order_id: string }[]>`
    SELECT order_id FROM storefront_payment_transactions WHERE razorpay_payment_id = ${paymentId} AND status = 'paid' LIMIT 1
  `
  return row?.order_id
}

async function createRazorpayOrder(input: { amount: number; receipt: string }) {
  const keyId = getRazorpayKeyId()
  const keySecret = getRazorpayKeySecret()
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    body: JSON.stringify({ amount: Math.round(input.amount * 100), currency: "INR", payment_capture: 1, receipt: input.receipt }),
    headers: { authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`, "content-type": "application/json" },
    method: "POST",
  })
  const json = await response.json() as { error?: { description?: string }; id?: string }
  if (!response.ok || !json.id) throw new Error(json.error?.description ?? "Unable to create Razorpay order.")
  return { id: json.id }
}

function isValidRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac("sha256", getRazorpayKeySecret()).update(`${orderId}|${paymentId}`).digest("hex")
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

function isValidWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !signature) return false
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

function getRazorpayKeyId() {
  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  if (!keyId) throw new Error("Razorpay key ID is not configured.")
  return keyId
}

function getRazorpayKeySecret() {
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) throw new Error("Razorpay key secret is not configured.")
  return keySecret
}

async function uniqueOrderNumber() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const number = `ACC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`
    const [existing] = await orycmsPrisma.$queryRaw<{ id: string }[]>`SELECT id FROM storefront_orders WHERE number = ${number} LIMIT 1`
    if (!existing) return number
  }
  throw new Error("Unable to generate order number.")
}

function timelineEvent(event: string, status: string) {
  return { at: new Date().toISOString(), event, status }
}

function aggregateItems(items: CheckoutItem[]) {
  const map = new Map<string, CheckoutItem>()
  for (const item of items) {
    const key = productSlug(item) || item.name
    const existing = map.get(key)
    map.set(key, existing ? { ...existing, quantity: existing.quantity + item.quantity } : item)
  }
  return Array.from(map.values())
}

function productSlug(item: CheckoutItem) {
  const id = String(item.id ?? "")
  return id.split("--")[0] || item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function money(value: unknown) {
  return Math.max(0, Math.round(Number(value || 0) * 100) / 100)
}

function makeSimplePdf(lines: string[]) {
  const text = lines.map((line, index) => `BT /F1 12 Tf 50 ${760 - index * 22} Td (${escapePdf(line)}) Tj ET`).join("\n")
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${text.length} >> stream\n${text}\nendstream endobj`,
  ]
  let offset = "%PDF-1.4\n".length
  const xref = objects.map((object) => {
    const current = offset
    offset += object.length + 1
    return current
  })
  const body = `%PDF-1.4\n${objects.join("\n")}\n`
  const table = `xref\n0 6\n0000000000 65535 f \n${xref.map((n) => `${String(n).padStart(10, "0")} 00000 n `).join("\n")}\n`
  return Buffer.from(`${body}${table}trailer << /Size 6 /Root 1 0 R >>\nstartxref\n${body.length}\n%%EOF`)
}

function escapePdf(value: string) {
  return value.replace(/[()\\]/g, "\\$&")
}
