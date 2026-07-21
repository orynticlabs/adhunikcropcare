import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { getOryCMSOrder } from "@/lib/orycms/orders"
import { listApiLogsForOrder, serializeApiLog } from "@/lib/shiprocket/shipments"

export const runtime = "nodejs"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    const order = await getOryCMSOrder((await params).id)
    if (!order) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Order not found." } }, { status: 404 })
    }
    const logs = await listApiLogsForOrder(order.id, 100)
    return NextResponse.json({ success: true, data: logs.map(serializeApiLog) })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: error.status })
    }
    return NextResponse.json(
      { success: false, error: { code: "ACTIVITY_ERROR", message: error instanceof Error ? error.message : "Failed to load activity." } },
      { status: 500 },
    )
  }
}
