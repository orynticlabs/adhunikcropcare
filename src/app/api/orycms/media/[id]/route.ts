import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { deleteOryCMSMedia } from "@/lib/orycms/media"

export const runtime = "nodejs"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireOryCMSUser(request)

    const { id } = await params

    await deleteOryCMSMedia(id)

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
        { status: error.status },
      )
    }

    const message = error instanceof Error ? error.message : "Delete failed."

    return NextResponse.json(
      { success: false, error: { code: "MEDIA_DELETE_FAILED", message } },
      { status: message.includes("not found") ? 404 : 500 },
    )
  }
}
