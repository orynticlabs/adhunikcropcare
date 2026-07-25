import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { confirmOryCMSOrder, getOryCMSOrder, packOryCMSOrder } from "@/lib/orycms/orders"
import { cancelOrderByAdmin } from "@/lib/storefront-orders"
import { enqueueJob } from "@/lib/shiprocket/jobs"
import { getShipmentByOrderId } from "@/lib/shiprocket/shipments"
import { generateLabel, ShiprocketError } from "@/lib/shiprocket/client"
import { cancelShipment } from "@/lib/shiprocket/fulfillment"

export const runtime = "nodejs"

type BulkAction = "confirm" | "pack" | "create_shipment" | "print_labels" | "cancel"

const ENQUEUE_ACTIONS: Record<string, { type: "create_shipment" }> = {
  create_shipment: { type: "create_shipment" },
}

/**
 * Bulk order/shipment operations. Confirm updates orders directly; shipment
 * actions fan out idempotent jobs and document actions call Shiprocket endpoints.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireOryCMSUser(request)
    const body = (await request.json().catch(() => ({}))) as { action?: BulkAction; orderIds?: unknown }
    const action = body.action
    const orderIds = Array.isArray(body.orderIds) ? body.orderIds.filter((value): value is string => typeof value === "string") : []

    if (!action) return bad("Missing action.")
    if (orderIds.length === 0) return bad("Select at least one order.")
    if (orderIds.length > 100) return bad("Select at most 100 orders per bulk action.")

    if (action === "confirm") {
      const results = await Promise.all(
        orderIds.map(async (orderId) => {
          try {
            await confirmOryCMSOrder(orderId, user)
            return { orderId, ok: true }
          } catch (error) {
            return { orderId, ok: false, error: error instanceof Error ? error.message : "Failed to confirm." }
          }
        }),
      )
      return NextResponse.json({ success: true, data: { action, results } })
    }

    if (action === "pack") {
      const results = await Promise.all(
        orderIds.map(async (orderId) => {
          try {
            await packOryCMSOrder(orderId, user)
            return { orderId, ok: true }
          } catch (error) {
            return { orderId, ok: false, error: error instanceof Error ? error.message : "Failed to pack." }
          }
        }),
      )
      return NextResponse.json({ success: true, data: { action, results } })
    }

    if (action === "cancel") {
      const results = await Promise.all(
        orderIds.map(async (orderId) => {
          try {
            const order = await getOryCMSOrder(orderId)
            if (!order) throw new Error("Order not found.")
            const shipment = await getShipmentByOrderId(order.id)
            if (shipment) await cancelShipment(order.id)
            else await cancelOrderByAdmin(order.id)
            return { orderId, ok: true }
          } catch (error) {
            return { orderId, ok: false, error: error instanceof Error ? error.message : "Failed to cancel." }
          }
        }),
      )
      return NextResponse.json({ success: true, data: { action, results } })
    }

    if (action in ENQUEUE_ACTIONS) {
      const { type } = ENQUEUE_ACTIONS[action]
      const results = await Promise.all(
        orderIds.map(async (orderId) => {
          try {
            const jobId = await enqueueJob({ type, orderId, dedupeKey: `bulk:${type}:${orderId}` })
            return { orderId, ok: true, queued: jobId != null }
          } catch (error) {
            return { orderId, ok: false, error: error instanceof Error ? error.message : "Failed to enqueue." }
          }
        }),
      )
      return NextResponse.json({ success: true, data: { action, queued: true, results } })
    }

    if (action === "print_labels") {
      // Resolve Shiprocket shipment/order ids for the selection.
      const shipments = await Promise.all(orderIds.map((orderId) => getShipmentByOrderId(orderId)))
      const found = shipments.filter((shipment): shipment is NonNullable<typeof shipment> => Boolean(shipment))
      const missing = orderIds.length - found.length

      const shipmentIds = found.map((shipment) => shipment.shiprocket_shipment_id).filter((value): value is string => Boolean(value))
      if (shipmentIds.length === 0) return bad("None of the selected orders have a Shiprocket shipment yet.")
      const response = await generateLabel(shipmentIds)
      return NextResponse.json({ success: true, data: { action, url: response.label_url ?? null, count: shipmentIds.length, missing } })
    }

    return bad("Unknown action.")
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: error.status })
    }
    if (error instanceof ShiprocketError) {
      return NextResponse.json({ success: false, error: { code: "SHIPROCKET_ERROR", message: error.message } }, { status: error.status >= 400 && error.status < 600 ? error.status : 502 })
    }
    return NextResponse.json({ success: false, error: { code: "BULK_ERROR", message: error instanceof Error ? error.message : "Bulk action failed." } }, { status: 500 })
  }
}

function bad(message: string) {
  return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message } }, { status: 400 })
}
