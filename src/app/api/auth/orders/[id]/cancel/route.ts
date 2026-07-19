import { NextResponse } from "next/server"
import { cancelOrder } from "@/lib/storefront-orders"
import { jsonError, requireCsrf, requireUser } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireCsrf()
    const user = await requireUser()
    const { id } = await params
    const order = await cancelOrder(user.id, id)
    return NextResponse.json({ success: true, data: { order } })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Order cancellation failed.", 422, "ORDER_CANCEL_FAILED")
  }
}
