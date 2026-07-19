import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createCheckoutOrder } from "@/lib/storefront-orders"
import { jsonError, rateLimit, requestKey, requireCsrf, requireUser } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    await rateLimit(await requestKey("checkout-order"), 10)
    await requireCsrf()
    const user = await requireUser()
    const result = await createCheckoutOrder(user.id, await request.json(), request.headers.get("idempotency-key"))
    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Order creation failed.", 422, "CHECKOUT_ORDER_FAILED")
  }
}
