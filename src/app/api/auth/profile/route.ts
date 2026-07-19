import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jsonError, requireCsrf, requireUser, updateUserProfile } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function PATCH(request: NextRequest) {
  try {
    await requireCsrf()
    const user = await requireUser()
    const body = await request.json()
    const updated = await updateUserProfile(user.id, {
      avatar: body.avatar,
      defaultAddress: body.defaultAddress,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
    })
    return NextResponse.json({ success: true, data: { user: updated } })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Profile update failed.", 422, "PROFILE_FAILED")
  }
}
