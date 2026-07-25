import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSRole, REFUND_ALLOWED_ROLES } from "@/lib/orycms/auth"
import { getOryCMSOrder } from "@/lib/orycms/orders"
import { getCapturedPaymentForRefund } from "@/lib/orycms/payments"
import { recordPaymentAudit } from "@/lib/orycms/payments-audit"
import { issueRefund } from "@/lib/orycms/payments-sync"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { paymentsError } from "@/lib/orycms/payments-http"

export const runtime = "nodejs"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireOryCMSRole(request, REFUND_ALLOWED_ROLES)
    const order = await getOryCMSOrder((await params).id)
    if (!order) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Order not found." } }, { status: 404 })
    if (order.payment_method !== "razorpay") return NextResponse.json({ success: false, error: { code: "COD_ORDER", message: "COD orders do not need Razorpay refunds." } }, { status: 409 })
    if (order.payment_status !== "paid") return NextResponse.json({ success: false, error: { code: "NOT_PAID", message: "Only paid Razorpay orders can be refunded." } }, { status: 409 })
    if (!isRefundableReturnStatus(order.status)) return NextResponse.json({ success: false, error: { code: "NOT_RETURNED", message: "Refund is available only after return, RTO, or cancellation status." } }, { status: 409 })
    if (!order.razorpay_payment_id) return NextResponse.json({ success: false, error: { code: "PAYMENT_MISSING", message: "Razorpay payment id is missing." } }, { status: 409 })

    const payment = await getCapturedPaymentForRefund(order.razorpay_payment_id)
    if (!payment || !payment.captured || payment.status !== "captured") {
      return NextResponse.json({ success: false, error: { code: "NOT_CAPTURED", message: "Only captured payments can be refunded." } }, { status: 409 })
    }
    const refundable = Math.max(0, Number(payment.amount) - Number(payment.amount_refunded))
    if (refundable <= 0) return NextResponse.json({ success: false, error: { code: "NO_BALANCE", message: "This payment has no refundable balance." } }, { status: 409 })

    const result = await orycmsPrisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${order.id}))`
      const existing = await tx.$queryRawUnsafe<Array<{ razorpay_refund_id: string; amount: string | number; status: string }>>(
        `SELECT razorpay_refund_id, amount, status
         FROM razorpay_refunds
         WHERE order_id = $1::uuid AND lower(status) <> 'failed'
         ORDER BY created_at DESC LIMIT 1`,
        order.id,
      )
      if (existing[0]) return { refund: existing[0], duplicate: true }

      const refund = await issueRefund({ paymentId: order.razorpay_payment_id!, reason: "Return/RTO refund", adminEmail: user.email })
      await recordPaymentAudit({ admin: user, action: "refund.create", paymentId: order.razorpay_payment_id, refundId: refund.id, detail: { orderId: order.id, amount: Number(refund.amount) / 100, status: refund.status } })
      return { refund: { razorpay_refund_id: refund.id, amount: Number(refund.amount) / 100, status: refund.status }, duplicate: false }
    }, { timeout: 30_000 })

    return NextResponse.json({ success: true, data: { order: await getOryCMSOrder(order.id), ...result } })
  } catch (error) {
    return paymentsError(error, "Failed to initiate refund.")
  }
}

function isRefundableReturnStatus(status: string) {
  return ["cancelled", "rto delivered", "return delivered", "returned"].includes(status.toLowerCase())
}
