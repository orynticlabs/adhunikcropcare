import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { getOryCMSAnnouncement, saveOryCMSAnnouncement, deleteOryCMSAnnouncement } from "@/lib/orycms/announcements"

export const runtime = "nodejs"

function announcementError(error: unknown, fallback: string) {
  if (error instanceof Response) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 })
  }
  const message = error instanceof Error ? error.message : fallback
  return NextResponse.json({ success: false, error: { code: "ANNOUNCEMENT_ERROR", message } }, { status: 500 })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    const { id } = await params
    const announcement = await getOryCMSAnnouncement(id)
    if (!announcement) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Announcement not found." } }, { status: 404 })
    return NextResponse.json({ success: true, data: announcement })
  } catch (error) {
    return announcementError(error, "Failed to load announcement.")
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    const { id } = await params
    return NextResponse.json({ success: true, data: await saveOryCMSAnnouncement(await request.json(), id) })
  } catch (error) {
    return announcementError(error, "Failed to update announcement.")
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    const { id } = await params
    await deleteOryCMSAnnouncement(id)
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return announcementError(error, "Failed to delete announcement.")
  }
}
