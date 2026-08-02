import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { bulkRestoreOryCMSProducts, restoreOryCMSProduct } from "@/lib/orycms/products"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const body = (await request.json()) as { id?: string; ids?: string[] }

    if (body.id) {
      const restored = await restoreOryCMSProduct(body.id)
      return NextResponse.json({ success: true, data: restored })
    }

    if (Array.isArray(body.ids)) {
      const restored = await bulkRestoreOryCMSProducts(body.ids)
      return NextResponse.json({ success: true, data: restored })
    }

    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Provide id or ids to restore." } },
      { status: 422 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to restore product."
    return NextResponse.json({ success: false, error: { code: "PRODUCT_ERROR", message } }, { status: 500 })
  }
}
