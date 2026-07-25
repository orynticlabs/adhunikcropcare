import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { getOryCMSNotificationSettings, upsertOryCMSNotificationSettings, type OryCMSNotificationSettings } from "@/lib/orycms/notification-settings"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await getOryCMSNotificationSettings() })
  } catch (error) {
    return notificationSettingsError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const bool = (value: unknown) => (typeof value === "boolean" ? value : undefined)
    const input: Partial<OryCMSNotificationSettings> = {
      emailAlerts: bool(body.emailAlerts),
      pushAlerts: bool(body.pushAlerts),
      marketingDigest: bool(body.marketingDigest),
    }
    return NextResponse.json({ success: true, data: await upsertOryCMSNotificationSettings(input) })
  } catch (error) {
    return notificationSettingsError(error)
  }
}

function notificationSettingsError(error: unknown) {
  if (error instanceof Response) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: error.status })
  }
  return NextResponse.json(
    { success: false, error: { code: "NOTIFICATION_SETTINGS_ERROR", message: error instanceof Error ? error.message : "Failed to update notification settings." } },
    { status: 500 },
  )
}
