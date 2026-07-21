import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { cancelShipment } from "@/lib/shiprocket/fulfillment"
import { ShiprocketError } from "@/lib/shiprocket/client"

export const runtime = "nodejs"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    const result = await cancelShipment((await params).id)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return cancelError(error, "Failed to cancel shipment.")
  }
}

function cancelError(error: unknown, fallback: string) {
  if (error instanceof Response) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: error.status },
    )
  }
  if (error instanceof ShiprocketError) {
    return NextResponse.json(
      { success: false, error: { code: "SHIPROCKET_ERROR", message: error.message } },
      { status: error.status >= 400 && error.status < 600 ? error.status : 502 },
    )
  }
  return NextResponse.json(
    { success: false, error: { code: "CANCEL_SHIPMENT_ERROR", message: error instanceof Error ? error.message : fallback } },
    { status: 500 },
  )
}
