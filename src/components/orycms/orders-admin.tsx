"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Ban, CheckCircle2, Eye, FileText, Loader2, Package, Printer, Search, Truck } from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { playOryCMSToastSound } from "@/lib/orycms/toast-sound"
import { cn, formatCurrency } from "@/lib/utils"

const ORDER_PAGE_SIZE = 10

type OrderItem = { image?: string; img?: string; name?: string; price?: number; quantity?: number; qty?: number; size?: string }
type Order = {
  cancelled_at?: string | null
  confirmed_at?: string | null
  confirmed_by_admin_email?: string | null
  confirmed_by_admin_id?: string | null
  packed_at?: string | null
  packed_by_admin_email?: string | null
  packed_by_admin_id?: string | null
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
  shipment?: Shipment | null
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
  tracking_number: string | null
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
  shipment_created_at: string | null
  shipment_created_by_admin_id: string | null
  return_status: string | null
  reverse_pickup_status: string | null
  return_reason: string | null
  return_updated_at: string | null
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

type Toast = { id: number; message: string; tone: "success" | "error" }

type OrderDetail = Order & {
  refunds?: Refund[]
  shipment?: Shipment | null
  shipmentEvents?: ShipmentEvent[]
}

type Refund = { razorpay_refund_id: string; amount: number; status: string; reason: string | null; created_at: string | null }

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
  const [actionNote, setActionNote] = useState("")

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

  async function runBulkAction(action: "confirm" | "pack" | "create_shipment" | "print_labels" | "cancel") {
    if (selected.size === 0) return
    setBulkAction(action)
    setActionNote("")
    try {
      const json = await fetch("/api/orycms/orders/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, orderIds: Array.from(selected) }),
      }).then((response) => response.json())
      if (!json.success) throw new Error(json.error?.message ?? "Action failed.")
      if (json.data?.url) window.open(json.data.url, "_blank", "noreferrer")
      const ok = Array.isArray(json.data?.results) ? json.data.results.filter((item: { ok: boolean }) => item.ok).length : selected.size
      setActionNote(`${label(action)} completed for ${ok} of ${selected.size} selected order(s).`)
      setSelected(new Set())
      void loadOrders(false)
    } catch (err) {
      setActionNote(err instanceof Error ? err.message : "Action failed.")
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
            <BulkButton onClick={() => void runBulkAction("confirm")} busy={bulkAction === "confirm"} disabled={bulkAction !== null}>Confirm</BulkButton>
            <BulkButton onClick={() => void runBulkAction("pack")} busy={bulkAction === "pack"} disabled={bulkAction !== null}>Mark as Packed</BulkButton>
            <BulkButton onClick={() => void runBulkAction("create_shipment")} busy={bulkAction === "create_shipment"} disabled={bulkAction !== null}>Create Shipment</BulkButton>
            <BulkButton onClick={() => void runBulkAction("print_labels")} busy={bulkAction === "print_labels"} disabled={bulkAction !== null}>Print Labels</BulkButton>
            <BulkButton onClick={() => void runBulkAction("cancel")} busy={bulkAction === "cancel"} disabled={bulkAction !== null}>Cancel</BulkButton>
            <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-[12px] font-medium text-muted-foreground hover:text-foreground">Clear</button>
          </div>
        ) : null}
        {actionNote ? <div className="border-b border-border bg-surface-muted px-4 py-2 text-[12px] text-muted-foreground">{actionNote}</div> : null}

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
  const [toasts, setToasts] = useState<Toast[]>([])

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

  function toast(message: string, tone: Toast["tone"]) {
    const item = { id: Date.now(), message, tone }
    playOryCMSToastSound()
    setToasts((items) => [...items, item])
    window.setTimeout(() => setToasts((items) => items.filter((toastItem) => toastItem.id !== item.id)), 3500)
  }

  function applyResult(data: { orderStatus?: string; order?: OrderDetail | null; shipment?: Shipment | null; events?: ShipmentEvent[] }) {
    setOrder((current) => current ? {
      ...current,
      ...(data.order ?? {}),
      status: data.orderStatus ?? current.status,
      shipment: data.shipment ?? data.order?.shipment ?? current.shipment,
      shipmentEvents: data.events ?? data.order?.shipmentEvents ?? current.shipmentEvents,
    } : current)
  }

  async function runAction(kind: "confirm" | "pack" | "create-shipment" | "cancel" | "refund") {
    setAction(kind)
    setActionError("")
    const urls: Record<string, { url: string; body?: unknown }> = {
      confirm: { url: `/api/orycms/orders/${encodeURIComponent(id)}/confirm` },
      pack: { url: `/api/orycms/orders/${encodeURIComponent(id)}/pack` },
      "create-shipment": { url: `/api/orycms/orders/${encodeURIComponent(id)}/shipment/create` },
      cancel: { url: `/api/orycms/orders/${encodeURIComponent(id)}/cancel` },
      refund: { url: `/api/orycms/orders/${encodeURIComponent(id)}/refund` },
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
      toast(kind === "confirm" ? "Order confirmed." : kind === "pack" ? "Order packed." : kind === "create-shipment" ? "Shipment created." : kind === "refund" ? "Refund initiated." : "Order cancelled.", "success")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed."
      setActionError(message)
      toast(message, "error")
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
            onConfirm={() => void runAction("confirm")}
            onPack={() => void runAction("pack")}
            onCreateShipment={() => void runAction("create-shipment")}
            onCancel={() => void runAction("cancel")}
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

              <Panel title="Order timeline">
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

              <ShipmentPanel order={order} />
              <ReturnsPanel
                action={action}
                onRefund={() => void runAction("refund")}
                order={order}
              />

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
          <ToastStack toasts={toasts} />
        </>
      )}
    </section>
  )
}

function FulfillmentActionBar({
  order,
  action,
  actionError,
  onCancel,
  onConfirm,
  onCreateShipment,
  onPack,
}: {
  order: OrderDetail
  action: string | null
  actionError: string
  onCancel: () => void
  onConfirm: () => void
  onCreateShipment: () => void
  onPack: () => void
}) {
  const confirmed = isConfirmed(order.status)
  const packed = isPacked(order.status)
  const hasShipment = Boolean(order.shipment?.shiprocket_shipment_id)
  const busy = action !== null

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <p className="text-[14px] font-semibold">{hasShipment ? "Shipment created" : packed ? "Order packed" : confirmed ? "Order confirmed" : "Awaiting order confirmation"}</p>
          </div>
          <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
            {hasShipment
              ? `Shiprocket shipment ${order.shipment?.shiprocket_shipment_id ?? ""}${order.shipment?.awb_code ? ` · AWB ${order.shipment.awb_code}` : ""}.`
              : packed
              ? `Packed${order.packed_at ? ` on ${dateTime(order.packed_at)}` : ""}${order.packed_by_admin_email ? ` by ${order.packed_by_admin_email}` : ""}.`
              : confirmed
              ? `Confirmed${order.confirmed_at ? ` on ${dateTime(order.confirmed_at)}` : ""}${order.confirmed_by_admin_email ? ` by ${order.confirmed_by_admin_email}` : ""}.`
              : "Validate payment and stock, then confirm this order. Packing is available after confirmation."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {canConfirmOrder(order) ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-[13px] font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {action === "confirm" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm Order
            </button>
          ) : null}
          {canPackOrder(order) ? (
            <button
              type="button"
              onClick={onPack}
              disabled={busy}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-[13px] font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {action === "pack" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
              Mark as Packed
            </button>
          ) : null}
          {canCreateShipment(order) ? (
            <button
              type="button"
              onClick={onCreateShipment}
              disabled={busy}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-[13px] font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {action === "create-shipment" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
              Create Shipment
            </button>
          ) : null}
          {hasShipment ? (
            <>
              {order.shipment?.tracking_url ? <DocLink href={order.shipment.tracking_url} label="Track Shipment" icon={Truck} /> : null}
              <DocLink href={`/api/orycms/orders/${encodeURIComponent(order.id)}/documents/label`} label="Download Shipping Label" icon={Printer} />
              <DocLink href={`/api/orycms/orders/${encodeURIComponent(order.id)}/documents/invoice`} label="Download Invoice" icon={FileText} />
            </>
          ) : null}
          {packed && !hasShipment ? <DocLink href={`/api/orycms/orders/${encodeURIComponent(order.id)}/documents/invoice`} label="Print Invoice" icon={FileText} /> : null}
          {canCancelShipment(order) || (!hasShipment && canCancelOrder(order)) ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 text-[13px] font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-60"
            >
              {action === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
              {hasShipment ? "Cancel Shipment" : "Cancel Order"}
            </button>
          ) : null}
        </div>
      </div>

      {actionError ? (
        <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">{actionError}</p>
      ) : null}
    </div>
  )
}

function BulkButton({
  busy,
  children,
  disabled,
  onClick,
}: {
  busy?: boolean
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className="inline-flex min-h-7 items-center gap-1 rounded-lg border border-border bg-surface px-2 text-[11px] font-medium transition-colors hover:border-border-strong hover:bg-accent disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
      {children}
    </button>
  )
}

function DocLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:border-border-strong hover:bg-accent">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  )
}

function ShipmentPanel({ order }: { order: OrderDetail }) {
  const shipment = order.shipment
  const events = order.shipmentEvents ?? []
  return (
    <Panel title="Shipment Information">
      {shipment ? (
        <div className="space-y-1">
          <Info label="AWB Number" value={shipment.awb_code ?? "Pending"} />
          <Info label="Courier Name" value={shipment.courier_name ?? "Assigning"} />
          <Info label="Tracking Number" value={shipment.tracking_number ?? shipment.awb_code ?? "Pending"} />
          <Info label="Tracking URL" value={shipment.tracking_url ?? "Pending"} />
          <Info label="Pickup Date" value={shipment.pickup_scheduled_date ? dateTime(shipment.pickup_scheduled_date) : "—"} />
          <Info label="Shipment Status" value={label(shipment.status)} />
          <Info label="Estimated Delivery" value={shipment.estimated_delivery_date ? dateTime(shipment.estimated_delivery_date) : "—"} />
          <ShipmentStages shipment={shipment} events={events} />
          {events.length > 0 ? (
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 text-[12px] font-semibold">Shipment timeline</p>
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
        <p className="text-muted-foreground">No shipment created yet. Confirm the order, then create the Shiprocket shipment.</p>
      )}
    </Panel>
  )
}

function ShipmentStages({ events, shipment }: { events: ShipmentEvent[]; shipment: Shipment }) {
  const currentIndex = shipmentStageIndex(shipment.status, events)
  return (
    <div className="mt-4 border-t border-border pt-3">
      <p className="mb-3 text-[12px] font-semibold">Shipment Timeline</p>
      <div className="grid gap-2 sm:grid-cols-5">
        {SHIPMENT_STAGES.map((stage, index) => {
          const state = index < currentIndex ? "Completed" : index === currentIndex ? "Current" : "Upcoming"
          return (
            <div key={stage} className={cn("rounded-lg border px-2.5 py-2 text-[11px]", index <= currentIndex ? "border-success/30 bg-success/5 text-success" : "border-border bg-surface-muted text-muted-foreground")}>
              <p className="font-semibold">{stage}</p>
              <p className="mt-0.5">{state}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ReturnsPanel({ action, onRefund, order }: { action: string | null; onRefund: () => void; order: OrderDetail }) {
  const shipment = order.shipment
  const events = returnEvents(order.shipmentEvents ?? [])
  const latestEvent = events[events.length - 1]
  const latestRefund = order.refunds?.[0]
  const shouldShow = Boolean(shipment?.return_status || latestEvent || isReturnStatus(order.status) || latestRefund || order.refund_status !== "none")
  if (!shouldShow) return null

  return (
    <Panel title="Returns & RTO">
      <div className="space-y-1">
        <Info label="Current Return/RTO Status" value={label(shipment?.return_status ?? (isReturnStatus(order.status) ? order.status : "none"))} />
        <Info label="Reverse Pickup Status" value={label(shipment?.reverse_pickup_status ?? "not available")} />
        <Info label="Return Reason" value={shipment?.return_reason ?? "—"} />
        <Info label="Updated Date & Time" value={shipment?.return_updated_at ? dateTime(shipment.return_updated_at) : latestEvent?.occurred_at ? dateTime(latestEvent.occurred_at) : "—"} />
        {latestRefund ? (
          <>
            <Info label="Refund ID" value={latestRefund.razorpay_refund_id} />
            <Info label="Refund Amount" value={formatCurrency(latestRefund.amount)} />
            <Info label="Refund Status" value={label(latestRefund.status)} />
          </>
        ) : null}
        {canInitiateRefund(order) ? (
          <button
            type="button"
            onClick={onRefund}
            disabled={action !== null}
            className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-[12.5px] font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {action === "refund" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Initiate Refund
          </button>
        ) : null}
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-[12px] font-semibold">Return Timeline</p>
          {events.length > 0 ? (
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
          ) : <p className="text-muted-foreground">No return/RTO events recorded.</p>}
        </div>
      </div>
    </Panel>
  )
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2">
      {toasts.map((toast) => (
        <div key={toast.id} className={cn("flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-[13px] shadow-lg", toast.tone === "success" ? "border-success/30 text-success" : "border-destructive/30 text-destructive")}>
          {toast.tone === "success" ? <CheckCircle2 className="h-4 w-4" /> : null}
          {toast.message}
        </div>
      ))}
    </div>
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

function canConfirmOrder(order: Order) {
  return ["pending", "processing"].includes(order.status.toLowerCase())
}

function canPackOrder(order: Order) {
  return isConfirmed(order.status)
}

function canCreateShipment(order: Order | OrderDetail) {
  if (!isPacked(order.status)) return false
  if (!order.shipment) return true
  if (order.shipment.shiprocket_shipment_id) return false
  return order.shipment.status.toLowerCase() === "error"
}

function canCancelOrder(order: Order) {
  return !["cancelled", "picked up", "shipped", "in transit", "out for delivery", "delivered", "rto", "rto in transit", "rto delivered", "return requested", "return picked up", "return delivered", "returned"].includes(order.status.toLowerCase()) && order.payment_status !== "refunded"
}

function canCancelShipment(order: Order | OrderDetail) {
  const status = "shipment" in order ? order.shipment?.status?.toLowerCase() : undefined
  return Boolean(order.shipment?.shiprocket_shipment_id && status && ["pending", "confirmed", "processing", "packed", "created", "awb_assigned"].includes(status))
}

function canInitiateRefund(order: OrderDetail) {
  return order.payment_method === "razorpay" &&
    order.payment_status === "paid" &&
    isRefundEligibleStatus(order.status) &&
    !order.refunds?.some((refund) => refund.status.toLowerCase() !== "failed")
}

function isRefundEligibleStatus(status: string) {
  return ["cancelled", "rto delivered", "return delivered", "returned"].includes(status.toLowerCase())
}

function isReturnStatus(status: string) {
  return ["cancelled", "rto", "rto in transit", "rto delivered", "return requested", "return picked up", "return delivered", "returned"].includes(status.toLowerCase())
}

function returnEvents(events: ShipmentEvent[]) {
  return events.filter((event) => isReturnStatus(event.status) || /rto|return|cancel/i.test(`${event.activity ?? ""} ${event.status}`))
}

function isConfirmed(status: string) {
  return status.toLowerCase() === "confirmed"
}

function isPacked(status: string) {
  return status.toLowerCase() === "packed"
}

function label(value: string) {
  return value.replace(/[_.]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
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

const SHIPMENT_STAGES = ["Shipment Created", "Picked Up", "In Transit", "Out for Delivery", "Delivered"] as const

function shipmentStageIndex(status: string, events: ShipmentEvent[]) {
  const current = stageFromText(status)
  if (current > 0) return current
  return Math.max(0, ...events.map((event) => stageFromText(`${event.status} ${event.activity ?? ""}`)))
}

function stageFromText(value: string) {
  const text = value.toLowerCase()
  if (/\bdelivered\b/.test(text)) return 4
  if (/out\s*for\s*delivery/.test(text)) return 3
  if (/deliver/.test(text)) return 4
  if (/in\s*transit|transit|reached/.test(text)) return 2
  if (/picked\s*up|pickup|shipped|dispatch/.test(text)) return 1
  return 0
}
