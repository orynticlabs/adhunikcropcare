import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { completeInvitationPasswordSetup, validateInvitationToken } from "@/lib/orycms/invitation"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")
    if (!token) {
      return NextResponse.json({ success: false, error: { message: "Invitation token is required." } }, { status: 400 })
    }
    const result = await validateInvitationToken(token)
    if (!result.valid) {
      return NextResponse.json({ success: false, error: { message: result.message, reason: result.reason } }, { status: 422 })
    }
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to validate invitation token."
    return NextResponse.json({ success: false, error: { message } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { confirmPassword?: string; password?: string; token?: string }
    if (!body.token) {
      return NextResponse.json({ success: false, error: { message: "Invitation token is required." } }, { status: 400 })
    }
    if (!body.password || body.password.length < 8) {
      return NextResponse.json({ success: false, error: { message: "Password must be at least 8 characters long." } }, { status: 422 })
    }
    if (body.password !== body.confirmPassword) {
      return NextResponse.json({ success: false, error: { message: "Passwords do not match." } }, { status: 422 })
    }

    const result = await completeInvitationPasswordSetup(body.token, body.password)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to set password."
    return NextResponse.json({ success: false, error: { message } }, { status: 422 })
  }
}
