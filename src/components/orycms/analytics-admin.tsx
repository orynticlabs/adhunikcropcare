"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, BarChart3, Brain, CalendarDays, Package, RefreshCw, ShoppingBag, TrendingUp, Users } from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { OryCMSSelect } from "@/components/orycms/custom-select"
import { cn, formatCurrency } from "@/lib/utils"

type RangeKey = "today" | "7d" | "30d" | "90d" | "month" | "year" | "custom"
type Row = Record<string, string | number | null | undefined>
type Analytics = {
  cards: Record<string, number | null>
  charts: Record<string, Row[]>
  generatedAt: string
  insights: Record<string, unknown>
  meta: { note: string; range: { from: string; key: RangeKey; label: string; to: string }; revenueChangePercent: number | null }
  recommendations: { action: string; detail: string; priority: "High" | "Medium" | "Low"; title: string }[]
}

const ranges: { label: string; value: RangeKey }[] = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 90 Days", value: "90d" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
  { label: "Custom", value: "custom" },
]

export function OryCMSAnalyticsDashboard() {
  const [data, setData] = useState<Analytics | null>(null)
  const [error, setError] = useState("")
  const [from, setFrom] = useState("")
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<RangeKey>("30d")
  const [refreshing, setRefreshing] = useState(false)
  const [to, setTo] = useState("")

  useEffect(() => {
    void load(true)
    const interval = window.setInterval(() => void load(false), 15000)
    return () => window.clearInterval(interval)
  }, [range, from, to])

  async function load(showLoader: boolean) {
    if (showLoader) setLoading(true)
    setRefreshing(true)
    setError("")
    try {
      const params = new URLSearchParams({ range })
      if (range === "custom") {
        if (from) params.set("from", from)
        if (to) params.set("to", to)
      }
      const json = await fetch(`/api/orycms/analytics/insights?${params}`, { cache: "no-store" }).then((response) => response.json())
      if (!json.success) throw new Error(json.error?.message ?? "Failed to load insights.")
      setData(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load insights.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const maxRevenue = useMemo(() => Math.max(1, ...((data?.charts.revenueTrend ?? []) as Row[]).map((row) => Number(row.total ?? 0))), [data])

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-6 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/analytics", label: "Analytics" }]} />
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">AI Business Insights</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
            Real-time sales, inventory, customer, payment, and product recommendations from live database data.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OryCMSSelect
            value={range}
            onChange={(val) => setRange(val as RangeKey)}
            options={ranges.map((r) => ({ label: r.label, value: r.value }))}
            className="w-auto"
          />
          {range === "custom" ? (
            <>
              <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-9 rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none" />
              <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-9 rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none" />
            </>
          ) : null}
          <button type="button" onClick={() => void load(false)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:bg-accent">
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">{error}</div> : null}
      {loading ? <Panel>Loading live business insights…</Panel> : null}
      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={TrendingUp} label="Total Revenue" value={money(data.cards.totalRevenue)} change={data.meta.revenueChangePercent} />
            <Metric icon={CalendarDays} label="Today's Sales" value={money(data.cards.todaysSales)} />
            <Metric icon={ShoppingBag} label="Orders Today" value={num(data.cards.ordersToday)} />
            <Metric icon={BarChart3} label="Average Order Value" value={money(data.cards.averageOrderValue)} />
            <Metric icon={Brain} label="Conversion Rate" value={data.cards.conversionRate === null ? "N/A" : `${data.cards.conversionRate.toFixed(1)}%`} />
            <Metric icon={Users} label="Returning Customers" value={num(data.cards.returningCustomers)} />
            <Metric icon={Users} label="New Customers" value={num(data.cards.newCustomers)} />
            <Metric icon={Package} label="Products Sold" value={num(data.cards.productsSold)} />
          </div>

          <Panel title="Business Health Summary">
            <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
              <div className="rounded-xl border border-border bg-surface-muted p-4">
                <div className="flex items-start gap-3">
                  <Brain className="mt-1 h-5 w-5 text-[var(--orycms-color-primary)]" />
                  <div>
                    <p className="font-semibold">{healthTitle(data)}</p>
                    <p className="mt-1 text-[13px] leading-6 text-muted-foreground">{data.meta.note}</p>
                    <p className="mt-2 text-[12px] text-muted-foreground">Generated {dateTime(data.generatedAt)} · {data.meta.range.label}</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3">
                {data.recommendations.slice(0, 4).map((rec) => (
                  <div key={`${rec.title}-${rec.detail}`} className="rounded-xl border border-border bg-surface p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold">{rec.title}</p>
                        <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{rec.detail}</p>
                      </div>
                      <span className={cn("rounded-full px-2 py-1 text-[11px] font-medium", rec.priority === "High" ? "bg-destructive/10 text-destructive" : rec.priority === "Medium" ? "bg-warning/10 text-warning" : "bg-success/10 text-success")}>{rec.priority}</span>
                    </div>
                    <p className="mt-2 text-[12px] font-medium text-foreground">{rec.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <div className="grid gap-5 xl:grid-cols-2">
            <Chart title="Sales Trend" rows={data.charts.salesTrend ?? []} max={maxRevenue} format={money} />
            <Chart title="Revenue Trend" rows={data.charts.revenueTrend ?? []} max={maxRevenue} format={money} />
            <Chart title="Orders Trend" rows={data.charts.ordersTrend ?? []} max={Math.max(1, ...(data.charts.ordersTrend ?? []).map((row) => Number(row.total ?? 0)))} />
            <Chart title="Customer Growth" rows={data.charts.customerGrowth ?? []} max={Math.max(1, ...(data.charts.customerGrowth ?? []).map((row) => Number(row.total ?? 0)))} />
            <List title="Category-wise Sales" rows={data.charts.categorySales ?? []} valueKey="revenue" />
            <List title="Top Products" rows={data.charts.topProducts ?? []} valueKey="revenue" />
            <List title="Payment Method Breakdown" rows={data.charts.paymentBreakdown ?? []} valueKey="count" />
            <List title="Geographic Sales Distribution" rows={data.charts.geographicSales ?? []} valueKey="revenue" />
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <InsightList title="Best Selling Products" rows={arr(data.insights.bestSellingProducts)} valueKey="quantity" />
            <InsightList title="Low Stock Products" rows={arr(data.insights.lowStockProducts)} valueKey="stock_quantity" />
            <InsightList title="Out of Stock Products" rows={arr(data.insights.outOfStockProducts)} valueKey="stock_quantity" />
            <InsightList title="Fast Moving Products" rows={arr(data.insights.fastMovingProducts)} valueKey="quantity" />
            <InsightList title="Slow Moving / Dead Stock" rows={arr(data.insights.slowMovingDeadStock)} valueKey="stock" />
            <InsightList title="Highest Revenue Categories" rows={arr(data.insights.highestRevenueCategories)} valueKey="revenue" moneyValue />
            <InsightList title="Highest Revenue Products" rows={arr(data.insights.highestRevenueProducts)} valueKey="revenue" moneyValue />
            <InsightList title="Top Customers" rows={arr(data.insights.topCustomers)} valueKey="revenue" moneyValue />
            <InsightList title="Peak Sales Hours" rows={arr(data.insights.peakSalesHours)} valueKey="revenue" moneyValue />
            <InsightList title="Peak Sales Days" rows={arr(data.insights.peakSalesDays)} valueKey="revenue" moneyValue />
            <InsightList title="Payment Method Distribution" rows={arr(data.insights.paymentMethodDistribution)} valueKey="count" />
            <RefundCard data={data.insights.refundCancellation as Row} />
          </div>

          <Panel title="Event Tracking Gaps">
            <div className="grid gap-3 md:grid-cols-4">
              <Unavailable title="Most Added-to-Cart Products" />
              <Unavailable title="Most Viewed Products" />
              <Unavailable title="Low Conversion Products" />
              <Unavailable title="Cart Abandonment Rate" />
            </div>
          </Panel>
        </>
      ) : null}
    </section>
  )
}

function Metric({ change, icon: Icon, label, value }: { change?: number | null; icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-[var(--orycms-color-primary)]" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      {change !== undefined ? <p className={cn("mt-1 text-[12px]", change === null ? "text-muted-foreground" : change >= 0 ? "text-success" : "text-destructive")}>{change === null ? "No previous period" : `${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs previous`}</p> : null}
    </div>
  )
}

function Panel({ children, title }: { children: React.ReactNode; title?: string }) {
  return <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">{title ? <h2 className="mb-4 text-[14px] font-semibold">{title}</h2> : null}<div className="text-[13px]">{children}</div></div>
}

function Chart({ format = num, max, rows, title }: { format?: (value: number | null | undefined) => string; max: number; rows: Row[]; title: string }) {
  return (
    <Panel title={title}>
      {rows.length === 0 ? <Empty /> : <div className="space-y-2">{rows.slice(-14).map((row) => {
        const total = Number(row.total ?? 0)
        return (
          <div key={String(row.label)} className="grid grid-cols-[90px_1fr_90px] items-center gap-3">
            <span className="truncate text-[12px] text-muted-foreground">{row.label}</span>
            <div className="h-2 rounded-full bg-surface-muted"><div className="h-full rounded-full bg-[var(--orycms-color-primary)]" style={{ width: `${Math.max(2, (total / max) * 100)}%` }} /></div>
            <span className="text-right text-[12px] font-medium">{format(total)}</span>
          </div>
        )
      })}</div>}
    </Panel>
  )
}

function List({ rows, title, valueKey }: { rows: Row[]; title: string; valueKey: string }) {
  return <Panel title={title}><InsightRows rows={rows} valueKey={valueKey} moneyValue={valueKey === "revenue"} /></Panel>
}

function InsightList({ moneyValue, rows, title, valueKey }: { moneyValue?: boolean; rows: Row[]; title: string; valueKey: string }) {
  return <Panel title={title}><InsightRows moneyValue={moneyValue} rows={rows} valueKey={valueKey} /></Panel>
}

function InsightRows({ moneyValue, rows, valueKey }: { moneyValue?: boolean; rows: Row[]; valueKey: string }) {
  if (rows.length === 0) return <Empty />
  return <div className="space-y-2">{rows.slice(0, 8).map((row, index) => {
    const name = String(row.name ?? row.email ?? row.title ?? row.label ?? row.product ?? "Unknown")
    const value = Number(row[valueKey] ?? 0)
    return <div key={`${name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted px-3 py-2"><span className="truncate font-medium">{name}</span><span className="text-muted-foreground">{moneyValue ? money(value) : num(value)}</span></div>
  })}</div>
}

function RefundCard({ data }: { data: Row }) {
  return (
    <Panel title="Refund & Cancellation Analysis">
      <div className="space-y-2">
        <Info label="Cancelled Orders" value={num(Number(data.cancelled ?? 0))} />
        <Info label="Cancellation Rate" value={`${Number(data.cancellationRate ?? 0).toFixed(1)}%`} />
        <Info label="Refunded Orders" value={num(Number(data.refunded ?? 0))} />
        <Info label="Refund Rate" value={`${Number(data.refundRate ?? 0).toFixed(1)}%`} />
      </div>
    </Panel>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 rounded-lg border border-border bg-surface-muted px-3 py-2"><span>{label}</span><span className="font-medium">{value}</span></div>
}

function Unavailable({ title }: { title: string }) {
  return <div className="rounded-xl border border-border bg-surface-muted p-4"><AlertTriangle className="h-4 w-4 text-warning" /><p className="mt-2 font-medium">{title}</p><p className="mt-1 text-[12px] text-muted-foreground">Needs storefront event tracking. No mock data shown.</p></div>
}

function Empty() {
  return <p className="py-4 text-center text-[12px] text-muted-foreground">No live data for this range.</p>
}

function healthTitle(data: Analytics) {
  const out = arr(data.insights.outOfStockProducts).length
  const low = arr(data.insights.lowStockProducts).length
  if (out) return `${out} product${out > 1 ? "s" : ""} out of stock`
  if (low) return `${low} low-stock product${low > 1 ? "s" : ""} need attention`
  return "Business health is stable"
}

function arr(value: unknown): Row[] {
  return Array.isArray(value) ? value as Row[] : []
}

function money(value: number | null | undefined) {
  return formatCurrency(Number(value ?? 0))
}

function num(value: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", { notation: Number(value ?? 0) > 9999 ? "compact" : "standard" }).format(Number(value ?? 0))
}

function dateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}
