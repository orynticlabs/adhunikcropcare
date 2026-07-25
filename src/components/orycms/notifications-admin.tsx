"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Boxes, CreditCard, Receipt, Truck, Users } from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { cn } from "@/lib/utils"

type NotificationKind = "order" | "payment" | "shipment" | "inventory" | "customer" | "admin-user" | "system"
type Notification = {
  body: string
  category: string
  id: string
  kind: NotificationKind
  read: boolean
  targetUrl: string
  time: string
  timestamp: string
  title: string
}

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Orders", value: "order" },
  { label: "Payments", value: "payment" },
  { label: "Shipments", value: "shipment" },
  { label: "Inventory", value: "inventory" },
]

export function OryCMSNotificationsAdmin() {
  const router = useRouter()
  const [filter, setFilter] = useState("all")
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    setLoading(true)
    fetch(`/api/orycms/notifications?filter=${encodeURIComponent(filter)}&page=${page}&limit=${pageSize}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((json) => {
        if (json.success) {
          setItems(Array.isArray(json.data?.items) ? json.data.items : [])
          setTotal(Number(json.data?.total ?? 0))
        }
      })
      .finally(() => setLoading(false))
  }, [filter, page])

  async function openNotification(notification: Notification) {
    await fetch("/api/orycms/notifications", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: notification.id }),
    }).catch(() => undefined)
    router.push(notification.targetUrl)
  }

  return (
    <section className="mx-auto max-w-[1200px] space-y-6 px-6 py-6 lg:px-8">
      <div>
        <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/notifications", label: "Notifications" }]} />
        <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">Notifications</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">Order, payment, shipment, customer, inventory, and system activity.</p>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-muted px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => { setFilter(item.value); setPage(1) }}
                className={cn("h-8 rounded-lg border px-3 text-[12px] font-medium transition-colors", filter === item.value ? "border-foreground bg-foreground text-background" : "border-border bg-surface text-muted-foreground hover:bg-accent")}
              >
                {item.label}
              </button>
            ))}
          </div>
          <span className="text-[12px] text-muted-foreground">{total} total</span>
        </div>

        <div className="divide-y divide-border">
          {loading ? <div className="p-8 text-center text-[13px] text-muted-foreground">Loading notifications…</div> : null}
          {!loading && items.length === 0 ? <div className="p-8 text-center text-[13px] text-muted-foreground">No notifications found.</div> : null}
          {items.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => void openNotification(notification)}
              className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40", !notification.read && "bg-chart-3/5")}
            >
              <span className={cn("mt-0.5 grid h-9 w-9 place-items-center rounded-lg", tone(notification.kind))}>
                <Icon kind={notification.kind} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold">{notification.title}</span>
                  <span className="text-[11px] text-muted-foreground" title={dateTime(notification.timestamp)}>{notification.time}</span>
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">{notification.category}</span>
                  {!notification.read ? <span className="text-[10.5px] font-semibold text-chart-3">Unread</span> : null}
                </span>
                <span className="mt-1 block text-[12px] leading-5 text-muted-foreground">{notification.body}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-[12px] text-muted-foreground">
          <span>Page {page} of {pageCount}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="h-8 rounded-lg border border-border px-3 font-medium disabled:opacity-50">Previous</button>
            <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={page === pageCount} className="h-8 rounded-lg border border-border px-3 font-medium disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Icon({ kind }: { kind: NotificationKind }) {
  if (kind === "order") return <Receipt className="h-4 w-4" />
  if (kind === "payment") return <CreditCard className="h-4 w-4" />
  if (kind === "shipment") return <Truck className="h-4 w-4" />
  if (kind === "inventory") return <Boxes className="h-4 w-4" />
  if (kind === "customer") return <Users className="h-4 w-4" />
  return <Bell className="h-4 w-4" />
}

function tone(kind: NotificationKind) {
  if (kind === "order") return "bg-success/10 text-success"
  if (kind === "payment") return "bg-destructive/10 text-destructive"
  if (kind === "shipment" || kind === "customer") return "bg-info/10 text-info"
  if (kind === "inventory") return "bg-warning/10 text-warning"
  return "bg-muted text-muted-foreground"
}

function dateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}
