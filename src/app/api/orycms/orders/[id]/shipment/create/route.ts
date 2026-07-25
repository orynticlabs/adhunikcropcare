import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { ShiprocketError } from "@/lib/shiprocket/client"
import { confirmAndCreateShipment } from "@/lib/shiprocket/fulfillment"

export const runtime = "nodejs"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireOryCMSUser(request)
    const result = await confirmAndCreateShipment((await params).id, user)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: error.status })
    }
    if (error instanceof ShiprocketError) {
      return NextResponse.json({ success: false, error: { code: "SHIPROCKET_ERROR", message: error.message } }, { status: error.status >= 400 && error.status < 600 ? error.status : 502 })
    }
    return NextResponse.json({ success: false, error: { code: "CREATE_SHIPMENT_ERROR", message: error instanceof Error ? error.message : "Failed to create shipment." } }, { status: 500 })
  }
}
