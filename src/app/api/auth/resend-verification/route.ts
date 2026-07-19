import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import {
  createFreshEmailVerificationToken,
  findUserByEmail,
  jsonError,
  rateLimit,
  requestKey,
  requireCsrf,
} from "@/lib/storefront-auth"
import { emailBaseUrl, sendEmail } from "@/lib/email/mailer"

export const runtime = "nodejs"

const GENERIC_MESSAGE = "If an unverified customer account exists for this email, a new confirmation link has been sent."

export async function POST(request: NextRequest) {
  try {
    await rateLimit(await requestKey("resend-verification"), 3, 10 * 60_000)
    await requireCsrf()
    const body = await request.json()
    const user = await findUserByEmail(String(body.email ?? ""))

    if (user && !user.emailVerified) {
      const verifyToken = await createFreshEmailVerificationToken(user.id)
      await sendEmail({
        actionUrl: `${emailBaseUrl()}/verify-email?token=${encodeURIComponent(verifyToken)}&email=${encodeURIComponent(user.email)}`,
        firstName: user.firstName,
        template: "accountVerification",
        to: user.email,
        unsubscribeUrl: "",
        userId: user.id,
      }).catch((error) => console.error("Resent verification email failed", error))
    }

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
