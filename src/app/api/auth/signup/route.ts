import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createUser, jsonError, rateLimit, requestKey, requireCsrf, setAuthCookies } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    await rateLimit(await requestKey("signup"), 5)
    await requireCsrf()
    const body = await request.json()
    const { user } = await createUser(body)
    const response = NextResponse.json({ success: true, data: { user } }, { status: 201 })
    return setAuthCookies(response, user.id)
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Sign up failed.", 422, "SIGNUP_FAILED")
  }
}
