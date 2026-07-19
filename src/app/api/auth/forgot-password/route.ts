import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createAuthToken, findUserByEmail, jsonError, rateLimit, requestKey, requireCsrf } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    await rateLimit(await requestKey("forgot"), 5)
    await requireCsrf()
    const body = await request.json()
    const user = await findUserByEmail(String(body.email ?? ""))
    const resetToken = user ? await createAuthToken(user.id, "reset_password", 60 * 60) : null
    return NextResponse.json({ success: true, data: { resetToken } })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Reset request failed.", 400, "FORGOT_FAILED")
  }
}
