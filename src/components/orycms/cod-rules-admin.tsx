"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, Save, ShieldAlert, ShoppingBag } from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"

export function OryCMSCodRulesAdmin() {
  const [minOrders, setMinOrders] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null)

  useEffect(() => {
    let active = true
    void fetch("/api/orycms/cod-rules")
      .then((res) => res.json())
      .then((json: { data?: { minOrdersRequired?: number }; error?: { message?: string }; success?: boolean }) => {
        if (!active) return
        if (json.success && json.data) {
          setMinOrders(Number(json.data.minOrdersRequired) || 0)
        } else {
          setMessage({ text: json.error?.message || "Failed to load COD settings.", type: "error" })
        }
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setMessage({ text: "Failed to load COD settings.", type: "error" })
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch("/api/orycms/cod-rules", {
        body: JSON.stringify({ minOrdersRequired: Math.max(0, Math.floor(Number(minOrders) || 0)) }),
        headers: { "content-type": "application/json" },
        method: "POST",
      })
      const json = (await response.json()) as { data?: { minOrdersRequired?: number }; error?: { message?: string }; success?: boolean }
      setSaving(false)

      if (json.success && json.data) {
        setMinOrders(Number(json.data.minOrdersRequired) || 0)
        setMessage({ text: "COD rules updated successfully.", type: "success" })
      } else {
        setMessage({ text: json.error?.message || "Failed to update COD rules.", type: "error" })
      }
    } catch {
      setSaving(false)
      setMessage({ text: "Failed to update COD rules.", type: "error" })
    }
  }

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <OryCMSBreadcrumbs
            items={[
              { href: "/admin", label: "Overview" },
              { href: "/admin/collections", label: "Collections" },
              { href: "/admin/collections/cod-rules", label: "COD Rules" },
            ]}
          />
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight">COD Requirements</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Configure the minimum number of completed orders required for customers to unlock Cash on Delivery.
          </p>
        </div>
      </div>

      {message ? (
        <div
          className={`rounded-lg border px-4 py-3 text-[13px] ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {loading ? (
        <div className="grid min-h-64 place-items-center rounded-xl border border-border bg-surface">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <form onSubmit={handleSave} className="space-y-5 rounded-xl border border-border bg-surface p-6 shadow-xs lg:col-span-2">
            <div>
              <h2 className="text-base font-semibold">Cash on Delivery Order Threshold</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Set a single numerical limit ($N$). Storefront users must complete at least $N$ orders before Cash on Delivery becomes available at checkout.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="minOrdersRequired" className="block text-[13px] font-medium text-foreground">
                Minimum Completed Orders Required ($N$)
              </label>
              <input
                id="minOrdersRequired"
                type="number"
                min="0"
                step="1"
                required
                value={minOrders}
                onChange={(e) => setMinOrders(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="h-10 w-full max-w-xs rounded-lg border border-border bg-surface px-3 text-[13.5px] outline-none focus:border-foreground"
                placeholder="0"
              />
              <p className="text-[11.5px] text-muted-foreground">
                By default, this is <strong>0</strong> (COD allowed for all buyers). If set to <strong>3</strong>, a user must have at least 3 completed orders before COD is unlocked.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-[12.5px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Rule
              </button>
            </div>
          </form>

          <div className="space-y-4 rounded-xl border border-border bg-surface-muted/50 p-6">
            <h3 className="text-sm font-semibold text-foreground">Active Configuration Summary</h3>
            {minOrders === 0 ? (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-[12.5px]">
                <div className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  COD Unrestricted ($N = 0$)
                </div>
                <p className="mt-1.5 leading-relaxed text-muted-foreground">
                  Cash on Delivery is available to all customers including first-time buyers.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-[12.5px]">
                <div className="flex items-center gap-2 font-medium text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  COD Threshold Enforced ($N = {minOrders}$)
                </div>
                <p className="mt-1.5 leading-relaxed text-muted-foreground">
                  Customers must have successfully completed at least <strong>{minOrders}</strong> order(s) to use Cash on Delivery. Otherwise, COD will be disabled at checkout.
                </p>
              </div>
            )}

            <div className="space-y-2 text-[12px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                <span>Backend API verification active</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Direct POST/API checkout calls bypassing the frontend will be validated against this rule on the server side.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
