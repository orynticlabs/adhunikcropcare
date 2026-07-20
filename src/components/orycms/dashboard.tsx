"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Bell,
  Boxes,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  Layers,
  LineChart,
  LogOut,
  Megaphone,
  Package,
  PanelLeft,
  Puzzle,
  Receipt,
  SearchCheck,
  Shield,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Tags,
  Truck,
  TrendingUp,
  User,
  UserCog,
  Users,
  X,
} from "lucide-react"
import { OryCMSSessionProvider, useOryCMSSession } from "../../../orycms/hooks"
import { cn, formatCurrency } from "@/lib/utils"
import { ORYCMS_ADMIN_MENU, ORYCMS_ADMIN_SEARCH_ITEMS } from "@/lib/orycms/admin-menu"

type MenuChild = {
  label: string
  href: string
  slug: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
}

type MenuItem = {
  label: string
  href?: string
  slug: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  children?: MenuChild[]
}

type OryCMSNotification = {
  body: string
  id: string
  kind: "order" | "customer" | "admin-user" | "system"
  read: boolean
  time: string
  timestamp: string
  title: string
}

type OryCMSHeaderProfile = {
  email: string
  fullName: string
  profilePhoto: string | null
}

type OryCMSDashboardData = {
  admin: { email: string; name: string }
  generatedAt: string
  inventory: { healthScore: number; inStock: number; lowStock: number; outOfStock: number; status: string }
  kpis: {
    averageOrderValue: number
    conversionRate: number | null
    pendingFulfillment: number
    revenueToday: number
    revenueTrend: number | null
    totalOrders: number
    visitors: number | null
  }
  latestOrders: { customerName: string; id: string; number: string; paymentStatus: string; status: string; total: number }[]
  lowStockAlerts: { id: string; name: string; sku: string; stock_quantity: number }[]
  orderStatuses: Record<string, number>
  range: { from: string; key: string; label: string; to: string }
  recentCustomers: { email: string; id: string; joinedAt: string; name: string }[]
  revenueChart: { label: string; previous: number; value: number }[]
  topProducts: { name: string; revenue: number; sku: string; sold: number }[]
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Analytics: LineChart,
  Categories: Tags,
  Certificates: Award,
  Collections: Layers,
  Commerce: ShoppingBag,
  Content: FileText,
  Customers: Users,
  Database,
  Inventory: Boxes,
  Marketing: Megaphone,
  Media: ImageIcon,
  Orders: Receipt,
  Overview: LayoutDashboard,
  Plugins: Puzzle,
  Products: Package,
  Roles: Shield,
  SEO: SearchCheck,
  Settings,
  Setup: Shield,
  Users: UserCog,
}

const ORYCMS_MENU: { section: string; items: MenuItem[] }[] = ORYCMS_ADMIN_MENU.map((group) => ({
  section: group.section,
  items: group.items.map((item) => ({
    ...item,
    icon: ICONS[item.label] ?? LayoutDashboard,
    children: item.children?.map((child) => ({
      ...child,
      icon: ICONS[child.label] ?? LayoutDashboard,
    })),
  })),
}))

const SEARCH_ITEMS: MenuChild[] = ORYCMS_ADMIN_SEARCH_ITEMS.map((item) => ({
  ...item,
  icon: ICONS[item.label] ?? LayoutDashboard,
}))

export function OryCMSDashboard({
  children,
  section = "Overview",
}: {
  children?: React.ReactNode
  section?: string
}) {
  return (
    <OryCMSSessionProvider>
      <DashboardShell section={section}>{children ?? <OryCMSOverview />}</DashboardShell>
    </OryCMSSessionProvider>
  )
}

function DashboardShell({
  children,
  section,
}: {
  children: React.ReactNode
  section: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { loaded, user, roleName } = useOryCMSSession()
  const headerActionsRef = useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<OryCMSNotification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [headerProfile, setHeaderProfile] = useState<OryCMSHeaderProfile | null>(null)

  useEffect(() => {
    if (!loaded || (user && roleName)) return
    const from = pathname?.startsWith("/admin") ? pathname : "/admin/dashboard"
    router.replace(`/admin/login?from=${encodeURIComponent(from)}`)
  }, [loaded, pathname, roleName, router, user])

  useEffect(() => {
    if (!user || !roleName) return

    let cancelled = false
    async function loadNotifications() {
      setNotificationsLoading(true)
      try {
        const response = await fetch("/api/orycms/notifications", { cache: "no-store" })
        const json = await response.json()
        if (!cancelled && response.ok && json.success) {
          setNotifications(Array.isArray(json.data) ? json.data : [])
        }
      } finally {
        if (!cancelled) setNotificationsLoading(false)
      }
    }

    void loadNotifications()
    const interval = window.setInterval(loadNotifications, 8000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [roleName, user])

  useEffect(() => {
    if (!user || !roleName) return

    let cancelled = false
    async function loadProfile() {
      try {
        const response = await fetch("/api/orycms/profile", { cache: "no-store" })
        const json = await response.json()
        if (!cancelled && response.ok && json.success) {
          setHeaderProfile(json.data)
        }
      } catch {
        if (!cancelled) setHeaderProfile(null)
      }
    }

    void loadProfile()
    window.addEventListener("orycms-profile-updated", loadProfile)
    return () => {
      cancelled = true
      window.removeEventListener("orycms-profile-updated", loadProfile)
    }
  }, [roleName, user])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false)
        setProfileOpen(false)
        return
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!headerActionsRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false)
        setProfileOpen(false)
      }
    }

    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [])

  async function logout() {
    await fetch("/api/orycms/auth/logout", { method: "POST" })
    router.replace("/admin")
  }

  if (!loaded) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading dashboard…
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <OryCMSSidebar collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 h-14 shrink-0 border-b border-border bg-background">
          <div className="flex h-full items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label="Toggle sidebar"
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <PanelLeft className="h-4 w-4" />
          </button>

          <div className="hidden items-center gap-1.5 text-sm md:flex">
            <Link href="/admin" className="text-muted-foreground transition-colors hover:text-chart-3">
              OryCMS
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <Link href={sectionHref(section)} className="font-medium transition-colors hover:text-chart-3">
              {section}
            </Link>
          </div>

          <div className="ml-auto" />
          <button
            type="button"
            onClick={() => setInsightsOpen((value) => !value)}
            aria-label="Toggle insights"
            className={`grid h-8 w-8 place-items-center rounded-md transition-colors ${
              insightsOpen
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Sparkles className="h-4 w-4" />
          </button>

          <div ref={headerActionsRef} className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((value) => !value)
                  setProfileOpen(false)
                }}
                aria-expanded={notificationsOpen}
                aria-haspopup="dialog"
                aria-label="Notifications"
                className={`relative grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${
                  notificationsOpen ? "bg-accent text-foreground notification-bell-ring" : ""
                }`}
              >
                <Bell className="h-4 w-4" />
                {notifications.length ? (
                  <span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-semibold leading-none text-white">
                    {Math.min(notifications.length, 9)}
                  </span>
                ) : null}
              </button>
              <NotificationsPanel
                loading={notificationsLoading}
                notifications={notifications}
                open={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((value) => !value)
                  setNotificationsOpen(false)
                }}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                className="grid h-8 w-8 place-items-center rounded-full border border-border bg-gradient-to-br from-chart-3 to-chart-4 text-[11px] font-semibold text-white shadow-xs transition-opacity hover:opacity-90"
                aria-label="Profile"
              >
                {headerProfile?.profilePhoto ? (
                  <img src={headerProfile.profilePhoto} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <img src="/orycms/img/favicon.png" alt="" className="h-5 w-5 object-contain" />
                )}
              </button>

              <ProfileDropdown
                displayName={headerProfile?.fullName}
                email={headerProfile?.email ?? user.email}
                onClose={() => setProfileOpen(false)}
                onLogout={logout}
                open={profileOpen}
                profilePhoto={headerProfile?.profilePhoto ?? null}
                roleName={roleName ?? "Owner"}
              />
            </div>
          </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
            <div className="flex-1">{children}</div>
            <OryCMSFooter />
          </main>
          <InsightsPanel open={insightsOpen} />
        </div>
      </div>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

function OryCMSOverview() {
  const [data, setData] = useState<OryCMSDashboardData | null>(null)
  const [error, setError] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState("7d")
  const [toDate, setToDate] = useState("")

  useEffect(() => {
    let cancelled = false
    async function loadDashboard(showLoader = false) {
      if (showLoader) setLoading(true)
      try {
        const params = new URLSearchParams({ range })
        if (range === "custom") {
          if (fromDate) params.set("from", fromDate)
          if (toDate) params.set("to", toDate)
        }
        const response = await fetch(`/api/orycms/dashboard?${params.toString()}`, { cache: "no-store" })
        const json = await response.json()
        if (!cancelled && response.ok && json.success) {
          setData(json.data)
          setError("")
        } else if (!cancelled) {
          setError(json.error?.message ?? "Failed to load dashboard.")
        }
      } catch {
        if (!cancelled) setError("Dashboard data unavailable.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    function onOrdersUpdated() {
      void loadDashboard(false)
    }

    void loadDashboard(true)
    const interval = window.setInterval(() => void loadDashboard(false), 10000)
    window.addEventListener("orycms-orders-updated", onOrdersUpdated)
    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener("orycms-orders-updated", onOrdersUpdated)
    }
  }, [fromDate, range, toDate])

  const now = new Date()
  const metrics = data ? [
    {
      delta: data.kpis.revenueTrend,
      foot: data.kpis.revenueTrend === null ? "No previous period revenue yet" : `vs previous ${data.range.label} period`,
      label: "Revenue today",
      value: formatCurrency(data.kpis.revenueToday),
    },
    {
      delta: null,
      foot: `${data.kpis.pendingFulfillment} pending fulfillment`,
      label: "Total orders",
      value: data.kpis.totalOrders.toLocaleString("en-IN"),
    },
    {
      delta: null,
      foot: data.kpis.visitors === null ? "Visitor tracking not configured" : `of ${data.kpis.visitors.toLocaleString("en-IN")} visitors`,
      label: "Conversion rate",
      value: data.kpis.conversionRate === null ? "—" : `${data.kpis.conversionRate.toFixed(2)}%`,
    },
    {
      delta: null,
      foot: "Paid + COD orders in selected range",
      label: "Avg. order value",
      value: formatCurrency(data.kpis.averageOrderValue),
    },
  ] : []

  return (
    <section className="mx-auto max-w-[1400px] space-y-5 px-6 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[12px] text-muted-foreground">
            {now.toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}
          </div>
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">
            {greeting(now)}, {data?.admin.name ?? "Admin"} <span className="inline-block">👋</span>
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            {loading ? "Loading live dashboard…" : data ? `Live database snapshot refreshed ${new Date(data.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}.` : "No dashboard data loaded."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/products/new" className="h-9 rounded-lg bg-foreground px-3 pt-2 text-[12.5px] font-medium text-background transition-opacity hover:opacity-90">
            New product
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
          {error}
        </div>
      ) : null}

      <OverviewCard className="overflow-hidden">
        {loading && !data ? (
          <div className="grid h-32 place-items-center text-sm text-muted-foreground">Loading live KPIs…</div>
        ) : (
          <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            {metrics.map((metric) => (
            <div key={metric.label} className="p-5">
              <div className="text-[12px] text-muted-foreground">{metric.label}</div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <div className="num text-[24px] font-semibold tracking-tight">{metric.value}</div>
                {typeof metric.delta === "number" ? <MetricDelta value={metric.delta} /> : null}
              </div>
              <div className="mt-1 text-[11.5px] text-muted-foreground">{metric.foot}</div>
            </div>
            ))}
          </div>
        )}
      </OverviewCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
        <RevenueOverview chart={data?.revenueChart ?? []} fromDate={fromDate} range={range} setFromDate={setFromDate} setRange={setRange} setToDate={setToDate} toDate={toDate} total={data ? data.revenueChart.reduce((sum, item) => sum + item.value, 0) : 0} trend={data?.kpis.revenueTrend ?? null} />
        <div className="space-y-5">
          <OrdersPipeline statuses={data?.orderStatuses ?? {}} />
          <InventoryHealth inventory={data?.inventory} />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.4fr)_minmax(300px,0.8fr)]">
        <TopProducts products={data?.topProducts ?? []} />
        <RecentOrders orders={data?.latestOrders ?? []} />
        <AlertsAndCustomers alerts={data?.lowStockAlerts ?? []} customers={data?.recentCustomers ?? []} />
      </div>
    </section>
  )
}

function OverviewCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("rounded-xl border border-border bg-surface shadow-xs", className)}>{children}</div>
}

function MetricDelta({ value }: { value: number }) {
  const up = value >= 0

  return (
    <span
      className={cn(
        "num inline-flex h-5 items-center gap-0.5 rounded-full px-1.5 text-[11.5px] font-medium",
        up ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
      )}
    >
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {up ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  )
}

function RevenueOverview({
  chart,
  fromDate,
  range,
  setFromDate,
  setRange,
  setToDate,
  toDate,
  total,
  trend,
}: {
  chart: OryCMSDashboardData["revenueChart"]
  fromDate: string
  range: string
  setFromDate: (value: string) => void
  setRange: (range: string) => void
  setToDate: (value: string) => void
  toDate: string
  total: number
  trend: number | null
}) {
  const max = Math.max(1, ...chart.flatMap((bar) => [bar.value, bar.previous]))

  return (
    <OverviewCard className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[12px] text-muted-foreground">Revenue</div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="num text-[22px] font-semibold tracking-tight">
              {formatCurrency(total)}
            </div>
            {typeof trend === "number" ? <MetricDelta value={trend} /> : null}
          </div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">
            Compared with previous selected period
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border border-border bg-surface-muted p-0.5 text-[12px]">
          {["1d", "7d", "1m", "1y", "custom"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRange(item)}
              className={cn(
                "h-6 rounded-[5px] px-2.5 transition-colors",
                item === range
                  ? "bg-surface font-medium text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item === "custom" ? "Custom" : item.toUpperCase()}
            </button>
          ))}
          </div>
          {range === "custom" ? (
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="h-7 rounded-md border border-border bg-surface px-2 text-[12px] outline-none" />
              <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="h-7 rounded-md border border-border bg-surface px-2 text-[12px] outline-none" />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex h-[240px] items-end gap-3 border-b border-border/70 pb-5">
        {chart.length ? chart.map((bar) => (
          <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-48 w-full items-end justify-center gap-1.5 rounded-lg bg-surface-muted/70 p-2">
              <div
                className="w-full rounded-md bg-border-strong"
                style={{ height: `${(bar.previous / max) * 100}%` }}
                title={`Previous ${bar.label}`}
              />
              <div
                className="w-full rounded-md bg-foreground"
                style={{ height: `${(bar.value / max) * 100}%` }}
                title={`Current ${bar.label}`}
              />
            </div>
            <div className="text-[11px] text-muted-foreground">{bar.label}</div>
          </div>
        )) : (
          <div className="grid h-48 flex-1 place-items-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            No paid/COD orders in this period.
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-[11.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-foreground" />
          Current period
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-border-strong" />
          Previous period
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-success">
          <TrendingUp className="h-3.5 w-3.5" />
          Live trend
        </span>
      </div>
    </OverviewCard>
  )
}

function OrdersPipeline({ statuses }: { statuses: Record<string, number> }) {
  const rows = [
    { icon: Clock, key: "pending", label: "Pending", tint: "bg-warning/10 text-warning" },
    { icon: CheckCircle2, key: "confirmed", label: "Confirmed", tint: "bg-info/10 text-info" },
    { icon: Boxes, key: "processing", label: "Processing", tint: "bg-warning/10 text-warning" },
    { icon: Package, key: "packed", label: "Packed", tint: "bg-muted text-muted-foreground" },
    { icon: Truck, key: "shipped", label: "Shipped", tint: "bg-info/10 text-info" },
    { icon: Truck, key: "out_for_delivery", label: "Out for delivery", tint: "bg-info/10 text-info" },
    { icon: CheckCircle2, key: "delivered", label: "Delivered", tint: "bg-success/10 text-success" },
    { icon: ArrowDownRight, key: "cancelled", label: "Cancelled", tint: "bg-destructive/10 text-destructive" },
    { icon: ArrowDownRight, key: "refunded", label: "Refunded", tint: "bg-destructive/10 text-destructive" },
  ]

  return (
    <OverviewCard className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13.5px] font-semibold">Orders overview</div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">
            Snapshot of order pipeline
          </div>
        </div>
        <Link href="/admin/orders" className="text-[11.5px] text-muted-foreground hover:text-foreground">
          View all →
        </Link>
      </div>
      <div className="mt-4 space-y-2">
        {rows.map((row) => {
          const Icon = row.icon

          return (
            <div key={row.key} className="flex items-center gap-3 py-1.5">
              <div className={cn("grid h-7 w-7 place-items-center rounded-md", row.tint)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="text-[13px]">{row.label}</div>
              <div className="num ml-auto text-[14px] font-semibold tabular-nums">{statuses[row.key] ?? 0}</div>
            </div>
          )
        })}
      </div>
    </OverviewCard>
  )
}

function InventoryHealth({ inventory }: { inventory?: OryCMSDashboardData["inventory"] }) {
  const score = inventory?.healthScore ?? 0
  return (
    <OverviewCard className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13.5px] font-semibold">Inventory health</div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">All warehouses</div>
        </div>
        <span className={cn("text-[11.5px] font-medium", score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive")}>
          {inventory?.status ?? "No stock data"}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-[86px] w-[86px]">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-muted)" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="var(--color-foreground)"
              strokeDasharray={`${(score / 100) * 97.4} 97.4`}
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="num text-[18px] font-semibold leading-none">{score}</div>
              <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground">score</div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-1.5 text-[12.5px]">
          {[
            ["In stock", String(inventory?.inStock ?? 0), "text-foreground"],
            ["Low stock", String(inventory?.lowStock ?? 0), "text-warning"],
            ["Out of stock", String(inventory?.outOfStock ?? 0), "text-destructive"],
          ].map(([label, value, tone]) => (
            <div key={label} className="flex justify-between">
              <span className="text-muted-foreground">{label}</span>
              <span className={cn("num font-medium", tone)}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </OverviewCard>
  )
}

function TopProducts({ products }: { products: OryCMSDashboardData["topProducts"] }) {
  const max = Math.max(1, ...products.map((product) => product.revenue))

  return (
    <OverviewCard>
      <div className="flex items-center justify-between p-5 pb-3">
        <div>
          <div className="text-[13.5px] font-semibold">Top products</div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">By revenue · selected range</div>
        </div>
        <Link href="/admin/products" className="text-[11.5px] text-muted-foreground hover:text-foreground">
          View all →
        </Link>
      </div>
      <div className="space-y-2 px-3 pb-3">
        {products.length ? products.map((product, index) => (
          <div
            key={product.sku}
            className="rounded-lg border border-border bg-surface-muted/35 p-3 transition-colors hover:bg-accent/40"
          >
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-surface font-mono text-[10px] text-muted-foreground">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium">{product.name}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {product.sku}
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{ width: `${(product.revenue / max) * 100}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-[11.5px]">
                  <div>
                    <div className="text-muted-foreground">Units sold</div>
                    <div className="num mt-0.5 font-medium">{product.sold}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground">Revenue</div>
                    <div className="num mt-0.5 font-medium">{formatCurrency(product.revenue)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <EmptyBlock message="No product sales in this period." />
        )}
      </div>
    </OverviewCard>
  )
}

function RecentOrders({ orders }: { orders: OryCMSDashboardData["latestOrders"] }) {
  return (
    <OverviewCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-surface-muted px-5 py-4">
        <div>
          <div className="text-[13.5px] font-semibold">Recent orders</div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">Latest commerce activity</div>
        </div>
        <Link href="/admin/orders" className="text-[11.5px] text-muted-foreground hover:text-foreground">
          Manage →
        </Link>
      </div>
      <div className="divide-y divide-border">
        {orders.length ? orders.map((order) => (
          <div key={order.id} className="grid grid-cols-[90px_1fr_auto] items-center gap-3 px-5 py-3 text-[12.5px]">
            <div className="font-mono text-muted-foreground">{order.number}</div>
            <div className="min-w-0">
              <div className="truncate font-medium">{order.customerName}</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <StatusPill label={label(order.paymentStatus)} tone={order.paymentStatus === "paid" ? "success" : order.paymentStatus.includes("pending") ? "warning" : "danger"} />
                <StatusPill label={label(order.status)} tone={order.status === "delivered" ? "success" : order.status === "shipped" || order.status === "out_for_delivery" ? "info" : order.status === "processing" ? "warning" : order.status === "cancelled" || order.status === "refunded" ? "danger" : "muted"} />
              </div>
            </div>
            <div className="num font-semibold">{formatCurrency(order.total)}</div>
          </div>
        )) : (
          <div className="p-5"><EmptyBlock message="No orders found yet." /></div>
        )}
      </div>
    </OverviewCard>
  )
}

function StatusPill({
  label,
  tone,
}: {
  label: string
  tone: "success" | "warning" | "info" | "danger" | "muted"
}) {
  const colors = {
    danger: "bg-destructive/10 text-destructive",
    info: "bg-info/10 text-info",
    muted: "bg-muted text-muted-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
  }

  return (
    <span className={cn("inline-flex h-5 items-center gap-1 rounded-full px-1.5 text-[11px] font-medium", colors[tone])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}

function AlertsAndCustomers({
  alerts,
  customers,
}: {
  alerts: OryCMSDashboardData["lowStockAlerts"]
  customers: OryCMSDashboardData["recentCustomers"]
}) {
  return (
    <OverviewCard className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13.5px] font-semibold">Live alerts</div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">Low stock and new customers</div>
        </div>
      </div>
      <div className="mt-4 space-y-4">
        <div>
          <div className="mb-2 text-[12px] font-medium text-muted-foreground">Low-stock alerts</div>
          <div className="space-y-2">
            {alerts.length ? alerts.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted/35 px-3 py-2 text-[12.5px]">
                <div className="min-w-0">
                  <div className="truncate font-medium">{product.name}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{product.sku}</div>
                </div>
                <span className={cn("num font-semibold", product.stock_quantity <= 0 ? "text-destructive" : "text-warning")}>
                  {product.stock_quantity}
                </span>
              </div>
            )) : <EmptyBlock message="No low-stock products." />}
          </div>
        </div>
        <div>
          <div className="mb-2 text-[12px] font-medium text-muted-foreground">Recent customers</div>
          <div className="space-y-2">
            {customers.length ? customers.map((customer) => (
              <div key={customer.id} className="rounded-lg border border-border bg-surface-muted/35 px-3 py-2 text-[12.5px]">
                <div className="truncate font-medium">{customer.name}</div>
                <div className="truncate text-[11px] text-muted-foreground">{customer.email}</div>
                <div className="mt-1 text-[10.5px] text-muted-foreground">{dateTime(customer.joinedAt)}</div>
              </div>
            )) : <EmptyBlock message="No registered customers yet." />}
          </div>
        </div>
      </div>
    </OverviewCard>
  )
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="grid min-h-24 place-items-center rounded-lg border border-dashed border-border bg-surface-muted/25 px-3 py-4 text-center text-[12.5px] text-muted-foreground">
      {message}
    </div>
  )
}

function greeting(now: Date) {
  const hour = now.getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function dateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function sectionHref(section: string) {
  const routes: Record<string, string> = {
    Categories: "/admin/categories",
    Media: "/admin/media",
    Overview: "/admin",
    Products: "/admin/products",
  }

  return routes[section] ?? `/admin/${section.toLowerCase().replace(/\s+/g, "-")}`
}

function OryCMSFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-6 py-3 text-[11.5px] text-muted-foreground lg:px-8">
        <span>© 2026 OrynticLabs Private Limited. All rights reserved.</span>
        <span>OryCMS v1.0.0</span>
      </div>
    </footer>
  )
}

function OryCMSSidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [open, setOpen] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      setOpen(JSON.parse(window.localStorage.getItem("orycms-sidebar-open") ?? "{}") as Record<string, boolean>)
    } catch {
      setOpen({})
    }
  }, [])

  useEffect(() => {
    setOpen((current) => {
      const active = findActiveSidebarGroup(pathname)
      if (!active || current[active]) return current

      const next = { ...current, [active]: true }
      window.localStorage.setItem("orycms-sidebar-open", JSON.stringify(next))
      return next
    })
  }, [pathname])

  function toggleGroup(label: string) {
    setOpen((current) => {
      const next = { ...current, [label]: !current[label] }
      window.localStorage.setItem("orycms-sidebar-open", JSON.stringify(next))
      return next
    })
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-300 ease-out lg:flex",
        collapsed ? "w-[68px]" : "w-[248px]",
      )}
    >
      <div className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2.5 border-b border-border/70 bg-sidebar px-4">
        <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-surface">
          <img src="/orycms/img/favicon.png" alt="" className="h-5 w-5 object-contain" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold tracking-tight">OryCMS</div>
            <div className="truncate text-[11px] text-muted-foreground">
              By OrynticLabs Private Limited
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-3">
        {ORYCMS_MENU.map((group) => (
          <div key={group.section}>
            {!collapsed && (
              <div className="px-2 pb-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">
                {group.section}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <OryCMSMenuItem
                  key={item.label}
                  item={item}
                  collapsed={collapsed}
                  pathname={pathname}
                  open={Boolean(open[item.label])}
                  onToggle={() => toggleGroup(item.label)}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="m-2.5 rounded-lg border border-border bg-surface p-3">
          <div className="flex items-center gap-1.5 text-[11.5px] font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            AI Copilot
          </div>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
            Ask questions across orders, inventory, and customers.
          </p>
          <button
            type="button"
            onClick={() => setCopilotOpen(true)}
            className="mt-2 h-7 w-full rounded-md bg-foreground text-[11.5px] font-medium text-background transition-opacity hover:opacity-90"
          >
            Try Copilot
          </button>
        </div>
      )}
      <CopilotComingSoonModal open={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </aside>
  )
}

function CopilotComingSoonModal({
  onClose,
  open,
}: {
  onClose: () => void
  open: boolean
}) {
  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose, open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-background/85 px-4 py-6 opacity-100 backdrop-blur-sm transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="copilot-coming-soon-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close Copilot announcement"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md scale-100 rounded-2xl border border-border bg-white p-6 text-center text-foreground shadow-[0_24px_80px_rgba(15,23,42,0.22)] transition-transform duration-200 ease-out">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--orycms-color-primary)]/10 text-2xl">
          🚀
        </div>
        <h2 id="copilot-coming-soon-title" className="mt-4 text-xl font-semibold tracking-tight">
          Coming Soon
        </h2>
        <p className="mt-3 text-[13.5px] leading-6 text-muted-foreground">
          AI Copilot is currently under development and will be launched soon by{" "}
          <span className="font-semibold text-foreground">OrynticLabs Private Limited</span>.
        </p>
        <p className="mt-4 text-[13.5px] leading-6 text-muted-foreground">
          For early access, demos, or enterprise inquiries, please contact:
        </p>
        <a
          href="mailto:sales@orynticlabs.com"
          className="mt-1 inline-flex font-semibold text-[var(--orycms-color-primary)] hover:underline"
        >
          sales@orynticlabs.com
        </a>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-10 w-full rounded-lg bg-foreground text-[13px] font-semibold text-background transition-colors hover:bg-[var(--orycms-color-primary)] hover:text-white"
        >
          OK
        </button>
      </div>
    </div>
  )
}

function OryCMSMenuItem({
  item,
  collapsed,
  pathname,
  open,
  onToggle,
}: {
  item: MenuItem
  collapsed: boolean
  pathname: string
  open: boolean
  onToggle: () => void
}) {
  const Icon = item.icon
  const hasChildren = Boolean(item.children?.length)

  if (hasChildren) {
    return (
      <li>
        <button
          type="button"
          onClick={onToggle}
          className="group flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-[13px] text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
        >
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
          {!collapsed && (
            <>
              <span className="truncate">{item.label}</span>
              <ChevronDown
                className={cn(
                  "ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform",
                  open && "rotate-180",
                )}
              />
            </>
          )}
        </button>
        {!collapsed && (
          <div
            className={cn(
              "ml-6 grid overflow-hidden border-l border-border/70 pl-3 transition-[grid-template-rows,opacity,margin] duration-200 ease-out",
              open ? "mt-0.5 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="min-h-0 space-y-0.5">
            {item.children!.map((child) => (
              <OryCMSMenuLink key={child.label} child={child} pathname={pathname} />
            ))}
            </div>
          </div>
        )}
      </li>
    )
  }

  if (!item.href) return null

  return (
    <li>
      <OryCMSMenuLink
        child={{
          description: item.description,
          href: item.href,
          icon: item.icon,
          label: item.label,
          slug: item.slug,
        }}
        collapsed={collapsed}
        pathname={pathname}
        badge={item.badge}
      />
    </li>
  )
}

function findActiveSidebarGroup(pathname: string) {
  for (const group of ORYCMS_MENU) {
    for (const item of group.items) {
      if (item.children?.some((child) => isActiveAdminPath(pathname, child.href))) {
        return item.label
      }
    }
  }

  return null
}

function OryCMSMenuLink({
  child,
  collapsed,
  pathname,
  badge,
}: {
  child: MenuChild
  collapsed?: boolean
  pathname: string
  badge?: string
}) {
  const active = isActiveAdminPath(pathname, child.href)
  const Icon = child.icon

  return (
    <Link
      href={child.href}
      className={cn(
        "group relative flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] text-sidebar-foreground transition-colors hover:bg-sidebar-accent",
        active && "bg-sidebar-accent font-medium text-foreground",
        collapsed && "justify-center",
      )}
    >
      {active && <span className="absolute bottom-1.5 left-0 top-1.5 w-[2px] rounded-r bg-foreground" />}
      {Icon && (
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
          )}
        />
      )}
      {!collapsed && (
        <>
          <span className="truncate">{child.label}</span>
          {badge ? (
            <span className="num ml-auto grid h-[18px] place-items-center rounded-full bg-foreground px-1.5 text-[10.5px] font-medium text-background">
              {badge}
            </span>
          ) : null}
        </>
      )}
    </Link>
  )
}

function isActiveAdminPath(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
}

function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const items = SEARCH_ITEMS

  if (!open) return null

  function go(href: string) {
    onClose()
    router.push(href)
  }

  return (
    <div className="fixed inset-0 z-50 bg-background p-4 pt-[12vh]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.62_0.14_240_/_0.08),transparent_34%),radial-gradient(circle_at_bottom_left,oklch(0.62_0.14_155_/_0.08),transparent_32%)]" />
      <div className="relative mx-auto max-w-xl overflow-hidden rounded-xl border border-border bg-surface shadow-pop">
        <div className="flex items-center gap-2 border-b border-border bg-surface px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            placeholder="Search OryCMS pages..."
            className="h-12 min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-b border-border bg-surface-muted px-4 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Navigate
        </div>
        <div className="bg-surface p-2">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={`${item.label}-${item.href}`}
                type="button"
                onClick={() => go(item.href)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[13px] transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function InsightsPanel({ open }: { open: boolean }) {
  const [data, setData] = useState<{
    cards?: Record<string, number | null>
    generatedAt?: string
    insights?: Record<string, unknown>
    recommendations?: { action: string; detail: string; priority: "High" | "Medium" | "Low"; title: string }[]
  } | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadInsights() {
      try {
        const response = await fetch("/api/orycms/analytics/insights?range=30d", { cache: "no-store" })
        const json = await response.json()
        if (!cancelled && response.ok && json.success) {
          setData(json.data)
          setError("")
        }
      } catch {
        if (!cancelled) setError("Live insights unavailable.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadInsights()
    const interval = window.setInterval(loadInsights, 15000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  const lowStock = Array.isArray(data?.insights?.lowStockProducts) ? data.insights.lowStockProducts.length : 0
  const outOfStock = Array.isArray(data?.insights?.outOfStockProducts) ? data.insights.outOfStockProducts.length : 0

  return (
    <aside
      className={`hidden shrink-0 overflow-hidden transition-[width] duration-300 ease-out lg:block ${
        open ? "w-80 border-l border-border bg-surface shadow-pop" : "w-0"
      }`}
    >
      <div className="h-full w-80 bg-surface text-foreground">
        <div className="border-b border-border bg-surface-muted px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            AI Insights
          </div>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            Live sales, stock, and customer signals
          </p>
        </div>
        <div className="space-y-3 bg-surface p-4">
          {loading ? <Insight title="Loading live insights" body="Reading real orders, products, customers, and stock data…" /> : null}
          {error ? <Insight title="Insights unavailable" body={error} tone="warning" /> : null}
          {data ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <MiniInsight label="Revenue" value={formatCurrency(Number(data.cards?.totalRevenue ?? 0))} />
                <MiniInsight label="Orders today" value={String(data.cards?.ordersToday ?? 0)} />
                <MiniInsight label="AOV" value={formatCurrency(Number(data.cards?.averageOrderValue ?? 0))} />
                <MiniInsight label="Products sold" value={String(data.cards?.productsSold ?? 0)} />
              </div>
              <Insight
                title={outOfStock ? "Critical stock alert" : lowStock ? "Low stock warning" : "Business health stable"}
                body={
                  outOfStock
                    ? `${outOfStock} products are out of stock. Restock before promotion.`
                    : lowStock
                      ? `${lowStock} products are running low based on live inventory.`
                      : "No urgent sales or inventory issue detected in the last 30 days."
                }
                tone={outOfStock ? "danger" : lowStock ? "warning" : "success"}
              />
              {(data.recommendations ?? []).slice(0, 4).map((rec) => (
                <Insight
                  key={`${rec.title}-${rec.detail}`}
                  title={rec.title}
                  body={`${rec.detail} ${rec.action}`}
                  tone={rec.priority === "High" ? "danger" : rec.priority === "Medium" ? "warning" : "success"}
                />
              ))}
              <div className="rounded-xl border border-border bg-surface-muted p-3 text-[11.5px] leading-5 text-muted-foreground">
                Updated {data.generatedAt ? new Date(data.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "now"} · Auto-refresh every 15s
              </div>
            </>
          ) : null}
        </div>
      </div>
    </aside>
  )
}

function MiniInsight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 shadow-xs">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-[13px] font-semibold">{value}</div>
    </div>
  )
}

function Insight({ body, title, tone = "default" }: { body: string; title: string; tone?: "danger" | "default" | "success" | "warning" }) {
  return (
    <div className={cn(
      "rounded-xl border border-border bg-surface p-4 shadow-xs",
      tone === "danger" && "border-destructive/30 bg-destructive/5",
      tone === "warning" && "border-warning/30 bg-warning/5",
      tone === "success" && "border-success/30 bg-success/5",
    )}>
      <div className="text-[12.5px] font-semibold">{title}</div>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}

function ProfileDropdown({
  displayName,
  email,
  onClose,
  onLogout,
  open,
  profilePhoto,
  roleName,
}: {
  displayName?: string
  email: string
  onClose: () => void
  onLogout: () => void
  open: boolean
  profilePhoto: string | null
  roleName: string
}) {
  return (
    <div
      role="menu"
      className={cn(
        "absolute right-0 top-11 z-[80] w-64 overflow-hidden rounded-xl border border-border bg-white text-foreground shadow-pop transition-all duration-200 ease-out",
        open
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-1 opacity-0",
      )}
    >
      <div className="flex items-center gap-3 border-b border-border bg-[#f8fafc] p-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-white">
          {profilePhoto ? (
            <img src={profilePhoto} alt="" className="h-full w-full object-cover" />
          ) : (
            <img src="/orycms/img/favicon.png" alt="" className="h-5 w-5 object-contain" />
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[12.5px] font-semibold">{displayName || email}</div>
          {displayName ? <div className="truncate text-[11px] text-muted-foreground">{email}</div> : null}
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {roleName} · OryCMS
          </div>
        </div>
      </div>
      <div className="bg-white p-1.5">
        <Link
          href="/admin/profile"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[12.5px] transition-colors hover:bg-accent hover:text-accent-foreground"
          onClick={onClose}
          role="menuitem"
        >
          <User className="h-4 w-4" />
          Profile
        </Link>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[12.5px] transition-colors hover:bg-accent hover:text-accent-foreground"
          onClick={onClose}
          role="menuitem"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-border px-3 py-2.5 text-left text-[12.5px] text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
          role="menuitem"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}

function NotificationsPanel({
  loading,
  notifications,
  open,
  onClose,
}: {
  loading: boolean
  notifications: OryCMSNotification[]
  open: boolean
  onClose: () => void
}) {
  return (
    <div
      role="dialog"
      aria-label="Notifications"
      className={cn(
        "absolute right-0 top-11 z-[80] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-white text-foreground shadow-pop transition-all duration-200 ease-out sm:w-[360px]",
        open
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-1 opacity-0",
      )}
    >
      <div className="border-b border-border bg-[#f8fafc] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[12.5px] font-semibold">Notifications</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close notifications"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-0.5 text-[11.5px] text-muted-foreground">
          Live order, customer, and admin activity
        </div>
      </div>
      <div className="max-h-[420px] space-y-2 overflow-y-auto bg-white p-3">
        {loading && notifications.length === 0 ? (
          <div className="rounded-lg border border-border bg-white p-4 text-center text-[12px] text-muted-foreground">
            Loading live notifications…
          </div>
        ) : null}
        {!loading && notifications.length === 0 ? (
          <div className="rounded-lg border border-border bg-white p-4 text-center text-[12px] text-muted-foreground">
            No recent order or customer activity.
          </div>
        ) : null}
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="rounded-lg border border-border bg-white p-3 transition-colors hover:bg-accent/30"
          >
            <div className="flex items-start gap-3">
              <div
                className={cn("mt-0.5 grid h-8 w-8 place-items-center rounded-md", notificationTone(notification.kind))}
              >
                <NotificationIcon kind={notification.kind} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[12.5px] font-medium">{notification.title}</div>
                  <div className="text-[10.5px] text-muted-foreground">
                    {notification.time}
                  </div>
                </div>
                <div className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                  {notification.body}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NotificationIcon({ kind }: { kind: OryCMSNotification["kind"] }) {
  if (kind === "order") return <Receipt className="h-4 w-4" />
  if (kind === "customer") return <Users className="h-4 w-4" />
  if (kind === "admin-user") return <UserCog className="h-4 w-4" />
  return <Bell className="h-4 w-4" />
}

function notificationTone(kind: OryCMSNotification["kind"]) {
  if (kind === "order") return "bg-success/10 text-success"
  if (kind === "customer") return "bg-info/10 text-info"
  if (kind === "admin-user") return "bg-warning/10 text-warning"
  return "bg-muted text-muted-foreground"
}
