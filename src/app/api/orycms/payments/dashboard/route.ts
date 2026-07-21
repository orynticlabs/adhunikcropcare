import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser, REFUND_ALLOWED_ROLES } from "@/lib/orycms/auth"
import { getPaymentDashboard } from "@/lib/orycms/payments"
import { paymentsError } from "@/lib/orycms/payments-http"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const user = await requireOryCMSUser(request)
    return NextResponse.json({
      success: true,
      data: { cards: await getPaymentDashboard(), canRefund: REFUND_ALLOWED_ROLES.includes(user.roleName), role: user.roleName },
    })
  } catch (error) {
    return paymentsError(error, "Failed to load dashboard.")
  }
}
