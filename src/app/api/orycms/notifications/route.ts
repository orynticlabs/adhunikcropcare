import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { listOryCMSNotifications } from "@/lib/orycms/notifications"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await listOryCMSNotifications() })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
        { status: error.status },
      )
    }
    return NextResponse.json(
      { success: false, error: { code: "NOTIFICATIONS_ERROR", message: error instanceof Error ? error.message : "Failed to load notifications." } },
      { status: 500 },
    )
  }
}
