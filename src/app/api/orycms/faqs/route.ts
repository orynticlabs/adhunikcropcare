import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { listOryCMSFaqs, saveOryCMSFaq } from "@/lib/orycms/faqs"
import { requireOryCMSUser } from "@/lib/orycms/auth"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const faqs = await listOryCMSFaqs()
    return NextResponse.json({ success: true, data: faqs })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : "Unauthorized"
    return NextResponse.json({ success: false, error: { message } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const body = await request.json()
    const faq = await saveOryCMSFaq(body)
    return NextResponse.json({ success: true, data: faq }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : "Failed to create FAQ"
    return NextResponse.json({ success: false, error: { message } }, { status: 400 })
  }
}
