import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createSignupOtp, jsonError, rateLimit, requestKey, requireCsrf } from "@/lib/storefront-auth"
import { isEmailDeliveryConfigured, sendEmail } from "@/lib/email/mailer"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    await rateLimit(await requestKey("send-signup-otp"), 3, 10 * 60_000)
    await requireCsrf()
    if (!isEmailDeliveryConfigured()) throw new Error("Email verification is temporarily unavailable.")
    const { email, otp } = await createSignupOtp(String((await request.json()).email ?? ""))
    const delivery = await sendEmail({ template: "accountVerification", to: email, otp, unsubscribeUrl: "" })
    if (delivery.skipped) throw new Error("Could not send the verification OTP.")
    return NextResponse.json({ success: true, data: { message: "OTP sent. It is valid for 5 minutes." } })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send OTP."
    return jsonError(message, message.startsWith("Too many attempts") ? 429 : 422, "OTP_SEND_FAILED")
  }
}
