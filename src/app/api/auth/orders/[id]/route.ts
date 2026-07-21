import { NextResponse } from "next/server"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { ensureStorefrontAuthSchema, jsonError, requireUser } from "@/lib/storefront-auth"
import { getShipmentByOrderId, listShipmentEvents, serializeShipment, serializeShipmentEvent } from "@/lib/shiprocket/shipments"

export const runtime = "nodejs"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    await ensureStorefrontAuthSchema()
    const rows = await orycmsPrisma.$queryRaw<Record<string, unknown>[]>`
      SELECT id, number, status, payment_status, payment_method, razorpay_order_id, razorpay_payment_id,
             refund_status, invoice_number, cancelled_at, reservation_expires_at, payment_timeline,
             contact, shipping_address, delivery_method, subtotal, shipping_total, discount_total,
             tracking, invoice_url, items, total, created_at
      FROM storefront_orders WHERE user_id = ${user.id}::uuid AND id = ${id}::uuid LIMIT 1
    `
    const [order] = rows
    if (!order) return jsonError("Order not found.", 404, "ORDER_NOT_FOUND")

    const shipmentRow = await getShipmentByOrderId(id)
    const shipment = shipmentRow ? serializeShipment(shipmentRow) : null
    const events = shipmentRow ? (await listShipmentEvents(shipmentRow.id)).map(serializeShipmentEvent) : []

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        // Customer-safe shipment subset — internal Shiprocket order id / raw payload are omitted.
        shipment: shipment
          ? {
              awb_code: shipment.awb_code,
              courier_name: shipment.courier_name,
              status: shipment.status,
              tracking_url: shipment.tracking_url,
              estimated_delivery_date: shipment.estimated_delivery_date,
              shiprocket_shipment_id: shipment.shiprocket_shipment_id,
            }
          : null,
        shipmentEvents: events.map((event) => ({
          id: event.id,
          status: event.status,
          location: event.location,
          activity: event.activity,
          occurred_at: event.occurred_at,
        })),
      },
    })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load order.", 401, "ORDER_FAILED")
  }
}
