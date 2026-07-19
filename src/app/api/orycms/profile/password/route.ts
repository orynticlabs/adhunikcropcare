import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { changeOryCMSAdminPassword } from "@/lib/orycms/users"

export const runtime = "nodejs"

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requireOryCMSUser(request)
    await changeOryCMSAdminPassword(actor, await request.json())
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return passwordError(error, "Failed to change password.")
  }
}

function passwordError(error: unknown, fallback: string) {
  if (error instanceof Response) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: error.status },
    )
  }

  const message = error instanceof Error ? error.message : fallback
  const validation = message.includes("required") || message.includes("Password") || message.includes("incorrect") || message.includes("match")

  return NextResponse.json(
    { success: false, error: { code: validation ? "VALIDATION_ERROR" : "PASSWORD_ERROR", message } },
    { status: validation ? 422 : 500 },
  )
}
