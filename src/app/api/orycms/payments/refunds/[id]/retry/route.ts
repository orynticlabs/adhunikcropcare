import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSRole, REFUND_ALLOWED_ROLES } from "@/lib/orycms/auth"
import { getRefundRow, getCapturedPaymentForRefund } from "@/lib/orycms/payments"
import { issueRefund, syncRefundStatus } from "@/lib/orycms/payments-sync"
import { recordPaymentAudit } from "@/lib/orycms/payments-audit"
import { paymentsError } from "@/lib/orycms/payments-http"

export const runtime = "nodejs"

/**
 * Retries a failed refund. Razorpay cannot re-process a failed refund object, so a
 * retry issues a fresh refund for the same payment and amount. If the existing
 * refund is not actually failed we just re-sync its status instead.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireOryCMSRole(request, REFUND_ALLOWED_ROLES)
    const refundId = (await params).id

    const existing = await getRefundRow(refundId)
    if (!existing) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Refund not found." } }, { status: 404 })
    }
    if (existing.status !== "failed") {
      // Not failed — just reconcile status from Razorpay.
      const refreshed = await syncRefundStatus(refundId)
      await recordPaymentAudit({ admin: user, action: "refund.sync", refundId, paymentId: existing.razorpay_payment_id, detail: { status: refreshed.status } })
      return NextResponse.json({ success: true, data: { refundId, status: refreshed.status, retried: false } })
    }

    // Guard: only retry when the payment is still refundable.
    const payment = await getCapturedPaymentForRefund(existing.razorpay_payment_id)
    if (!payment || !payment.captured) {
      return NextResponse.json({ success: false, error: { code: "NOT_CAPTURED", message: "Payment is not refundable." } }, { status: 409 })
    }

    const refund = await issueRefund({
      paymentId: existing.razorpay_payment_id,
      amount: Number(existing.amount),
      reason: existing.reason ?? "retry of failed refund",
      adminEmail: user.email,
    })
    await recordPaymentAudit({ admin: user, action: "refund.retry", paymentId: existing.razorpay_payment_id, refundId: refund.id, detail: { previousRefundId: refundId, status: refund.status } })
    return NextResponse.json({ success: true, data: { refundId: refund.id, status: refund.status, retried: true } })
  } catch (error) {
    return paymentsError(error, "Failed to retry refund.")
  }
}
