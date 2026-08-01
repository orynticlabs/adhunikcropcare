import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { deleteContactNotificationEmail, updateContactNotificationEmail } from "@/lib/orycms/contact-notification-emails"
import { contactEmailError } from "../route"

export const runtime = "nodejs"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    const id = (await params).id
    const body = (await request.json()) as { email?: string; enabled?: boolean; label?: string | null }
    return NextResponse.json({ success: true, data: await updateContactNotificationEmail(id, body) })
  } catch (error) {
    return contactEmailError(error, "Failed to update contact notification email.")
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    await deleteContactNotificationEmail((await params).id)
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return contactEmailError(error, "Failed to delete contact notification email.")
  }
}
