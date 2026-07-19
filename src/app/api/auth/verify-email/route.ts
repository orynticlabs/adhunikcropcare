import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getUserById, jsonError, requireCsrf, verifyStorefrontEmail } from "@/lib/storefront-auth"
import { sendEmail } from "@/lib/email/mailer"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    await requireCsrf()
    const body = await request.json()
    const result = await verifyStorefrontEmail(String(body.token ?? ""))
    const user = await getUserById(result.userId)
    if (user && result.status === "verified") await sendEmail({ firstName: user.firstName, template: "emailVerified", to: user.email, userId: user.id, unsubscribeUrl: "" }).catch((error) => console.error("Verified email failed", error))
    return NextResponse.json({ success: true, data: { status: result.status } })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Email verification failed.", 422, "VERIFY_FAILED")
  }
}
