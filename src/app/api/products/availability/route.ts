import { NextResponse } from "next/server"
import { listOryCMSProducts } from "@/lib/orycms/products"
import { checkRateLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const { allowed } = await checkRateLimit("cart-availability", 60, 60_000)
  if (!allowed) {
    return NextResponse.json({ success: false, error: { message: "Too many requests." } }, { status: 429 })
  }

  try {
    const body = (await request.json().catch(() => ({ items: [] }))) as {
      items?: { name?: string; quantity?: number }[]
    }
    const items = Array.isArray(body.items) ? body.items.slice(0, 50) : []

    if (items.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // High performance: fetch cached published products in-memory (0ms DB delay)
    const allProducts = await listOryCMSProducts({ publishedOnly: true })
    const productMap = new Map(allProducts.map((p) => [p.name.trim().toLowerCase(), p]))

    const data = items.map((item) => {
      const name = String(item.name ?? "").trim()
      const lower = name.toLowerCase()
      const product = productMap.get(lower)
      const quantity = Math.max(1, Number(item.quantity) || 1)

      const status =
        !product || product.status !== "published"
          ? "unavailable"
          : product.stockQuantity < quantity
            ? "out_of_stock"
            : "available"

      return { name, slug: product?.slug ?? null, status }
    })

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: true, data: [] })
  }
}
