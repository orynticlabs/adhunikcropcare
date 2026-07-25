import "server-only"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import type { ShipmentEventRow, ShipmentRow } from "@/lib/shiprocket/types"

export const SHIPMENT_SELECT = `
  id, order_id, shiprocket_order_id, shiprocket_shipment_id, awb_code, tracking_number, courier_name, courier_id,
  status, status_code, tracking_url, estimated_delivery_date, shipping_charge, pickup_scheduled_date,
  pickup_status, pickup_token, label_url, manifest_url, invoice_url, shipment_created_at, shipment_created_by_admin_id,
  return_status, reverse_pickup_status, return_reason, return_updated_at,
  retry_count, last_error_code, last_error_message, last_retry_at, raw_response, created_at, updated_at
`

export function serializeShipment(row: ShipmentRow) {
  return {
    ...row,
    estimated_delivery_date: toIso(row.estimated_delivery_date),
    shipment_created_at: toIso(row.shipment_created_at),
    return_updated_at: toIso(row.return_updated_at),
    pickup_scheduled_date: toIso(row.pickup_scheduled_date),
    shipping_charge: row.shipping_charge === null ? null : Number(row.shipping_charge),
    last_retry_at: toIso(row.last_retry_at ?? null),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  }
}

export function serializeShipmentEvent(row: ShipmentEventRow) {
  return {
    ...row,
    occurred_at: toIso(row.occurred_at),
    created_at: toIso(row.created_at),
  }
}

export async function getShipmentByOrderId(orderId: string): Promise<ShipmentRow | null> {
  await ensureShipmentAuditSchema()
  const rows = await orycmsPrisma.$queryRawUnsafe<ShipmentRow[]>(
    `SELECT ${SHIPMENT_SELECT} FROM storefront_shipments WHERE order_id = $1::uuid LIMIT 1`,
    orderId,
  )
  return rows[0] ?? null
}

export async function getShipmentByShiprocketId(shipmentId: string): Promise<ShipmentRow | null> {
  await ensureShipmentAuditSchema()
  const rows = await orycmsPrisma.$queryRawUnsafe<ShipmentRow[]>(
    `SELECT ${SHIPMENT_SELECT} FROM storefront_shipments WHERE shiprocket_shipment_id = $1 LIMIT 1`,
    shipmentId,
  )
  return rows[0] ?? null
}

export async function getShipmentByAwb(awb: string): Promise<ShipmentRow | null> {
  await ensureShipmentAuditSchema()
  const rows = await orycmsPrisma.$queryRawUnsafe<ShipmentRow[]>(
    `SELECT ${SHIPMENT_SELECT} FROM storefront_shipments WHERE awb_code = $1 LIMIT 1`,
    awb,
  )
  return rows[0] ?? null
}

export async function listActiveShipmentsForTracking(limit = 25): Promise<ShipmentRow[]> {
  await ensureShipmentAuditSchema()
  return orycmsPrisma.$queryRawUnsafe<ShipmentRow[]>(
    `SELECT ${SHIPMENT_SELECT}
     FROM storefront_shipments
     WHERE awb_code IS NOT NULL
       AND lower(status) IN (
         'created', 'awb_assigned', 'shipment created', 'confirmed', 'processing',
         'packed', 'picked up', 'shipped', 'in transit', 'out for delivery',
         'rto in transit', 'return requested', 'return picked up'
       )
     ORDER BY updated_at ASC
     LIMIT $1`,
    Math.max(1, Math.min(100, limit)),
  )
}

export async function ensureShipmentAuditSchema() {
  await orycmsPrisma.$executeRaw`
    ALTER TABLE storefront_shipments
      ADD COLUMN IF NOT EXISTS tracking_number TEXT,
      ADD COLUMN IF NOT EXISTS shipment_created_at TIMESTAMPTZ(6),
      ADD COLUMN IF NOT EXISTS shipment_created_by_admin_id UUID,
      ADD COLUMN IF NOT EXISTS return_status TEXT,
      ADD COLUMN IF NOT EXISTS reverse_pickup_status TEXT,
      ADD COLUMN IF NOT EXISTS return_reason TEXT,
      ADD COLUMN IF NOT EXISTS return_updated_at TIMESTAMPTZ(6)
  `
  await orycmsPrisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS storefront_shipments_shipment_created_at_idx ON storefront_shipments (shipment_created_at)
  `
}

export async function listShipmentEvents(shipmentId: string): Promise<ShipmentEventRow[]> {
  return orycmsPrisma.$queryRawUnsafe<ShipmentEventRow[]>(
    `SELECT id, shipment_id, order_id, status, status_code, location, activity, occurred_at, raw, created_at
     FROM storefront_shipment_events WHERE shipment_id = $1::uuid ORDER BY occurred_at ASC, created_at ASC`,
    shipmentId,
  )
}

function toIso(value: Date | string | null) {
  if (value === null) return null
  return value instanceof Date ? value.toISOString() : String(value)
}

export type ApiLogInput = {
  orderId?: string | null
  shipmentId?: string | null
  direction?: "request" | "webhook" | "sync" | "status_change"
  endpoint: string
  method: string
  statusCode?: number | null
  ok: boolean
  errorCode?: string | null
  errorMessage?: string | null
  requestSummary?: unknown
  responseSummary?: unknown
}

/**
 * Records a Shiprocket API call / webhook for the OryCMS activity log. Best-effort:
 * a logging failure must never break the operation being logged, so errors are swallowed.
 */
export async function recordApiLog(input: ApiLogInput): Promise<void> {
  try {
    await orycmsPrisma.$executeRawUnsafe(
      `INSERT INTO shiprocket_api_logs (order_id, shipment_id, direction, endpoint, method, status_code, ok, error_code, error_message, request_summary, response_summary)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb)`,
      input.orderId ?? null,
      input.shipmentId ?? null,
      input.direction ?? "request",
      input.endpoint,
      input.method,
      input.statusCode ?? null,
      input.ok,
      input.errorCode ?? null,
      input.errorMessage ?? null,
      JSON.stringify(input.requestSummary ?? {}),
      JSON.stringify(input.responseSummary ?? {}),
    )
  } catch (error) {
    console.error("Failed to record Shiprocket API log", error)
  }
}

export type ApiLogRow = {
  id: string
  order_id: string | null
  shipment_id: string | null
  direction: string
  endpoint: string
  method: string
  status_code: number | null
  ok: boolean
  error_code: string | null
  error_message: string | null
  created_at: Date | string
}

export async function listApiLogsForOrder(orderId: string, limit = 50): Promise<ApiLogRow[]> {
  return orycmsPrisma.$queryRawUnsafe<ApiLogRow[]>(
    `SELECT id, order_id, shipment_id, direction, endpoint, method, status_code, ok, error_code, error_message, created_at
     FROM shiprocket_api_logs WHERE order_id = $1::uuid ORDER BY created_at DESC LIMIT ${Math.max(1, Math.min(200, limit))}`,
    orderId,
  )
}

export function serializeApiLog(row: ApiLogRow) {
  return { ...row, created_at: toIso(row.created_at) }
}
