import { clearAuthCookies, jsonError, requireCsrf } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function POST() {
  try {
    await requireCsrf()
    return clearAuthCookies()
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Logout failed.", 400, "LOGOUT_FAILED")
  }
}
