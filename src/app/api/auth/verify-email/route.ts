import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jsonError, requireCsrf, verifySignupOtp } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    await requireCsrf()
    const body = await request.json()
    const verificationToken = await verifySignupOtp(String(body.email ?? ""), String(body.otp ?? ""))
    return NextResponse.json({ success: true, data: { verificationToken } })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Email verification failed.", 422, "VERIFY_FAILED")
  }
}
