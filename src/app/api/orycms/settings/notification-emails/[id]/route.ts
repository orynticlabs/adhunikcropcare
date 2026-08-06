import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { deleteNotificationEmail, updateNotificationEmail } from "@/lib/orycms/notification-emails"
import { notificationEmailError } from "../route"

export const runtime = "nodejs"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    const id = (await params).id
    const body = (await request.json()) as { email?: string; enabled?: boolean; label?: string | null }
    return NextResponse.json({ success: true, data: await updateNotificationEmail(id, body) })
  } catch (error) {
    return notificationEmailError(error, "Failed to update notification email.")
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    await deleteNotificationEmail((await params).id)
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return notificationEmailError(error, "Failed to delete notification email.")
  }
}
