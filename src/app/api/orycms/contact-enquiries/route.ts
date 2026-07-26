import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { listOryCMSContactEnquiries } from "@/lib/orycms/contact-enquiries"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await listOryCMSContactEnquiries() })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : "Failed to load contact enquiries." } }, { status: 500 })
  }
}
