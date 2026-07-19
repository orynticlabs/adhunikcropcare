import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { getOryCMSAdminProfile, updateOryCMSAdminProfile } from "@/lib/orycms/users"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const actor = await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await getOryCMSAdminProfile(actor) })
  } catch (error) {
    return profileError(error, "Failed to load profile.")
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await updateOryCMSAdminProfile(actor, await request.json()) })
  } catch (error) {
    return profileError(error, "Failed to save profile.")
  }
}

function profileError(error: unknown, fallback: string) {
  if (error instanceof Response) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: error.status },
    )
  }

  const message = error instanceof Error ? error.message : fallback
  const validation = message.includes("required") || message.includes("exists") || message.includes("Username")

  return NextResponse.json(
    { success: false, error: { code: validation ? "VALIDATION_ERROR" : "PROFILE_ERROR", message } },
    { status: validation ? 422 : 500 },
  )
}
