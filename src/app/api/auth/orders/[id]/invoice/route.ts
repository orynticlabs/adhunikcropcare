import { buildInvoicePdf } from "@/lib/storefront-orders"
import { jsonError, requireUser } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    const invoice = await buildInvoicePdf(user.id, id)
    return new Response(invoice.bytes, {
      headers: {
        "content-disposition": `attachment; filename="${invoice.filename}"`,
        "content-type": "application/pdf",
      },
    })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invoice download failed.", 404, "INVOICE_FAILED")
  }
}
