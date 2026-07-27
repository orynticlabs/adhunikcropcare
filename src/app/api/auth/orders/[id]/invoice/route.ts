import { buildInvoicePdf } from "@/lib/storefront-orders"
import { jsonError, requireUser } from "@/lib/storefront-auth"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export const runtime = "nodejs"

/**
 * Customer invoice download. The order is verified against the signed-in user
 * before the in-app GST invoice is generated.
 */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return jsonError("Order not found.", 404, "ORDER_NOT_FOUND")

    const [owned] = await orycmsPrisma.$queryRaw<{ id: string; number: string }[]>`
      SELECT id, number FROM storefront_orders WHERE id = ${id}::uuid AND user_id = ${user.id}::uuid LIMIT 1
    `
    if (!owned) return jsonError("Order not found.", 404, "ORDER_NOT_FOUND")

    const invoice = await buildInvoicePdf(user.id, id)
    return new Response(new Uint8Array(invoice.bytes), {
      headers: {
        "content-disposition": `attachment; filename="${invoice.filename}"`,
        "content-type": "application/pdf",
        "x-content-type-options": "nosniff",
      },
    })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invoice download failed.", 404, "INVOICE_FAILED")
  }
}
