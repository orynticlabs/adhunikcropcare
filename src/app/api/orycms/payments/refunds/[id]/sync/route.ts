import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSRole, REFUND_ALLOWED_ROLES } from "@/lib/orycms/auth"
import { syncRefundStatus } from "@/lib/orycms/payments-sync"
import { recordPaymentAudit } from "@/lib/orycms/payments-audit"
import { paymentsError } from "@/lib/orycms/payments-http"

export const runtime = "nodejs"

// Re-pull a refund's latest status from Razorpay (also used to reconcile after a retry).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireOryCMSRole(request, REFUND_ALLOWED_ROLES)
    const refundId = (await params).id
    const refund = await syncRefundStatus(refundId)
    await recordPaymentAudit({ admin: user, action: "refund.sync", refundId, paymentId: refund.payment_id, detail: { status: refund.status } })
    return NextResponse.json({ success: true, data: { refundId: refund.id, status: refund.status } })
  } catch (error) {
    return paymentsError(error, "Failed to sync refund.")
  }
}
