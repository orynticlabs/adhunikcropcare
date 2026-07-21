import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import crypto from "crypto"
import { getShipmentByAwb, getShipmentByShiprocketId, recordApiLog } from "@/lib/shiprocket/shipments"
import { enqueueJob } from "@/lib/shiprocket/jobs"

export const runtime = "nodejs"

/**
 * Shiprocket tracking webhook. Authenticated by the `x-api-key` header, which must
 * match SHIPROCKET_WEBHOOK_TOKEN (configured in the Shiprocket dashboard). Records
 * the event and enqueues a sync_tracking job, then returns 200 immediately — the
 * heavy status recompute + notification sends happen off the request in the queue.
 * Dedupe keys make repeated deliveries a no-op.
 */
export async function POST(request: NextRequest) {
  const token = process.env.SHIPROCKET_WEBHOOK_TOKEN
  const provided = request.headers.get("x-api-key")
  if (!token || !provided || !safeEqual(provided, token)) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid webhook token." } }, { status: 401 })
  }

  let body: ShiprocketWebhookBody
  try {
    body = (await request.json()) as ShiprocketWebhookBody
  } catch {
    return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid JSON." } }, { status: 400 })
  }

  const awb = firstString(body.awb, body.awb_code)
  const shiprocketShipmentId = firstString(body.shipment_id, body.sr_shipment_id)

  const shipment = awb
    ? await getShipmentByAwb(awb)
    : shiprocketShipmentId
      ? await getShipmentByShiprocketId(shiprocketShipmentId)
      : null

  const statusCode = firstString(body.current_status_id, body.shipment_status_id, body["sr-status"]) ?? null
  const statusLabel = firstString(body.current_status, body.shipment_status, body.status) ?? "Update"
  const occurredAt = normalizeDate(firstString(body.current_timestamp, body.status_date, body.date))

  await recordApiLog({
    orderId: shipment?.order_id ?? null,
    shipmentId: shipment?.id ?? null,
    direction: "webhook",
    endpoint: "webhook/tracking",
    method: "POST",
    statusCode: 200,
    ok: Boolean(shipment),
    errorMessage: shipment ? null : "No matching shipment",
    requestSummary: { awb, shiprocketShipmentId, statusCode, statusLabel },
  })

  if (!shipment) {
    // Unknown shipment — ack so Shiprocket stops retrying; nothing to enqueue.
    return NextResponse.json({ success: true, data: { matched: false } })
  }

  // Idempotent enqueue: one sync job per (shipment, status, timestamp).
  await enqueueJob({
    type: "sync_tracking",
    orderId: shipment.order_id,
    shipmentId: shipment.id,
    payload: { statusCode, statusLabel, occurredAt },
    dedupeKey: `sync:${shipment.id}:${statusCode ?? "na"}:${occurredAt}`,
  })

  return NextResponse.json({ success: true, data: { matched: true, queued: true } })
}

type ShiprocketWebhookBody = Record<string, unknown> & {
  awb?: unknown
  awb_code?: unknown
  shipment_id?: unknown
  sr_shipment_id?: unknown
  current_status?: unknown
  current_status_id?: unknown
  shipment_status?: unknown
  shipment_status_id?: unknown
  status?: unknown
  "sr-status"?: unknown
  location?: unknown
  current_location?: unknown
  activity?: unknown
  current_timestamp?: unknown
  status_date?: unknown
  date?: unknown
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (value === null || value === undefined) continue
    const str = String(value).trim()
    if (str.length > 0) return str
  }
  return undefined
}

function normalizeDate(value: string | undefined): string {
  if (!value) return new Date().toISOString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)
}
