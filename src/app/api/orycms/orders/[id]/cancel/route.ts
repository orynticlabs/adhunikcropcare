import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { getOryCMSOrder } from "@/lib/orycms/orders"
import { cancelOrderByAdmin } from "@/lib/storefront-orders"
import { ShiprocketError } from "@/lib/shiprocket/client"
import { cancelShipment } from "@/lib/shiprocket/fulfillment"
import { getShipmentByOrderId } from "@/lib/shiprocket/shipments"

export const runtime = "nodejs"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    const { id } = await params
    const order = await getOryCMSOrder(id)
    if (!order) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Order not found." } }, { status: 404 })

    const shipment = await getShipmentByOrderId(order.id)
    if (shipment) {
      const result = await cancelShipment(order.id)
      return NextResponse.json({ success: true, data: { ...result, order: await getOryCMSOrder(order.id) } })
    }

    await cancelOrderByAdmin(order.id)
    return NextResponse.json({ success: true, data: { orderStatus: "cancelled", order: await getOryCMSOrder(order.id) } })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: error.status })
    }
    if (error instanceof ShiprocketError) {
      return NextResponse.json({ success: false, error: { code: "SHIPROCKET_ERROR", message: error.message } }, { status: error.status >= 400 && error.status < 600 ? error.status : 502 })
    }
    return NextResponse.json({ success: false, error: { code: "CANCEL_ORDER_ERROR", message: error instanceof Error ? error.message : "Failed to cancel order." } }, { status: 500 })
  }
}
