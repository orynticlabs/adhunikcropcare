import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { authenticateUser, jsonError, rateLimit, requestKey, requireCsrf, setAuthCookies } from "@/lib/storefront-auth"
import { clearFailedAttempts, isLockedOut, recordFailedAttempt } from "@/lib/security/brute-force-guard"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    await rateLimit(await requestKey("login"), 8, 60_000)
    await requireCsrf()
    const body = await request.json()
    const email = String(body.email ?? "").trim().toLowerCase()
    
    if (email) {
      const lockout = await isLockedOut(email)
      if (lockout.locked) {
        return jsonError(
          `Too many failed attempts. Account temporarily locked for ${Math.ceil(lockout.remainingSeconds / 60)} minute(s).`,
          429,
          "ACCOUNT_LOCKED"
        )
      }
    }

    try {
      const user = await authenticateUser(email, String(body.password ?? ""))
      await clearFailedAttempts(email)
      const response = NextResponse.json({ success: true, data: { user } })
      return setAuthCookies(response, user.id)
    } catch (authError) {
      if (email) {
        await recordFailedAttempt(email)
      }
      throw authError
    }
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Login failed.", 401, "LOGIN_FAILED")
  }
}
