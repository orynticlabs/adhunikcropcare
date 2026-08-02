import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { resendOryCMSAdminInvitation } from "@/lib/orycms/users"

export const runtime = "nodejs"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireOryCMSUser(request)
    const { id } = await params
    const result = await resendOryCMSAdminInvitation(id, actor)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : "Failed to resend invitation."
    return NextResponse.json({ success: false, error: { message } }, { status: 422 })
  }
}
