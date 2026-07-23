import { NextResponse } from "next/server"
import { getActiveAnnouncements } from "@/lib/orycms/announcements"

export const runtime = "nodejs"

export async function GET() {
  try {
    const announcements = await getActiveAnnouncements()
    return NextResponse.json(
      { success: true, data: announcements },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
    )
  } catch {
    return NextResponse.json({ success: true, data: [] })
  }
}
