import crypto from "crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"
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

async function invoicePdfForOrder(order: StorefrontOrderRow) {
  return {
    filename: `${order.invoice_number ?? order.number}.pdf`,
    bytes: await makeInvoicePdf(order),
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

type InvoiceContact = { email?: string; firstName?: string; lastName?: string; phone?: string; gstNumber?: string }
type InvoiceAddress = { address1?: string; address2?: string; city?: string; pincode?: string; state?: string; country?: string; gstNumber?: string }
type InvoiceLineItem = CheckoutItem & {
  productSlug?: string
  sku?: string
  hsn?: string
  hsnCode?: string
  hsnSac?: string
  gstRate?: number
  taxRate?: number
  discount?: number
  discountAmount?: number
}

const COMPANY = {
  name: "Adhunik CropCare Private Limited",
  mobile: "+91 9205762766",
  email: "support@adhunikcropcare.com",
  gstin: "06AAHCA5011F1Z8",
  registeredAddress: ["SCO 323, 2nd Floor", "Sector 40-D", "Chandigarh - 160036"],
  warehouseAddress: ["KHEWAT NO. 349", "KHATONI NO. 440", "VILLAGE BHADOG, TEHSIL NARAINGARH"],
}

type PdfImage = { dataHex: string; height: number; name: string; width: number }

async function makeInvoicePdf(order: StorefrontOrderRow) {
  const pdf = new PdfBuilder()
  const logo = await loadInvoiceLogo()
  drawInvoicePage(pdf, order, logo)
  return pdf.toBuffer()
}

async function loadInvoiceLogo(): Promise<PdfImage | null> {
  try {
    const input = await readFile(path.join(process.cwd(), "public", "fevicon.png"))
    const { data, info } = await sharp(input)
      .resize(96, 96, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .raw()
      .toBuffer({ resolveWithObject: true })
    return { name: "Logo", width: info.width, height: info.height, dataHex: data.toString("hex").toUpperCase() }
  } catch (error) {
    console.error("Invoice logo unavailable", error)
    return null
  }
}

function drawInvoicePage(pdf: PdfBuilder, order: StorefrontOrderRow, logo: PdfImage | null) {
  const contact = objectOf<InvoiceContact>(order.contact)
  const address = objectOf<InvoiceAddress>(order.shipping_address)
  const items = Array.isArray(order.items) ? (order.items as InvoiceLineItem[]) : []
  const invoiceNo = order.invoice_number ?? `INV-${order.number}`
  const subtotal = money(order.subtotal)
  const discount = money(order.discount_total)
  const shipping = money(order.shipping_total)
  const grandTotal = money(order.total)
  const taxable = Math.max(0, subtotal - discount)
  const gstTotal = Math.max(0, grandTotal - taxable - shipping)
  const isInterstate = String(address.state ?? "").trim().toLowerCase() !== "haryana"
  const cgst = isInterstate ? 0 : round2(gstTotal / 2)
  const sgst = isInterstate ? 0 : round2(gstTotal / 2)
  const igst = isInterstate ? gstTotal : 0
  const computed = taxable + shipping + cgst + sgst + igst
  const roundOff = round2(grandTotal - computed)

  drawHeader(pdf, logo)
  drawInfoTable(pdf, [
    ["Invoice Number", invoiceNo],
    ["Order Number", order.number],
    ["Invoice Date", dateIn(order.packed_at ?? new Date())],
    ["Order Date", dateIn(order.created_at)],
    ["Payment Method", titleCase(order.payment_method.replace(/_/g, " "))],
    ["Payment Status", titleCase(order.payment_status)],
    ["Order Status", titleCase(order.status)],
    ["Shipping Method", titleCase(order.delivery_method ?? "Standard")],
  ], 38, 650, 520, 70)

  const buyerLines = [
    fullName(contact),
    contact.phone ? `Mobile: ${contact.phone}` : null,
    contact.email ? `Email: ${contact.email}` : null,
    address.address1,
    address.address2,
    [address.city, address.state, address.pincode].filter(Boolean).join(", "),
    address.country ?? "India",
    address.gstNumber || contact.gstNumber ? `GST Number: ${address.gstNumber ?? contact.gstNumber}` : null,
  ].filter(Boolean) as string[]
  const sellerLines = [
    COMPANY.name,
    `GSTIN: ${COMPANY.gstin}`,
    `Registered: ${COMPANY.registeredAddress.join(", ")}`,
    `Warehouse: ${COMPANY.warehouseAddress.join(", ")}`,
    `Support: ${COMPANY.email}`,
    `Phone: ${COMPANY.mobile}`,
  ]
  drawBoxedText(pdf, "Bill To", buyerLines, 38, 565, 250, 112)
  drawBoxedText(pdf, "Sold By", sellerLines, 308, 565, 250, 112)

  const tableBottom = drawProductTable(pdf, items, 38, 430)
  let summaryTop = Math.min(tableBottom - 18, 250)
  if (tableBottom < 300) {
    drawFooter(pdf)
    pdf.addPage()
    pdf.text("TAX INVOICE", 38, 800, 14, "bold")
    pdf.text(`${invoiceNo} / ${order.number}`, 330, 802, 8, "normal", 210, [90, 90, 90], "right")
    pdf.line(38, 784, 558, 784)
    summaryTop = 742
  }
  drawTotals(pdf, {
    subtotal,
    discount,
    shipping,
    taxable,
    cgst,
    sgst,
    igst,
    roundOff,
    grandTotal,
  }, 333, summaryTop)

  pdf.text("Amount in Words", 38, summaryTop - 8, 8, "bold")
  pdf.text(`${amountWords(Math.round(grandTotal))} only`, 38, summaryTop - 21, 8, "normal", 270)

  drawNotes(pdf, 38, 118)
  drawSignature(pdf, 355, 115)
  drawFooter(pdf)
}

function drawHeader(pdf: PdfBuilder, logo: PdfImage | null) {
  pdf.rect(38, 735, 520, 72)
  pdf.fillRect(50, 756, 42, 34, [235, 244, 230])
  if (logo) {
    pdf.image(logo, 54, 758, 34, 30)
  } else {
    pdf.circle(71, 773, 13, [104, 156, 48])
    pdf.text("ACC", 61, 769, 9, "bold", 42, "white")
  }
  pdf.text("TAX INVOICE", 38, 817, 15, "bold")
  pdf.text(COMPANY.name, 108, 786, 14, "bold")
  pdf.text(`Mobile: ${COMPANY.mobile}`, 108, 770, 8)
  pdf.text(`Email: ${COMPANY.email}`, 108, 758, 8)
  pdf.text(`GSTIN: ${COMPANY.gstin}`, 108, 746, 8, "bold")
  pdf.text(COMPANY.registeredAddress.join(", "), 330, 786, 8, "normal", 210, "black", "right")
  pdf.text(`Warehouse: ${COMPANY.warehouseAddress.join(", ")}`, 330, 758, 8, "normal", 210, "black", "right")
}

function drawInfoTable(pdf: PdfBuilder, rows: Array<[string, string]>, x: number, y: number, w: number, h: number) {
  pdf.rect(x, y, w, h)
  const colW = w / 4
  const rowH = h / 2
  rows.forEach(([label, value], index) => {
    const cx = x + (index % 4) * colW
    const cy = y + (index < 4 ? rowH : 0)
    if (index % 4 > 0) pdf.line(cx, y, cx, y + h)
    if (index === 4) pdf.line(x, y + rowH, x + w, y + rowH)
    pdf.text(label, cx + 6, cy + rowH - 15, 6.8, "bold", colW - 12, [90, 90, 90])
    pdf.text(value, cx + 6, cy + rowH - 30, 8, "normal", colW - 12)
  })
}

function drawBoxedText(pdf: PdfBuilder, title: string, lines: string[], x: number, y: number, w: number, h: number) {
  pdf.rect(x, y, w, h)
  pdf.fillRect(x, y + h - 22, w, 22, [245, 247, 245])
  pdf.text(title, x + 9, y + h - 15, 9, "bold")
  let cy = y + h - 36
  for (const line of lines) {
    const used = pdf.text(line, x + 9, cy, 7.6, "normal", w - 18)
    cy -= used + 3
    if (cy < y + 8) break
  }
}

function drawProductTable(pdf: PdfBuilder, items: InvoiceLineItem[], x: number, topY: number) {
  const widths = [25, 116, 55, 43, 28, 55, 46, 34, 52, 66]
  const headers = ["S.No.", "Product Name", "SKU", "HSN/SAC", "Qty", "Unit Price", "Discount", "Tax %", "GST Amount", "Total"]
  let y = topY
  pdf.fillRect(x, y, 520, 22, [239, 243, 238])
  pdf.rect(x, y, 520, 22)
  let cx = x
  headers.forEach((header, index) => {
    pdf.text(header, cx + 3, y + 8, 6.5, "bold", widths[index] - 6, [40, 40, 40], index >= 4 ? "right" : "left")
    if (index > 0) pdf.line(cx, y, cx, y + 22)
    cx += widths[index]
  })
  y -= 1

  const rows = items.length ? items : [{ name: "Order Item", price: Number(orderTotalFallback(items)), quantity: 1 }]
  rows.forEach((item, index) => {
    const qty = Math.max(1, Number(item.quantity ?? 1))
    const unit = money(item.price)
    const discount = money(item.discountAmount ?? item.discount ?? 0)
    const taxRate = Number(item.gstRate ?? item.taxRate ?? 0)
    const lineTaxable = Math.max(0, unit * qty - discount)
    const gst = round2(lineTaxable * taxRate / 100)
    const total = lineTaxable + gst
    const rowY = y - 34
    pdf.rect(x, rowY, 520, 34)
    cx = x
    const cells = [
      String(index + 1),
      String(item.name ?? "Product"),
      String(item.sku ?? item.productSlug ?? item.id ?? "-"),
      String(item.hsnSac ?? item.hsnCode ?? item.hsn ?? "-"),
      String(qty),
      inr(unit),
      inr(discount),
      taxRate ? `${taxRate}%` : "-",
      inr(gst),
      inr(total || unit * qty),
    ]
    cells.forEach((cell, cellIndex) => {
      pdf.text(cell, cx + 3, rowY + 20, 6.7, "normal", widths[cellIndex] - 6, "black", cellIndex >= 4 ? "right" : "left")
      if (cellIndex > 0) pdf.line(cx, rowY, cx, rowY + 34)
      cx += widths[cellIndex]
    })
    y = rowY
  })
  return y
}

function drawTotals(pdf: PdfBuilder, totals: Record<string, number>, x: number, y: number) {
  const allRows: Array<[string, number, boolean?]> = [
    ["Subtotal", totals.subtotal],
    ["Discount", -totals.discount],
    ["Shipping Charge", totals.shipping],
    ["Taxable Amount", totals.taxable],
    ["CGST", totals.cgst],
    ["SGST", totals.sgst],
    ["IGST", totals.igst],
    ["Round Off", totals.roundOff],
    ["Grand Total", totals.grandTotal, true],
  ]
  const rows = allRows.filter(([label, value]) => label === "Grand Total" || value !== 0)
  const rowH = 17
  const h = rows.length * rowH
  pdf.rect(x, y - h, 225, h)
  rows.forEach(([label, value, strong], index) => {
    const cy = y - (index + 1) * rowH
    if (strong) pdf.fillRect(x, cy, 225, rowH, [235, 244, 230])
    pdf.line(x, cy, x + 225, cy)
    pdf.text(label, x + 8, cy + 5, strong ? 8.5 : 7.5, strong ? "bold" : "normal")
    pdf.text(inr(value), x + 122, cy + 5, strong ? 8.5 : 7.5, strong ? "bold" : "normal", 92, "black", "right")
  })
}

function drawNotes(pdf: PdfBuilder, x: number, y: number) {
  pdf.text("Notes", x, y + 34, 8, "bold")
  const notes = [
    "Goods once sold are not returnable unless applicable.",
    "Please retain this invoice for warranty purposes.",
    "This is a computer-generated invoice.",
  ]
  notes.forEach((note, index) => pdf.text(`${index + 1}. ${note}`, x, y + 19 - index * 12, 7))
}

function drawSignature(pdf: PdfBuilder, x: number, y: number) {
  pdf.line(x, y + 34, x + 165, y + 34)
  pdf.text("Authorized Signature", x + 48, y + 20, 8, "bold")
  pdf.text(COMPANY.name, x + 12, y + 8, 7, "normal", 150, [90, 90, 90], "center")
}

function drawFooter(pdf: PdfBuilder) {
  pdf.text("Auto Generated Invoice by OryCMS", 160, 35, 7, "normal", 275, [120, 120, 120], "center")
  pdf.text("Powered by OrynticLabs Private Limited", 160, 24, 7, "normal", 275, [120, 120, 120], "center")
}

class PdfBuilder {
  private pages: string[][] = [[]]
  private images = new Map<string, PdfImage>()

  addPage() {
    this.pages.push([])
  }

  private get commands() {
    return this.pages[this.pages.length - 1]
  }

  rect(x: number, y: number, w: number, h: number, color: PdfColor = [120, 120, 120]) {
    this.commands.push(`${stroke(color)} ${fmt(x)} ${fmt(y)} ${fmt(w)} ${fmt(h)} re S`)
  }

  fillRect(x: number, y: number, w: number, h: number, color: PdfColor) {
    this.commands.push(`${fill(color)} ${fmt(x)} ${fmt(y)} ${fmt(w)} ${fmt(h)} re f`)
  }

  line(x1: number, y1: number, x2: number, y2: number, color: PdfColor = [190, 190, 190]) {
    this.commands.push(`${stroke(color)} ${fmt(x1)} ${fmt(y1)} m ${fmt(x2)} ${fmt(y2)} l S`)
  }

  circle(cx: number, cy: number, r: number, color: PdfColor) {
    this.commands.push(`${fill(color)} ${fmt(cx - r)} ${fmt(cy - r)} ${fmt(r * 2)} ${fmt(r * 2)} re f`)
  }

  image(image: PdfImage, x: number, y: number, w: number, h: number) {
    this.images.set(image.name, image)
    this.commands.push(`q ${fmt(w)} 0 0 ${fmt(h)} ${fmt(x)} ${fmt(y)} cm /${image.name} Do Q`)
  }

  text(value: string, x: number, y: number, size = 8, weight: "normal" | "bold" = "normal", maxWidth = 999, color: PdfColor | "black" | "white" = "black", align: "left" | "right" | "center" = "left") {
    const clean = ascii(value)
    const lines = wrap(clean, maxWidth, size)
    lines.forEach((line, index) => {
      const width = textWidth(line, size)
      const dx = align === "right" ? maxWidth - width : align === "center" ? (maxWidth - width) / 2 : 0
      this.commands.push(`${fill(color)} BT /${weight === "bold" ? "F2" : "F1"} ${fmt(size)} Tf ${fmt(x + Math.max(0, dx))} ${fmt(y - index * (size + 2))} Td (${escapePdf(line)}) Tj ET`)
    })
    return lines.length * (size + 2)
  }

  toBuffer() {
    const font1Obj = 3 + this.pages.length * 2
    const font2Obj = font1Obj + 1
    const imageList = Array.from(this.images.values())
    const imageObjStart = font2Obj + 1
    const xobjects = imageList.length
      ? ` /XObject << ${imageList.map((image, index) => `/${image.name} ${imageObjStart + index} 0 R`).join(" ")} >>`
      : ""
    const objects = [
      "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
      `2 0 obj << /Type /Pages /Kids [${this.pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${this.pages.length} >> endobj`,
    ]
    this.pages.forEach((commands, index) => {
      const pageObj = 3 + index * 2
      const contentObj = pageObj + 1
      const stream = commands.join("\n")
      objects.push(`${pageObj} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font1Obj} 0 R /F2 ${font2Obj} 0 R >>${xobjects} >> /Contents ${contentObj} 0 R >> endobj`)
      objects.push(`${contentObj} 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`)
    })
    objects.push(`${font1Obj} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`)
    objects.push(`${font2Obj} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj`)
    imageList.forEach((image, index) => {
      const stream = `${image.dataHex}>`
      objects.push(`${imageObjStart + index} 0 obj << /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /ASCIIHexDecode /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`)
    })
    let offset = "%PDF-1.4\n".length
    const xref = objects.map((object) => {
      const current = offset
      offset += Buffer.byteLength(`${object}\n`)
      return current
    })
    const body = `%PDF-1.4\n${objects.join("\n")}\n`
    const table = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${xref.map((n) => `${String(n).padStart(10, "0")} 00000 n `).join("\n")}\n`
    return Buffer.from(`${body}${table}trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${Buffer.byteLength(body)}\n%%EOF`)
  }
}

type PdfColor = [number, number, number]

function objectOf<T extends object>(value: unknown): Partial<T> {
  return value && typeof value === "object" ? value as Partial<T> : {}
}

function fullName(contact: Partial<InvoiceContact>) {
  return [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Customer"
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function inr(value: number) {
  const sign = value < 0 ? "-" : ""
  return `${sign}INR ${Math.abs(value).toFixed(2)}`
}

function dateIn(value: Date | string | null | undefined) {
  const date = value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function orderTotalFallback(items: InvoiceLineItem[]) {
  return items.reduce((sum, item) => sum + money(item.price) * Math.max(1, Number(item.quantity ?? 1)), 0)
}

function amountWords(value: number) {
  if (value === 0) return "Zero rupees"
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
  const below100 = (n: number) => n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`
  const below1000 = (n: number) => `${n >= 100 ? `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? " " : ""}` : ""}${n % 100 ? below100(n % 100) : ""}`
  const crore = Math.floor(value / 10000000)
  const lakh = Math.floor(value / 100000) % 100
  const thousand = Math.floor(value / 1000) % 100
  const rest = value % 1000
  return [
    crore ? `${below100(crore)} Crore` : "",
    lakh ? `${below100(lakh)} Lakh` : "",
    thousand ? `${below100(thousand)} Thousand` : "",
    rest ? below1000(rest) : "",
    "Rupees",
  ].filter(Boolean).join(" ")
}

function wrap(value: string, maxWidth: number, size: number) {
  const words = value.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ""
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (textWidth(next, size) <= maxWidth || !line) {
      line = next
    } else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : [""]
}

function textWidth(value: string, size: number) {
  return value.length * size * 0.47
}

function fill(color: PdfColor | "black" | "white") {
  const [r, g, b] = color === "black" ? [0, 0, 0] : color === "white" ? [255, 255, 255] : color
  return `${fmt(r / 255)} ${fmt(g / 255)} ${fmt(b / 255)} rg`
}

function stroke(color: PdfColor) {
  return `${fmt(color[0] / 255)} ${fmt(color[1] / 255)} ${fmt(color[2] / 255)} RG`
}

function fmt(value: number) {
  return Number(value.toFixed(2))
}

function ascii(value: string) {
  return String(value).replace(/[₹–—]/g, "-").replace(/[^\x20-\x7E]/g, "")
}

function escapePdf(value: string) {
  return value.replace(/[()\\]/g, "\\$&")
}
