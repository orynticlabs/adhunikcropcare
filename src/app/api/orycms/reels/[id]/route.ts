import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { deleteOryCMSReelVideo } from "@/lib/orycms/reel-videos"

export const runtime = "nodejs"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    await deleteOryCMSReelVideo((await params).id)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ success: false, error: { message: "Authentication required." } }, { status: error.status })
    }

    const message = error instanceof Error ? error.message : "Unable to delete reel."
    return NextResponse.json({ success: false, error: { message } }, { status: message.includes("not found") ? 404 : 500 })
  }
}
