import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { getShipmentByOrderId } from "@/lib/shiprocket/shipments"
import { refreshTracking } from "@/lib/shiprocket/fulfillment"
import { ShiprocketError } from "@/lib/shiprocket/client"

export const runtime = "nodejs"

// "Sync tracking now" — pulls the latest tracking from Shiprocket synchronously so
// the admin sees fresh status immediately (the cron queue also does this in the
// background, but this gives an on-demand refresh button).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    const { id } = await params
    const shipment = await getShipmentByOrderId(id)
    if (!shipment) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "No shipment for this order." } }, { status: 404 })
    }
    const result = await refreshTracking(shipment)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: error.status })
    }
    if (error instanceof ShiprocketError) {
      return NextResponse.json({ success: false, error: { code: "SHIPROCKET_ERROR", message: error.message } }, { status: error.status >= 400 && error.status < 600 ? error.status : 502 })
    }
    return NextResponse.json({ success: false, error: { code: "SYNC_ERROR", message: error instanceof Error ? error.message : "Sync failed." } }, { status: 500 })
  }
}
