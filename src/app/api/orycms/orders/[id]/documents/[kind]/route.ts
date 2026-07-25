import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { getOryCMSOrder } from "@/lib/orycms/orders"
import { buildAdminInvoicePdf } from "@/lib/storefront-orders"
import { isDocumentKind, proxyDocument } from "@/lib/shiprocket/documents"
import { ShiprocketError } from "@/lib/shiprocket/client"

export const runtime = "nodejs"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; kind: string }> }) {
  try {
    await requireOryCMSUser(request)
    const { id, kind } = await params
    if (!isDocumentKind(kind)) {
      return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "Unknown document type." } }, { status: 400 })
    }
    const order = await getOryCMSOrder(id)
    if (!order) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Order not found." } }, { status: 404 })
    }
    if (kind === "invoice" && !order.shipment?.shiprocket_order_id) {
      const invoice = await buildAdminInvoicePdf(order.id)
      return new Response(new Uint8Array(invoice.bytes), {
        headers: {
          "content-disposition": `inline; filename="${invoice.filename}"`,
          "content-type": "application/pdf",
        },
      })
    }
    return await proxyDocument(order.id, kind, order.number)
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: error.status })
    }
    if (error instanceof ShiprocketError) {
      return NextResponse.json({ success: false, error: { code: "SHIPROCKET_ERROR", message: error.message } }, { status: error.status >= 400 && error.status < 600 ? error.status : 502 })
    }
    return NextResponse.json({ success: false, error: { code: "DOCUMENT_ERROR", message: error instanceof Error ? error.message : "Failed to load document." } }, { status: 500 })
  }
}
