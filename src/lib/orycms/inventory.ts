import { ensureOryCMSProductsSchema } from "@/lib/orycms/products"
import { LOW_STOCK_THRESHOLD } from "@/lib/orycms/low-stock"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { ensureStorefrontAuthSchema } from "@/lib/storefront-auth"

type ProductRow = {
  brand: string | null
  category: string
  created_at: Date | string
  id: string
  images: unknown
  name: string
  pack_sizes: unknown
  price: number | string
  sku: string
  stock_quantity: number
  updated_at: Date | string
}

type OrderRow = {
  created_at: Date | string
  id: string
  items: unknown
  number: string
  payment_method: string
  payment_status: string
  status: string
  stock_released_at: Date | string | null
}

type InventoryEventRow = {
  created_at: Date | string
  id: string
  product_id: string | null
  quantity: number
  reason: string | null
  type: string
  updated_by: string | null
}

const REORDER_LEVEL = LOW_STOCK_THRESHOLD

export async function getOryCMSInventoryData() {
  await ensureStorefrontAuthSchema()
  await ensureOryCMSProductsSchema()
  await ensureInventoryEventsSchema()

  const [products, orders, events] = await Promise.all([
    orycmsPrisma.$queryRaw<ProductRow[]>`
      SELECT id, name, sku, category, brand, price, pack_sizes, images, stock_quantity, created_at, updated_at
      FROM orycms_products
      WHERE deleted_at IS NULL
      ORDER BY updated_at DESC
    `,
    orycmsPrisma.$queryRaw<OrderRow[]>`
      SELECT id, number, status, payment_status, payment_method, stock_released_at, items, created_at
      FROM storefront_orders
      ORDER BY created_at DESC
    `,
    orycmsPrisma.$queryRaw<InventoryEventRow[]>`
      SELECT id, product_id, type, quantity, reason, updated_by, created_at
      FROM orycms_inventory_events
      ORDER BY created_at DESC
      LIMIT 100
    `,
  ])

  const reserved = new Map<string, number>()
  const sold = new Map<string, number>()
  const history = [...events.map(toEventHistory)]

  for (const order of orders) {
    const items = orderItems(order)
    const reserveActive = order.payment_method === "razorpay"
      && ["pending_payment", "failed"].includes(order.payment_status)
      && !order.stock_released_at
    const sale = order.payment_status === "paid" || order.payment_method === "cash_on_delivery"
    const returned = order.status === "cancelled" || order.status === "refunded"

    for (const item of items) {
      const key = item.productId || item.id || item.name
      if (!key) continue
      if (reserveActive) reserved.set(key, (reserved.get(key) ?? 0) + item.quantity)
      if (sale) sold.set(key, (sold.get(key) ?? 0) + item.quantity)
      if (sale) history.push(toOrderHistory(order, item, "Order Sales", -item.quantity))
      if (returned) history.push(toOrderHistory(order, item, "Returns", item.quantity))
    }
  }

  const items = products.map((product) => {
    const productReserved = lookup(reserved, product, 0)
    const unitsSold = lookup(sold, product, 0)
    const availableStock = Math.max(0, Number(product.stock_quantity))
    const currentStock = availableStock + productReserved
    const status = availableStock <= 0 ? "Out of Stock" : availableStock <= REORDER_LEVEL ? "Low Stock" : "In Stock"
    const lastRestock = events.find((event) => event.product_id === product.id && event.type === "stock_in")?.created_at
    const packSizes = asArray(product.pack_sizes)
      .map((item) => {
        const row = item as Record<string, unknown>
        return [text(row.size), row.price ? `₹${Number(row.price).toLocaleString("en-IN")}` : ""].filter(Boolean).join(" · ")
      })
      .filter(Boolean)

    return {
      availableStock,
      brand: product.brand ?? "",
      category: product.category,
      currentStock,
      id: product.id,
      image: primaryImage(product.images),
      inventoryValue: availableStock * Number(product.price),
      lastRestocked: lastRestock ? iso(lastRestock) : null,
      lastUpdated: iso(product.updated_at),
      packSize: packSizes.join(", ") || "Default",
      productName: product.name,
      reorderLevel: REORDER_LEVEL,
      reservedStock: productReserved,
      sku: product.sku,
      stockStatus: status,
      unitsSold,
    }
  })

  return {
    alerts: items.filter((item) => item.stockStatus !== "In Stock").sort((a, b) => a.availableStock - b.availableStock),
    cards: {
      inventoryValue: items.reduce((sum, item) => sum + item.inventoryValue, 0),
      lowStockProducts: items.filter((item) => item.stockStatus === "Low Stock").length,
      outOfStockProducts: items.filter((item) => item.stockStatus === "Out of Stock").length,
      totalProducts: items.length,
      totalStock: items.reduce((sum, item) => sum + item.currentStock, 0),
      totalUnitsSold: items.reduce((sum, item) => sum + item.unitsSold, 0),
    },
    filters: {
      brands: Array.from(new Set(items.map((item) => item.brand).filter(Boolean))).sort(),
      categories: Array.from(new Set(items.map((item) => item.category).filter(Boolean))).sort(),
    },
    generatedAt: new Date().toISOString(),
    history: history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 100),
    items,
  }
}

async function ensureInventoryEventsSchema() {
  await orycmsPrisma.$executeRawUnsafe(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE IF NOT EXISTS orycms_inventory_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id uuid,
      type text NOT NULL,
      quantity integer NOT NULL DEFAULT 0,
      reason text,
      updated_by text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS orycms_inventory_events_product_id_idx ON orycms_inventory_events (product_id);
    CREATE INDEX IF NOT EXISTS orycms_inventory_events_created_at_idx ON orycms_inventory_events (created_at);
  `)
}

function orderItems(order: OrderRow) {
  return asArray(order.items).map((item) => {
    const value = item as Record<string, unknown>
    return {
      id: text(value.id),
      name: text(value.name) || "Unknown product",
      productId: text(value.productId),
      quantity: Math.max(1, Number(value.quantity ?? value.qty ?? 1)),
    }
  })
}

function lookup(map: Map<string, number>, product: ProductRow, fallback: number) {
  return map.get(product.id) ?? map.get(product.sku) ?? map.get(product.name) ?? fallback
}

function toEventHistory(event: InventoryEventRow) {
  return {
    id: event.id,
    productId: event.product_id,
    quantity: Number(event.quantity),
    timestamp: iso(event.created_at),
    type: label(event.type),
    updatedBy: event.updated_by || "OryCMS",
    reason: event.reason || "Inventory update",
  }
}

function toOrderHistory(order: OrderRow, item: ReturnType<typeof orderItems>[number], type: string, quantity: number) {
  return {
    id: `${order.id}-${type}-${item.productId || item.id || item.name}`,
    productId: item.productId || item.id || null,
    productName: item.name,
    quantity,
    reason: `${order.number} · ${label(order.status)}`,
    timestamp: iso(order.created_at),
    type,
    updatedBy: "Storefront order",
  }
}

function primaryImage(images: unknown) {
  const first = asArray(images)[0] as Record<string, unknown> | undefined
  return text(first?.url)
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (typeof value === "object" && value !== null && "items" in value && Array.isArray((value as Record<string, unknown>).items)) {
    return (value as Record<string, unknown>).items as unknown[]
  }
  return []
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : String(value)
}
