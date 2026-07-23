import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { getOryCMSDiscount, saveOryCMSDiscount, deleteOryCMSDiscount } from "@/lib/orycms/discounts"

export const runtime = "nodejs"

function discountError(error: unknown, fallback: string) {
  if (error instanceof Response) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 })
  }
  const message = error instanceof Error ? error.message : fallback
  const isValidation = message.includes("required") || message.includes("Invalid") || message.includes("already exists")
  return NextResponse.json(
    { success: false, error: { code: isValidation ? "VALIDATION_ERROR" : "DISCOUNT_ERROR", message } },
    { status: isValidation ? 422 : 500 },
  )
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    const { id } = await params
    const discount = await getOryCMSDiscount(id)
    if (!discount) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Discount not found." } }, { status: 404 })
    return NextResponse.json({ success: true, data: discount })
  } catch (error) {
    return discountError(error, "Failed to load discount.")
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    const { id } = await params
    return NextResponse.json({ success: true, data: await saveOryCMSDiscount(await request.json(), id) })
  } catch (error) {
    return discountError(error, "Failed to update discount.")
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    const { id } = await params
    await deleteOryCMSDiscount(id)
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return discountError(error, "Failed to delete discount.")
  }
}
