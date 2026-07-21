import "server-only"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import {
  createRefund,
  fetchPayments,
  fetchRefundsForPayment,
  fetchSettlements,
  getPayment,
  getRefund,
  type RazorpayPaymentEntity,
  type RazorpayRefundEntity,
  type RazorpaySettlementEntity,
} from "@/lib/razorpay/client"

const paise = (value: number | null | undefined) => (value == null ? null : Number(value) / 100)
const rzpDate = (seconds: number | null | undefined) => (seconds ? new Date(seconds * 1000) : null)

type OrderLink = { id: string; number: string; customerName: string | null }

/** Resolves the local storefront order for a Razorpay payment via order id / payment id. */
async function linkOrder(payment: RazorpayPaymentEntity): Promise<OrderLink | null> {
  const rows = await orycmsPrisma.$queryRaw<{ id: string; number: string; contact: unknown }[]>`
    SELECT id, number, contact FROM storefront_orders
    WHERE razorpay_order_id = ${payment.order_id} OR razorpay_payment_id = ${payment.id}
    LIMIT 1
  `
  const order = rows[0]
  if (!order) return null
  const contact = (order.contact ?? {}) as { firstName?: string; lastName?: string }
  const customerName = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || null
  return { id: order.id, number: order.number, customerName }
}

export async function upsertPaymentMirror(payment: RazorpayPaymentEntity): Promise<void> {
  const link = await linkOrder(payment)
  const notes = payment.notes && typeof payment.notes === "object" ? payment.notes : {}
  await orycmsPrisma.$executeRaw`
    INSERT INTO razorpay_payments (
      razorpay_payment_id, razorpay_order_id, order_id, order_number, customer_name,
      amount, amount_refunded, currency, status, method, captured, email, contact,
      fee, tax, refund_status, international, notes, raw, created_at_rzp, synced_at
    ) VALUES (
      ${payment.id}, ${payment.order_id}, ${link?.id ?? null}::uuid, ${link?.number ?? null}, ${link?.customerName ?? null},
      ${paise(payment.amount) ?? 0}, ${paise(payment.amount_refunded) ?? 0}, ${payment.currency}, ${payment.status},
      ${payment.method}, ${payment.captured}, ${payment.email}, ${payment.contact},
      ${paise(payment.fee)}, ${paise(payment.tax)}, ${payment.refund_status}, ${payment.international},
      ${JSON.stringify(notes)}::jsonb, ${JSON.stringify(payment)}::jsonb, ${rzpDate(payment.created_at)}, now()
    )
    ON CONFLICT (razorpay_payment_id) DO UPDATE SET
      razorpay_order_id = EXCLUDED.razorpay_order_id,
      order_id = COALESCE(EXCLUDED.order_id, razorpay_payments.order_id),
      order_number = COALESCE(EXCLUDED.order_number, razorpay_payments.order_number),
      customer_name = COALESCE(EXCLUDED.customer_name, razorpay_payments.customer_name),
      amount = EXCLUDED.amount,
      amount_refunded = EXCLUDED.amount_refunded,
      status = EXCLUDED.status,
      method = EXCLUDED.method,
      captured = EXCLUDED.captured,
      email = COALESCE(EXCLUDED.email, razorpay_payments.email),
      contact = COALESCE(EXCLUDED.contact, razorpay_payments.contact),
      fee = EXCLUDED.fee,
      tax = EXCLUDED.tax,
      refund_status = EXCLUDED.refund_status,
      notes = EXCLUDED.notes,
      raw = EXCLUDED.raw,
      synced_at = now(),
      updated_at = now()
  `
}

export async function upsertRefundMirror(refund: RazorpayRefundEntity): Promise<void> {
  const rows = await orycmsPrisma.$queryRaw<{ order_id: string | null }[]>`
    SELECT order_id FROM razorpay_payments WHERE razorpay_payment_id = ${refund.payment_id} LIMIT 1
  `
  const orderId = rows[0]?.order_id ?? null
  const notes = refund.notes && typeof refund.notes === "object" ? refund.notes : {}
  const reason = (notes as Record<string, unknown>).reason
  await orycmsPrisma.$executeRaw`
    INSERT INTO razorpay_refunds (
      razorpay_refund_id, razorpay_payment_id, order_id, amount, currency, status,
      speed_processed, reason, receipt, notes, raw, created_at_rzp, synced_at
    ) VALUES (
      ${refund.id}, ${refund.payment_id}, ${orderId}::uuid, ${paise(refund.amount) ?? 0}, ${refund.currency}, ${refund.status},
      ${refund.speed_processed ?? null}, ${typeof reason === "string" ? reason : null}, ${refund.receipt ?? null},
      ${JSON.stringify(notes)}::jsonb, ${JSON.stringify(refund)}::jsonb, ${rzpDate(refund.created_at)}, now()
    )
    ON CONFLICT (razorpay_refund_id) DO UPDATE SET
      status = EXCLUDED.status,
      speed_processed = EXCLUDED.speed_processed,
      amount = EXCLUDED.amount,
      raw = EXCLUDED.raw,
      synced_at = now(),
      updated_at = now()
  `
}

export async function upsertSettlementMirror(settlement: RazorpaySettlementEntity): Promise<void> {
  await orycmsPrisma.$executeRaw`
    INSERT INTO razorpay_settlements (
      razorpay_settlement_id, amount, fees, tax, status, settled, utr, raw, created_at_rzp, synced_at
    ) VALUES (
      ${settlement.id}, ${paise(settlement.amount) ?? 0}, ${paise(settlement.fees) ?? 0}, ${paise(settlement.tax) ?? 0},
      ${settlement.status}, ${settlement.status === "processed"}, ${settlement.utr}, ${JSON.stringify(settlement)}::jsonb,
      ${rzpDate(settlement.created_at)}, now()
    )
    ON CONFLICT (razorpay_settlement_id) DO UPDATE SET
      amount = EXCLUDED.amount, fees = EXCLUDED.fees, tax = EXCLUDED.tax,
      status = EXCLUDED.status, settled = EXCLUDED.settled, utr = EXCLUDED.utr,
      raw = EXCLUDED.raw, synced_at = now()
  `
}

/** Pulls recent payments (+ their refunds) from Razorpay into the mirror. Idempotent. */
export async function syncPaymentsFromRazorpay(params: { from?: number; to?: number; pages?: number } = {}): Promise<{ payments: number; refunds: number }> {
  let paymentCount = 0
  let refundCount = 0
  const pages = Math.max(1, Math.min(10, params.pages ?? 3))
  for (let page = 0; page < pages; page += 1) {
    const result = await fetchPayments({ from: params.from, to: params.to, count: 100, skip: page * 100 })
    if (!result.items?.length) break
    for (const payment of result.items) {
      await upsertPaymentMirror(payment)
      paymentCount += 1
      if (payment.amount_refunded > 0) {
        const refunds = await fetchRefundsForPayment(payment.id).catch(() => null)
        for (const refund of refunds?.items ?? []) {
          await upsertRefundMirror(refund)
          refundCount += 1
        }
      }
    }
    if (result.items.length < 100) break
  }
  return { payments: paymentCount, refunds: refundCount }
}

export async function syncSettlements(params: { from?: number; to?: number } = {}): Promise<{ settlements: number }> {
  let count = 0
  const result = await fetchSettlements({ from: params.from, to: params.to, count: 100 })
  for (const settlement of result.items ?? []) {
    await upsertSettlementMirror(settlement)
    count += 1
  }
  return { settlements: count }
}

/** Re-fetches a single refund and payment from Razorpay and refreshes their mirror rows + linked order. */
export async function syncRefundStatus(refundId: string): Promise<RazorpayRefundEntity> {
  const refund = await getRefund(refundId)
  await upsertRefundMirror(refund)
  const payment = await getPayment(refund.payment_id).catch(() => null)
  if (payment) {
    await upsertPaymentMirror(payment)
    await syncOrderRefundStatus(refund.payment_id, refund.status)
  }
  return refund
}

/** Mirrors the refund state back onto the linked storefront order. */
async function syncOrderRefundStatus(razorpayPaymentId: string, refundStatus: string): Promise<void> {
  const orderStatus = refundStatus === "processed" ? "processed" : refundStatus === "failed" ? "failed" : "pending"
  await orycmsPrisma.$executeRaw`
    UPDATE storefront_orders
    SET refund_status = ${orderStatus},
        payment_status = CASE WHEN ${refundStatus} = 'processed' THEN 'refunded' ELSE payment_status END,
        payment_timeline = payment_timeline || ${JSON.stringify([{ at: new Date().toISOString(), event: `refund.${refundStatus}`, status: orderStatus }])}::jsonb
    WHERE razorpay_payment_id = ${razorpayPaymentId}
  `
}

/**
 * Issues a refund via the official API, mirrors it, and reflects it on the order.
 * The caller must have already enforced the captured-only guard and RBAC.
 */
export async function issueRefund(input: { paymentId: string; amount?: number; reason?: string; adminEmail?: string }): Promise<RazorpayRefundEntity> {
  const notes: Record<string, string> = {}
  if (input.reason) notes.reason = input.reason
  if (input.adminEmail) notes.refunded_by = input.adminEmail
  const refund = await createRefund(input.paymentId, { amount: input.amount, notes })
  await upsertRefundMirror(refund)
  const payment = await getPayment(input.paymentId).catch(() => null)
  if (payment) await upsertPaymentMirror(payment)
  await syncOrderRefundStatus(input.paymentId, refund.status)
  return refund
}
