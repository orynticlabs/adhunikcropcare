import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { consumeAuthToken, jsonError, requireCsrf, setVerified } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    await requireCsrf()
    const body = await request.json()
    const userId = await consumeAuthToken(String(body.token ?? ""), "verify_email")
    await setVerified(userId)
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Email verification failed.", 422, "VERIFY_FAILED")
  }
}
