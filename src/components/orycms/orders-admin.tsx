"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Copy, Download, ExternalLink, Eye, Loader2, Package, RefreshCw, Search, Truck } from "lucide-react"
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

type Shipment = {
  id: string
  order_id: string
  shiprocket_order_id: string | null
  shiprocket_shipment_id: string | null
  awb_code: string | null
  courier_name: string | null
  courier_id: string | null
  status: string
  status_code: string | null
  tracking_url: string | null
  estimated_delivery_date: string | null
  shipping_charge: number | null
  pickup_scheduled_date: string | null
  pickup_status: string | null
  pickup_token: string | null
  label_url: string | null
  manifest_url: string | null
  invoice_url: string | null
  retry_count: number
  last_error_code: string | null
  last_error_message: string | null
  last_retry_at: string | null
}

type ShipmentEvent = {
  id: string
  status: string
  status_code: string | null
  location: string | null
  activity: string | null
  occurred_at: string
}

type ActivityLog = {
  id: string
  direction: string
  endpoint: string
  method: string
  status_code: number | null
  ok: boolean
  error_code: string | null
  error_message: string | null
  created_at: string
}

type OrderDetail = Order & {
  shipment?: Shipment | null
  shipmentEvents?: ShipmentEvent[]
}

const PRE_DISPATCH_STATUSES = new Set(["Pending", "Confirmed", "Processing", "Packed", "created", "awb_assigned"])

export function OryCMSOrdersList() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [page, setPage] = useState(1)
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>("created-desc")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState<string | null>(null)
  const [bulkNote, setBulkNote] = useState("")

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

  function toggleSelect(id: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function runBulk(action: string) {
    if (selected.size === 0) return
    setBulkAction(action)
    setBulkNote("")
    try {
      const json = await fetch("/api/orycms/orders/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, orderIds: Array.from(selected) }),
      }).then((response) => response.json())
      if (!json.success) throw new Error(json.error?.message ?? "Bulk action failed.")
      if (json.data.url) {
        window.open(json.data.url, "_blank", "noreferrer")
        setBulkNote(`Document ready for ${json.data.count} order(s).${json.data.missing ? ` ${json.data.missing} skipped (no shipment).` : ""}`)
      } else {
        const ok = Array.isArray(json.data.results) ? json.data.results.filter((r: { ok: boolean }) => r.ok).length : selected.size
        setBulkNote(`Queued ${ok} of ${selected.size} order(s). Processing runs in the background.`)
      }
      setSelected(new Set())
      void loadOrders(false)
    } catch (err) {
      setBulkNote(err instanceof Error ? err.message : "Bulk action failed.")
    } finally {
      setBulkAction(null)
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

        {selected.size > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-accent/40 px-4 py-2.5">
            <span className="text-[12.5px] font-medium">{selected.size} selected</span>
            <span className="mx-1 h-5 w-px bg-border" />
            <BulkButton onClick={() => void runBulk("confirm")} busy={bulkAction === "confirm"} disabled={bulkAction !== null}>Confirm orders</BulkButton>
            <BulkButton onClick={() => void runBulk("create_shipment")} busy={bulkAction === "create_shipment"} disabled={bulkAction !== null}>Create shipments</BulkButton>
            <BulkButton onClick={() => void runBulk("schedule_pickup")} busy={bulkAction === "schedule_pickup"} disabled={bulkAction !== null}>Schedule pickup</BulkButton>
            <BulkButton onClick={() => void runBulk("print_labels")} busy={bulkAction === "print_labels"} disabled={bulkAction !== null}>Print labels</BulkButton>
            <BulkButton onClick={() => void runBulk("download_manifest")} busy={bulkAction === "download_manifest"} disabled={bulkAction !== null}>Download manifest</BulkButton>
            <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-[12px] font-medium text-muted-foreground hover:text-foreground">Clear</button>
          </div>
        ) : null}
        {bulkNote ? <div className="border-b border-border bg-surface-muted px-4 py-2 text-[12px] text-muted-foreground">{bulkNote}</div> : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-[13px]">
            <thead className="border-b border-border bg-surface-muted text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all on page"
                    checked={paged.length > 0 && paged.every((order) => selected.has(order.id))}
                    onChange={(event) => {
                      setSelected((current) => {
                        const next = new Set(current)
                        if (event.target.checked) paged.forEach((order) => next.add(order.id))
                        else paged.forEach((order) => next.delete(order.id))
                        return next
                      })
                    }}
                  />
                </th>
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
                <tr><td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">Loading orders…</td></tr>
              ) : error ? (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-destructive">{error}</td></tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-14 text-center">
                    <Package className="mx-auto h-10 w-10 text-muted-foreground/30" strokeWidth={1} />
                    <p className="mt-3 font-medium">No orders found.</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">New frontend orders will appear here automatically.</p>
                  </td>
                </tr>
              ) : paged.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-surface-muted/60">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select order ${order.number}`}
                      checked={selected.has(order.id)}
                      onChange={() => toggleSelect(order.id)}
                    />
                  </td>
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
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [action, setAction] = useState<string | null>(null)
  const [actionError, setActionError] = useState("")
  const [actionNote, setActionNote] = useState("")
  const [activity, setActivity] = useState<ActivityLog[]>([])

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
    loadActivity()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function loadActivity() {
    fetch(`/api/orycms/orders/${encodeURIComponent(id)}/activity`, { cache: "no-store" })
      .then((response) => response.json())
      .then((json) => { if (json.success) setActivity(json.data) })
      .catch(() => {})
  }

  function applyResult(data: { orderStatus?: string; shipment?: Shipment | null; events?: ShipmentEvent[] }) {
    setOrder((current) => current ? {
      ...current,
      status: data.orderStatus ?? current.status,
      shipment: data.shipment ?? current.shipment,
      shipmentEvents: data.events ?? current.shipmentEvents,
    } : current)
    loadActivity()
  }

  async function runAction(kind: "confirm" | "cancel" | "sync" | "pickup-schedule" | "pickup-cancel") {
    setAction(kind)
    setActionError("")
    setActionNote("")
    const urls: Record<string, { url: string; body?: unknown }> = {
      confirm: { url: `/api/orycms/orders/${encodeURIComponent(id)}/confirm` },
      cancel: { url: `/api/orycms/orders/${encodeURIComponent(id)}/shipment/cancel` },
      sync: { url: `/api/orycms/orders/${encodeURIComponent(id)}/sync` },
      "pickup-schedule": { url: `/api/orycms/orders/${encodeURIComponent(id)}/pickup`, body: { action: "schedule" } },
      "pickup-cancel": { url: `/api/orycms/orders/${encodeURIComponent(id)}/pickup`, body: { action: "cancel" } },
    }
    const target = urls[kind]
    try {
      const json = await fetch(target.url, {
        method: "POST",
        headers: target.body ? { "content-type": "application/json" } : undefined,
        body: target.body ? JSON.stringify(target.body) : undefined,
      }).then((response) => response.json())
      if (!json.success) throw new Error(json.error?.message ?? "Action failed.")
      applyResult(json.data)
      setActionNote(kind === "sync" ? "Tracking synced." : kind === "confirm" ? "Shipment updated." : "Done.")
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed.")
    } finally {
      setAction(null)
    }
  }

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

          <FulfillmentActionBar
            order={order}
            action={action}
            actionError={actionError}
            actionNote={actionNote}
            onConfirm={() => void runAction("confirm")}
            onCancel={() => void runAction("cancel")}
            onSync={() => void runAction("sync")}
            onSchedulePickup={() => void runAction("pickup-schedule")}
            onCancelPickup={() => void runAction("pickup-cancel")}
          />

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

              <ActivityPanel logs={activity} />
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

              <ShipmentPanel order={order} />
            </div>
          </div>
        </>
      )}
    </section>
  )
}

function FulfillmentActionBar({
  order,
  action,
  actionError,
  actionNote,
  onConfirm,
  onCancel,
  onSync,
  onSchedulePickup,
  onCancelPickup,
}: {
  order: OrderDetail
  action: string | null
  actionError: string
  actionNote: string
  onConfirm: () => void
  onCancel: () => void
  onSync: () => void
  onSchedulePickup: () => void
  onCancelPickup: () => void
}) {
  const shipment = order.shipment ?? null
  const canCancel = Boolean(shipment) && PRE_DISPATCH_STATUSES.has(shipment?.status ?? "")
  const hasAwb = Boolean(shipment?.awb_code)
  const hasError = Boolean(shipment?.last_error_message) && !hasAwb
  const [copied, setCopied] = useState(false)

  function copyAwb() {
    if (shipment?.awb_code && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shipment.awb_code).then(() => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      }).catch(() => {})
    }
  }

  const docBase = `/api/orycms/orders/${encodeURIComponent(order.id)}/documents`

  // Plain-language summary of where this order is in the fulfillment flow.
  const state = !shipment
    ? {
        step: 1,
        heading: "Awaiting confirmation",
        detail: "Review the order below, then confirm to create the Shiprocket shipment, auto-assign a courier, and schedule pickup.",
      }
    : hasAwb
      ? {
          step: 3,
          heading: `Shipment ready · ${shipment?.courier_name ?? "Courier assigned"}`,
          detail: `AWB ${shipment?.awb_code} generated. Track live status in the Shipment panel. Cancel is available until the courier picks it up.`,
        }
      : {
          step: 2,
          heading: "Shipment created — assigning courier",
          detail: "The Shiprocket order exists but no AWB is assigned yet. Retry to assign a courier and schedule pickup.",
        }

  const busy = action !== null

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
      <FulfillmentSteps current={state.step} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <p className="text-[14px] font-semibold">{state.heading}</p>
          </div>
          <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">{state.detail}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {canCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 text-[13px] font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-60"
            >
              {action === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Cancel shipment
            </button>
          ) : null}
          {!shipment || !hasAwb ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-[13px] font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {action === "confirm" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
              {shipment ? "Retry shipment creation" : "Confirm & create shipment"}
            </button>
          ) : null}
        </div>
      </div>

      {/* Secondary action toolbar — visible once a shipment exists. */}
      {shipment ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <ToolbarButton onClick={onSync} busy={action === "sync"} disabled={busy}>
            <RefreshCw className="h-3.5 w-3.5" /> Sync tracking now
          </ToolbarButton>
          {hasAwb ? (
            <ToolbarButton onClick={copyAwb} disabled={busy}>
              <Copy className="h-3.5 w-3.5" /> {copied ? "Copied!" : "Copy AWB"}
            </ToolbarButton>
          ) : null}
          {shipment.tracking_url ? (
            <a
              href={shipment.tracking_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:border-border-strong hover:bg-accent"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open tracking
            </a>
          ) : null}
          <span className="mx-1 h-5 w-px bg-border" />
          <DocLink href={`${docBase}/invoice`} label="Invoice" />
          <DocLink href={`${docBase}/label`} label="Shipping label" />
          <DocLink href={`${docBase}/manifest`} label="Manifest" />
          <span className="mx-1 h-5 w-px bg-border" />
          {shipment.pickup_status === "cancelled" || !shipment.pickup_scheduled_date ? (
            <ToolbarButton onClick={onSchedulePickup} busy={action === "pickup-schedule"} disabled={busy || !hasAwb}>
              <Truck className="h-3.5 w-3.5" /> Schedule pickup
            </ToolbarButton>
          ) : (
            <>
              <ToolbarButton onClick={onSchedulePickup} busy={action === "pickup-schedule"} disabled={busy}>
                <RefreshCw className="h-3.5 w-3.5" /> Reschedule pickup
              </ToolbarButton>
              <ToolbarButton onClick={onCancelPickup} busy={action === "pickup-cancel"} disabled={busy}>
                Cancel pickup
              </ToolbarButton>
            </>
          )}
        </div>
      ) : null}

      {/* Error + one-click retry surfaced from the last failed create attempt. */}
      {hasError ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="text-[12.5px]">
              <p className="font-semibold text-destructive">Last error{shipment?.last_error_code ? ` (${shipment.last_error_code})` : ""}</p>
              <p className="mt-0.5 text-muted-foreground">{shipment?.last_error_message}</p>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                Retry count: {shipment?.retry_count ?? 0}
                {shipment?.last_retry_at ? ` · Last retry ${dateTime(shipment.last_retry_at)}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-foreground px-3 text-[12.5px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {action === "confirm" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Retry now
            </button>
          </div>
        </div>
      ) : null}

      {actionError ? (
        <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">{actionError}</p>
      ) : null}
      {actionNote && !actionError ? (
        <p className="mt-3 text-[12.5px] text-success">{actionNote}</p>
      ) : null}
    </div>
  )
}

function BulkButton({ children, onClick, busy, disabled }: { children: React.ReactNode; onClick: () => void; busy?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-[12px] font-medium transition-colors hover:border-border-strong hover:bg-accent disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      {children}
    </button>
  )
}

function ToolbarButton({ children, onClick, busy, disabled }: { children: React.ReactNode; onClick: () => void; busy?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:border-border-strong hover:bg-accent disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      {children}
    </button>
  )
}

function DocLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:border-border-strong hover:bg-accent"
    >
      <Download className="h-3.5 w-3.5" /> {label}
    </a>
  )
}

function ActivityPanel({ logs }: { logs: ActivityLog[] }) {
  return (
    <Panel title="Shipment activity">
      {logs.length === 0 ? (
        <p className="text-muted-foreground">No Shiprocket API calls recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start justify-between gap-3 border-b border-border/60 py-2 last:border-0 text-[12.5px]">
              <div className="min-w-0">
                <p className="font-medium">
                  <span className={cn("mr-2 rounded px-1.5 py-0.5 text-[10.5px] font-semibold", log.ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                    {log.ok ? "OK" : "ERR"}
                  </span>
                  {log.direction === "webhook" ? "Webhook" : `${log.method} ${log.endpoint}`}
                </p>
                {log.error_message ? <p className="mt-0.5 text-destructive">{log.error_code ? `[${log.error_code}] ` : ""}{log.error_message}</p> : null}
              </div>
              <span className="shrink-0 text-[11.5px] text-muted-foreground">{dateTime(log.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

function FulfillmentSteps({ current }: { current: number }) {
  const steps = ["Order placed", "Shipment created", "Courier & pickup"]
  return (
    <div className="flex items-center gap-2">
      {steps.map((stepLabel, index) => {
        const step = index + 1
        const done = step < current
        const active = step === current
        return (
          <div key={stepLabel} className="flex items-center gap-2">
            <div
              className={cn(
                "grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold",
                done ? "bg-success/15 text-success" : active ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
              )}
            >
              {done ? "✓" : step}
            </div>
            <span className={cn("text-[12px] font-medium", active ? "text-foreground" : "text-muted-foreground")}>{stepLabel}</span>
            {index < steps.length - 1 ? <span className="mx-1 h-px w-6 bg-border sm:w-10" /> : null}
          </div>
        )
      })}
    </div>
  )
}

function ShipmentPanel({ order }: { order: OrderDetail }) {
  const shipment = order.shipment ?? null
  const events = order.shipmentEvents ?? []

  return (
    <Panel title="Shipment">
      {shipment ? (
        <div className="space-y-1">
          <Info label="Shipment ID" value={shipment.shiprocket_shipment_id ?? "—"} />
          <Info label="AWB" value={shipment.awb_code ?? "Pending"} />
          <Info label="Courier" value={shipment.courier_name ?? "—"} />
          <Info label="Status" value={label(shipment.status)} />
          <Info label="Pickup" value={shipment.pickup_status ? label(shipment.pickup_status) : "—"} />
          <Info label="Shipping cost" value={shipment.shipping_charge != null ? formatCurrency(shipment.shipping_charge) : "—"} />
          <Info label="Est. delivery" value={shipment.estimated_delivery_date ? dateTime(shipment.estimated_delivery_date) : "—"} />
          {shipment.tracking_url ? (
            <div className="pt-1">
              <a href={shipment.tracking_url} target="_blank" rel="noreferrer" className="text-[12.5px] font-medium text-success hover:underline">
                Track parcel →
              </a>
            </div>
          ) : null}

          {events.length > 0 ? (
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 text-[12px] font-semibold">Delivery timeline</p>
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="flex gap-3 text-[13px]">
                    <span className="mt-1 h-2 w-2 rounded-full bg-foreground" />
                    <div>
                      <p className="font-medium">{label(event.status)}</p>
                      <p className="text-[12px] text-muted-foreground">
                        {dateTime(event.occurred_at)}
                        {event.location ? ` · ${event.location}` : ""}
                        {event.activity ? ` · ${event.activity}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-[13px] text-muted-foreground">No shipment yet. Use “Confirm &amp; create shipment” above to generate it.</p>
      )}
    </Panel>
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
