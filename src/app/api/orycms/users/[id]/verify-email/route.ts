import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { verifyOryCMSAdminEmailManual } from "@/lib/orycms/users"

export const runtime = "nodejs"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireOryCMSUser(request)
    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as { justification?: string }
    if (!body.justification) {
      return NextResponse.json({ success: false, error: { message: "Justification is required for manual email verification." } }, { status: 400 })
    }
    const updated = await verifyOryCMSAdminEmailManual(id, body.justification, actor)
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : "Failed to verify email."
    return NextResponse.json({ success: false, error: { message } }, { status: 422 })
  }
}
