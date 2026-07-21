import { buildInvoicePdf } from "@/lib/storefront-orders"
import { jsonError, requireUser } from "@/lib/storefront-auth"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { getShipmentByOrderId } from "@/lib/shiprocket/shipments"
import { proxyDocument } from "@/lib/shiprocket/documents"

export const runtime = "nodejs"

/**
 * Customer invoice download. Prefers the Shiprocket-generated GST invoice once a
 * shipment exists; falls back to the in-app PDF for orders not yet shipped. The
 * order is verified against the signed-in user before anything is generated.
 */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params

    const [owned] = await orycmsPrisma.$queryRaw<{ id: string; number: string }[]>`
      SELECT id, number FROM storefront_orders WHERE id = ${id}::uuid AND user_id = ${user.id}::uuid LIMIT 1
    `
    if (!owned) return jsonError("Order not found.", 404, "ORDER_NOT_FOUND")

    const shipment = await getShipmentByOrderId(owned.id)
    if (shipment?.shiprocket_order_id) {
      try {
        return await proxyDocument(owned.id, "invoice", owned.number)
      } catch (error) {
        // Fall through to the in-app invoice if Shiprocket cannot produce one yet.
        console.error("Shiprocket invoice unavailable, using fallback", error)
      }
    }

    const invoice = await buildInvoicePdf(user.id, id)
    return new Response(new Uint8Array(invoice.bytes), {
      headers: {
        "content-disposition": `attachment; filename="${invoice.filename}"`,
        "content-type": "application/pdf",
      },
    })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invoice download failed.", 404, "INVOICE_FAILED")
  }
}
