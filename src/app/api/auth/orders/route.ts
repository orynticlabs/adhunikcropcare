import { NextResponse } from "next/server"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { ensureStorefrontAuthSchema, jsonError, requireUser } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function GET() {
  try {
    const user = await requireUser()
    await ensureStorefrontAuthSchema()
    const orders = await orycmsPrisma.$queryRaw<Record<string, unknown>[]>`
      SELECT id, number, status, payment_status, payment_method, razorpay_order_id, razorpay_payment_id,
             refund_status, invoice_number, cancelled_at, reservation_expires_at, payment_timeline,
             tracking, invoice_url, items, total, created_at
      FROM storefront_orders WHERE user_id = ${user.id}::uuid ORDER BY created_at DESC
    `
    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load orders.", 401, "ORDERS_FAILED")
  }
}
