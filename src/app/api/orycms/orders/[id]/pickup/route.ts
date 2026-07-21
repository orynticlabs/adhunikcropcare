import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { cancelPickupForOrder, schedulePickup } from "@/lib/shiprocket/fulfillment"
import { ShiprocketError } from "@/lib/shiprocket/client"

export const runtime = "nodejs"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as { action?: string; pickupDate?: string }
    const action = body.action ?? "schedule"

    const result = action === "cancel"
      ? await cancelPickupForOrder(id)
      : await schedulePickup(id, action === "reschedule" ? body.pickupDate : undefined)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: error.status })
    }
    if (error instanceof ShiprocketError) {
      return NextResponse.json({ success: false, error: { code: "SHIPROCKET_ERROR", message: error.message } }, { status: error.status >= 400 && error.status < 600 ? error.status : 502 })
    }
    return NextResponse.json({ success: false, error: { code: "PICKUP_ERROR", message: error instanceof Error ? error.message : "Pickup action failed." } }, { status: 500 })
  }
}
