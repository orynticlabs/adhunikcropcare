import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyRazorpayPayment } from "@/lib/storefront-orders"
import { jsonError, rateLimit, requestKey, requireCsrf, requireUser } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    await rateLimit(await requestKey("checkout-verify"), 20)
    await requireCsrf()
    const user = await requireUser()
    const order = await verifyRazorpayPayment(user.id, await request.json(), request.headers.get("idempotency-key"))
    return NextResponse.json({ success: true, data: { order } })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Payment verification failed.", 422, "PAYMENT_VERIFY_FAILED")
  }
}
