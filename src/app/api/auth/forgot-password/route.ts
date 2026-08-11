import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createAuthToken, findUserByEmail, jsonError, rateLimit, requestKey, requireCsrf } from "@/lib/storefront-auth"
import { emailBaseUrl, sendEmail } from "@/lib/email/mailer"

export const runtime = "nodejs"

const GENERIC_MESSAGE = "If a customer account exists for this email, a password reset link has been sent."

export async function POST(request: NextRequest) {
  try {
    await rateLimit(await requestKey("forgot"), 5)
    await requireCsrf()
    const body = await request.json()
    const user = await findUserByEmail(String(body.email ?? ""))
    const resetToken = user ? await createAuthToken(user.id, "reset_password", 60 * 60) : null
    if (user && resetToken) await sendEmail({
      actionUrl: `${emailBaseUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`,
      firstName: user.firstName,
      template: "passwordReset",
      to: user.email,
      userId: user.id,
      unsubscribeUrl: "",
    }).catch(() => {})
    return NextResponse.json({ success: true, data: { message: GENERIC_MESSAGE } })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Reset request failed.", 400, "FORGOT_FAILED")
  }
}
