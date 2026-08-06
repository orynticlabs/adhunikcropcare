import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { createNotificationEmail, listNotificationEmails } from "@/lib/orycms/notification-emails"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await listNotificationEmails() })
  } catch (error) {
    return notificationEmailError(error, "Failed to load notification emails.")
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const body = (await request.json()) as { email?: string; label?: string | null }
    return NextResponse.json({ success: true, data: await createNotificationEmail(body) }, { status: 201 })
  } catch (error) {
    return notificationEmailError(error, "Failed to add notification email.")
  }
}

export function notificationEmailError(error: unknown, fallback: string) {
  if (error instanceof Response) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: error.status },
    )
  }

  const message = error instanceof Error ? error.message : fallback
  const notFound = message.includes("not found")
  const validation = message.includes("valid email") || message.includes("already on the list")

  return NextResponse.json(
    { success: false, error: { code: notFound ? "NOT_FOUND" : validation ? "VALIDATION_ERROR" : "NOTIFICATION_EMAIL_ERROR", message } },
    { status: notFound ? 404 : validation ? 422 : 500 },
  )
}
