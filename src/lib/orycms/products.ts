import type { Prisma } from "@prisma/client"
import { revalidateTag, unstable_cache } from "next/cache"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { deleteOryCMSMediaIfUnreferenced } from "@/lib/orycms/media"
import { notifyLowStockProduct } from "@/lib/orycms/low-stock"
import { sanitizeRichText } from "@/lib/orycms/sanitize-html"
import {
  PRODUCT_STATUSES,
  type OryCMSProductDTO,
  type OryCMSProductInput,
  type PackSizeInput,
  type ProductImageInput,
  type ProductStatus,
} from "./product-utils"

export * from "./product-utils"

type OryCMSProductRow = {
  brand: string | null
  category: string
  created_at: Date
  featured: boolean
  full_description: string | null
  how_to_use: string | null
  id: string
  images: Prisma.JsonValue
  meta_description: string | null
  meta_title: string | null
  name: string
  pack_sizes: Prisma.JsonValue
  price: Prisma.Decimal | number | string
  sale_price: Prisma.Decimal | number | string | null
  shipping_returns: string | null
  short_description: string
  sku: string
  slug: string
  specifications: string | null
  status: string
  stock_quantity: number
  tags: Prisma.JsonValue
  unit: string
  updated_at: Date
}

const fallbackImage =
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80"

const STOREFRONT_PRODUCTS_CACHE_TAG = "storefront-products"

const listPublishedOryCMSProducts = unstable_cache(
  async () => {
    await ensureOryCMSProductsSchema()

    const products = await orycmsPrisma.$queryRaw<OryCMSProductRow[]>`
      SELECT * FROM orycms_products
      WHERE status = 'published' AND deleted_at IS NULL
      ORDER BY featured DESC, updated_at DESC
    `

    return products.map(toProductDTO)
  },
  ["published-orycms-products"],
  { revalidate: 60, tags: [STOREFRONT_PRODUCTS_CACHE_TAG] },
)

export async function listOryCMSProducts(options: { publishedOnly?: boolean } = {}) {
  if (options.publishedOnly) return listPublishedOryCMSProducts()

  await ensureOryCMSProductsSchema()
  const products = await orycmsPrisma.$queryRaw<OryCMSProductRow[]>`
    SELECT * FROM orycms_products
    WHERE deleted_at IS NULL
    ORDER BY featured DESC, updated_at DESC
  `

  return products.map(toProductDTO)
}

export async function getOryCMSProduct(id: string) {
  await ensureOryCMSProductsSchema()

  const [product] = await orycmsPrisma.$queryRaw<OryCMSProductRow[]>`
    SELECT * FROM orycms_products
    WHERE id = ${id}::uuid AND deleted_at IS NULL
    LIMIT 1
  `

  return product ? toProductDTO(product) : null
}

export async function getPublishedOryCMSProductBySlug(slug: string) {
  const publishedProducts = await listPublishedOryCMSProducts()
  const match = publishedProducts.find((p) => p.slug === slug)
  if (match) return match

  await ensureOryCMSProductsSchema()

  const [product] = await orycmsPrisma.$queryRaw<OryCMSProductRow[]>`
    SELECT * FROM orycms_products
    WHERE slug = ${slug} AND status = 'published' AND deleted_at IS NULL
    LIMIT 1
  `

  return product ? toProductDTO(product) : null
}

export async function saveOryCMSProduct(input: OryCMSProductInput, id?: string) {
  await ensureOryCMSProductsSchema()

  const payload = validateProductInput(input)
  const slug = payload.slug || (await nextAlphanumericSlug())
  const data = toPrismaProductData({ ...payload, slug })

  const [product] = id
    ? await orycmsPrisma.$queryRaw<OryCMSProductRow[]>`
        UPDATE orycms_products
        SET
          brand = ${data.brand},
          category = ${data.category},
          featured = ${data.featured},
          full_description = ${data.fullDescription},
          how_to_use = ${data.howToUse},
          images = ${JSON.stringify(payload.images)}::jsonb,
          meta_description = ${data.metaDescription},
          meta_title = ${data.metaTitle},
          name = ${data.name},
          pack_sizes = ${JSON.stringify(payload.packSizes)}::jsonb,
          price = ${data.price},
          sale_price = ${data.salePrice},
          shipping_returns = ${data.shippingReturns},
          short_description = ${data.shortDescription},
          sku = ${data.sku},
          specifications = ${data.specifications},
          status = ${data.status},
          stock_quantity = ${data.stockQuantity},
          tags = ${JSON.stringify(payload.tags)}::jsonb,
          unit = ${data.unit},
          updated_at = now()
        WHERE id = ${id}::uuid
        RETURNING *
      `
    : await orycmsPrisma.$queryRaw<OryCMSProductRow[]>`
        INSERT INTO orycms_products (
          brand,
          category,
          featured,
          full_description,
          how_to_use,
          images,
          meta_description,
          meta_title,
          name,
          pack_sizes,
          price,
          sale_price,
          shipping_returns,
          short_description,
          sku,
          slug,
          specifications,
          status,
          stock_quantity,
          tags,
          unit
        )
        VALUES (
          ${data.brand},
          ${data.category},
          ${data.featured},
          ${data.fullDescription},
          ${data.howToUse},
          ${JSON.stringify(payload.images)}::jsonb,
          ${data.metaDescription},
          ${data.metaTitle},
          ${data.name},
          ${JSON.stringify(payload.packSizes)}::jsonb,
          ${data.price},
          ${data.salePrice},
          ${data.shippingReturns},
          ${data.shortDescription},
          ${data.sku},
          ${slug},
          ${data.specifications},
          ${data.status},
          ${data.stockQuantity},
          ${JSON.stringify(payload.tags)}::jsonb,
          ${data.unit}
        )
        RETURNING *
      `

  if (!product) throw new Error("Product not found.")
  if (product.status === "published") await notifyLowStockProduct(product)

  revalidateStorefrontProducts()
  return toProductDTO(product)
}

export async function deleteOryCMSProduct(id: string) {
  await ensureOryCMSProductsSchema()
  const product = await getOryCMSProduct(id)

  await orycmsPrisma.$executeRaw`
    UPDATE orycms_products
    SET deleted_at = now(),
        slug = slug || '-deleted-' || left(id::text, 8),
        sku = sku || '-deleted-' || left(id::text, 8),
        updated_at = now()
    WHERE id = ${id}::uuid
      AND deleted_at IS NULL
  `

  if (product) {
    const images = Array.from(
      new Map(product.images.map((image) => [image.id ?? image.url, image])).values(),
    )

    for (const image of images) {
      await deleteOryCMSMediaIfUnreferenced({ id: image.id, url: image.url })
    }
  }

  revalidateStorefrontProducts()
}

function revalidateStorefrontProducts() {
  revalidateTag(STOREFRONT_PRODUCTS_CACHE_TAG, { expire: 0 })
}

export async function bulkDeleteOryCMSProducts(ids: string[]) {
  await Promise.all(ids.filter(Boolean).map((id) => deleteOryCMSProduct(id)))
}

export async function listOryCMSProductCategories() {
  const products = await listOryCMSProducts()
  return Array.from(
    new Set([
      "Fertilizers",
      "Organic",
      "Bio Products",
      "Soil Care",
      "Pest Management",
      "Irrigation",
      ...products.map((product) => product.category).filter(Boolean),
    ]),
  )
}

export async function listOryCMSProductMedia() {
  try {
    const assets = await orycmsPrisma.oryCMSMediaAsset.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        originalFilename: true,
        secureUrl: true,
      },
      take: 100,
    })

    return assets.map((asset) => ({
      id: asset.id,
      name: asset.originalFilename ?? asset.id,
      url: asset.secureUrl,
    }))
  } catch {
    return []
  }
}

function validateProductInput(input: OryCMSProductInput) {
  const normalized: OryCMSProductInput = {
    ...input,
    brand: input.brand?.trim(),
    category: input.category.trim(),
    fullDescription: sanitizeRichText(input.fullDescription),
    howToUse: sanitizeRichText(input.howToUse),
    images: input.images.filter((image) => image.url.trim()),
    metaDescription: input.metaDescription?.trim(),
    metaTitle: input.metaTitle?.trim(),
    name: input.name.trim(),
    packSizes: input.packSizes
      .map((pack) => ({ price: Number(pack.price), size: pack.size.trim() }))
      .filter((pack) => pack.size && Number.isFinite(pack.price)),
    price: Number(input.price),
    salePrice: input.salePrice ? Number(input.salePrice) : null,
    shippingReturns: sanitizeRichText(input.shippingReturns),
    shortDescription: input.shortDescription.trim(),
    sku: input.sku.trim(),
    slug: input.slug?.trim(),
    specifications: sanitizeRichText(input.specifications),
    stockQuantity: Number(input.stockQuantity),
    tags: input.tags.map((tag) => tag.trim()).filter(Boolean),
    unit: input.unit.trim(),
  }

  const required = [
    ["Product Name", normalized.name],
    ["Short Description", normalized.shortDescription],
    ["Category", normalized.category],
    ["SKU", normalized.sku],
    ["Unit", normalized.unit],
  ] as const

  for (const [label, value] of required) {
    if (!value) throw new Error(`${label} is required.`)
  }

  if (normalized.shortDescription.length > 85) {
    throw new Error("Short Description must be 85 characters or fewer.")
  }

  if (!Number.isFinite(normalized.price) || normalized.price <= 0) throw new Error("Price is required.")
  if (!Number.isFinite(normalized.stockQuantity) || normalized.stockQuantity < 0) {
    throw new Error("Stock quantity is required.")
  }
  if (!PRODUCT_STATUSES.includes(normalized.status)) throw new Error("Invalid product status.")

  return normalized
}

async function nextAlphanumericSlug() {
  for (let index = 0; index < 5; index++) {
    const slug = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 14)
      .padEnd(10, "0")
      .toLowerCase()

    const [match] = await orycmsPrisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM orycms_products
      WHERE slug = ${slug}
      LIMIT 1
    `
    if (!match) return slug
  }

  throw new Error("Could not generate a unique product slug.")
}

function toPrismaProductData(input: OryCMSProductInput & { slug: string }) {
  return {
    brand: input.brand || null,
    category: input.category,
    featured: input.featured,
    fullDescription: input.fullDescription || null,
    howToUse: input.howToUse || null,
    images: input.images as unknown as Prisma.InputJsonValue,
    metaDescription: input.metaDescription || null,
    metaTitle: input.metaTitle || null,
    name: input.name,
    packSizes: input.packSizes as unknown as Prisma.InputJsonValue,
    price: input.price,
    salePrice: input.salePrice || null,
    shippingReturns: input.shippingReturns || null,
    shortDescription: input.shortDescription,
    sku: input.sku,
    slug: input.slug,
    specifications: input.specifications || null,
    status: input.status,
    stockQuantity: input.stockQuantity,
    tags: input.tags as unknown as Prisma.InputJsonValue,
    unit: input.unit,
  }
}

function toProductDTO(product: OryCMSProductRow): OryCMSProductDTO {
  return {
    brand: product.brand ?? "",
    category: product.category,
    createdAt: new Date(product.created_at).toISOString(),
    featured: product.featured,
    fullDescription: product.full_description ?? "",
    howToUse: product.how_to_use ?? "",
    id: product.id,
    images: normalizeImages(product.images),
    metaDescription: product.meta_description ?? "",
    metaTitle: product.meta_title ?? "",
    name: product.name,
    packSizes: normalizePackSizes(product.pack_sizes),
    price: Number(product.price),
    salePrice: product.sale_price ? Number(product.sale_price) : null,
    shippingReturns: product.shipping_returns ?? "",
    shortDescription: product.short_description,
    sku: product.sku,
    slug: product.slug,
    specifications: product.specifications ?? "",
    status: product.status as ProductStatus,
    stockQuantity: product.stock_quantity,
    tags: normalizeTags(product.tags),
    unit: product.unit,
    updatedAt: new Date(product.updated_at).toISOString(),
  }
}

function normalizeImages(value: Prisma.JsonValue): ProductImageInput[] {
  return Array.isArray(value)
    ? value
        .map((item) => item as ProductImageInput & { secure_url?: string; original_filename?: string })
        .map((item) => ({
          id: item.id,
          name: item.name ?? item.original_filename,
          url: item.url ?? item.secure_url ?? "",
        }))
        .filter((item) => item.url)
    : []
}

function normalizePackSizes(value: Prisma.JsonValue): PackSizeInput[] {
  return Array.isArray(value)
    ? value
        .map((item) => item as PackSizeInput)
        .filter((item) => typeof item?.size === "string" && Number.isFinite(Number(item.price)))
        .map((item) => ({ price: Number(item.price), size: item.size }))
    : []
}

function normalizeTags(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

export function productPrimaryImage(product: Pick<OryCMSProductDTO, "images">) {
  return product.images[0]?.url || fallbackImage
}

export function ensureProductImages(product: OryCMSProductDTO) {
  const image = productPrimaryImage(product)
  return product.images.length ? product.images : [{ name: product.name, url: image }]
}

export async function ensureOryCMSProductsSchema() {
  // Database structure is managed by Prisma migrations.
}

export async function getBestSellingProducts(allProducts: OryCMSProductDTO[]): Promise<OryCMSProductDTO[]> {
  try {
    const orders = await orycmsPrisma.$queryRaw<Array<{ items: Prisma.JsonValue }>>`
      SELECT items FROM storefront_orders
      WHERE status NOT IN ('cancelled', 'refunded')
    `

    const salesMap = new Map<string, number>()

    for (const order of orders) {
      if (!Array.isArray(order.items)) continue
      for (const rawItem of order.items) {
        if (typeof rawItem === "object" && rawItem !== null && !Array.isArray(rawItem)) {
          const item = rawItem as Record<string, unknown>
          const qty = typeof item.quantity === "number" ? item.quantity : 1
          const keys = [
            typeof item.productId === "string" ? item.productId.trim().toLowerCase() : "",
            typeof item.slug === "string" ? item.slug.trim().toLowerCase() : "",
            typeof item.id === "string" ? item.id.trim().toLowerCase() : "",
            typeof item.name === "string" ? item.name.trim().toLowerCase() : "",
          ].filter(Boolean)

          for (const key of keys) {
            salesMap.set(key, (salesMap.get(key) || 0) + qty)
          }
        }
      }
    }

    const sorted = [...allProducts].sort((a, b) => {
      const salesA =
        (salesMap.get(a.id.toLowerCase()) || 0) +
        (salesMap.get(a.slug.toLowerCase()) || 0) +
        (salesMap.get(a.name.toLowerCase()) || 0)
      const salesB =
        (salesMap.get(b.id.toLowerCase()) || 0) +
        (salesMap.get(b.slug.toLowerCase()) || 0) +
        (salesMap.get(b.name.toLowerCase()) || 0)

      if (salesB !== salesA) return salesB - salesA
      if (a.featured !== b.featured) return a.featured ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return sorted
  } catch {
    return [...allProducts].sort((a, b) => (a.featured !== b.featured ? (a.featured ? -1 : 1) : 0))
  }
}
