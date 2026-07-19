import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jsonError, rateLimit, requestKey, requireCsrf } from "@/lib/storefront-auth"

export const runtime = "nodejs"

const GENERIC_MESSAGE = "Email verification is completed with a 5-minute OTP on the create-account form."

export async function POST(request: NextRequest) {
  try {
    await rateLimit(await requestKey("resend-verification"), 3, 10 * 60_000)
    await requireCsrf()
    await request.json()

    return NextResponse.json({ success: true, data: { message: GENERIC_MESSAGE } })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Too many attempts")) {
      return jsonError(error.message, 429, "RATE_LIMITED")
    }
    // Do not reveal whether a storefront customer account exists or is already verified.
    console.error("Verification resend request failed", error)
    return NextResponse.json({ success: true, data: { message: GENERIC_MESSAGE } })
  }
}
