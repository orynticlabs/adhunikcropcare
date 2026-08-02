import { Prisma } from "@prisma/client"
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
  deleted_at: Date | null
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

export async function listOryCMSProducts(options: { publishedOnly?: boolean; trashOnly?: boolean } = {}) {
  if (options.publishedOnly) return listPublishedOryCMSProducts()

  await ensureOryCMSProductsSchema()
  const products = options.trashOnly
    ? await orycmsPrisma.$queryRaw<OryCMSProductRow[]>`
        SELECT * FROM orycms_products
        WHERE deleted_at IS NOT NULL
        ORDER BY deleted_at DESC
      `
    : await orycmsPrisma.$queryRaw<OryCMSProductRow[]>`
        SELECT * FROM orycms_products
        WHERE deleted_at IS NULL
        ORDER BY featured DESC, updated_at DESC
      `

  return products.map(toProductDTO)
}

export async function getOryCMSProduct(id: string, includeDeleted = false) {
  await ensureOryCMSProductsSchema()

  const [product] = includeDeleted
    ? await orycmsPrisma.$queryRaw<OryCMSProductRow[]>`
        SELECT * FROM orycms_products
        WHERE id = ${id}::uuid
        LIMIT 1
      `
    : await orycmsPrisma.$queryRaw<OryCMSProductRow[]>`
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

  await orycmsPrisma.$executeRaw`
    UPDATE orycms_products
    SET deleted_at = now(),
        updated_at = now()
    WHERE id = ${id}::uuid
      AND deleted_at IS NULL
  `

  revalidateStorefrontProducts()
}

function revalidateStorefrontProducts() {
  revalidateTag(STOREFRONT_PRODUCTS_CACHE_TAG, { expire: 0 })
}

export async function bulkDeleteOryCMSProducts(ids: string[]) {
  const validIds = ids.filter(Boolean)
  if (validIds.length === 0) return

  await orycmsPrisma.$executeRaw`
    UPDATE orycms_products
    SET deleted_at = now(),
        updated_at = now()
    WHERE id IN (${Prisma.join(validIds.map((id) => Prisma.raw(`'${id}'::uuid`)))})
      AND deleted_at IS NULL
  `
  revalidateStorefrontProducts()
}

export async function restoreOryCMSProduct(id: string) {
  await ensureOryCMSProductsSchema()
  const product = await getOryCMSProduct(id, true)
  if (!product || !product.deletedAt) return null

  // Check for active slug/SKU collision
  let targetSlug = product.slug
  let targetSku = product.sku

  const [existingSlug] = await orycmsPrisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM orycms_products WHERE slug = ${targetSlug} AND deleted_at IS NULL AND id != ${id}::uuid LIMIT 1
  `
  if (existingSlug) {
    targetSlug = `${targetSlug}-restored-${Date.now().toString(36)}`
  }

  const [existingSku] = await orycmsPrisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM orycms_products WHERE sku = ${targetSku} AND deleted_at IS NULL AND id != ${id}::uuid LIMIT 1
  `
  if (existingSku) {
    targetSku = `${targetSku}-RESTORED-${Date.now().toString(36)}`
  }

  const [restored] = await orycmsPrisma.$queryRaw<OryCMSProductRow[]>`
    UPDATE orycms_products
    SET deleted_at = NULL,
        slug = ${targetSlug},
        sku = ${targetSku},
        updated_at = now()
    WHERE id = ${id}::uuid
    RETURNING *
  `

  revalidateStorefrontProducts()
  return restored ? toProductDTO(restored) : null
}

export async function bulkRestoreOryCMSProducts(ids: string[]) {
  const validIds = ids.filter(Boolean)
  if (validIds.length === 0) return []

  const restoredList = []
  for (const id of validIds) {
    const item = await restoreOryCMSProduct(id)
    if (item) restoredList.push(item)
  }
  return restoredList
}

export async function permanentDeleteOryCMSProduct(id: string) {
  await ensureOryCMSProductsSchema()
  const product = await getOryCMSProduct(id, true)

  await orycmsPrisma.$executeRaw`
    DELETE FROM orycms_products
    WHERE id = ${id}::uuid
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

export async function bulkPermanentDeleteOryCMSProducts(ids: string[]) {
  const validIds = ids.filter(Boolean)
  for (const id of validIds) {
    await permanentDeleteOryCMSProduct(id)
  }
}

export async function purgeExpiredTrashOryCMSProducts(daysThreshold = 60) {
  await ensureOryCMSProductsSchema()

  const expiredProducts = await orycmsPrisma.$queryRaw<OryCMSProductRow[]>`
    SELECT * FROM orycms_products
    WHERE deleted_at IS NOT NULL
      AND deleted_at < (now() - (${daysThreshold} || ' days')::interval)
  `

  let purgedCount = 0
  for (const product of expiredProducts) {
    await permanentDeleteOryCMSProduct(product.id)
    purgedCount++
  }

  return purgedCount
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
    images: (input.images || [])
      .map((image) => ({
        id: image.id,
        name: image.name?.trim(),
        packSizes: Array.isArray(image.packSizes)
          ? Array.from(new Set(image.packSizes.map((s) => s.trim()).filter(Boolean)))
          : undefined,
        url: image.url.trim(),
      }))
      .filter((image) => image.url),
    metaDescription: input.metaDescription?.trim(),
    metaTitle: input.metaTitle?.trim(),
    name: input.name.trim(),
    packSizes: (input.packSizes || [])
      .map((pack) => {
        const imageIds = Array.isArray(pack.imageIds)
          ? Array.from(new Set(pack.imageIds.map((id) => String(id).trim()).filter(Boolean)))
          : pack.imageId?.trim()
            ? [pack.imageId.trim()]
            : []
        const imageUrls = Array.isArray(pack.imageUrls)
          ? Array.from(new Set(pack.imageUrls.map((url) => String(url).trim()).filter(Boolean)))
          : pack.imageUrl?.trim()
            ? [pack.imageUrl.trim()]
            : []

        return {
          imageId: imageIds[0] || pack.imageId?.trim() || undefined,
          imageIds: imageIds.length > 0 ? imageIds : undefined,
          imageUrl: imageUrls[0] || pack.imageUrl?.trim() || undefined,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
          price: Number(pack.price),
          size: pack.size.trim(),
        }
      })
      .filter((pack) => pack.size && Number.isFinite(pack.price)),
    packSizeImagesEnabled: Boolean(input.packSizeImagesEnabled),
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

  if (!Number.isFinite(normalized.price) || normalized.price <= 0) throw new Error("MRP is required.")
  if (!Number.isFinite(normalized.stockQuantity) || normalized.stockQuantity <= 0) {
    throw new Error("Stock Quantity is required.")
  }
  if (!normalized.images || normalized.images.length === 0) {
    throw new Error("At least one product image is required.")
  }
  if (!normalized.packSizes || normalized.packSizes.length === 0) {
    throw new Error("At least one valid pack size is required.")
  }

  const targetPrice = normalized.salePrice && normalized.salePrice > 0 ? normalized.salePrice : normalized.price
  const priceTypeLabel = normalized.salePrice && normalized.salePrice > 0 ? "Sale Price" : "MRP"
  const hasMatchingPack = normalized.packSizes.some(
    (p) => p.size.trim() && Number.isFinite(p.price) && Math.abs(p.price - targetPrice) < 0.01
  )
  if (!hasMatchingPack) {
    throw new Error(`At least one pack size price must match the product ${priceTypeLabel} (INR ${targetPrice}).`)
  }

  if (normalized.packSizeImagesEnabled) {
    const hasBasePricePack = normalized.packSizes.some(
      (p) => Math.abs(p.price - normalized.price) < 0.01 || Math.abs(p.price - targetPrice) < 0.01
    )
    if (!hasBasePricePack) {
      throw new Error("When pack-size-specific images are enabled, at least one pack size must match the product base price.")
    }
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
  const packSizesData = {
    enabled: Boolean(input.packSizeImagesEnabled),
    items: input.packSizes,
  }

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
    packSizes: packSizesData as unknown as Prisma.InputJsonValue,
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
  const { enabled, packSizes } = normalizePackSizes(product.pack_sizes)

  return {
    brand: product.brand ?? "",
    category: product.category,
    createdAt: new Date(product.created_at).toISOString(),
    deletedAt: product.deleted_at ? new Date(product.deleted_at).toISOString() : null,
    featured: product.featured,
    fullDescription: product.full_description ?? "",
    howToUse: product.how_to_use ?? "",
    id: product.id,
    images: normalizeImages(product.images),
    metaDescription: product.meta_description ?? "",
    metaTitle: product.meta_title ?? "",
    name: product.name,
    packSizes,
    packSizeImagesEnabled: enabled,
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
        .map(
          (item) =>
            item as ProductImageInput & {
              secure_url?: string
              original_filename?: string
              pack_sizes?: string[]
              packSizes?: string[]
            },
        )
        .map((item) => ({
          id: item.id,
          name: item.name ?? item.original_filename,
          packSizes: Array.isArray(item.packSizes)
            ? item.packSizes.filter((s): s is string => typeof s === "string")
            : Array.isArray(item.pack_sizes)
              ? item.pack_sizes.filter((s): s is string => typeof s === "string")
              : undefined,
          url: item.url ?? item.secure_url ?? "",
        }))
        .filter((item) => item.url)
    : []
}

function normalizePackSizes(value: Prisma.JsonValue): { packSizes: PackSizeInput[]; enabled: boolean } {
  let enabled = false
  let rawItems: any[] = []

  if (Array.isArray(value)) {
    rawItems = value
    enabled = (value as any).packSizeImagesEnabled ?? rawItems.some((i) => Boolean(i?.imageId || i?.imageUrl || (Array.isArray(i?.imageIds) && i.imageIds.length) || (Array.isArray(i?.imageUrls) && i.imageUrls.length)))
  } else if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, any>
    enabled = Boolean(obj.enabled ?? obj.packSizeImagesEnabled)
    rawItems = Array.isArray(obj.items) ? obj.items : Array.isArray(obj.packSizes) ? obj.packSizes : []
  }

  const packSizes = rawItems
    .filter((item) => typeof item?.size === "string" && Number.isFinite(Number(item.price)))
    .map((item) => {
      const imageIds = Array.isArray(item.imageIds)
        ? item.imageIds.filter((id: unknown): id is string => typeof id === "string" && Boolean(id.trim()))
        : typeof item.imageId === "string" && item.imageId.trim()
          ? [item.imageId.trim()]
          : []
      const imageUrls = Array.isArray(item.imageUrls)
        ? item.imageUrls.filter((url: unknown): url is string => typeof url === "string" && Boolean(url.trim()))
        : typeof item.imageUrl === "string" && item.imageUrl.trim()
          ? [item.imageUrl.trim()]
          : []

      return {
        imageId: imageIds[0] || (typeof item.imageId === "string" ? item.imageId : undefined),
        imageIds: imageIds.length > 0 ? imageIds : undefined,
        imageUrl: imageUrls[0] || (typeof item.imageUrl === "string" ? item.imageUrl : undefined),
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        price: Number(item.price),
        size: item.size,
      }
    })

  return { enabled, packSizes }
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
