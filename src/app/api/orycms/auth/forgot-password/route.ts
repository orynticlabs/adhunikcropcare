import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createAndSendAdminPasswordReset } from "@/lib/orycms/password-reset"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string }
    const email = String(body.email ?? "").trim()
    if (!email) {
      return NextResponse.json(
        { success: false, error: { message: "Please enter your work email address." } },
        { status: 400 }
      )
    }

    const result = await createAndSendAdminPasswordReset(email)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process password reset request."
    return NextResponse.json({ success: false, error: { message } }, { status: 422 })
  }
}
