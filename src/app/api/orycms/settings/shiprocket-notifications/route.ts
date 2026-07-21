import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { getShipmentNotificationSettings, upsertShipmentNotificationSettings, type ShipmentNotificationSettings } from "@/lib/shiprocket/notification-settings"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await getShipmentNotificationSettings() })
  } catch (error) {
    return notifError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const bool = (value: unknown) => (typeof value === "boolean" ? value : undefined)
    const input: Partial<ShipmentNotificationSettings> = {
      enabled: bool(body.enabled),
      shipmentCreated: bool(body.shipmentCreated),
      shipped: bool(body.shipped),
      outForDelivery: bool(body.outForDelivery),
      delivered: bool(body.delivered),
      cancelled: bool(body.cancelled),
    }
    const saved = await upsertShipmentNotificationSettings(input)
    return NextResponse.json({ success: true, data: saved })
  } catch (error) {
    return notifError(error)
  }
}

function notifError(error: unknown) {
  if (error instanceof Response) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: error.status })
  }
  return NextResponse.json(
    { success: false, error: { code: "NOTIFICATION_SETTINGS_ERROR", message: error instanceof Error ? error.message : "Failed to update settings." } },
    { status: 500 },
  )
}
