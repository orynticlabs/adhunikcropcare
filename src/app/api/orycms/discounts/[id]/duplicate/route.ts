import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { duplicateOryCMSDiscount } from "@/lib/orycms/discounts"

export const runtime = "nodejs"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    const { id } = await params
    return NextResponse.json({ success: true, data: await duplicateOryCMSDiscount(id) }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 })
    }
    return NextResponse.json(
      { success: false, error: { code: "DISCOUNT_ERROR", message: error instanceof Error ? error.message : "Failed to duplicate discount." } },
      { status: 500 },
    )
  }
}
