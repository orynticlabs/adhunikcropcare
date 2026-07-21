import "server-only"
import { getShiprocketCredentials } from "@/lib/shiprocket/settings"
import { recordApiLog } from "@/lib/shiprocket/shipments"
import type { ShiprocketTrackingEvent } from "@/lib/shiprocket/types"

const BASE_URL = "https://apiv2.shiprocket.in/v1/external"

export type ApiContext = { orderId?: string | null; shipmentId?: string | null }

export class ShiprocketError extends Error {
  status: number
  details: unknown
  code: string | null
  constructor(message: string, status: number, details?: unknown, code?: string | null) {
    super(message)
    this.name = "ShiprocketError"
    this.status = status
    this.details = details
    this.code = code ?? null
  }
}

type TokenCache = { token: string; expiresAt: number }
let tokenCache: TokenCache | null = null

/** Clears the cached auth token (e.g. after credentials change). */
export function resetShiprocketToken() {
  tokenCache = null
}

async function login(): Promise<string> {
  const creds = await getShiprocketCredentials()
  if (!creds) throw new ShiprocketError("Shiprocket API credentials are not configured.", 400)
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: creds.email, password: creds.password }),
  })
  const json = (await response.json().catch(() => ({}))) as { token?: string; message?: string }
  if (!response.ok || !json.token) {
    throw new ShiprocketError(json.message ?? "Shiprocket authentication failed.", response.status, json)
  }
  // Shiprocket tokens are valid ~10 days; cache for 9 to be safe.
  tokenCache = { token: json.token, expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000 }
  return json.token
}

async function getToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.token
  return login()
}

async function request<T>(path: string, init: { method?: string; body?: unknown; retryOnAuth?: boolean; context?: ApiContext } = {}): Promise<T> {
  const token = await getToken()
  const method = init.method ?? "GET"
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })

  if (response.status === 401 && init.retryOnAuth !== false) {
    resetShiprocketToken()
    await getToken(true)
    return request<T>(path, { ...init, retryOnAuth: false })
  }

  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>
  const endpoint = path.split("?")[0]
  if (!response.ok) {
    const message = typeof json.message === "string" ? json.message : `Shiprocket request failed (${response.status}).`
    const errorCode = json.status_code != null ? String(json.status_code) : String(response.status)
    await recordApiLog({
      orderId: init.context?.orderId ?? null,
      shipmentId: init.context?.shipmentId ?? null,
      endpoint,
      method,
      statusCode: response.status,
      ok: false,
      errorCode,
      errorMessage: message,
      responseSummary: json,
    })
    throw new ShiprocketError(message, response.status, json, errorCode)
  }
  await recordApiLog({
    orderId: init.context?.orderId ?? null,
    shipmentId: init.context?.shipmentId ?? null,
    endpoint,
    method,
    statusCode: response.status,
    ok: true,
    responseSummary: summarizeResponse(json),
  })
  return json as T
}

/** Keeps only lightweight fields from a success response so logs stay small. */
function summarizeResponse(json: Record<string, unknown>): Record<string, unknown> {
  const keys = ["status", "status_code", "order_id", "shipment_id", "awb_code", "courier_name", "message", "pickup_status", "label_url", "manifest_url", "invoice_url", "label_created", "manifest_url"]
  const summary: Record<string, unknown> = {}
  for (const key of keys) {
    if (json[key] !== undefined) summary[key] = json[key]
  }
  return Object.keys(summary).length > 0 ? summary : { ok: true }
}

export type CreateOrderPayload = {
  order_id: string
  order_date: string
  pickup_location: string
  channel_id?: string
  billing_customer_name: string
  billing_last_name: string
  billing_address: string
  billing_address_2?: string
  billing_city: string
  billing_pincode: string
  billing_state: string
  billing_country: string
  billing_email: string
  billing_phone: string
  shipping_is_billing: boolean
  order_items: Array<{ name: string; sku: string; units: number; selling_price: number }>
  payment_method: "COD" | "Prepaid"
  sub_total: number
  length: number
  breadth: number
  height: number
  weight: number
}

export type CreateOrderResponse = {
  order_id?: number | string
  shipment_id?: number | string
  status?: string
  status_code?: number | string
  courier_company_id?: number | string
  courier_name?: string
  awb_code?: string | null
  onboarding_completed_now?: number
  message?: string
}

export async function createShiprocketOrder(payload: CreateOrderPayload, context?: ApiContext): Promise<CreateOrderResponse> {
  return request<CreateOrderResponse>("/orders/create/adhoc", { method: "POST", body: payload, context })
}

export type AssignAwbResponse = {
  awb_assign_status?: number
  response?: {
    data?: {
      awb_code?: string
      courier_company_id?: number | string
      courier_name?: string
      shipment_id?: number | string
      freight_charges?: number
      routing_code?: string
      applied_weight?: number
      pickup_scheduled_date?: string
    }
  }
  message?: string
}

export async function assignAwb(shipmentId: string | number, courierId?: string | number, context?: ApiContext): Promise<AssignAwbResponse> {
  const body: Record<string, unknown> = { shipment_id: shipmentId }
  if (courierId) body.courier_id = courierId
  return request<AssignAwbResponse>("/courier/assign/awb", { method: "POST", body, context })
}

export type PickupResponse = {
  pickup_status?: number
  response?: { pickup_scheduled_date?: string; pickup_token_number?: string; status?: number; pickup_generated_date?: unknown }
  message?: string
}

export async function requestPickup(shipmentIds: Array<string | number>, context?: ApiContext): Promise<PickupResponse> {
  return request<PickupResponse>("/courier/generate/pickup", { method: "POST", body: { shipment_id: shipmentIds }, context })
}

export type ServiceabilityCourier = {
  courier_name: string
  courier_company_id: number
  rate: number
  cod: number
  estimated_delivery_days: string
  etd: string
}

export type ServiceabilityResponse = {
  status?: number
  data?: {
    available_courier_companies?: ServiceabilityCourier[]
  }
}

export async function checkServiceability(input: {
  pickupPincode: string
  deliveryPincode: string
  weight: number
  cod: boolean
}): Promise<ServiceabilityResponse> {
  const params = new URLSearchParams({
    pickup_postcode: input.pickupPincode,
    delivery_postcode: input.deliveryPincode,
    weight: String(input.weight),
    cod: input.cod ? "1" : "0",
  })
  return request<ServiceabilityResponse>(`/courier/serviceability/?${params.toString()}`)
}

export type CancelResponse = { status_code?: number; message?: string }

export async function cancelShiprocketShipment(awbCodes: string[], context?: ApiContext): Promise<CancelResponse> {
  return request<CancelResponse>("/orders/cancel/shipment/awbs", { method: "POST", body: { awbs: awbCodes }, context })
}

export async function cancelShiprocketOrder(orderIds: Array<string | number>, context?: ApiContext): Promise<CancelResponse> {
  return request<CancelResponse>("/orders/cancel", { method: "POST", body: { ids: orderIds }, context })
}

// --- Documents ---

export type InvoiceResponse = { is_invoice_created?: boolean; invoice_url?: string; not_created?: unknown[] }
export async function generateInvoice(orderIds: Array<string | number>, context?: ApiContext): Promise<InvoiceResponse> {
  return request<InvoiceResponse>("/orders/print/invoice", { method: "POST", body: { ids: orderIds }, context })
}

export type LabelResponse = { label_created?: number; label_url?: string; response?: string; not_created?: unknown[] }
export async function generateLabel(shipmentIds: Array<string | number>, context?: ApiContext): Promise<LabelResponse> {
  return request<LabelResponse>("/courier/generate/label", { method: "POST", body: { shipment_id: shipmentIds }, context })
}

export type ManifestGenerateResponse = { status?: number; manifest_url?: string }
export async function generateManifest(shipmentIds: Array<string | number>, context?: ApiContext): Promise<ManifestGenerateResponse> {
  return request<ManifestGenerateResponse>("/manifests/generate", { method: "POST", body: { shipment_id: shipmentIds }, context })
}

export type ManifestPrintResponse = { status?: number; manifest_url?: string }
export async function printManifest(orderIds: Array<string | number>, context?: ApiContext): Promise<ManifestPrintResponse> {
  return request<ManifestPrintResponse>("/manifests/print", { method: "POST", body: { order_ids: orderIds }, context })
}

// --- Pickup management ---

export async function reschedulePickup(shipmentIds: Array<string | number>, pickupDate: string, context?: ApiContext): Promise<PickupResponse> {
  return request<PickupResponse>("/courier/generate/pickup", { method: "POST", body: { shipment_id: shipmentIds, pickup_date: [pickupDate] }, context })
}

export type PickupCancelResponse = { status_code?: number; message?: string; success?: boolean }
export async function cancelPickup(shipmentIds: Array<string | number>, context?: ApiContext): Promise<PickupCancelResponse> {
  return request<PickupCancelResponse>("/courier/cancel/pickup", { method: "POST", body: { shipment_id: shipmentIds }, context })
}

type TrackingActivity = { date?: string; status?: string; activity?: string; location?: string; "sr-status"?: string | number }
type TrackingResponse = {
  tracking_data?: {
    track_status?: number
    shipment_status?: number | string
    shipment_track?: Array<{ current_status?: string; delivered_date?: string; edd?: string }>
    shipment_track_activities?: TrackingActivity[]
    track_url?: string
    etd?: string
  }
}

export async function getTrackingByAwb(awb: string): Promise<{ trackUrl: string | null; etd: string | null; events: ShiprocketTrackingEvent[] }> {
  const json = await request<TrackingResponse>(`/courier/track/awb/${encodeURIComponent(awb)}`)
  return normalizeTracking(json)
}

export async function getTrackingByShipmentId(shipmentId: string | number): Promise<{ trackUrl: string | null; etd: string | null; events: ShiprocketTrackingEvent[] }> {
  const json = await request<TrackingResponse>(`/courier/track/shipment/${encodeURIComponent(String(shipmentId))}`)
  return normalizeTracking(json)
}

function normalizeTracking(json: TrackingResponse): { trackUrl: string | null; etd: string | null; events: ShiprocketTrackingEvent[] } {
  const data = json.tracking_data
  const activities = data?.shipment_track_activities ?? []
  const events: ShiprocketTrackingEvent[] = activities.map((activity) => ({
    statusCode: activity["sr-status"] !== undefined && activity["sr-status"] !== null ? String(activity["sr-status"]) : null,
    statusLabel: activity.status ?? activity.activity ?? "Update",
    location: activity.location ?? null,
    activity: activity.activity ?? null,
    occurredAt: activity.date ?? new Date().toISOString(),
    raw: activity,
  }))
  return {
    trackUrl: data?.track_url ?? null,
    etd: data?.etd ?? data?.shipment_track?.[0]?.edd ?? null,
    events,
  }
}
