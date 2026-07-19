import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { retryRazorpayPayment } from "@/lib/storefront-orders"
import { jsonError, rateLimit, requestKey, requireCsrf, requireUser } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    await rateLimit(await requestKey("checkout-retry"), 20)
    await requireCsrf()
    const user = await requireUser()
    const body = await request.json()
    const result = await retryRazorpayPayment(user.id, String(body.orderId ?? ""))
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Payment retry failed.", 422, "PAYMENT_RETRY_FAILED")
  }
}
