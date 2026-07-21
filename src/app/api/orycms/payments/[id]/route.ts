import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser, REFUND_ALLOWED_ROLES } from "@/lib/orycms/auth"
import { getPaymentDetail } from "@/lib/orycms/payments"
import { paymentsError } from "@/lib/orycms/payments-http"

export const runtime = "nodejs"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireOryCMSUser(request)
    const detail = await getPaymentDetail((await params).id)
    if (!detail) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Payment not found." } }, { status: 404 })
    }
    // Tell the client whether this admin may refund, so the UI can hide the action.
    return NextResponse.json({ success: true, data: { ...detail, canRefund: REFUND_ALLOWED_ROLES.includes(user.roleName) } })
  } catch (error) {
    return paymentsError(error, "Failed to load payment.")
  }
}
