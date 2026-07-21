import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSRole, REFUND_ALLOWED_ROLES } from "@/lib/orycms/auth"
import { getCapturedPaymentForRefund } from "@/lib/orycms/payments"
import { issueRefund } from "@/lib/orycms/payments-sync"
import { recordPaymentAudit } from "@/lib/orycms/payments-audit"
import { paymentsError } from "@/lib/orycms/payments-http"

export const runtime = "nodejs"

/**
 * Issues a full or partial refund for a captured payment. Restricted to
 * Super Admin + Admin. Captured-only enforced; partial amount validated against
 * the remaining refundable balance. Every attempt is audit-logged.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireOryCMSRole(request, REFUND_ALLOWED_ROLES)
    const paymentId = (await params).id
    const body = (await request.json().catch(() => ({}))) as { amount?: number; reason?: string }

    const payment = await getCapturedPaymentForRefund(paymentId)
    if (!payment) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Payment not found." } }, { status: 404 })
    }
    if (!payment.captured || payment.status !== "captured") {
      return NextResponse.json({ success: false, error: { code: "NOT_CAPTURED", message: "Only captured payments can be refunded." } }, { status: 409 })
    }

    const total = Number(payment.amount)
    const alreadyRefunded = Number(payment.amount_refunded)
    const refundable = Math.max(0, total - alreadyRefunded)
    const amount = body.amount != null && body.amount > 0 ? Number(body.amount) : undefined // undefined = full
    if (amount != null && amount > refundable + 0.001) {
      return NextResponse.json({ success: false, error: { code: "AMOUNT_EXCEEDS", message: `Refund amount exceeds the refundable balance (₹${refundable.toFixed(2)}).` } }, { status: 400 })
    }

    try {
      const refund = await issueRefund({ paymentId, amount, reason: body.reason, adminEmail: user.email })
      await recordPaymentAudit({ admin: user, action: "refund.create", paymentId, refundId: refund.id, detail: { amount: amount ?? refundable, reason: body.reason, status: refund.status } })
      return NextResponse.json({ success: true, data: { refundId: refund.id, status: refund.status, amount: Number(refund.amount) / 100 } })
    } catch (refundError) {
      await recordPaymentAudit({ admin: user, action: "refund.create", paymentId, detail: { amount, reason: body.reason, error: refundError instanceof Error ? refundError.message : "failed" } })
      throw refundError
    }
  } catch (error) {
    return paymentsError(error, "Failed to issue refund.")
  }
}
