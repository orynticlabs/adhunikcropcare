import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireUser, jsonError, rateLimit, requestKey, requireCsrf } from "@/lib/storefront-auth"
import { validateCouponCode } from "@/lib/orycms/discounts"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    await rateLimit(await requestKey("validate-coupon"), 30)
    await requireCsrf()
    const user = await requireUser()
    const body = await request.json() as { code?: string; subtotal?: number; shippingTotal?: number; items?: { productSlug?: string }[] }

    const code = String(body.code ?? "").trim().toUpperCase()
    if (!code) return jsonError("Please enter a coupon code.", 422, "COUPON_INVALID")

    const subtotal = Number(body.subtotal ?? 0)
    const shippingTotal = Number(body.shippingTotal ?? 0)
    const productSlugs = (body.items ?? []).map((i) => i.productSlug ?? "").filter(Boolean)

    const [orderCountRow] = await orycmsPrisma.$queryRaw<{ cnt: bigint }[]>`
      SELECT COUNT(*) AS cnt FROM storefront_orders
      WHERE user_id = ${user.id}::uuid AND payment_status = 'paid'
    `
    const orderCount = Number(orderCountRow?.cnt ?? 0)

    const result = await validateCouponCode(code, {
      userId: user.id,
      subtotal,
      shippingTotal,
      productSlugs,
      orderCount,
    })

    if (!result.valid) return jsonError(result.message, 422, "COUPON_INVALID")

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Coupon validation failed.", 422, "COUPON_ERROR")
  }
}
