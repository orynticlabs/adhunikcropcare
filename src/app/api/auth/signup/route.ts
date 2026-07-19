import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createUser, jsonError, rateLimit, requestKey, requireCsrf } from "@/lib/storefront-auth"
import { emailBaseUrl, isEmailDeliveryConfigured, sendEmail } from "@/lib/email/mailer"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    await rateLimit(await requestKey("signup"), 5)
    await requireCsrf()
    if (!isEmailDeliveryConfigured()) throw new Error("Account signup is temporarily unavailable because email verification is not configured.")
    const body = await request.json()
    const { user, verifyToken } = await createUser(body)
    await sendEmail({
      actionUrl: `${emailBaseUrl()}/verify-email?token=${encodeURIComponent(verifyToken)}&email=${encodeURIComponent(user.email)}`,
      firstName: user.firstName,
      template: "accountVerification",
      to: user.email,
      userId: user.id,
      unsubscribeUrl: "",
    }).catch((error) => console.error("Initial verification email failed; customer can request a resend.", error))
    return NextResponse.json({ success: true, data: { email: user.email } }, { status: 201 })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Sign up failed.", 422, "SIGNUP_FAILED")
  }
}
