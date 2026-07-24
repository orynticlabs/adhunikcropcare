import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { createOryCMSReelVideo, listOryCMSReelVideos } from "@/lib/orycms/reel-videos"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await listOryCMSReelVideos() })
  } catch (error) {
    return responseError(error, "Unable to load reels.")
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireOryCMSUser(request)

    const form = await request.formData()
    const file = form.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: { message: "Video file is required." } },
        { status: 422 },
      )
    }

    return NextResponse.json({
      success: true,
      data: await createOryCMSReelVideo(file, {
        displayOrder: Number(form.get("displayOrder") ?? 0),
        farmer: text(form.get("farmer")),
        location: text(form.get("location")),
        prompt: text(form.get("prompt")),
        result: text(form.get("result")),
        status: text(form.get("status")),
        title: text(form.get("title")),
      }),
    }, { status: 201 })
  } catch (error) {
    return responseError(error, "Unable to upload reel.")
  }
}

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : undefined
}

function responseError(error: unknown, fallback: string) {
  if (error instanceof Response) {
    return NextResponse.json({ success: false, error: { message: "Authentication required." } }, { status: error.status })
  }

  const message = error instanceof Error ? error.message : fallback
  const validation = message.includes("required") || message.includes("allowed") || message.includes("large") || message.includes("Unsupported")
  return NextResponse.json({ success: false, error: { message } }, { status: validation ? 422 : 500 })
}
