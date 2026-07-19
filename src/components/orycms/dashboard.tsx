"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import {
  ArrowDownRight,
  ArrowUpRight,
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

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Analytics: LineChart,
  Categories: Tags,
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
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    if (!loaded || (user && roleName)) return
    const from = pathname?.startsWith("/admin") ? pathname : "/admin/dashboard"
    router.replace(`/admin/login?from=${encodeURIComponent(from)}`)
  }, [loaded, pathname, roleName, router, user])

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
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
              </button>
              <NotificationsPanel
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
                <img src="/orycms/img/favicon.png" alt="" className="h-5 w-5 object-contain" />
              </button>

              <ProfileDropdown
                email={user.email}
                onClose={() => setProfileOpen(false)}
                onLogout={logout}
                open={profileOpen}
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
  const metrics = [
    {
      label: "Revenue today",
      value: formatCurrency(14283),
      delta: 12.4,
      foot: `vs. ${formatCurrency(12712)} yesterday`,
    },
    { label: "Orders", value: "312", delta: 8.1, foot: "42 pending fulfillment" },
    { label: "Conversion rate", value: "3.28%", delta: -0.6, foot: "of 48,210 visitors" },
    {
      label: "Avg. order value",
      value: formatCurrency(92.4),
      delta: 4.2,
      foot: "AOV up over 7 days",
    },
  ]

  return (
    <section className="mx-auto max-w-[1400px] space-y-5 px-6 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[12px] text-muted-foreground">Saturday, July 18</div>
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">
            Good evening, Tushar <span className="inline-block">👋</span>
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Sales are pacing <span className="font-medium text-success">14.2% ahead</span> of last
            week. Two products need restocking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:border-border-strong">
            Export report
          </button>
          <button className="h-9 rounded-lg bg-foreground px-3 text-[12.5px] font-medium text-background transition-opacity hover:opacity-90">
            New product
          </button>
        </div>
      </div>

      <OverviewCard className="overflow-hidden">
        <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="p-5">
              <div className="text-[12px] text-muted-foreground">{metric.label}</div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <div className="num text-[24px] font-semibold tracking-tight">{metric.value}</div>
                <MetricDelta value={metric.delta} />
              </div>
              <div className="mt-1 text-[11.5px] text-muted-foreground">{metric.foot}</div>
            </div>
          ))}
        </div>
      </OverviewCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
        <RevenueOverview />
        <div className="space-y-5">
          <OrdersPipeline />
          <InventoryHealth />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.4fr)_minmax(300px,0.8fr)]">
        <TopProducts />
        <RecentOrders />
        <SalesFunnel />
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

function RevenueOverview() {
  const bars = [
    { label: "Mon", value: 4200, previous: 3800 },
    { label: "Tue", value: 5100, previous: 4400 },
    { label: "Wed", value: 4800, previous: 4600 },
    { label: "Thu", value: 6200, previous: 5100 },
    { label: "Fri", value: 7400, previous: 5800 },
    { label: "Sat", value: 8900, previous: 6900 },
    { label: "Sun", value: 7800, previous: 6200 },
  ]
  const max = Math.max(...bars.flatMap((bar) => [bar.value, bar.previous]))

  return (
    <OverviewCard className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[12px] text-muted-foreground">Revenue</div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="num text-[22px] font-semibold tracking-tight">
              {formatCurrency(74392.1)}
            </div>
            <MetricDelta value={14.2} />
          </div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">
            Compared to {formatCurrency(65148)} previous period
          </div>
        </div>
        <div className="inline-flex rounded-md border border-border bg-surface-muted p-0.5 text-[12px]">
          {["1D", "7D", "1M", "1Y"].map((range) => (
            <button
              key={range}
              className={cn(
                "h-6 rounded-[5px] px-2.5 transition-colors",
                range === "7D"
                  ? "bg-surface font-medium text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex h-[240px] items-end gap-3 border-b border-border/70 pb-5">
        {bars.map((bar) => (
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
        ))}
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

function OrdersPipeline() {
  const rows = [
    { icon: Clock, label: "Active", value: 128, tint: "bg-warning/10 text-warning" },
    { icon: Truck, label: "Shipping", value: 74, tint: "bg-info/10 text-info" },
    { icon: CheckCircle2, label: "Delivered", value: 892, tint: "bg-success/10 text-success" },
    { icon: ArrowDownRight, label: "Refunds", value: 6, tint: "bg-destructive/10 text-destructive" },
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
            <div key={row.label} className="flex items-center gap-3 py-1.5">
              <div className={cn("grid h-7 w-7 place-items-center rounded-md", row.tint)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="text-[13px]">{row.label}</div>
              <div className="num ml-auto text-[14px] font-semibold tabular-nums">{row.value}</div>
            </div>
          )
        })}
      </div>
    </OverviewCard>
  )
}

function InventoryHealth() {
  return (
    <OverviewCard className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13.5px] font-semibold">Inventory health</div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">All warehouses</div>
        </div>
        <span className="text-[11.5px] font-medium text-success">Healthy</span>
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
              strokeDasharray="81.8 97.4"
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="num text-[18px] font-semibold leading-none">84</div>
              <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground">score</div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-1.5 text-[12.5px]">
          {[
            ["In stock", "1,284", "text-foreground"],
            ["Low stock", "12", "text-warning"],
            ["Out of stock", "3", "text-destructive"],
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

function TopProducts() {
  const products = [
    { name: "Linen Crewneck Tee", sku: "LT-01", sold: 428, revenue: 12840, trend: 12.4 },
    { name: "Canvas Everyday Tote", sku: "CT-04", sold: 361, revenue: 9748, trend: 8.1 },
    { name: "Ceramic Mug — Sand", sku: "CM-11", sold: 289, revenue: 5202, trend: -3.2 },
    { name: "Merino Beanie", sku: "MB-02", sold: 214, revenue: 4708, trend: 5.6 },
  ]
  const max = Math.max(...products.map((product) => product.revenue))

  return (
    <OverviewCard>
      <div className="flex items-center justify-between p-5 pb-3">
        <div>
          <div className="text-[13.5px] font-semibold">Top products</div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">By revenue · last 7 days</div>
        </div>
        <Link href="/admin/products" className="text-[11.5px] text-muted-foreground hover:text-foreground">
          View all →
        </Link>
      </div>
      <div className="space-y-2 px-3 pb-3">
        {products.map((product, index) => (
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
                  <MetricDelta value={product.trend} />
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
        ))}
      </div>
    </OverviewCard>
  )
}

function RecentOrders() {
  const orders = [
    ["#4021", "Amelia Watson", "paid", "processing", formatCurrency(248)],
    ["#4020", "Noah Bennett", "paid", "shipped", formatCurrency(89.5)],
    ["#4019", "Priya Shah", "pending", "unfulfilled", formatCurrency(512.4)],
    ["#4018", "Marc Dubois", "paid", "delivered", formatCurrency(164)],
    ["#4017", "Ines García", "refunded", "returned", formatCurrency(328.9)],
  ]

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
        {orders.map(([id, customer, payment, shipping, total]) => (
          <div key={id} className="grid grid-cols-[80px_1fr_auto] items-center gap-3 px-5 py-3 text-[12.5px]">
            <div className="font-mono text-muted-foreground">{id}</div>
            <div className="min-w-0">
              <div className="truncate font-medium">{customer}</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <StatusPill label={payment} tone={payment === "paid" ? "success" : payment === "pending" ? "warning" : "danger"} />
                <StatusPill label={shipping} tone={shipping === "delivered" ? "success" : shipping === "shipped" ? "info" : shipping === "processing" ? "warning" : "muted"} />
              </div>
            </div>
            <div className="num font-semibold">{total}</div>
          </div>
        ))}
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

function SalesFunnel() {
  const funnel = [
    { label: "Visitors", value: 48210, pct: 100 },
    { label: "Add to Cart", value: 12384, pct: 25.7 },
    { label: "Checkout", value: 5842, pct: 12.1 },
    { label: "Purchase", value: 3126, pct: 6.5 },
  ]

  return (
    <OverviewCard className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13.5px] font-semibold">Sales funnel</div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">Last 7 days</div>
        </div>
        <span className="text-[11.5px] text-muted-foreground">Conv. 6.5%</span>
      </div>
      <div className="mt-4 space-y-3">
        {funnel.map((step, index) => (
          <div key={step.label}>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-muted-foreground">{step.label}</span>
              <span className="num font-medium tabular-nums">
                {step.value.toLocaleString()}{" "}
                <span className="font-normal text-muted-foreground">· {step.pct}%</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground"
                style={{ opacity: 1 - index * 0.15, width: `${step.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </OverviewCard>
  )
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
          <button className="mt-2 h-7 w-full rounded-md bg-foreground text-[11.5px] font-medium text-background transition-opacity hover:opacity-90">
            Try Copilot
          </button>
        </div>
      )}
    </aside>
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
            Workspace signals and OryCMS setup notes
          </p>
        </div>
        <div className="space-y-3 bg-surface p-4">
          <Insight
            title="Setup status"
            body="Neon schema and first owner are handled by /admin/setup once."
          />
          <Insight
            title="Admin security"
            body="Protected admin routes require the OryCMS session cookie."
          />
          <Insight
            title="Content API"
            body="OryCMS API is mounted under /api/orycms from orycms.config.ts."
          />
        </div>
      </div>
    </aside>
  )
}

function Insight({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="text-[12.5px] font-semibold">{title}</div>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}

function ProfileDropdown({
  email,
  onClose,
  onLogout,
  open,
  roleName,
}: {
  email: string
  onClose: () => void
  onLogout: () => void
  open: boolean
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
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-white">
          <img src="/orycms/img/favicon.png" alt="" className="h-5 w-5 object-contain" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[12.5px] font-semibold">{email}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {roleName} · OryCMS
          </div>
        </div>
      </div>
      <div className="bg-white p-1.5">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[12.5px] transition-colors hover:bg-accent hover:text-accent-foreground"
          onClick={onClose}
          role="menuitem"
        >
          <User className="h-4 w-4" />
          Profile
        </button>
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
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const notifications = [
    {
      title: "Database connected",
      body: "OryCMS is using your Neon connection string.",
      time: "now",
      tone: "bg-success/10 text-success",
    },
    {
      title: "First-run setup",
      body: "Create the owner account once from /admin/setup.",
      time: "setup",
      tone: "bg-info/10 text-info",
    },
    {
      title: "Admin protected",
      body: "Dashboard access is gated by the OryCMS session cookie.",
      time: "auth",
      tone: "bg-warning/10 text-warning",
    },
  ]

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
          OryCMS setup and admin runtime updates
        </div>
      </div>
      <div className="space-y-2 bg-white p-3">
        {notifications.map((notification) => (
          <div
            key={notification.title}
            className="rounded-lg border border-border bg-white p-3 transition-colors hover:bg-accent/30"
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 grid h-8 w-8 place-items-center rounded-md ${notification.tone}`}
              >
                <Bell className="h-4 w-4" />
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
