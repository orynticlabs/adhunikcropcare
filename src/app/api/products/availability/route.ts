import { NextResponse } from "next/server"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({ items: [] })) as { items?: { name?: string; quantity?: number }[] }
  const items = Array.isArray(body.items) ? body.items.slice(0, 50) : []
  const data = await Promise.all(items.map(async (item) => {
    const name = String(item.name ?? "").trim()
    const [product] = await orycmsPrisma.$queryRaw<{ stock_quantity: number; status: string; deleted_at: Date | null }[]>`SELECT stock_quantity, status, deleted_at FROM orycms_products WHERE lower(name) = lower(${name}) LIMIT 1`
    const quantity = Math.max(1, Number(item.quantity) || 1)
    const status = !product || product.deleted_at || product.status !== "published" ? "unavailable" : product.stock_quantity < quantity ? "out_of_stock" : "available"
    return { name, status }
  }))
  return NextResponse.json({ success: true, data })
}
