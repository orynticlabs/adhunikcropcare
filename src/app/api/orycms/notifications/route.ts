import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { clearReadOryCMSNotifications, listOryCMSNotifications, markAllOryCMSNotificationsRead, markOryCMSNotificationRead } from "@/lib/orycms/notifications"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const params = request.nextUrl.searchParams
    return NextResponse.json({ success: true, data: await listOryCMSNotifications({
      filter: params.get("filter"),
      limit: Number(params.get("limit") ?? "100"),
      page: Number(params.get("page") ?? "1"),
    }) })
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

export async function PATCH(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const body = (await request.json().catch(() => ({}))) as { id?: string; all?: boolean }
    if (body.all) await markAllOryCMSNotificationsRead()
    else if (body.id) await markOryCMSNotificationRead(body.id)
    else return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "Notification id is required." } }, { status: 400 })
    return NextResponse.json({ success: true, data: await listOryCMSNotifications() })
  } catch (error) {
    return notificationError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    await clearReadOryCMSNotifications()
    return NextResponse.json({ success: true, data: await listOryCMSNotifications() })
  } catch (error) {
    return notificationError(error)
  }
}

function notificationError(error: unknown) {
  if (error instanceof Response) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: error.status },
    )
  }
  return NextResponse.json(
    { success: false, error: { code: "NOTIFICATIONS_ERROR", message: error instanceof Error ? error.message : "Failed to update notifications." } },
    { status: 500 },
  )
}
