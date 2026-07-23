import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getActiveOffersForProduct } from "@/lib/orycms/discounts"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productSlug = searchParams.get("productSlug") ?? ""
    const categorySlug = searchParams.get("categorySlug") ?? undefined
    const offers = await getActiveOffersForProduct(productSlug, categorySlug)
    return NextResponse.json(
      { success: true, data: offers.map((o) => ({
        id: o.id,
        name: o.name,
        code: o.code,
        shortText: o.shortText,
        badgeText: o.badgeText,
        bgColor: o.bgColor,
        textColor: o.textColor,
        buttonText: o.buttonText,
        buttonColor: o.buttonColor,
        type: o.type,
        value: o.value,
        endsAt: o.endsAt,
      })) },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
    )
  } catch {
    return NextResponse.json({ success: true, data: [] })
  }
}
