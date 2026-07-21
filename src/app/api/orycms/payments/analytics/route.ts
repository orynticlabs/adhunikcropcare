import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { getPaymentAnalytics } from "@/lib/orycms/payments"
import { paymentsError } from "@/lib/orycms/payments-http"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await getPaymentAnalytics() })
  } catch (error) {
    return paymentsError(error, "Failed to load analytics.")
  }
}
