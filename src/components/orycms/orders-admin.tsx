"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Eye, Package, Search } from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { cn, formatCurrency } from "@/lib/utils"

const ORDER_PAGE_SIZE = 10

type OrderItem = { image?: string; img?: string; name?: string; price?: number; quantity?: number; qty?: number; size?: string }
type Order = {
  cancelled_at?: string | null
  contact?: Record<string, unknown> | null
  created_at: string
  customerEmail: string
  customerName: string
  delivery_method?: string | null
  discount_total: number
  id: string
  invoice_number?: string | null
  items: OrderItem[]
  number: string
  payment_method: string
  payment_status: string
  payment_timeline?: { at?: string; event?: string; status?: string }[]
  razorpay_order_id?: string | null
  razorpay_payment_id?: string | null
  refund_status?: string
  shipping_address?: Record<string, unknown> | null
  shipping_total: number
  status: string
  subtotal: number
  total: number
  totalItems: number
}

type SortBy = "created-desc" | "created-asc" | "total-desc" | "total-asc" | "number-asc"

export function OryCMSOrdersList() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [page, setPage] = useState(1)
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>("created-desc")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    void loadOrders(true)
    const interval = window.setInterval(() => void loadOrders(false), 15000)
    return () => window.clearInterval(interval)
  }, [])

  async function loadOrders(showLoader: boolean) {
    if (showLoader) setLoading(true)
    setError("")
    try {
      const json = await fetch("/api/orycms/orders", { cache: "no-store" }).then((response) => response.json())
      if (!json.success) throw new Error(json.error?.message ?? "Failed to load orders.")
      setOrders(Array.isArray(json.data) ? json.data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.")
    } finally {
      if (showLoader) setLoading(false)
    }
  }

  const statuses = useMemo(() => Array.from(new Set(orders.map((order) => order.status).filter(Boolean))).sort(), [orders])
  const paymentStatuses = useMemo(() => Array.from(new Set(orders.map((order) => order.payment_status).filter(Boolean))).sort(), [orders])
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    return orders
      .filter((order) => {
        const matchesSearch = !search || [order.number, order.customerName, order.customerEmail].join(" ").toLowerCase().includes(search)
        const matchesStatus = statusFilter === "all" || order.status === statusFilter
        const matchesPayment = paymentFilter === "all" || order.payment_status === paymentFilter
        return matchesSearch && matchesStatus && matchesPayment
      })
      .sort((a, b) => {
        if (sortBy === "created-asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        if (sortBy === "total-desc") return Number(b.total) - Number(a.total)
        if (sortBy === "total-asc") return Number(a.total) - Number(b.total)
        if (sortBy === "number-asc") return a.number.localeCompare(b.number)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [orders, paymentFilter, query, sortBy, statusFilter])
  const pageCount = Math.max(1, Math.ceil(filtered.length / ORDER_PAGE_SIZE))
  const paged = filtered.slice((page - 1) * ORDER_PAGE_SIZE, page * ORDER_PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [paymentFilter, query, sortBy, statusFilter])

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-6 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/orders", label: "Orders" }]} />
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">Orders</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
            View real storefront orders, payments, shipment status, and customer details.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface px-3 py-2 text-[12.5px] text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span> of {orders.length} orders
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-xs">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-muted px-4 py-3">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by order number, customer, or email…"
              className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-[13px] outline-none focus:border-border-strong"
            />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none">
            <option value="all">All order status</option>
            {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
          </select>
          <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="h-9 rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none">
            <option value="all">All payment status</option>
            {paymentStatuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
          </select>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)} className="h-9 rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none">
            <option value="created-desc">Newest first</option>
            <option value="created-asc">Oldest first</option>
            <option value="total-desc">Total high</option>
            <option value="total-asc">Total low</option>
            <option value="number-asc">Order number A–Z</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-[13px]">
            <thead className="border-b border-border bg-surface-muted text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Order Number</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Total Amount</th>
                <th className="px-4 py-3 font-medium">Payment Method</th>
                <th className="px-4 py-3 font-medium">Payment Status</th>
                <th className="px-4 py-3 font-medium">Order Status</th>
                <th className="px-4 py-3 font-medium">Total Items</th>
                <th className="px-4 py-3 font-medium">Order Date</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">Loading orders…</td></tr>
              ) : error ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-destructive">{error}</td></tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-14 text-center">
                    <Package className="mx-auto h-10 w-10 text-muted-foreground/30" strokeWidth={1} />
                    <p className="mt-3 font-medium">No orders found.</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">New frontend orders will appear here automatically.</p>
                  </td>
                </tr>
              ) : paged.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-surface-muted/60">
                  <td className="px-4 py-3 font-medium">{order.number}</td>
                  <td className="px-4 py-3">{order.customerName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{order.customerEmail || "—"}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(Number(order.total))}</td>
                  <td className="px-4 py-3">{paymentMethod(order.payment_method)}</td>
                  <td className="px-4 py-3"><StatusBadge value={order.payment_status} /></td>
                  <td className="px-4 py-3"><StatusBadge value={order.status} muted /></td>
                  <td className="px-4 py-3">{order.totalItems}</td>
                  <td className="px-4 py-3 text-muted-foreground">{dateTime(order.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/orders/${order.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-[12px] font-medium transition-colors hover:border-border-strong hover:bg-accent">
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[12px] text-muted-foreground">
          <span>Page {page} of {pageCount}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="h-8 rounded-lg border border-border px-3 font-medium disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
            <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={page === pageCount} className="h-8 rounded-lg border border-border px-3 font-medium disabled:cursor-not-allowed disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </section>
  )
}

export function OryCMSOrderDetails({ id }: { id: string }) {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/orycms/orders/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (response) => {
        const json = await response.json()
        if (!response.ok || !json.success) throw new Error(json.error?.message ?? "Order not found.")
        setOrder(json.data)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Order not found."))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-6 py-6 lg:px-8">
      <div>
        <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/orders", label: "Orders" }, { href: `/admin/orders/${id}`, label: order?.number ?? id }]} />
        <Link href="/admin/orders" className="mt-4 inline-flex items-center gap-2 text-[12.5px] font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to orders
        </Link>
      </div>

      {loading ? (
        <Panel>Loading order details…</Panel>
      ) : error || !order ? (
        <Panel><span className="text-destructive">{error || "Order not found."}</span></Panel>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-surface p-5 shadow-xs">
            <div>
              <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Order Details</p>
              <h1 className="mt-1 text-[26px] font-semibold tracking-tight">{order.number}</h1>
              <p className="mt-1 text-[13px] text-muted-foreground">Placed {dateTime(order.created_at)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge value={order.status} muted />
              <StatusBadge value={order.payment_status} />
              <span className="rounded-full border border-border px-2.5 py-1 text-[12px]">{paymentMethod(order.payment_method)}</span>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <Panel title="Products">
                <div className="divide-y divide-border">
                  {order.items.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="flex items-center gap-4 py-4">
                      <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-surface-muted">
                        {item.image || item.img ? <img src={item.image ?? item.img} alt="" className="h-full w-full object-contain" /> : <Package className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{item.name ?? "Product"}</p>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">{item.size ? `${item.size} · ` : ""}Qty {item.quantity ?? item.qty ?? 1}</p>
                      </div>
                      <div className="text-right font-semibold">{formatCurrency(Number(item.price ?? 0) * Number(item.quantity ?? item.qty ?? 1))}</div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Payment timeline">
                {Array.isArray(order.payment_timeline) && order.payment_timeline.length > 0 ? (
                  <div className="space-y-3">
                    {order.payment_timeline.map((event, index) => (
                      <div key={index} className="flex gap-3 text-[13px]">
                        <span className="mt-1 h-2 w-2 rounded-full bg-foreground" />
                        <div>
                          <p className="font-medium">{label(event.event ?? "Event")}</p>
                          <p className="text-[12px] text-muted-foreground">{event.at ? dateTime(event.at) : "—"} · {label(event.status ?? "")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground">No timeline recorded.</p>}
              </Panel>
            </div>

            <div className="space-y-5">
              <Panel title="Customer">
                <Info label="Name" value={order.customerName} />
                <Info label="Email" value={order.customerEmail || "—"} />
                <Info label="Phone" value={text(order.contact?.phone) || "—"} />
              </Panel>
              <Panel title="Shipping address">
                <p className="text-[13px] leading-6 text-muted-foreground">{formatAddress(order.shipping_address)}</p>
                <Info label="Delivery" value={label(order.delivery_method ?? "standard")} />
              </Panel>
              <Panel title="Pricing">
                <Info label="Subtotal" value={formatCurrency(order.subtotal)} />
                <Info label="Shipping" value={formatCurrency(order.shipping_total)} />
                <Info label="Discount" value={formatCurrency(order.discount_total)} />
                <div className="mt-3 border-t border-border pt-3">
                  <Info label="Total" value={formatCurrency(order.total)} strong />
                </div>
              </Panel>
              <Panel title="Payment">
                <Info label="Method" value={paymentMethod(order.payment_method)} />
                <Info label="Status" value={label(order.payment_status)} />
                <Info label="Razorpay Order ID" value={order.razorpay_order_id ?? "—"} />
                <Info label="Payment ID" value={order.razorpay_payment_id ?? "—"} />
                <Info label="Invoice" value={order.invoice_number ?? "—"} />
                <Info label="Refund" value={label(order.refund_status ?? "none")} />
              </Panel>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

function StatusBadge({ muted, value }: { muted?: boolean; value: string }) {
  return <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-medium", muted ? "bg-muted text-muted-foreground" : "bg-success/10 text-success")}>{label(value)}</span>
}

function Panel({ children, title }: { children: React.ReactNode; title?: string }) {
  return <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">{title ? <h2 className="mb-4 text-[14px] font-semibold">{title}</h2> : null}<div className="text-[13px]">{children}</div></div>
}

function Info({ label: key, strong, value }: { label: string; strong?: boolean; value: string }) {
  return <div className="flex items-start justify-between gap-4 py-1.5 text-[13px]"><span className="text-muted-foreground">{key}</span><span className={cn("text-right", strong && "font-semibold text-foreground")}>{value}</span></div>
}

function paymentMethod(method: string) {
  return method === "razorpay" ? "Razorpay Online" : "Cash on Delivery"
}

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function dateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function formatAddress(address?: Record<string, unknown> | null) {
  if (!address) return "—"
  return [address.address1, address.address2, address.city, address.state, address.pincode].map(text).filter(Boolean).join(", ") || "—"
}
