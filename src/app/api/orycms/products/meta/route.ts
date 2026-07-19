import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { listActiveOryCMSCategoryNames } from "@/lib/orycms/categories"
import { listOryCMSProductMedia } from "@/lib/orycms/products"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const [categories, media] = await Promise.all([
      listActiveOryCMSCategoryNames(),
      listOryCMSProductMedia(),
    ])

    return NextResponse.json({ success: true, data: { categories, media } })
  } catch (error) {
    const status = error instanceof Response ? error.status : 500

    return NextResponse.json(
      { success: false, error: { code: "PRODUCT_META_ERROR", message: "Failed to load product metadata." } },
      { status },
    )
  }
}
