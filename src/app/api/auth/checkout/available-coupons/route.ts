import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireUser, jsonError, rateLimit, requestKey } from "@/lib/storefront-auth"
import { listAvailableCoupons } from "@/lib/orycms/discounts"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    await rateLimit(await requestKey("available-coupons"), 30)
    const user = await requireUser()
    const body = (await request.json()) as {
      subtotal?: number
      shippingTotal?: number
      items?: { productSlug?: string }[]
    }

    const subtotal = Number(body.subtotal ?? 0)
    const shippingTotal = Number(body.shippingTotal ?? 0)
    const productSlugs = (body.items ?? []).map((i) => i.productSlug ?? "").filter(Boolean)

    const [orderCountRow] = await orycmsPrisma.$queryRaw<{ cnt: bigint }[]>`
      SELECT COUNT(*) AS cnt FROM storefront_orders
      WHERE user_id = ${user.id}::uuid AND payment_status = 'paid'
    `
    const orderCount = Number(orderCountRow?.cnt ?? 0)

    const coupons = await listAvailableCoupons({
      userId: user.id,
      subtotal,
      shippingTotal,
      productSlugs,
      orderCount,
    })

    return NextResponse.json({ success: true, data: coupons })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to load available coupons.",
      422,
      "AVAILABLE_COUPONS_ERROR",
    )
  }
}
