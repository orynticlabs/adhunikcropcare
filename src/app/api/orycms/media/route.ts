import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { listOryCMSMedia, uploadOryCMSMedia } from "@/lib/orycms/media"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)

    const search = request.nextUrl.searchParams.get("search")?.trim() ?? ""

    return NextResponse.json({
      success: true,
      data: await listOryCMSMedia(search),
    })
  } catch (error) {
    return toOryCMSMediaError(error, "Failed to load media.")
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireOryCMSUser(request)

    const form = await request.formData()
    const file = form.get("file")
    const mediaName = form.get("mediaName")
    const purpose = form.get("purpose")

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "File is required." } },
        { status: 422 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: await uploadOryCMSMedia(file, {
          mediaName: typeof mediaName === "string" ? mediaName : undefined,
          productImage: purpose === "product",
          purpose: typeof purpose === "string" ? purpose : undefined,
        }),
      },
      { status: 201 },
    )
  } catch (error) {
    return toOryCMSMediaError(error, "Upload failed.")
  }
}

function toOryCMSMediaError(error: unknown, fallback: string) {
  if (error instanceof Response) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: error.statusText || "Authentication required." } },
      { status: error.status },
    )
  }

  const message = error instanceof Error ? error.message : fallback
  const status =
    message.includes("Cloudinary is not configured")
      ? 503
      : message.includes("Can't reach database") || message.includes("does not exist")
        ? 503
        : message.includes("allowed") || message.includes("large") || message.includes("Unsupported") || message.includes("Product images")
          ? 422
          : 500

  return NextResponse.json(
    {
      success: false,
      error: {
        code:
          status === 422
            ? "VALIDATION_ERROR"
            : status === 503
              ? "MEDIA_SERVICE_UNAVAILABLE"
              : "MEDIA_ERROR",
        message,
      },
    },
    { status },
  )
}
