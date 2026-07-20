import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { validateContactForm } from "@/lib/contact-form"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { rateLimit, requestKey, requireCsrf } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    await rateLimit(await requestKey("contact"), 5, 10 * 60_000)
    await requireCsrf()

    const contentType = request.headers.get("content-type") ?? ""
    if (!contentType.includes("application/json")) {
      return errorResponse("Submit the form using a valid request.", 415, "INVALID_CONTENT_TYPE")
    }

    const body = await request.json()
    if (typeof body?.website === "string" && body.website.trim()) {
      return NextResponse.json({ success: true, data: { message: "Your enquiry has been received." } }, { status: 201 })
    }

    const validation = validateContactForm(body)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            fields: validation.errors,
            message: "Please correct the highlighted fields.",
          },
        },
        { status: 422 },
      )
    }

    const enquiry = await orycmsPrisma.storefrontContactEnquiry.create({
      data: {
        countryCode: "+91",
        email: validation.values.email,
        fullName: validation.values.fullName,
        location: validation.values.location,
        message: validation.values.message,
        mobileNumber: validation.values.mobileNumber,
        topic: validation.values.topic,
      },
      select: { id: true },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: enquiry.id,
          message: "Thank you. Your enquiry has been received and our team will contact you soon.",
        },
      },
      { status: 201 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit your enquiry."
    if (message.includes("Too many attempts")) return errorResponse(message, 429, "RATE_LIMITED")
    if (message.includes("Security check failed")) return errorResponse(message, 403, "CSRF_FAILED")
    return errorResponse("Unable to submit your enquiry right now. Please try again shortly.", 500, "CONTACT_ERROR")
  }
}

function errorResponse(message: string, status: number, code: string) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}
