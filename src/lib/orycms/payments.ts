import "server-only"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { listPaymentAudit } from "@/lib/orycms/payments-audit"

export type PaymentRow = {
  id: string
  razorpay_payment_id: string
  razorpay_order_id: string | null
  order_id: string | null
  order_number: string | null
  customer_name: string | null
  amount: string | number
  amount_refunded: string | number
  currency: string
  status: string
  method: string | null
  captured: boolean
  email: string | null
  contact: string | null
  fee: string | number | null
  tax: string | number | null
  refund_status: string | null
  international: boolean
  notes: unknown
  raw: unknown
  created_at_rzp: Date | string | null
}

export type PaymentFilters = {
  search?: string | null
  status?: string | null
  refundStatus?: string | null
  method?: string | null
  from?: string | null
  to?: string | null
  page?: number
  pageSize?: number
}

const num = (value: string | number | null | undefined) => (value == null ? 0 : Number(value))
const iso = (value: Date | string | null) => (value == null ? null : value instanceof Date ? value.toISOString() : String(value))

function serializePayment(row: PaymentRow) {
  return {
    ...row,
    amount: num(row.amount),
    amount_refunded: num(row.amount_refunded),
    fee: row.fee == null ? null : num(row.fee),
    tax: row.tax == null ? null : num(row.tax),
    created_at_rzp: iso(row.created_at_rzp),
  }
}

const PAYMENT_COLUMNS = `
  id, razorpay_payment_id, razorpay_order_id, order_id, order_number, customer_name,
  amount, amount_refunded, currency, status, method, captured, email, contact,
  fee, tax, refund_status, international, notes, raw, created_at_rzp
`

/** Filtered, paginated payments list from the mirror. All filters applied in SQL. */
export async function listPayments(filters: PaymentFilters) {
  const conditions: string[] = []
  const values: unknown[] = []
  const add = (clause: string, value: unknown) => {
    values.push(value)
    conditions.push(clause.replace("$?", `$${values.length}`))
  }

  if (filters.status && filters.status !== "all") add("status = $?", filters.status)
  if (filters.method && filters.method !== "all") add("method = $?", filters.method)
  if (filters.refundStatus && filters.refundStatus !== "all") {
    if (filters.refundStatus === "none") conditions.push("(refund_status IS NULL OR refund_status = 'null')")
    else add("refund_status = $?", filters.refundStatus)
  }
  if (filters.from) add("created_at_rzp >= $?::timestamptz", filters.from)
  if (filters.to) add("created_at_rzp <= $?::timestamptz", filters.to)
  if (filters.search) {
    const term = `%${filters.search.trim().toLowerCase()}%`
    values.push(term)
    const i = values.length
    conditions.push(`(lower(razorpay_payment_id) LIKE $${i} OR lower(coalesce(order_number,'')) LIKE $${i} OR lower(coalesce(customer_name,'')) LIKE $${i} OR lower(coalesce(email,'')) LIKE $${i})`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? 20))
  const offset = (page - 1) * pageSize

  const countRows = await orycmsPrisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint AS count FROM razorpay_payments ${where}`,
    ...values,
  )
  const total = Number(countRows[0]?.count ?? 0)

  const rows = await orycmsPrisma.$queryRawUnsafe<PaymentRow[]>(
    `SELECT ${PAYMENT_COLUMNS} FROM razorpay_payments ${where} ORDER BY created_at_rzp DESC NULLS LAST LIMIT ${pageSize} OFFSET ${offset}`,
    ...values,
  )

  return { items: rows.map(serializePayment), total, page, pageSize }
}

export async function getPaymentDetail(paymentId: string) {
  const rows = await orycmsPrisma.$queryRawUnsafe<PaymentRow[]>(
    `SELECT ${PAYMENT_COLUMNS} FROM razorpay_payments WHERE razorpay_payment_id = $1 OR id = $1::uuid LIMIT 1`,
    paymentId,
  )
  const payment = rows[0]
  if (!payment) return null

  const refunds = await orycmsPrisma.$queryRaw<Record<string, unknown>[]>`
    SELECT id, razorpay_refund_id, amount, currency, status, speed_processed, reason, receipt, created_at_rzp, created_at
    FROM razorpay_refunds WHERE razorpay_payment_id = ${payment.razorpay_payment_id} ORDER BY created_at DESC
  `
  const audit = await listPaymentAudit(payment.razorpay_payment_id)

  // Pull the linked order + its payment timeline for the order/timeline panels.
  let order: Record<string, unknown> | null = null
  if (payment.order_id) {
    const orderRows = await orycmsPrisma.$queryRaw<Record<string, unknown>[]>`
      SELECT id, number, status, payment_status, payment_method, refund_status, contact, shipping_address,
             subtotal, shipping_total, discount_total, total, payment_timeline, created_at
      FROM storefront_orders WHERE id = ${payment.order_id}::uuid LIMIT 1
    `
    order = orderRows[0] ?? null
  }

  return {
    payment: serializePayment(payment),
    refunds: refunds.map((r) => ({ ...r, amount: num(r.amount as number), created_at_rzp: iso(r.created_at_rzp as Date), created_at: iso(r.created_at as Date) })),
    audit: audit.map((a) => ({ ...a, created_at: iso(a.created_at) })),
    order,
  }
}

export async function getCapturedPaymentForRefund(paymentId: string) {
  const rows = await orycmsPrisma.$queryRaw<PaymentRow[]>`
    SELECT id, razorpay_payment_id, amount, amount_refunded, captured, status
    FROM razorpay_payments WHERE razorpay_payment_id = ${paymentId} LIMIT 1
  `
  return rows[0] ?? null
}

/** Looks up a refund row (mirror) to support retry of a failed refund. */
export async function getRefundRow(refundId: string) {
  const rows = await orycmsPrisma.$queryRaw<{ razorpay_refund_id: string; razorpay_payment_id: string; amount: string | number; status: string; reason: string | null }[]>`
    SELECT razorpay_refund_id, razorpay_payment_id, amount, status, reason
    FROM razorpay_refunds WHERE razorpay_refund_id = ${refundId} LIMIT 1
  `
  return rows[0] ?? null
}

/** Eight dashboard metric cards computed from the mirror. */
export async function getPaymentDashboard() {
  const [row] = await orycmsPrisma.$queryRaw<Record<string, string>[]>`
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE status = 'captured'), 0) AS total_revenue,
      COUNT(*) FILTER (WHERE status = 'captured') AS successful,
      COUNT(*) FILTER (WHERE status IN ('created','authorized')) AS pending,
      COUNT(*) FILTER (WHERE status = 'failed') AS failed,
      COALESCE(SUM(amount_refunded), 0) AS refunded_amount
    FROM razorpay_payments
  `
  const [refundPendingRow] = await orycmsPrisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count FROM razorpay_refunds WHERE status IN ('pending','created','initiated')
  `
  const [settleRow] = await orycmsPrisma.$queryRaw<Record<string, string>[]>`
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE settled = true), 0) AS settled_amount,
      COALESCE(SUM(amount) FILTER (WHERE settled = false), 0) AS unsettled_amount
    FROM razorpay_settlements
  `
  return {
    totalRevenue: Number(row.total_revenue),
    successfulPayments: Number(row.successful),
    pendingPayments: Number(row.pending),
    failedPayments: Number(row.failed),
    refundedAmount: Number(row.refunded_amount),
    refundPending: Number(refundPendingRow?.count ?? 0),
    settledAmount: Number(settleRow?.settled_amount ?? 0),
    unsettledAmount: Number(settleRow?.unsettled_amount ?? 0),
  }
}

/** Analytics series for charts. */
export async function getPaymentAnalytics() {
  const revenueTrend = await orycmsPrisma.$queryRaw<{ day: Date; total: string }[]>`
    SELECT date_trunc('day', created_at_rzp) AS day, COALESCE(SUM(amount),0) AS total
    FROM razorpay_payments WHERE status = 'captured' AND created_at_rzp > now() - interval '30 days'
    GROUP BY 1 ORDER BY 1
  `
  const methodDistribution = await orycmsPrisma.$queryRaw<{ method: string | null; count: bigint }[]>`
    SELECT method, COUNT(*)::bigint AS count FROM razorpay_payments WHERE status = 'captured' GROUP BY method ORDER BY count DESC
  `
  const successVsFailed = await orycmsPrisma.$queryRaw<{ status: string; count: bigint }[]>`
    SELECT CASE WHEN status = 'captured' THEN 'Success' WHEN status = 'failed' THEN 'Failed' ELSE 'Other' END AS status,
           COUNT(*)::bigint AS count FROM razorpay_payments GROUP BY 1
  `
  const refundTrend = await orycmsPrisma.$queryRaw<{ day: Date; total: string }[]>`
    SELECT date_trunc('day', created_at_rzp) AS day, COALESCE(SUM(amount),0) AS total
    FROM razorpay_refunds WHERE created_at_rzp > now() - interval '30 days' GROUP BY 1 ORDER BY 1
  `
  const settlementTrend = await orycmsPrisma.$queryRaw<{ day: Date; total: string }[]>`
    SELECT date_trunc('day', created_at_rzp) AS day, COALESCE(SUM(amount),0) AS total
    FROM razorpay_settlements WHERE created_at_rzp > now() - interval '90 days' GROUP BY 1 ORDER BY 1
  `
  const toSeries = (rows: { day: Date; total: string }[]) => rows.map((r) => ({ label: new Date(r.day).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), value: Number(r.total) }))
  return {
    revenueTrend: toSeries(revenueTrend),
    methodDistribution: methodDistribution.map((r) => ({ label: r.method ?? "unknown", value: Number(r.count) })),
    successVsFailed: successVsFailed.map((r) => ({ label: r.status, value: Number(r.count) })),
    refundTrend: toSeries(refundTrend),
    settlementTrend: toSeries(settlementTrend),
  }
}

export async function listSettlements() {
  const rows = await orycmsPrisma.$queryRaw<Record<string, unknown>[]>`
    SELECT id, razorpay_settlement_id, amount, fees, tax, status, settled, utr, created_at_rzp
    FROM razorpay_settlements ORDER BY created_at_rzp DESC NULLS LAST LIMIT 200
  `
  return rows.map((r) => ({
    ...r,
    amount: num(r.amount as number),
    fees: num(r.fees as number),
    tax: num(r.tax as number),
    net: num(r.amount as number) - num(r.fees as number) - num(r.tax as number),
    created_at_rzp: iso(r.created_at_rzp as Date),
  }))
}

export async function listWebhookLogs() {
  const rows = await orycmsPrisma.$queryRaw<Record<string, unknown>[]>`
    SELECT id, event, razorpay_event_id, signature_valid, status, retry_count, error, created_at
    FROM razorpay_webhook_logs ORDER BY created_at DESC LIMIT 200
  `
  return rows.map((r) => ({ ...r, created_at: iso(r.created_at as Date) }))
}

/** All payments matching filters (no pagination) — for export. */
export async function listPaymentsForExport(filters: PaymentFilters) {
  const { items } = await listPayments({ ...filters, page: 1, pageSize: 100 })
  return items
}
