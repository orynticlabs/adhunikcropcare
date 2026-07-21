"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Loader2, RefreshCw, X } from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { playOryCMSToastSound } from "@/lib/orycms/toast-sound"
import { cn, formatCurrency } from "@/lib/utils"

type Toast = { id: number; message: string; tone: "success" | "error" }

type Detail = {
  payment: {
    razorpay_payment_id: string
    razorpay_order_id: string | null
    order_number: string | null
    customer_name: string | null
    email: string | null
    contact: string | null
    amount: number
    amount_refunded: number
    currency: string
    status: string
    method: string | null
    captured: boolean
    fee: number | null
    tax: number | null
    refund_status: string | null
    international: boolean
    notes: unknown
    raw: unknown
    created_at_rzp: string | null
  }
  refunds: { id: string; razorpay_refund_id: string; amount: number; status: string; speed_processed: string | null; reason: string | null; created_at: string | null }[]
  audit: { id: string; admin_email: string | null; action: string; detail: unknown; created_at: string | null }[]
  order: Record<string, unknown> | null
  canRefund: boolean
}

export function OryCMSPaymentDetail({ id }: { id: string }) {
  const [detail, setDetail] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [toasts, setToasts] = useState<Toast[]>([])
  const [refundOpen, setRefundOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  function toast(message: string, tone: Toast["tone"]) {
    const tid = Date.now() + Math.random()
    playOryCMSToastSound()
    setToasts((items) => [...items, { id: tid, message, tone }])
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== tid)), 3500)
  }

  const load = useCallback(async () => {
    const json = await fetch(`/api/orycms/payments/${encodeURIComponent(id)}`, { cache: "no-store" }).then((r) => r.json())
    if (!json.success) throw new Error(json.error?.message ?? "Payment not found.")
    setDetail(json.data)
  }, [id])

  useEffect(() => {
    let active = true
    load()
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Payment not found.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [load])

  async function submitRefund(amount: number | undefined, reason: string) {
    setBusy("refund")
    try {
      const json = await fetch(`/api/orycms/payments/${encodeURIComponent(id)}/refund`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount, reason }),
      }).then((r) => r.json())
      if (!json.success) throw new Error(json.error?.message ?? "Refund failed.")
      toast(`Refund ${json.data.status} (₹${json.data.amount}).`, "success")
      setRefundOpen(false)
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : "Refund failed.", "error")
    } finally {
      setBusy(null)
    }
  }

  async function retryRefund(refundId: string) {
    setBusy(refundId)
    try {
      const json = await fetch(`/api/orycms/payments/refunds/${encodeURIComponent(refundId)}/retry`, { method: "POST" }).then((r) => r.json())
      if (!json.success) throw new Error(json.error?.message ?? "Retry failed.")
      toast(json.data.retried ? `Retried — new refund ${json.data.status}.` : `Refund status: ${json.data.status}.`, "success")
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : "Retry failed.", "error")
    } finally {
      setBusy(null)
    }
  }

  async function syncRefund(refundId: string) {
    setBusy(refundId)
    try {
      const json = await fetch(`/api/orycms/payments/refunds/${encodeURIComponent(refundId)}/sync`, { method: "POST" }).then((r) => r.json())
      if (!json.success) throw new Error(json.error?.message ?? "Sync failed.")
      toast(`Refund status: ${json.data.status}.`, "success")
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : "Sync failed.", "error")
    } finally {
      setBusy(null)
    }
  }

  if (loading) return <div className="mx-auto max-w-[1200px] px-6 py-6"><Panel>Loading payment…</Panel></div>
  if (error || !detail) return <div className="mx-auto max-w-[1200px] px-6 py-6"><Panel><span className="text-destructive">{error || "Payment not found."}</span></Panel></div>

  const p = detail.payment
  const refundable = Math.max(0, p.amount - p.amount_refunded)
  const canRefund = detail.canRefund && p.captured && p.status === "captured" && refundable > 0
  const timeline = extractTimeline(detail.order)

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-6 py-6 lg:px-8">
      <div>
        <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/payments", label: "Payments" }, { href: `/admin/payments/${id}`, label: p.razorpay_payment_id }]} />
        <Link href="/admin/payments" className="mt-4 inline-flex items-center gap-2 text-[12.5px] font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to payments
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-surface p-5 shadow-xs">
        <div>
          <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Payment</p>
          <h1 className="mt-1 font-mono text-[22px] font-semibold tracking-tight">{p.razorpay_payment_id}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{p.created_at_rzp ? new Date(p.created_at_rzp).toLocaleString("en-IN") : "—"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge value={p.status} />
          {p.captured ? <Badge value="captured" /> : null}
          {canRefund ? (
            <button type="button" onClick={() => setRefundOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-[12.5px] font-medium text-background hover:opacity-90">
              <RefreshCw className="h-3.5 w-3.5" /> Refund
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Panel title="Transaction">
            <Info label="Amount" value={formatCurrency(p.amount)} strong />
            <Info label="Refunded" value={formatCurrency(p.amount_refunded)} />
            <Info label="Refundable" value={formatCurrency(refundable)} />
            <Info label="Currency" value={p.currency} />
            <Info label="Method" value={p.method ?? "—"} />
            <Info label="Captured" value={p.captured ? "Yes" : "No"} />
            <Info label="International" value={p.international ? "Yes" : "No"} />
            <Info label="Razorpay Order ID" value={p.razorpay_order_id ?? "—"} />
          </Panel>

          <Panel title="Fees & GST">
            <Info label="Razorpay Fee" value={p.fee != null ? formatCurrency(p.fee) : "—"} />
            <Info label="GST / Tax" value={p.tax != null ? formatCurrency(p.tax) : "—"} />
            <Info label="Net to settle" value={p.fee != null ? formatCurrency(p.amount - (p.fee ?? 0)) : "—"} />
          </Panel>

          <Panel title="Payment Timeline">
            {timeline.length === 0 ? <p className="text-muted-foreground">No timeline events.</p> : (
              <div className="space-y-3">
                {timeline.map((event, index) => (
                  <div key={index} className="flex gap-3 text-[13px]">
                    <span className="mt-1 h-2 w-2 rounded-full bg-foreground" />
                    <div>
                      <p className="font-medium capitalize">{String(event.event).replace(/[._]/g, " ")}</p>
                      <p className="text-[12px] text-muted-foreground">{event.at ? new Date(event.at).toLocaleString("en-IN") : "—"} · {event.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Refunds">
            {detail.refunds.length === 0 ? <p className="text-muted-foreground">No refunds issued.</p> : (
              <div className="space-y-2">
                {detail.refunds.map((refund) => (
                  <div key={refund.id} className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-[12.5px]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[11.5px]">{refund.razorpay_refund_id}</span>
                      <Badge value={refund.status} muted={refund.status !== "processed"} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
                      <span>{formatCurrency(refund.amount)}{refund.reason ? ` · ${refund.reason}` : ""}</span>
                      <span className="flex gap-2">
                        <button type="button" onClick={() => void syncRefund(refund.razorpay_refund_id)} disabled={busy !== null} className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2 py-0.5 hover:bg-accent disabled:opacity-50">
                          {busy === refund.razorpay_refund_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Sync
                        </button>
                        {refund.status === "failed" && detail.canRefund ? (
                          <button type="button" onClick={() => void retryRefund(refund.razorpay_refund_id)} disabled={busy !== null} className="inline-flex items-center gap-1 rounded border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-destructive hover:bg-destructive/20 disabled:opacity-50">
                            Retry
                          </button>
                        ) : null}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Gateway Response (Razorpay)">
            <pre className="max-h-72 overflow-auto rounded-lg bg-surface-muted p-3 text-[11.5px] leading-relaxed">{JSON.stringify(p.raw, null, 2)}</pre>
          </Panel>

          <Panel title="Audit Log">
            {detail.audit.length === 0 ? <p className="text-muted-foreground">No admin actions recorded.</p> : (
              <div className="space-y-2">
                {detail.audit.map((entry) => (
                  <div key={entry.id} className="flex items-start justify-between gap-3 border-b border-border/60 py-2 text-[12.5px] last:border-0">
                    <div>
                      <p className="font-medium">{entry.action}</p>
                      <p className="text-[11.5px] text-muted-foreground">{entry.admin_email ?? "system"}</p>
                    </div>
                    <span className="text-[11.5px] text-muted-foreground">{entry.created_at ? new Date(entry.created_at).toLocaleString("en-IN") : "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Customer">
            <Info label="Name" value={p.customer_name ?? "—"} />
            <Info label="Email" value={p.email ?? "—"} />
            <Info label="Contact" value={p.contact ?? "—"} />
          </Panel>
          <Panel title="Order">
            <Info label="Order #" value={p.order_number ?? "—"} />
            {p.order_number && detail.order ? (
              <Link href={`/admin/orders/${String(detail.order.id)}`} className="mt-2 inline-block text-[12.5px] font-medium text-success hover:underline">View order →</Link>
            ) : null}
          </Panel>
          <Panel title="Notes">
            {p.notes && Object.keys(p.notes as object).length > 0 ? (
              <pre className="overflow-auto rounded-lg bg-surface-muted p-3 text-[11.5px]">{JSON.stringify(p.notes, null, 2)}</pre>
            ) : <p className="text-muted-foreground">No notes.</p>}
          </Panel>
        </div>
      </div>

      {refundOpen ? <RefundModal refundable={refundable} busy={busy === "refund"} onClose={() => setRefundOpen(false)} onSubmit={submitRefund} /> : null}
      <ToastStack toasts={toasts} />
    </section>
  )
}

function RefundModal({ refundable, busy, onClose, onSubmit }: { refundable: number; busy: boolean; onClose: () => void; onSubmit: (amount: number | undefined, reason: string) => void }) {
  const [mode, setMode] = useState<"full" | "partial">("full")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")

  function submit() {
    const value = mode === "partial" ? Number(amount) : undefined
    if (mode === "partial" && (!Number.isFinite(value) || (value ?? 0) <= 0)) return
    onSubmit(value, reason)
  }

  return (
    <div className="fixed inset-0 z-[110] grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold">Issue Refund</h3>
          <button type="button" onClick={onClose} className="grid h-7 w-7 place-items-center rounded hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-1 text-[12.5px] text-muted-foreground">Refundable balance: {formatCurrency(refundable)}</p>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setMode("full")} className={cn("h-9 flex-1 rounded-lg border text-[12.5px] font-medium", mode === "full" ? "border-foreground bg-foreground text-background" : "border-border")}>Full refund</button>
          <button type="button" onClick={() => setMode("partial")} className={cn("h-9 flex-1 rounded-lg border text-[12.5px] font-medium", mode === "partial" ? "border-foreground bg-foreground text-background" : "border-border")}>Partial</button>
        </div>

        {mode === "partial" ? (
          <label className="mt-3 block space-y-1">
            <span className="text-[12px] font-medium">Amount (₹)</span>
            <input type="number" value={amount} max={refundable} onChange={(e) => setAmount(e.target.value)} placeholder={String(refundable)} className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-border-strong" />
          </label>
        ) : null}

        <label className="mt-3 block space-y-1">
          <span className="text-[12px] font-medium">Reason</span>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Customer request, damaged item, etc." className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-border-strong" />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-border px-3 text-[12.5px] font-medium hover:bg-accent">Cancel</button>
          <button type="button" onClick={submit} disabled={busy} className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-[12.5px] font-medium text-background hover:opacity-90 disabled:opacity-60">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Confirm refund
          </button>
        </div>
      </div>
    </div>
  )
}

function extractTimeline(order: Record<string, unknown> | null): { at?: string; event: string; status: string }[] {
  if (!order) return []
  const raw = order.payment_timeline
  if (!Array.isArray(raw)) return []
  return raw as { at?: string; event: string; status: string }[]
}

function Panel({ children, title }: { children: React.ReactNode; title?: string }) {
  return <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">{title ? <h2 className="mb-4 text-[14px] font-semibold">{title}</h2> : null}<div className="text-[13px]">{children}</div></div>
}

function Info({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex items-start justify-between gap-4 py-1.5 text-[13px]"><span className="text-muted-foreground">{label}</span><span className={cn("break-all text-right", strong && "font-semibold text-foreground")}>{value}</span></div>
}

function Badge({ value, muted }: { value: string; muted?: boolean }) {
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
    <div className="fixed bottom-4 right-4 z-[120] space-y-2">
      {toasts.map((toast) => (
        <div key={toast.id} className={cn("flex items-center gap-2 rounded-xl border bg-surface px-4 py-3 text-[13px] shadow-lg", toast.tone === "success" ? "border-success/30 text-success" : "border-destructive/30 text-destructive")}>
          {toast.tone === "success" ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {toast.message}
        </div>
      ))}
    </div>
  )
}
