import { ensureStorefrontAuthSchema } from "@/lib/storefront-auth"
import { ensureOryCMSProductsSchema } from "@/lib/orycms/products"
import { LOW_STOCK_THRESHOLD } from "@/lib/orycms/low-stock"
import { orycmsPrisma } from "@/lib/orycms/prisma"

type RangeKey = "today" | "7d" | "30d" | "90d" | "month" | "year" | "custom"

type OrderRow = {
  cancelled_at: Date | string | null
  created_at: Date | string
  discount_total: number | string
  id: string
  items: unknown
  payment_method: string
  payment_status: string
  refund_status: string
  shipping_address: unknown
  status: string
  total: number | string
  user_id: string
}

type CustomerRow = { created_at: Date | string; email: string; first_name: string; id: string; last_name: string }

type ProductRow = {
  category: string
  id: string
  name: string
  price: number | string
  sku: string
  status: string
  stock_quantity: number
}

type OrderItem = { id?: string; name: string; price: number; quantity: number; size?: string }

export async function getOryCMSAnalyticsInsights(input: { from?: string | null; range?: string | null; to?: string | null }) {
  await ensureStorefrontAuthSchema()
  await ensureOryCMSProductsSchema()
  const range = resolveRange(input)
  // Independent reads — run concurrently rather than as a serial waterfall.
  const [orders, previousOrders, customers, allCustomers, products] = await Promise.all([
    orycmsPrisma.$queryRaw<OrderRow[]>`
      SELECT id, user_id, status, payment_status, payment_method, refund_status, cancelled_at,
             shipping_address, discount_total, items, total, created_at
      FROM storefront_orders
      WHERE created_at >= ${range.from} AND created_at <= ${range.to}
      ORDER BY created_at ASC
    `,
    orycmsPrisma.$queryRaw<OrderRow[]>`
      SELECT id, user_id, status, payment_status, payment_method, refund_status, cancelled_at,
             shipping_address, discount_total, items, total, created_at
      FROM storefront_orders
      WHERE created_at >= ${range.previousFrom} AND created_at < ${range.from}
    `,
    orycmsPrisma.$queryRaw<CustomerRow[]>`
      SELECT id, first_name, last_name, email, created_at
      FROM storefront_users
      WHERE deleted_at IS NULL AND created_at >= ${range.from} AND created_at <= ${range.to}
    `,
    orycmsPrisma.$queryRaw<CustomerRow[]>`
      SELECT id, first_name, last_name, email, created_at
      FROM storefront_users
      WHERE deleted_at IS NULL
    `,
    orycmsPrisma.$queryRaw<ProductRow[]>`
      SELECT id, name, sku, category, price, stock_quantity, status
      FROM orycms_products
      WHERE deleted_at IS NULL
    `,
  ])

  const paidOrders = orders.filter(isRevenueOrder)
  const previousPaid = previousOrders.filter(isRevenueOrder)
  const items = paidOrders.flatMap(orderItems)
  const productStats = aggregateProducts(items, products)
  const categoryStats = aggregateCategories(productStats)
  const revenue = sum(paidOrders.map((order) => Number(order.total)))
  const previousRevenue = sum(previousPaid.map((order) => Number(order.total)))
  const today = todayBounds()
  const todayOrders = orders.filter((order) => between(new Date(order.created_at), today.from, today.to))
  const todayPaid = todayOrders.filter(isRevenueOrder)
  const returningCustomers = new Set(paidOrders.map((order) => order.user_id)).size - new Set(customers.map((customer) => customer.id)).size
  const cancelled = orders.filter((order) => order.status === "cancelled" || order.cancelled_at).length
  const refunded = orders.filter((order) => order.refund_status && order.refund_status !== "none").length
  const paymentMethods = groupCount(paidOrders, (order) => order.payment_method)
  const peakHours = groupRevenue(paidOrders, (order) => `${new Date(order.created_at).getHours()}:00`)
  const peakDays = groupRevenue(paidOrders, (order) => new Date(order.created_at).toLocaleDateString("en-IN", { weekday: "long" }))
  const geo = groupRevenue(paidOrders, (order) => text((order.shipping_address as Record<string, unknown> | null)?.state) || "Unknown")
  const lowStock = products.filter((product) => product.stock_quantity > 0 && product.stock_quantity <= LOW_STOCK_THRESHOLD)
  const outOfStock = products.filter((product) => product.stock_quantity <= 0)
  const fastMoving = productStats.filter((p) => p.quantity >= 5).sort(byQuantity)
  const deadStock = products
    .filter((product) => !productStats.some((stat) => stat.id === product.id || stat.name === product.name))
    .map((product) => ({ id: product.id, name: product.name, quantity: 0, revenue: 0, stock: product.stock_quantity }))

  return {
    cards: {
      averageOrderValue: paidOrders.length ? revenue / paidOrders.length : 0,
      conversionRate: null,
      newCustomers: customers.length,
      ordersToday: todayOrders.length,
      productsSold: sum(items.map((item) => item.quantity)),
      returningCustomers: Math.max(0, returningCustomers),
      todaysSales: sum(todayPaid.map((order) => Number(order.total))),
      totalRevenue: revenue,
    },
    charts: {
      categorySales: categoryStats.slice(0, 10),
      customerGrowth: trend(allCustomers.filter((customer) => between(new Date(customer.created_at), range.from, range.to)), (customer) => 1, range),
      geographicSales: geo.slice(0, 10),
      ordersTrend: trend(orders, () => 1, range),
      paymentBreakdown: paymentMethods,
      revenueTrend: trend(paidOrders, (order) => Number(order.total), range),
      salesTrend: trend(paidOrders, (order) => Number(order.total), range),
      topProducts: productStats.slice(0, 10),
    },
    generatedAt: new Date().toISOString(),
    insights: {
      bestSellingProducts: productStats.slice(0, 10),
      cartAbandonmentRate: null,
      couponUsage: { discountedOrders: orders.filter((order) => Number(order.discount_total) > 0).length, discountTotal: sum(orders.map((order) => Number(order.discount_total))) },
      fastMovingProducts: fastMoving.slice(0, 10),
      highestRevenueCategories: categoryStats.slice(0, 10),
      highestRevenueProducts: [...productStats].sort(byRevenue).slice(0, 10),
      lowConversionProducts: [],
      lowStockProducts: lowStock,
      mostAddedToCartProducts: [],
      mostViewedProducts: [],
      outOfStockProducts: outOfStock,
      paymentMethodDistribution: paymentMethods,
      peakSalesDays: peakDays.slice(0, 7),
      peakSalesHours: peakHours.slice(0, 8),
      refundCancellation: { cancelled, cancellationRate: orders.length ? (cancelled / orders.length) * 100 : 0, refunded, refundRate: orders.length ? (refunded / orders.length) * 100 : 0 },
      slowMovingDeadStock: deadStock.slice(0, 10),
      topCustomers: topCustomers(paidOrders, allCustomers),
    },
    meta: {
      note: "Product views, add-to-cart events, conversion rate, and cart abandonment require storefront event tracking. No mock values are used.",
      range: { from: range.from.toISOString(), key: range.key, label: range.label, to: range.to.toISOString() },
      revenueChangePercent: previousRevenue ? ((revenue - previousRevenue) / previousRevenue) * 100 : null,
    },
    recommendations: buildRecommendations({ categoryStats, deadStock, lowStock, outOfStock, productStats, revenue, revenueChange: previousRevenue ? ((revenue - previousRevenue) / previousRevenue) * 100 : null }),
  }
}

function resolveRange(input: { from?: string | null; range?: string | null; to?: string | null }) {
  const now = new Date()
  const key = (input.range ?? "30d") as RangeKey
  let from = new Date(now)
  if (key === "today") from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  else if (key === "7d") from.setDate(now.getDate() - 7)
  else if (key === "90d") from.setDate(now.getDate() - 90)
  else if (key === "month") from = new Date(now.getFullYear(), now.getMonth(), 1)
  else if (key === "year") from = new Date(now.getFullYear(), 0, 1)
  else if (key === "custom" && input.from) from = new Date(input.from)
  else from.setDate(now.getDate() - 30)
  const to = key === "custom" && input.to ? new Date(input.to) : now
  const span = to.getTime() - from.getTime()
  return { from, key, label: rangeLabel(key), previousFrom: new Date(from.getTime() - span), to }
}

function orderItems(order: OrderRow): OrderItem[] {
  const raw = Array.isArray(order.items) ? order.items : []
  return raw.map((item) => {
    const value = item as Record<string, unknown>
    return {
      id: text(value.id),
      name: text(value.name) || "Unknown product",
      price: Number(value.price ?? 0),
      quantity: Number(value.quantity ?? value.qty ?? 1),
      size: text(value.size),
    }
  })
}

function aggregateProducts(items: OrderItem[], products: ProductRow[]) {
  const map = new Map<string, { category: string; id: string; name: string; quantity: number; revenue: number; stock: number }>()
  for (const item of items) {
    const product = products.find((p) => p.id === item.id || p.name.toLowerCase() === item.name.toLowerCase())
    const key = product?.id ?? item.name
    const current = map.get(key) ?? { category: product?.category ?? "Uncategorized", id: product?.id ?? key, name: product?.name ?? item.name, quantity: 0, revenue: 0, stock: product?.stock_quantity ?? 0 }
    current.quantity += item.quantity
    current.revenue += item.quantity * item.price
    map.set(key, current)
  }
  return Array.from(map.values()).sort(byRevenue)
}

function aggregateCategories(products: ReturnType<typeof aggregateProducts>) {
  const map = new Map<string, { name: string; quantity: number; revenue: number }>()
  for (const product of products) {
    const current = map.get(product.category) ?? { name: product.category, quantity: 0, revenue: 0 }
    current.quantity += product.quantity
    current.revenue += product.revenue
    map.set(product.category, current)
  }
  return Array.from(map.values()).sort(byRevenue)
}

function topCustomers(orders: OrderRow[], customers: CustomerRow[]) {
  const map = new Map<string, { email: string; name: string; orders: number; revenue: number }>()
  for (const order of orders) {
    const customer = customers.find((item) => item.id === order.user_id)
    const current = map.get(order.user_id) ?? { email: customer?.email ?? "Unknown", name: customer ? `${customer.first_name} ${customer.last_name}`.trim() : "Unknown customer", orders: 0, revenue: 0 }
    current.orders += 1
    current.revenue += Number(order.total)
    map.set(order.user_id, current)
  }
  return Array.from(map.values()).sort(byRevenue).slice(0, 10)
}

function trend<T extends { created_at?: Date | string; createdAt?: Date | string }>(rows: T[], value: (row: T) => number, range: { from: Date; to: Date }) {
  const days = Math.max(1, Math.ceil((range.to.getTime() - range.from.getTime()) / 86_400_000))
  const monthly = days > 120
  const map = new Map<string, number>()
  for (const row of rows) {
    const date = new Date(String(row.created_at ?? row.createdAt))
    const key = monthly ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` : date.toISOString().slice(0, 10)
    map.set(key, (map.get(key) ?? 0) + value(row))
  }
  return Array.from(map.entries()).map(([label, total]) => ({ label, total })).sort((a, b) => a.label.localeCompare(b.label))
}

function buildRecommendations(input: { categoryStats: { name: string; revenue: number }[]; deadStock: { name: string; stock: number }[]; lowStock: ProductRow[]; outOfStock: ProductRow[]; productStats: { name: string; quantity: number; revenue: number; stock: number }[]; revenue: number; revenueChange: number | null }) {
  const recs: { action: string; detail: string; priority: "High" | "Medium" | "Low"; title: string }[] = []
  input.outOfStock.slice(0, 3).forEach((p) => recs.push({ action: "Restock immediately", detail: `${p.name} is out of stock.`, priority: "High", title: "Inventory shortage" }))
  input.lowStock.slice(0, 3).forEach((p) => recs.push({ action: "Plan purchase order", detail: `${p.name} has only ${p.stock_quantity} units left.`, priority: "Medium", title: "Low stock risk" }))
  input.deadStock.slice(0, 3).forEach((p) => recs.push({ action: "Offer discount or bundle", detail: `${p.name} has stock but no sales in this period.`, priority: "Medium", title: "Dead stock" }))
  input.productStats.slice(0, 3).forEach((p) => p.stock < Math.max(5, p.quantity * 2) && recs.push({ action: "Restock before next cycle", detail: `${p.name} sold ${p.quantity} units and has ${p.stock} left.`, priority: "High", title: "Fast mover shortage prediction" }))
  if (input.revenueChange !== null && input.revenueChange < -25) recs.push({ action: "Review campaigns and checkout failures", detail: `Revenue dropped ${Math.abs(input.revenueChange).toFixed(1)}% versus the previous period.`, priority: "High", title: "Unusual sales drop" })
  if (input.revenueChange !== null && input.revenueChange > 40) recs.push({ action: "Increase stock for winners", detail: `Revenue spiked ${input.revenueChange.toFixed(1)}% versus the previous period.`, priority: "Medium", title: "Sales spike detected" })
  if (input.categoryStats[0]) recs.push({ action: "Promote adjacent products", detail: `${input.categoryStats[0].name} is the highest revenue category. Use bundles/cross-sell.`, priority: "Low", title: "Cross-sell opportunity" })
  if (recs.length === 0) recs.push({ action: "Keep monitoring live order flow", detail: "No urgent sales or inventory issues detected in this period.", priority: "Low", title: "Business health stable" })
  return recs
}

function groupRevenue(orders: OrderRow[], keyFn: (order: OrderRow) => string) {
  const map = new Map<string, { name: string; orders: number; revenue: number }>()
  for (const order of orders) {
    const key = keyFn(order)
    const current = map.get(key) ?? { name: key, orders: 0, revenue: 0 }
    current.orders += 1
    current.revenue += Number(order.total)
    map.set(key, current)
  }
  return Array.from(map.values()).sort(byRevenue)
}

function groupCount(orders: OrderRow[], keyFn: (order: OrderRow) => string) {
  const map = new Map<string, { count: number; name: string }>()
  for (const order of orders) {
    const key = keyFn(order) || "Unknown"
    const current = map.get(key) ?? { count: 0, name: key }
    current.count += 1
    map.set(key, current)
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count)
}

function isRevenueOrder(order: OrderRow) {
  return order.payment_status === "paid" || order.payment_method === "cash_on_delivery"
}

function todayBounds() {
  const now = new Date()
  return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate()), to: now }
}

function between(value: Date, from: Date, to: Date) {
  return value >= from && value <= to
}

function byRevenue<T extends { revenue: number }>(a: T, b: T) {
  return b.revenue - a.revenue
}

function byQuantity<T extends { quantity: number }>(a: T, b: T) {
  return b.quantity - a.quantity
}

function rangeLabel(key: RangeKey) {
  return ({ today: "Today", "7d": "Last 7 Days", "30d": "Last 30 Days", "90d": "Last 90 Days", month: "This Month", year: "This Year", custom: "Custom Range" } as Record<RangeKey, string>)[key]
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + Number(value || 0), 0)
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}
