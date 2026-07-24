import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { deleteOryCMSFaq, getOryCMSFaq, saveOryCMSFaq } from "@/lib/orycms/faqs"
import { requireOryCMSUser } from "@/lib/orycms/auth"

export const runtime = "nodejs"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireOryCMSUser(request)
    const { id } = await params
    const faq = await getOryCMSFaq(id)
    if (!faq) {
      return NextResponse.json({ success: false, error: { message: "FAQ not found" } }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: faq })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : "Unauthorized"
    return NextResponse.json({ success: false, error: { message } }, { status: 401 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireOryCMSUser(request)
    const { id } = await params
    const body = await request.json()
    const faq = await saveOryCMSFaq(body, id)
    return NextResponse.json({ success: true, data: faq })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : "Failed to update FAQ"
    return NextResponse.json({ success: false, error: { message } }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireOryCMSUser(request)
    const { id } = await params
    await deleteOryCMSFaq(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : "Failed to delete FAQ"
    return NextResponse.json({ success: false, error: { message } }, { status: 400 })
  }
}
