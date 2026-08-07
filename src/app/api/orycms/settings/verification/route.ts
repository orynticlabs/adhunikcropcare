import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { getOryCMSVerificationSettings, updateOryCMSVerificationSettings } from "@/lib/orycms/verification-settings"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await getOryCMSVerificationSettings() })
  } catch (error) { return responseError(error) }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await updateOryCMSVerificationSettings(await request.json()) })
  } catch (error) { return responseError(error) }
}

function responseError(error: unknown) {
  if (error instanceof Response) return NextResponse.json({ success: false, error: { message: "Authentication required." } }, { status: error.status })
  const message = error instanceof Error ? error.message : "Verification settings operation failed."
  const validation = message.includes("required") || message.includes("Invalid")
  return NextResponse.json({ success: false, error: { message } }, { status: validation ? 422 : 500 })
}
