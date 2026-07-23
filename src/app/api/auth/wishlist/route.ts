import { NextResponse } from "next/server"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { jsonError, requireCsrf, requireUser } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function GET() {
  try {
    const user = await requireUser()
    const items = await orycmsPrisma.$queryRaw<{ slug: string; name: string | null; price: number | null; sale_price: number | null; images: unknown; status: string | null; stock_quantity: number | null }[]>`
      SELECT w.product_slug AS slug, p.name, p.price, p.sale_price, p.images, p.status, p.stock_quantity
      FROM storefront_wishlist_items w LEFT JOIN orycms_products p ON p.slug = w.product_slug AND p.deleted_at IS NULL
      WHERE w.user_id = ${user.id}::uuid ORDER BY w.created_at DESC`
    return NextResponse.json({ success: true, data: items })
  } catch (error) { return jsonError(error instanceof Error ? error.message : "Wishlist unavailable.", 401) }
}

export async function POST(request: Request) {
  try {
    await requireCsrf(); const user = await requireUser(); const { slug } = await request.json()
    if (typeof slug !== "string" || !slug) throw new Error("Product is invalid.")
    await orycmsPrisma.$executeRaw`INSERT INTO storefront_wishlist_items (user_id, product_slug) VALUES (${user.id}::uuid, ${slug}) ON CONFLICT (user_id, product_slug) DO NOTHING`
    return NextResponse.json({ success: true })
  } catch (error) { return jsonError(error instanceof Error ? error.message : "Unable to save wishlist.", 422) }
}

export async function DELETE(request: Request) {
  try { await requireCsrf(); const user = await requireUser(); const { slug } = await request.json(); await orycmsPrisma.$executeRaw`DELETE FROM storefront_wishlist_items WHERE user_id = ${user.id}::uuid AND product_slug = ${String(slug)} `; return NextResponse.json({ success: true }) } catch (error) { return jsonError(error instanceof Error ? error.message : "Unable to remove wishlist item.", 422) }
}
