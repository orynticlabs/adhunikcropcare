import "server-only"

const BASE_URL = "https://api.razorpay.com/v1"

export class RazorpayApiError extends Error {
  status: number
  code: string | null
  details: unknown
  constructor(message: string, status: number, code?: string | null, details?: unknown) {
    super(message)
    this.name = "RazorpayApiError"
    this.status = status
    this.code = code ?? null
    this.details = details
  }
}

function keyId(): string {
  const value = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  if (!value) throw new RazorpayApiError("Razorpay key ID is not configured.", 400)
  return value
}

function keySecret(): string {
  const value = process.env.RAZORPAY_KEY_SECRET
  if (!value) throw new RazorpayApiError("Razorpay key secret is not configured.", 400)
  return value
}

function authHeader(): string {
  return `Basic ${Buffer.from(`${keyId()}:${keySecret()}`).toString("base64")}`
}

async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: init.method ?? "GET",
    headers: {
      authorization: authHeader(),
      "content-type": "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>
  if (!response.ok) {
    const err = (json.error ?? {}) as { description?: string; code?: string }
    throw new RazorpayApiError(err.description ?? `Razorpay request failed (${response.status}).`, response.status, err.code ?? null, json)
  }
  return json as T
}

// --- Types (partial, only fields we consume) ---

export type RazorpayPaymentEntity = {
  id: string
  entity: "payment"
  amount: number
  currency: string
  status: string
  order_id: string | null
  method: string | null
  amount_refunded: number
  refund_status: string | null
  captured: boolean
  email: string | null
  contact: string | null
  fee: number | null
  tax: number | null
  international: boolean
  notes: Record<string, unknown> | unknown[]
  created_at: number
  error_code?: string | null
  error_description?: string | null
}

export type RazorpayRefundEntity = {
  id: string
  entity: "refund"
  amount: number
  currency: string
  payment_id: string
  status: string
  speed_processed?: string
  speed_requested?: string
  receipt?: string | null
  notes: Record<string, unknown> | unknown[]
  created_at: number
}

export type RazorpaySettlementEntity = {
  id: string
  entity: "settlement"
  amount: number
  status: string
  fees: number
  tax: number
  utr: string | null
  created_at: number
}

type ListResponse<T> = { entity: "collection"; count: number; items: T[] }

// --- Payments ---

export async function fetchPayments(params: { from?: number; to?: number; count?: number; skip?: number } = {}): Promise<ListResponse<RazorpayPaymentEntity>> {
  const query = new URLSearchParams()
  if (params.from) query.set("from", String(params.from))
  if (params.to) query.set("to", String(params.to))
  query.set("count", String(Math.min(100, params.count ?? 100)))
  query.set("skip", String(params.skip ?? 0))
  return request<ListResponse<RazorpayPaymentEntity>>(`/payments?${query.toString()}`)
}

export async function getPayment(paymentId: string): Promise<RazorpayPaymentEntity> {
  return request<RazorpayPaymentEntity>(`/payments/${encodeURIComponent(paymentId)}`)
}

// --- Refunds ---

export async function createRefund(paymentId: string, input: { amount?: number; notes?: Record<string, string>; receipt?: string; speed?: "normal" | "optimum" } = {}): Promise<RazorpayRefundEntity> {
  const body: Record<string, unknown> = {}
  // Amount in paise; omit for a full refund.
  if (input.amount != null) body.amount = Math.round(input.amount * 100)
  if (input.notes) body.notes = input.notes
  if (input.receipt) body.receipt = input.receipt
  if (input.speed) body.speed = input.speed
  return request<RazorpayRefundEntity>(`/payments/${encodeURIComponent(paymentId)}/refund`, { method: "POST", body })
}

export async function getRefund(refundId: string): Promise<RazorpayRefundEntity> {
  return request<RazorpayRefundEntity>(`/refunds/${encodeURIComponent(refundId)}`)
}

export async function fetchRefundsForPayment(paymentId: string): Promise<ListResponse<RazorpayRefundEntity>> {
  return request<ListResponse<RazorpayRefundEntity>>(`/payments/${encodeURIComponent(paymentId)}/refunds`)
}

// --- Settlements ---

export async function fetchSettlements(params: { from?: number; to?: number; count?: number; skip?: number } = {}): Promise<ListResponse<RazorpaySettlementEntity>> {
  const query = new URLSearchParams()
  if (params.from) query.set("from", String(params.from))
  if (params.to) query.set("to", String(params.to))
  query.set("count", String(Math.min(100, params.count ?? 100)))
  query.set("skip", String(params.skip ?? 0))
  return request<ListResponse<RazorpaySettlementEntity>>(`/settlements?${query.toString()}`)
}
