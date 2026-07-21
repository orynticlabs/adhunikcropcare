import { ensureOryCMSProductsSchema } from "@/lib/orycms/products"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { getOryCMSAdminProfile, type CurrentOryCMSAdmin } from "@/lib/orycms/users"
import { ensureStorefrontAuthSchema } from "@/lib/storefront-auth"

type RangeKey = "1d" | "7d" | "1m" | "1y" | "custom"

type OrderRow = {
  contact: unknown
  created_at: Date | string
  discount_total: number | string
  id: string
  items: unknown
  number: string
  payment_method: string
  payment_status: string
  refund_status: string
  status: string
  total: number | string
  user_id: string | null
}

type ProductRow = {
  id: string
  name: string
  price: number | string
  sku: string
  stock_quantity: number
}

type CustomerRow = {
  created_at: Date | string
  email: string
  first_name: string
  id: string
  last_name: string
}

type OrderItem = {
  id?: string
  name: string
  price: number
  productId?: string
  quantity: number
}

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
] as const

export async function getOryCMSDashboardData(actor: CurrentOryCMSAdmin, input: { from?: string | null; range?: string | null; to?: string | null }) {
  await ensureStorefrontAuthSchema()
  await ensureOryCMSProductsSchema()

  const range = resolveRange(input)
  const today = todayBounds()
  // These reads are mutually independent — issue them concurrently so the
  // dashboard waits on the single slowest query instead of the sum of all of
  // them. (Prisma runs each on its own pooled connection.)
  const [admin, orders, previousOrders, todayOrders, latestOrders, products, customers, visitors] =
    await Promise.all([
      getOryCMSAdminProfile(actor),
      orycmsPrisma.$queryRaw<OrderRow[]>`
        SELECT id, user_id, number, status, payment_status, payment_method, refund_status,
               contact, discount_total, items, total, created_at
        FROM storefront_orders
        WHERE created_at >= ${range.from} AND created_at <= ${range.to}
        ORDER BY created_at ASC
      `,
      orycmsPrisma.$queryRaw<OrderRow[]>`
        SELECT id, user_id, number, status, payment_status, payment_method, refund_status,
               contact, discount_total, items, total, created_at
        FROM storefront_orders
        WHERE created_at >= ${range.previousFrom} AND created_at < ${range.from}
      `,
      orycmsPrisma.$queryRaw<OrderRow[]>`
        SELECT id, user_id, number, status, payment_status, payment_method, refund_status,
               contact, discount_total, items, total, created_at
        FROM storefront_orders
        WHERE created_at >= ${today.from} AND created_at <= ${today.to}
      `,
      orycmsPrisma.$queryRaw<OrderRow[]>`
        SELECT id, user_id, number, status, payment_status, payment_method, refund_status,
               contact, discount_total, items, total, created_at
        FROM storefront_orders
        ORDER BY created_at DESC
        LIMIT 6
      `,
      orycmsPrisma.$queryRaw<ProductRow[]>`
        SELECT id, name, sku, price, stock_quantity
        FROM orycms_products
        WHERE deleted_at IS NULL
      `,
      orycmsPrisma.$queryRaw<CustomerRow[]>`
        SELECT id, first_name, last_name, email, created_at
        FROM storefront_users
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 6
      `,
      countVisitors(range),
    ])

  const paidOrders = orders.filter(isRevenueOrder)
  const previousPaid = previousOrders.filter(isRevenueOrder)
  const todayPaid = todayOrders.filter(isRevenueOrder)
  const rangeRevenue = sum(paidOrders.map((order) => Number(order.total)))
  const previousRevenue = sum(previousPaid.map((order) => Number(order.total)))
  const todayRevenue = sum(todayPaid.map((order) => Number(order.total)))
  const items = paidOrders.flatMap(orderItems)
  const productStats = topProducts(items, products)
  const conversionRate = visitors ? (paidOrders.length / visitors) * 100 : null
  const lowStock = products.filter((product) => product.stock_quantity > 0 && product.stock_quantity <= 10)
  const outOfStock = products.filter((product) => product.stock_quantity <= 0)
  const inStock = products.filter((product) => product.stock_quantity > 10)
  const healthScore = products.length ? Math.round(((inStock.length + lowStock.length * 0.45) / products.length) * 100) : 0

  return {
    admin: {
      email: admin?.email ?? "",
      name: admin?.fullName || admin?.email || "Admin",
    },
    generatedAt: new Date().toISOString(),
    inventory: {
      healthScore,
      inStock: inStock.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      status: healthScore >= 80 ? "Healthy" : healthScore >= 50 ? "Warning" : "Critical",
    },
    kpis: {
      averageOrderValue: paidOrders.length ? rangeRevenue / paidOrders.length : 0,
      conversionRate,
      pendingFulfillment: orders.filter((order) => !["delivered", "cancelled", "refunded"].includes(order.status)).length,
      revenueToday: todayRevenue,
      revenueTrend: previousRevenue ? ((rangeRevenue - previousRevenue) / previousRevenue) * 100 : null,
      totalOrders: orders.length,
      visitors,
    },
    latestOrders: latestOrders.map(toLatestOrder),
    lowStockAlerts: [...lowStock, ...outOfStock].sort((a, b) => a.stock_quantity - b.stock_quantity).slice(0, 6),
    orderStatuses: Object.fromEntries(ORDER_STATUSES.map((status) => [status, orders.filter((order) => normalizedStatus(order) === status).length])),
    range: {
      from: range.from.toISOString(),
      key: range.key,
      label: range.label,
      to: range.to.toISOString(),
    },
    recentCustomers: customers.map((customer) => ({
      email: customer.email,
      id: customer.id,
      joinedAt: iso(customer.created_at),
      name: [customer.first_name, customer.last_name].filter(Boolean).join(" ") || customer.email,
    })),
    revenueChart: trendWithPrevious(paidOrders, previousPaid, range),
    topProducts: productStats.slice(0, 6),
  }
}

function resolveRange(input: { from?: string | null; range?: string | null; to?: string | null }) {
  const now = new Date()
  const key = (input.range ?? "7d") as RangeKey
  let from = new Date(now)
  if (key === "1d") from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  else if (key === "1m") from.setMonth(now.getMonth() - 1)
  else if (key === "1y") from.setFullYear(now.getFullYear() - 1)
  else if (key === "custom" && input.from) from = new Date(input.from)
  else from.setDate(now.getDate() - 7)
  const to = key === "custom" && input.to ? new Date(input.to) : now
  const span = Math.max(86_400_000, to.getTime() - from.getTime())
  return { from, key, label: key === "custom" ? "Custom" : key.toUpperCase(), previousFrom: new Date(from.getTime() - span), to }
}

async function countVisitors(range: { from: Date; to: Date }) {
  const [table] = await orycmsPrisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'storefront_events'
    ) AS exists
  `
  if (!table?.exists) return null
  const [row] = await orycmsPrisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(DISTINCT COALESCE(session_id, user_id::text, id::text)) AS count
    FROM storefront_events
    WHERE created_at >= ${range.from} AND created_at <= ${range.to}
      AND event IN ('page_view', 'product_view', 'visit')
  `
  return Number(row?.count ?? 0)
}

function trendWithPrevious(current: OrderRow[], previous: OrderRow[], range: { from: Date; to: Date }) {
  const labels = labelsFor(range)
  const previousLabels = labelsFor({ from: new Date(range.from.getTime() - (range.to.getTime() - range.from.getTime())), to: range.from })
  const currentMap = groupRevenueByLabel(current, range)
  const previousMap = groupRevenueByLabel(previous, { from: previousLabels[0]?.date ?? range.from, to: range.from })
  return labels.map((item, index) => ({
    label: item.label,
    previous: previousMap.get(previousLabels[index]?.key ?? "") ?? 0,
    value: currentMap.get(item.key) ?? 0,
  }))
}

function labelsFor(range: { from: Date; to: Date }) {
  const days = Math.max(1, Math.ceil((range.to.getTime() - range.from.getTime()) / 86_400_000))
  if (days <= 1) {
    return Array.from({ length: 24 }, (_, hour) => {
      const date = new Date(range.from)
      date.setHours(hour, 0, 0, 0)
      return { date, key: `${date.toISOString().slice(0, 10)}-${hour}`, label: `${hour}:00` }
    })
  }
  if (days > 92) {
    const labels: { date: Date; key: string; label: string }[] = []
    const cursor = new Date(range.from.getFullYear(), range.from.getMonth(), 1)
    while (cursor <= range.to) {
      labels.push({ date: new Date(cursor), key: `${cursor.getFullYear()}-${cursor.getMonth()}`, label: cursor.toLocaleDateString("en-IN", { month: "short" }) })
      cursor.setMonth(cursor.getMonth() + 1)
    }
    return labels
  }
  return Array.from({ length: days + 1 }, (_, index) => {
    const date = new Date(range.from)
    date.setDate(date.getDate() + index)
    return { date, key: date.toISOString().slice(0, 10), label: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) }
  })
}

function groupRevenueByLabel(orders: OrderRow[], range: { from: Date; to: Date }) {
  const days = Math.max(1, Math.ceil((range.to.getTime() - range.from.getTime()) / 86_400_000))
  const map = new Map<string, number>()
  for (const order of orders) {
    const date = new Date(order.created_at)
    const key = days <= 1
      ? `${date.toISOString().slice(0, 10)}-${date.getHours()}`
      : days > 92
        ? `${date.getFullYear()}-${date.getMonth()}`
        : date.toISOString().slice(0, 10)
    map.set(key, (map.get(key) ?? 0) + Number(order.total))
  }
  return map
}

function topProducts(items: OrderItem[], products: ProductRow[]) {
  const map = new Map<string, { name: string; revenue: number; sku: string; sold: number }>()
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId || p.id === item.id || p.name.toLowerCase() === item.name.toLowerCase())
    const key = product?.id ?? item.name
    const current = map.get(key) ?? { name: product?.name ?? item.name, revenue: 0, sku: product?.sku ?? "—", sold: 0 }
    current.sold += item.quantity
    current.revenue += item.quantity * item.price
    map.set(key, current)
  }
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
}

function orderItems(order: OrderRow): OrderItem[] {
  return Array.isArray(order.items) ? order.items.map((item) => {
    const value = item as Record<string, unknown>
    return {
      id: text(value.id),
      name: text(value.name) || "Unknown product",
      price: Number(value.price ?? 0),
      productId: text(value.productId),
      quantity: Math.max(1, Number(value.quantity ?? value.qty ?? 1)),
    }
  }) : []
}

function toLatestOrder(order: OrderRow) {
  const contact = asRecord(order.contact)
  const firstName = text(contact.firstName)
  const lastName = text(contact.lastName)
  const email = text(contact.email)
  return {
    createdAt: iso(order.created_at),
    customerName: [firstName, lastName].filter(Boolean).join(" ") || email || "Guest customer",
    id: order.id,
    number: order.number,
    paymentStatus: order.payment_status,
    status: normalizedStatus(order),
    total: Number(order.total),
  }
}

function normalizedStatus(order: OrderRow) {
  if (order.refund_status && order.refund_status !== "none") return "refunded"
  return order.status === "payment_pending" ? "pending" : order.status
}

function isRevenueOrder(order: OrderRow) {
  return order.payment_status === "paid" || order.payment_method === "cash_on_delivery"
}

function todayBounds() {
  const now = new Date()
  return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate()), to: now }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0)
}

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : String(value)
}
