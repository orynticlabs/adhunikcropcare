import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { listOryCMSAnnouncements, saveOryCMSAnnouncement } from "@/lib/orycms/announcements"

export const runtime = "nodejs"

function announcementError(error: unknown, fallback: string) {
  if (error instanceof Response) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 })
  }
  const message = error instanceof Error ? error.message : fallback
  return NextResponse.json({ success: false, error: { code: "ANNOUNCEMENT_ERROR", message } }, { status: 500 })
}

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await listOryCMSAnnouncements() })
  } catch (error) {
    return announcementError(error, "Failed to load announcements.")
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await saveOryCMSAnnouncement(await request.json()) }, { status: 201 })
  } catch (error) {
    return announcementError(error, "Failed to save announcement.")
  }
}
