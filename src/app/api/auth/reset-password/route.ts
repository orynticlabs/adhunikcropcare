import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { consumeAuthToken, jsonError, requireCsrf, setPassword } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    await requireCsrf()
    const body = await request.json()
    const userId = await consumeAuthToken(String(body.token ?? ""), "reset_password")
    await setPassword(userId, String(body.password ?? ""))
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Password reset failed.", 422, "RESET_FAILED")
  }
}
