"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { OryCMSSelect } from "@/components/orycms/custom-select"
import { playOryCMSToastSound } from "@/lib/orycms/toast-sound"
import { cn, formatCurrency } from "@/lib/utils"

type Toast = { id: number; message: string; tone: "success" | "error" }

type Payment = {
  id: string
  razorpay_payment_id: string
  razorpay_order_id: string | null
  order_id: string | null
  order_number: string | null
  customer_name: string | null
  amount: number
  amount_refunded: number
  currency: string
  status: string
  method: string | null
  captured: boolean
  email: string | null
  refund_status: string | null
  created_at_rzp: string | null
}

type Cards = {
  totalRevenue: number
  successfulPayments: number
  pendingPayments: number
  failedPayments: number
  refundedAmount: number
  refundPending: number
  settledAmount: number
  unsettledAmount: number
}

type Series = { label: string; value: number }
type Analytics = {
  revenueTrend: Series[]
  methodDistribution: Series[]
  successVsFailed: Series[]
  refundTrend: Series[]
  settlementTrend: Series[]
}

type Settlement = { id: string; razorpay_settlement_id: string; amount: number; fees: number; tax: number; net: number; status: string; settled: boolean; utr: string | null; created_at_rzp: string | null }
type WebhookLog = { id: string; event: string; signature_valid: boolean; status: string; retry_count: number; error: string | null; created_at: string }

const PAGE_SIZE = 20

export function OryCMSPaymentsAdmin() {
  const [cards, setCards] = useState<Cards | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [total, setTotal] = useState(0)
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [webhooks, setWebhooks] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  // Filters + search
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [refundStatus, setRefundStatus] = useState("all")
  const [method, setMethod] = useState("all")
  const [settlementFilter, setSettlementFilter] = useState("all")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [page, setPage] = useState(1)

  function toast(message: string, tone: Toast["tone"]) {
    const id = Date.now() + Math.random()
    playOryCMSToastSound()
    setToasts((items) => [...items, { id, message, tone }])
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3500)
  }

  const loadPayments = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (status !== "all") params.set("status", status)
    if (refundStatus !== "all") params.set("refundStatus", refundStatus)
    if (method !== "all") params.set("method", method)
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    params.set("page", String(page))
    params.set("pageSize", String(PAGE_SIZE))
    const json = await fetch(`/api/orycms/payments?${params.toString()}`, { cache: "no-store" }).then((r) => r.json())
    if (json.success) {
      setPayments(json.data.items)
      setTotal(json.data.total)
    }
  }, [search, status, refundStatus, method, from, to, page])

  const loadAux = useCallback(async () => {
    const [dash, ana, settle, hooks] = await Promise.all([
      fetch("/api/orycms/payments/dashboard", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/orycms/payments/analytics", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/orycms/payments/settlements", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/orycms/payments/webhooks", { cache: "no-store" }).then((r) => r.json()),
    ])
    if (dash.success) setCards(dash.data.cards)
    if (ana.success) setAnalytics(ana.data)
    if (settle.success) setSettlements(settle.data)
    if (hooks.success) setWebhooks(hooks.data)
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([loadPayments(), loadAux()]).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [loadPayments, loadAux])

  async function sync() {
    setSyncing(true)
    try {
      const json = await fetch("/api/orycms/payments/sync", { method: "POST" }).then((r) => r.json())
      if (!json.success) throw new Error(json.error?.message ?? "Sync failed.")
      toast(`Synced ${json.data.payments} payments, ${json.data.settlements ?? 0} settlements.`, "success")
      await Promise.all([loadPayments(), loadAux()])
    } catch (error) {
      toast(error instanceof Error ? error.message : "Sync failed.", "error")
    } finally {
      setSyncing(false)
    }
  }

  function exportAs(format: string) {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (status !== "all") params.set("status", status)
    if (refundStatus !== "all") params.set("refundStatus", refundStatus)
    if (method !== "all") params.set("method", method)
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    params.set("format", format)
    window.open(`/api/orycms/payments/export?${params.toString()}`, "_blank")
    toast(`Exporting ${format.toUpperCase()}…`, "success")
  }

  const filteredSettlements = useMemo(
    () => settlements.filter((s) => settlementFilter === "all" || (settlementFilter === "settled" ? s.settled : !s.settled)),
    [settlements, settlementFilter],
  )

  const warnings = useMemo(() => buildWarnings(cards, webhooks), [cards, webhooks])
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-6 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/payments", label: "Payments" }]} />
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">Payments</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">Real Razorpay payments, refunds, settlements, and analytics — synced with the official API.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => void sync()} disabled={syncing} className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-[12.5px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60">
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Sync with Razorpay
          </button>
          <ExportMenu onExport={exportAs} />
        </div>
      </div>

      {warnings.length > 0 ? (
        <div className="space-y-2">
          {warnings.map((warning) => (
            <div key={warning} className="flex items-center gap-2 rounded-lg border border-[#e9c46a]/40 bg-[#e9c46a]/10 px-3 py-2 text-[12.5px] text-[#8a6d1f]">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {warning}
            </div>
          ))}
        </div>
      ) : null}

      {/* Dashboard cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={TrendingUp} label="Total Revenue" value={formatCurrency(cards?.totalRevenue ?? 0)} />
        <Metric icon={CheckCircle2} label="Successful Payments" value={String(cards?.successfulPayments ?? 0)} />
        <Metric icon={Loader2} label="Pending Payments" value={String(cards?.pendingPayments ?? 0)} />
        <Metric icon={Ban} label="Failed Payments" value={String(cards?.failedPayments ?? 0)} />
        <Metric icon={RefreshCw} label="Refunded Amount" value={formatCurrency(cards?.refundedAmount ?? 0)} />
        <Metric icon={AlertTriangle} label="Refund Pending" value={String(cards?.refundPending ?? 0)} />
        <Metric icon={Wallet} label="Settled Amount" value={formatCurrency(cards?.settledAmount ?? 0)} />
        <Metric icon={CreditCard} label="Unsettled Amount" value={formatCurrency(cards?.unsettledAmount ?? 0)} />
      </div>

      {/* Filters + search */}
      <div className="rounded-xl border border-border bg-surface shadow-xs">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-muted px-4 py-3">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} placeholder="Order #, payment ID, customer, email…" className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-[13px] outline-none focus:border-border-strong" />
          </div>
          <Select value={status} onChange={(v) => { setPage(1); setStatus(v) }} label="Status" options={["all", "captured", "authorized", "created", "failed", "refunded"]} />
          <Select value={refundStatus} onChange={(v) => { setPage(1); setRefundStatus(v) }} label="Refund" options={["all", "none", "partial", "full", "processed"]} />
          <Select value={method} onChange={(v) => { setPage(1); setMethod(v) }} label="Method" options={["all", "card", "upi", "netbanking", "wallet", "emi"]} />
          <input type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value) }} className="h-9 rounded-lg border border-border bg-surface px-2 text-[12.5px] outline-none" />
          <input type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value) }} className="h-9 rounded-lg border border-border bg-surface px-2 text-[12.5px] outline-none" />
        </div>

        {/* Payments table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-[13px]">
            <thead className="border-b border-border bg-surface-muted text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Payment ID</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Captured</th>
                <th className="px-4 py-3 font-medium">Refund</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">Loading payments…</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-14 text-center">
                  <CreditCard className="mx-auto h-10 w-10 text-muted-foreground/30" strokeWidth={1} />
                  <p className="mt-3 font-medium">No payments found.</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">Click “Sync with Razorpay” to pull live payments.</p>
                </td></tr>
              ) : payments.map((payment) => (
                <tr key={payment.id} className="transition-colors hover:bg-surface-muted/60">
                  <td className="px-4 py-3 font-medium">{payment.order_number ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-[12px]">{payment.razorpay_payment_id}</td>
                  <td className="px-4 py-3">{payment.customer_name ?? payment.email ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(payment.amount)}</td>
                  <td className="px-4 py-3 capitalize">{payment.method ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge value={payment.status} /></td>
                  <td className="px-4 py-3">{payment.captured ? <span className="text-success">Yes</span> : <span className="text-muted-foreground">No</span>}</td>
                  <td className="px-4 py-3"><StatusBadge value={payment.refund_status ?? "none"} muted /></td>
                  <td className="px-4 py-3 text-muted-foreground">{payment.created_at_rzp ? new Date(payment.created_at_rzp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/payments/${payment.razorpay_payment_id}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-[12px] font-medium transition-colors hover:border-border-strong hover:bg-accent">
                      <Eye className="h-3.5 w-3.5" /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[12px] text-muted-foreground">
          <span>{total} payments · Page {page} of {pageCount}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage((v) => Math.max(1, v - 1))} disabled={page === 1} className="h-8 rounded-lg border border-border px-3 font-medium disabled:opacity-50">Previous</button>
            <button type="button" onClick={() => setPage((v) => Math.min(pageCount, v + 1))} disabled={page >= pageCount} className="h-8 rounded-lg border border-border px-3 font-medium disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {/* Analytics */}
      {analytics ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Chart title="Revenue Trend (30d)" rows={analytics.revenueTrend} money />
          <Chart title="Payment Method Distribution" rows={analytics.methodDistribution} />
          <Chart title="Success vs Failed" rows={analytics.successVsFailed} />
          <Chart title="Refund Trend (30d)" rows={analytics.refundTrend} money />
          <Chart title="Settlement Trend (90d)" rows={analytics.settlementTrend} money />
        </div>
      ) : null}

      {/* Settlements */}
      <Panel title="Settlements">
        <div className="mb-3 flex items-center gap-2">
          <Select value={settlementFilter} onChange={setSettlementFilter} label="Settlement" options={["all", "settled", "unsettled"]} />
        </div>
        {filteredSettlements.length === 0 ? <p className="text-muted-foreground">No settlements yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[12.5px]">
              <thead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                <tr><th className="py-2 pr-3">Settlement ID</th><th className="py-2 pr-3">Amount</th><th className="py-2 pr-3">Fees</th><th className="py-2 pr-3">Tax</th><th className="py-2 pr-3">Net</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">UTR</th><th className="py-2">Date</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSettlements.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2 pr-3 font-mono text-[11.5px]">{s.razorpay_settlement_id}</td>
                    <td className="py-2 pr-3">{formatCurrency(s.amount)}</td>
                    <td className="py-2 pr-3">{formatCurrency(s.fees)}</td>
                    <td className="py-2 pr-3">{formatCurrency(s.tax)}</td>
                    <td className="py-2 pr-3 font-medium">{formatCurrency(s.net)}</td>
                    <td className="py-2 pr-3"><StatusBadge value={s.settled ? "settled" : s.status} muted={!s.settled} /></td>
                    <td className="py-2 pr-3">{s.utr ?? "—"}</td>
                    <td className="py-2 text-muted-foreground">{s.created_at_rzp ? new Date(s.created_at_rzp).toLocaleDateString("en-IN") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Webhook logs */}
      <Panel title="Webhook Logs">
        {webhooks.length === 0 ? <p className="text-muted-foreground">No webhook events recorded yet.</p> : (
          <div className="space-y-2">
            {webhooks.slice(0, 30).map((log) => (
              <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted px-3 py-2 text-[12.5px]">
                <div className="flex items-center gap-2">
                  <span className={cn("rounded px-1.5 py-0.5 text-[10.5px] font-semibold", log.status === "processed" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>{log.status}</span>
                  <span className="font-medium">{log.event}</span>
                  {!log.signature_valid ? <span className="text-destructive">· invalid signature</span> : null}
                  {log.retry_count > 0 ? <span className="text-muted-foreground">· retries {log.retry_count}</span> : null}
                  {log.error ? <span className="text-destructive">· {log.error}</span> : null}
                </div>
                <span className="text-muted-foreground">{new Date(log.created_at).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <ToastStack toasts={toasts} />
    </section>
  )
}

function buildWarnings(cards: Cards | null, webhooks: WebhookLog[]): string[] {
  const list: string[] = []
  if (!cards) return list
  if (cards.failedPayments > 0) list.push(`${cards.failedPayments} failed payment(s) need attention.`)
  if (cards.pendingPayments > 0) list.push(`${cards.pendingPayments} payment(s) pending capture.`)
  if (cards.refundPending > 0) list.push(`${cards.refundPending} refund(s) still pending.`)
  if (cards.unsettledAmount > 0) list.push(`${formatCurrency(cards.unsettledAmount)} not yet settled to your bank.`)
  const failedHooks = webhooks.filter((w) => w.status === "failed").length
  if (failedHooks > 0) list.push(`${failedHooks} webhook event(s) failed to process.`)
  return list
}

function ExportMenu({ onExport }: { onExport: (format: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:border-border-strong hover:bg-accent">
        <Download className="h-3.5 w-3.5" /> Export
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-32 rounded-lg border border-border bg-surface p-1 shadow-lg" onMouseLeave={() => setOpen(false)}>
          {["csv", "xlsx", "pdf"].map((format) => (
            <button key={format} type="button" onClick={() => { onExport(format); setOpen(false) }} className="block w-full rounded px-2.5 py-1.5 text-left text-[12.5px] hover:bg-accent">
              {format === "xlsx" ? "Excel (.xlsx)" : format.toUpperCase()}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Select({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: string[] }) {
  const formattedOptions = options.map((option) => ({
    label: option === "all" ? `All ${label.toLowerCase()}` : option.charAt(0).toUpperCase() + option.slice(1),
    value: option,
  }))
  return <OryCMSSelect value={value} onChange={onChange} options={formattedOptions} ariaLabel={label} className="w-auto" />
}

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-[var(--orycms-color-primary)]" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}

function Panel({ children, title }: { children: React.ReactNode; title?: string }) {
  return <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">{title ? <h2 className="mb-4 text-[14px] font-semibold">{title}</h2> : null}<div className="text-[13px]">{children}</div></div>
}

function Chart({ title, rows, money }: { title: string; rows: Series[]; money?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <Panel title={title}>
      {rows.length === 0 ? <p className="text-muted-foreground">No data yet.</p> : (
        <div className="space-y-2">
          {rows.slice(-14).map((row) => (
            <div key={row.label} className="grid grid-cols-[110px_1fr_90px] items-center gap-3">
              <span className="truncate text-[12px] text-muted-foreground">{row.label}</span>
              <div className="h-2 rounded-full bg-surface-muted"><div className="h-full rounded-full bg-[var(--orycms-color-primary)]" style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }} /></div>
              <span className="text-right text-[12px] font-medium">{money ? formatCurrency(row.value) : row.value}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

function StatusBadge({ value, muted }: { value: string; muted?: boolean }) {
  const tone = /captur|settl|process|success|paid/i.test(value)
    ? "bg-success/10 text-success"
    : /fail|error/i.test(value)
      ? "bg-destructive/10 text-destructive"
      : muted
        ? "bg-muted text-muted-foreground"
        : "bg-[#e9c46a]/15 text-[#8a6d1f]"
  return <span className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-medium capitalize", tone)}>{value.replace(/_/g, " ")}</span>
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2">
      {toasts.map((toast) => (
        <div key={toast.id} className={cn("flex items-center gap-2 rounded-xl border bg-surface px-4 py-3 text-[13px] shadow-lg", toast.tone === "success" ? "border-success/30 text-success" : "border-destructive/30 text-destructive")}>
          {toast.tone === "success" ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {toast.message}
        </div>
      ))}
    </div>
  )
}
