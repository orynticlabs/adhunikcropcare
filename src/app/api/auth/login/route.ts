import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { authenticateUser, jsonError, rateLimit, requestKey, requireCsrf, setAuthCookies } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    await rateLimit(await requestKey("login"), 8)
    await requireCsrf()
    const body = await request.json()
    const user = await authenticateUser(String(body.email ?? ""), String(body.password ?? ""))
    const response = NextResponse.json({ success: true, data: { user } })
    return setAuthCookies(response, user.id)
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Login failed.", 401, "LOGIN_FAILED")
  }
}
