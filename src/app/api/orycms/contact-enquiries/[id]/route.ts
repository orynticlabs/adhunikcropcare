import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { updateOryCMSContactEnquiryStatus } from "@/lib/orycms/contact-enquiries"

export const runtime = "nodejs"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as { status?: string }
    return NextResponse.json({ success: true, data: await updateOryCMSContactEnquiryStatus(id, String(body.status ?? "")) })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : "Failed to update contact enquiry." } }, { status: 400 })
  }
}
