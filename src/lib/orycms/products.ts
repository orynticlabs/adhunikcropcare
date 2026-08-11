import crypto from "crypto"
import { Prisma } from "@prisma/client"
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"
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
  verify_description: string | null
  verify_image: Prisma.JsonValue
  mfg_date: Date | null
  expiry_date: Date | null
  pack_timing: string | null
  pack_date: Date | null
  supervisor_name: string | null
  contractor_name: string | null
  literature: string | null
  msds: string | null
  license: string | null
  cir: string | null
  epr_number: string | null
  plastic_category: string | null
  leaflet_info: string | null
  uin: string | null
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

  // Generate a client-side UUID if this is a new product to prevent chicken-and-egg snapshot creation
  const finalProductId = id || crypto.randomUUID()

  // Load existing product if ID exists to preserve details
  let existingProduct: Record<string, unknown> | null = null
  let existingPackSizes: PackSizeInput[] = []
  if (id) {
    const [existing] = await orycmsPrisma.$queryRaw<Record<string, unknown>[]>`
      SELECT * FROM orycms_products WHERE id = ${id}::uuid LIMIT 1
    `
    if (existing) {
      existingProduct = existing
      existingPackSizes = normalizePackSizes(existing.pack_sizes as Prisma.JsonValue).packSizes
    }
  }

  // UIN is manually assigned by admin and cannot be modified once set
  let uin = input.uin?.trim() || (typeof existingProduct?.uin === "string" ? existingProduct.uin.trim() : "")

  // Validate the inputs and copy default pack sizes parameters to product top-level properties
  const payload = validateProductInput({ ...input, uin }, existingProduct, existingPackSizes)
  uin = payload.uin || uin

  if (uin) {
    const existingUin = id
      ? await orycmsPrisma.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM orycms_products
          WHERE uin = ${uin} AND deleted_at IS NULL AND id != ${finalProductId}::uuid
          LIMIT 1
        `
      : await orycmsPrisma.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM orycms_products
          WHERE uin = ${uin} AND deleted_at IS NULL
          LIMIT 1
        `
    if (existingUin.length > 0) {
      throw new Error(`UIN "${uin}" is already assigned to another active product.`)
    }
  }

  const slug = payload.slug || (await nextAlphanumericSlug())

  // Generate pack-size specific snapshots (and URLs) if details have changed
  let packSizesWithSlugs = payload.packSizes
  if (uin && (input.isVerificationUpdate || existingProduct?.uin)) {
    packSizesWithSlugs = await processVerificationSnapshots(finalProductId, uin, payload)
  }
  payload.packSizes = packSizesWithSlugs

  const data = toPrismaProductData({ ...payload, slug })

  if (data.sku) {
    const existingSku = id
      ? await orycmsPrisma.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM orycms_products
          WHERE sku = ${data.sku} AND deleted_at IS NULL AND id != ${finalProductId}::uuid
          LIMIT 1
        `
      : await orycmsPrisma.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM orycms_products
          WHERE sku = ${data.sku} AND deleted_at IS NULL
          LIMIT 1
        `
    if (existingSku.length > 0) {
      throw new Error(`SKU "${data.sku}" is already assigned to another active product.`)
    }
  }

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
          verify_description = ${data.verifyDescription},
          verify_image = ${data.verifyImage ? JSON.stringify(data.verifyImage) : null}::jsonb,
          mfg_date = ${data.mfgDate ? data.mfgDate : null}::date,
          expiry_date = ${data.expiryDate ? data.expiryDate : null}::date,
          pack_timing = ${data.packTiming},
          pack_date = ${data.packDate ? data.packDate : null}::date,
          supervisor_name = ${data.supervisorName},
          contractor_name = ${data.contractorName},
          literature = ${data.literature},
          msds = ${data.msds},
          license = ${data.license},
          cir = ${data.cir},
          epr_number = ${data.eprNumber},
          plastic_category = ${data.plasticCategory},
          leaflet_info = ${data.leafletInfo},
          uin = ${data.uin},
          updated_at = now()
        WHERE id = ${finalProductId}::uuid
        RETURNING *
      `
    : await orycmsPrisma.$queryRaw<OryCMSProductRow[]>`
        INSERT INTO orycms_products (
          id,
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
          unit,
          verify_description,
          verify_image,
          mfg_date,
          expiry_date,
          pack_timing,
          pack_date,
          supervisor_name,
          contractor_name,
          literature,
          msds,
          license,
          cir,
          epr_number,
          plastic_category,
          leaflet_info,
          uin
        )
        VALUES (
          ${finalProductId}::uuid,
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
          ${data.unit},
          ${data.verifyDescription},
          ${data.verifyImage ? JSON.stringify(data.verifyImage) : null}::jsonb,
          ${data.mfgDate ? data.mfgDate : null}::date,
          ${data.expiryDate ? data.expiryDate : null}::date,
          ${data.packTiming},
          ${data.packDate ? data.packDate : null}::date,
          ${data.supervisorName},
          ${data.contractorName},
          ${data.literature},
          ${data.msds},
          ${data.license},
          ${data.cir},
          ${data.eprNumber},
          ${data.plasticCategory},
          ${data.leafletInfo},
          ${data.uin}
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
  try {
    revalidateTag(STOREFRONT_PRODUCTS_CACHE_TAG, { expire: 0 })
    revalidatePath("/", "layout")
  } catch {
    // Ignore outside request context
  }
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

function validateProductInput(
  input: OryCMSProductInput,
  existingProduct?: Record<string, unknown> | null,
  existingPackSizes?: PackSizeInput[]
) {
  const isVerificationUpdate = Boolean(input.isVerificationUpdate)
  const strVal = (val: unknown): string => (typeof val === "string" ? val.trim() : typeof val === "number" ? String(val) : "")
  const optStrVal = (val: unknown): string | undefined => (typeof val === "string" ? val.trim() || undefined : undefined)

  const normalized: OryCMSProductInput = {
    ...input,
    brand: input.brand !== undefined ? strVal(input.brand) : strVal(existingProduct?.brand),
    category: input.category !== undefined ? strVal(input.category) : strVal(existingProduct?.category),
    featured: Boolean(input.featured !== undefined ? input.featured : (existingProduct?.featured ?? false)),
    fullDescription: input.fullDescription !== undefined ? sanitizeRichText(input.fullDescription) : strVal(existingProduct?.full_description),
    howToUse: input.howToUse !== undefined ? sanitizeRichText(input.howToUse) : strVal(existingProduct?.how_to_use),
    images: (input.images || (existingProduct ? normalizeImages(existingProduct.images as Prisma.JsonValue) : []))
      .map((image) => ({
        id: image.id,
        name: strVal(image.name) || undefined,
        packSizes: Array.isArray(image.packSizes)
          ? Array.from(new Set(image.packSizes.map((s) => strVal(s)).filter(Boolean)))
          : undefined,
        url: strVal(image.url),
      }))
      .filter((image) => image.url),
    metaDescription: input.metaDescription !== undefined ? strVal(input.metaDescription) : strVal(existingProduct?.meta_description),
    metaTitle: input.metaTitle !== undefined ? strVal(input.metaTitle) : strVal(existingProduct?.meta_title),
    name: input.name !== undefined ? strVal(input.name) : strVal(existingProduct?.name),
    packSizes: (input.packSizes || (existingPackSizes || []))
      .map((pack) => {
        const packSizeStr = strVal(pack.size)
        const imageIds = Array.isArray(pack.imageIds)
          ? Array.from(new Set(pack.imageIds.map((id) => strVal(id)).filter(Boolean)))
          : pack.imageId && typeof pack.imageId === "string" && pack.imageId.trim()
            ? [pack.imageId.trim()]
            : []
        const imageUrls = Array.isArray(pack.imageUrls)
          ? Array.from(new Set(pack.imageUrls.map((url) => strVal(url)).filter(Boolean)))
          : pack.imageUrl && typeof pack.imageUrl === "string" && pack.imageUrl.trim()
            ? [pack.imageUrl.trim()]
            : []

        const existingPack = existingPackSizes?.find((p) => p.size === packSizeStr)
        const isVerified = pack.isVerified !== undefined
          ? Boolean(pack.isVerified)
          : Boolean(pack.verifySlug || existingPack?.isVerified || existingPack?.verifySlug)

        const verifyMrpVal = pack.verifyMrp !== undefined && pack.verifyMrp !== null && pack.verifyMrp !== ""
          ? Number(pack.verifyMrp)
          : (existingPack?.verifyMrp !== undefined && existingPack?.verifyMrp !== null ? Number(existingPack.verifyMrp) : (pack.mrp !== undefined ? Number(pack.mrp) : null))

        const uspVal = pack.usp !== undefined && pack.usp !== null && pack.usp !== ""
          ? Number(pack.usp)
          : (existingPack?.usp !== undefined && existingPack?.usp !== null ? Number(existingPack.usp) : null)

        return {
          imageId: imageIds[0] || (typeof pack.imageId === "string" ? pack.imageId.trim() : undefined),
          imageIds: imageIds.length > 0 ? imageIds : undefined,
          imageUrl: imageUrls[0] || (typeof pack.imageUrl === "string" ? pack.imageUrl.trim() : undefined),
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
          price: Number(pack.salePrice ?? pack.mrp ?? existingPack?.salePrice ?? existingPack?.mrp ?? 0),
          mrp: Number(pack.mrp ?? existingPack?.mrp ?? 0),
          salePrice: Number(pack.salePrice ?? existingPack?.salePrice ?? 0),
          verifyMrp: verifyMrpVal,
          usp: uspVal,
          sku: pack.sku ? strVal(pack.sku) : strVal(existingPack?.sku),
          batchNumber: pack.batchNumber ? strVal(pack.batchNumber) : strVal(existingPack?.batchNumber),
          stockQuantity: Number(pack.stockQuantity ?? existingPack?.stockQuantity ?? 0),
          isDefault: Boolean(pack.isDefault),
          verifySlug: pack.verifySlug ? strVal(pack.verifySlug) : (existingPack?.verifySlug || undefined),
          isVerified,
          size: packSizeStr,
        }
      })
      .filter((pack) => pack.size),
    packSizeImagesEnabled: Boolean(input.packSizeImagesEnabled ?? existingProduct?.pack_size_images_enabled),
    price: Number(input.price ?? existingProduct?.price ?? 0), // Overridden
    salePrice: input.salePrice ? Number(input.salePrice) : null, // Overridden
    shippingReturns: input.shippingReturns !== undefined ? sanitizeRichText(input.shippingReturns) : strVal(existingProduct?.shipping_returns),
    shortDescription: input.shortDescription !== undefined ? strVal(input.shortDescription) : strVal(existingProduct?.short_description),
    sku: input.sku ? strVal(input.sku) : strVal(existingProduct?.sku), // Overridden
    slug: optStrVal(input.slug) || optStrVal(existingProduct?.slug),
    specifications: input.specifications !== undefined ? sanitizeRichText(input.specifications) : strVal(existingProduct?.specifications),
    status: input.status || (typeof existingProduct?.status === "string" ? (existingProduct.status as ProductStatus) : "draft"),
    stockQuantity: (input.packSizes || (existingPackSizes || [])).reduce((sum, p) => sum + Number(p.stockQuantity || 0), 0),
    tags: Array.isArray(input.tags)
      ? input.tags.map((tag) => strVal(tag)).filter(Boolean)
      : (existingProduct ? normalizeTags(existingProduct.tags as Prisma.JsonValue) : []),
    unit: input.unit !== undefined ? strVal(input.unit) : strVal(existingProduct?.unit),

    // Product verification fields
    verifyDescription: input.verifyDescription !== undefined ? (sanitizeRichText(input.verifyDescription) || "") : strVal(existingProduct?.verify_description),
    verifyImage: input.verifyImage !== undefined ? (input.verifyImage?.url ? input.verifyImage : null) : ((existingProduct?.verify_image as ProductImageInput | null) || null),
    mfgDate: input.mfgDate !== undefined ? strVal(input.mfgDate) : (existingProduct?.mfg_date ? new Date(String(existingProduct.mfg_date)).toISOString() : ""),
    expiryDate: input.expiryDate !== undefined ? strVal(input.expiryDate) : (existingProduct?.expiry_date ? new Date(String(existingProduct.expiry_date)).toISOString() : ""),
    packTiming: input.packTiming !== undefined ? strVal(input.packTiming) : strVal(existingProduct?.pack_timing),
    packDate: input.packDate !== undefined ? strVal(input.packDate) : (existingProduct?.pack_date ? new Date(String(existingProduct.pack_date)).toISOString() : ""),
    supervisorName: input.supervisorName !== undefined ? strVal(input.supervisorName) : strVal(existingProduct?.supervisor_name),
    contractorName: input.contractorName !== undefined ? strVal(input.contractorName) : strVal(existingProduct?.contractor_name),
    literature: input.literature !== undefined ? strVal(input.literature) : strVal(existingProduct?.literature),
    msds: input.msds !== undefined ? strVal(input.msds) : strVal(existingProduct?.msds),
    license: input.license !== undefined ? strVal(input.license) : strVal(existingProduct?.license),
    cir: input.cir !== undefined ? strVal(input.cir) : strVal(existingProduct?.cir),
    eprNumber: input.eprNumber !== undefined ? strVal(input.eprNumber) : strVal(existingProduct?.epr_number),
    plasticCategory: input.plasticCategory !== undefined ? strVal(input.plasticCategory) : strVal(existingProduct?.plastic_category),
    leafletInfo: input.leafletInfo !== undefined ? sanitizeRichText(input.leafletInfo) : strVal(existingProduct?.leaflet_info),
    uin: input.uin !== undefined ? strVal(input.uin) : strVal(existingProduct?.uin),
  }

  const existingUinStr = typeof existingProduct?.uin === "string" ? existingProduct.uin.trim() : ""
  if (existingUinStr) {
    if (normalized.uin && normalized.uin !== existingUinStr) {
      throw new Error("UIN number cannot be changed once set.")
    }
    normalized.uin = existingUinStr
  } else {
    if (!normalized.uin) {
      throw new Error("UIN number is mandatory at creation or initial setup.")
    }
  }

  const required = [
    ["Product Name", normalized.name],
    ["Short Description", normalized.shortDescription],
    ["Category", normalized.category],
    ["Unit", normalized.unit],
    ["UIN Number", normalized.uin],
  ] as const

  for (const [label, value] of required) {
    if (!value) throw new Error(`${label} is required.`)
  }

  if (normalized.shortDescription.length > 85) {
    throw new Error("Short Description must be 85 characters or fewer.")
  }

  if (!normalized.images || normalized.images.length === 0) {
    throw new Error("At least one product image is required.")
  }

  if (!normalized.packSizes || normalized.packSizes.length === 0) {
    throw new Error("At least one valid pack size is required.")
  }

  for (const pack of normalized.packSizes) {
    if (pack.mrp <= 0) {
      throw new Error(`MRP for pack size "${pack.size}" must be greater than 0.`)
    }
    if (pack.salePrice <= 0) {
      throw new Error(`Sale Price for pack size "${pack.size}" must be greater than 0.`)
    }
    if (pack.salePrice > pack.mrp) {
      throw new Error(`MRP (₹${pack.mrp.toFixed(2)}) must be greater than or equal to Sale Price (₹${pack.salePrice.toFixed(2)}) for pack size "${pack.size}".`)
    }
    if (pack.stockQuantity <= 0) {
      throw new Error(`Stock Quantity for pack size "${pack.size}" must be greater than 0.`)
    }
  }

  if (isVerificationUpdate) {

    if (!normalized.verifyImage) {
      throw new Error("Verification product image is required.")
    }

    const verifiedPacks = normalized.packSizes.filter((p) => p.isVerified)
    if (verifiedPacks.length === 0) {
      throw new Error("At least one pack size must be selected for verification.")
    }

    for (const pack of normalized.packSizes) {
      if (pack.isVerified) {
        if (pack.verifyMrp === null || pack.verifyMrp === undefined || Number.isNaN(Number(pack.verifyMrp)) || Number(pack.verifyMrp) <= 0) {
          throw new Error(`Verification MRP for pack size "${pack.size}" is required for verification.`)
        }
        if (pack.usp === null || pack.usp === undefined || Number.isNaN(Number(pack.usp)) || Number(pack.usp) <= 0) {
          throw new Error(`USP (Unit Sale Price) for pack size "${pack.size}" is required for verification.`)
        }
      }
    }
  }

  // Ensure exactly one pack size is marked as default
  let defaultPacks = normalized.packSizes.filter((p) => p.isDefault)
  if (defaultPacks.length === 0 && normalized.packSizes.length > 0) {
    normalized.packSizes[0].isDefault = true
    defaultPacks = [normalized.packSizes[0]]
  }
  if (defaultPacks.length !== 1) {
    normalized.packSizes.forEach((p, idx) => {
      p.isDefault = idx === normalized.packSizes.findIndex((x) => x.isDefault)
    })
    defaultPacks = normalized.packSizes.filter((p) => p.isDefault)
  }

  const defaultPack = defaultPacks[0]
  normalized.sku = (defaultPack && defaultPack.sku ? defaultPack.sku.trim() : "") || (input.sku ? input.sku.trim() : "")
  normalized.price = defaultPack.mrp
  normalized.salePrice = defaultPack.salePrice || null
  normalized.stockQuantity = normalized.packSizes.reduce((sum, p) => sum + p.stockQuantity, 0)

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
    featured: Boolean(input.featured),
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
    sku: input.sku && input.sku.trim() ? input.sku.trim() : null,
    slug: input.slug,
    specifications: input.specifications || null,
    status: input.status,
    stockQuantity: input.stockQuantity,
    tags: input.tags as unknown as Prisma.InputJsonValue,
    unit: input.unit,

    verifyDescription: input.verifyDescription || null,
    verifyImage: input.verifyImage as unknown as Prisma.InputJsonValue || null,
    mfgDate: input.mfgDate ? input.mfgDate : null,
    expiryDate: input.expiryDate ? input.expiryDate : null,
    packTiming: input.packTiming || null,
    packDate: input.packDate ? input.packDate : null,
    supervisorName: input.supervisorName || null,
    contractorName: input.contractorName || null,
    literature: input.literature || null,
    msds: input.msds || null,
    license: input.license || null,
    cir: input.cir || null,
    eprNumber: input.eprNumber || null,
    plasticCategory: input.plasticCategory || null,
    leafletInfo: input.leafletInfo || null,
    uin: input.uin || null,
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
    stockQuantity: (packSizes || []).reduce((sum, p) => sum + Number(p.stockQuantity || 0), 0),
    tags: normalizeTags(product.tags),
    unit: product.unit,
    updatedAt: new Date(product.updated_at).toISOString(),

    verifyDescription: product.verify_description ?? "",
    verifyImage: normalizeVerifyImage(product.verify_image),
    mfgDate: product.mfg_date ? dateOnly(product.mfg_date) : "",
    expiryDate: product.expiry_date ? dateOnly(product.expiry_date) : "",
    packTiming: product.pack_timing ?? "",
    packDate: product.pack_date ? dateOnly(product.pack_date) : "",
    supervisorName: product.supervisor_name ?? "",
    contractorName: product.contractor_name ?? "",
    literature: product.literature ?? "",
    msds: product.msds ?? "",
    license: product.license ?? "",
    cir: product.cir ?? "",
    eprNumber: product.epr_number ?? "",
    plasticCategory: product.plastic_category ?? "",
    leafletInfo: product.leaflet_info ?? "",
    uin: product.uin ?? "",
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

function normalizeVerifyImage(value: Prisma.JsonValue | null): ProductImageInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const image = value as Record<string, unknown>
  const url = typeof image.url === "string" ? image.url : ""
  return url ? { id: typeof image.id === "string" ? image.id : undefined, name: typeof image.name === "string" ? image.name : undefined, url } : null
}

function normalizePackSizes(value: Prisma.JsonValue): { packSizes: PackSizeInput[]; enabled: boolean } {
  let enabled = false
  let rawItems: Record<string, unknown>[] = []

  if (Array.isArray(value)) {
    rawItems = value as Record<string, unknown>[]
    const arr = value as unknown as { packSizeImagesEnabled?: boolean }
    enabled = arr.packSizeImagesEnabled ?? rawItems.some((i) => Boolean(i?.imageId || i?.imageUrl || (Array.isArray(i?.imageIds) && i.imageIds.length) || (Array.isArray(i?.imageUrls) && i.imageUrls.length)))
  } else if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>
    enabled = Boolean(obj.enabled ?? obj.packSizeImagesEnabled)
    rawItems = (Array.isArray(obj.items) ? obj.items : Array.isArray(obj.packSizes) ? obj.packSizes : []) as Record<string, unknown>[]
  }

  const packSizes = rawItems
    .filter((item) => typeof item?.size === "string")
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

      const mrp = Number(item.mrp ?? item.price ?? 0)
      const salePrice = Number(item.salePrice ?? item.price ?? 0)
      const verifyMrp = item.verifyMrp !== undefined && item.verifyMrp !== null && item.verifyMrp !== "" ? Number(item.verifyMrp) : mrp
      const usp = item.usp !== undefined && item.usp !== null && item.usp !== "" ? Number(item.usp) : null

      const verifySlug = String(item.verifySlug ?? "")
      const isVerified = typeof item.isVerified === "boolean" ? item.isVerified : Boolean(verifySlug)

      return {
        imageId: imageIds[0] || (typeof item.imageId === "string" ? item.imageId : undefined),
        imageIds: imageIds.length > 0 ? imageIds : undefined,
        imageUrl: imageUrls[0] || (typeof item.imageUrl === "string" ? item.imageUrl : undefined),
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        price: salePrice || mrp,
        mrp,
        salePrice,
        verifyMrp,
        usp,
        sku: String(item.sku ?? ""),
        batchNumber: String(item.batchNumber ?? ""),
        stockQuantity: Number(item.stockQuantity ?? 0),
        isDefault: Boolean(item.isDefault),
        verifySlug,
        isVerified,
        size: String(item.size),
      }
    })

  return { enabled, packSizes }
}

async function processVerificationSnapshots(
  productId: string,
  uin: string,
  payload: OryCMSProductInput
): Promise<PackSizeInput[]> {
  const finalPackSizes: PackSizeInput[] = []

  // Helper to normalize values and avoid null/undefined/empty comparison mismatches
  const cleanStr = (val: unknown): string => {
    if (val === null || val === undefined) return ""
    return String(val).trim()
  }

  // Fetch the latest snapshot of any pack size for this product to compare global fields
  const [anyLatestSnapshot] = await orycmsPrisma.$queryRaw<Record<string, unknown>[]>`
    SELECT * FROM orycms_verified_product_snapshots
    WHERE product_id = ${productId}::uuid
    ORDER BY created_at DESC
    LIMIT 1
  `

  let globalFieldsChanged = false

  if (anyLatestSnapshot) {
    const normalizedMfgDate = payload.mfgDate ? new Date(payload.mfgDate).toISOString().slice(0, 10) : ""
    const normalizedExpDate = payload.expiryDate ? new Date(payload.expiryDate).toISOString().slice(0, 10) : ""
    const normalizedPackDate = payload.packDate ? new Date(payload.packDate).toISOString().slice(0, 10) : ""

    const snapshotMfgDate = anyLatestSnapshot.mfg_date ? new Date(anyLatestSnapshot.mfg_date as string).toISOString().slice(0, 10) : ""
    const snapshotExpDate = anyLatestSnapshot.expiry_date ? new Date(anyLatestSnapshot.expiry_date as string).toISOString().slice(0, 10) : ""
    const snapshotPackDate = anyLatestSnapshot.pack_date ? new Date(anyLatestSnapshot.pack_date as string).toISOString().slice(0, 10) : ""

    const mfgChanged = normalizedMfgDate !== snapshotMfgDate
    const expChanged = normalizedExpDate !== snapshotExpDate
    const packDateChanged = normalizedPackDate !== snapshotPackDate

    const payloadImgUrl = payload.verifyImage && typeof payload.verifyImage === "object"
      ? (payload.verifyImage as { url?: string }).url || ""
      : ""
    const snapshotImgUrl = anyLatestSnapshot.verify_image && typeof anyLatestSnapshot.verify_image === "object"
      ? (anyLatestSnapshot.verify_image as { url?: string }).url || ""
      : ""
    const imgChanged = payloadImgUrl !== snapshotImgUrl

    const otherGlobalChanged =
      cleanStr(anyLatestSnapshot.product_name) !== cleanStr(payload.name) ||
      cleanStr(anyLatestSnapshot.brand) !== cleanStr(payload.brand || "") ||
      cleanStr(anyLatestSnapshot.pack_timing) !== cleanStr(payload.packTiming) ||
      cleanStr(anyLatestSnapshot.supervisor_name) !== cleanStr(payload.supervisorName) ||
      cleanStr(anyLatestSnapshot.contractor_name) !== cleanStr(payload.contractorName) ||
      cleanStr(anyLatestSnapshot.verify_description) !== cleanStr(payload.verifyDescription) ||
      cleanStr(anyLatestSnapshot.literature) !== cleanStr(payload.literature) ||
      cleanStr(anyLatestSnapshot.msds) !== cleanStr(payload.msds) ||
      cleanStr(anyLatestSnapshot.license) !== cleanStr(payload.license) ||
      cleanStr(anyLatestSnapshot.cir) !== cleanStr(payload.cir) ||
      cleanStr(anyLatestSnapshot.epr_number) !== cleanStr(payload.eprNumber) ||
      cleanStr(anyLatestSnapshot.plastic_category) !== cleanStr(payload.plasticCategory) ||
      cleanStr(anyLatestSnapshot.leaflet_info) !== cleanStr(payload.leafletInfo)

    if (mfgChanged || expChanged || packDateChanged || imgChanged || otherGlobalChanged) {
      globalFieldsChanged = true
    }
  }

  for (const pack of payload.packSizes) {
    if (!pack.isVerified) {
      finalPackSizes.push({ ...pack, verifySlug: pack.verifySlug ? pack.verifySlug.trim() : "", isVerified: false })
      continue
    }

    let verifySlug = pack.verifySlug?.trim()
    let isDifferent = true
    const packVerifyMrp = pack.verifyMrp !== undefined && pack.verifyMrp !== null && pack.verifyMrp !== "" ? Number(pack.verifyMrp) : Number(pack.mrp || 0)
    const packUsp = pack.usp !== undefined && pack.usp !== null && pack.usp !== "" ? Number(pack.usp) : null

    if (verifySlug && !globalFieldsChanged) {
      const [latestSnapshot] = await orycmsPrisma.$queryRaw<Record<string, unknown>[]>`
        SELECT * FROM orycms_verified_product_snapshots
        WHERE slug = ${verifySlug}
        LIMIT 1
      `
      if (latestSnapshot) {
        const specMatch =
          cleanStr(latestSnapshot.pack_size) === cleanStr(pack.size) &&
          cleanStr(latestSnapshot.sku) === cleanStr(pack.sku) &&
          cleanStr(latestSnapshot.batch_number) === cleanStr(pack.batchNumber) &&
          Number(latestSnapshot.mrp || 0) === packVerifyMrp &&
          Number(latestSnapshot.usp || 0) === Number(packUsp || 0) &&
          Number(latestSnapshot.stock_quantity || 0) === Number(pack.stockQuantity || 0)

        if (specMatch) {
          isDifferent = false
        }
      }
    }

    if (isDifferent || !verifySlug) {
      verifySlug = `acc-verify-${crypto.randomBytes(12).toString("hex")}`

      await orycmsPrisma.$executeRaw`
        INSERT INTO orycms_verified_product_snapshots (
          slug, product_id, uin, product_name, brand, pack_size, sku, batch_number, mrp, usp, stock_quantity,
          mfg_date, expiry_date, pack_timing, pack_date, supervisor_name, contractor_name,
          verify_description, verify_image, literature, msds, license, cir, epr_number, plastic_category, leaflet_info
        ) VALUES (
          ${verifySlug},
          ${productId}::uuid,
          ${uin},
          ${payload.name},
          ${payload.brand || ""},
          ${pack.size},
          ${pack.sku},
          ${pack.batchNumber},
          ${packVerifyMrp},
          ${packUsp},
          ${pack.stockQuantity},
          ${payload.mfgDate ? payload.mfgDate : null}::date,
          ${payload.expiryDate ? payload.expiryDate : null}::date,
          ${payload.packTiming || null},
          ${payload.packDate ? payload.packDate : null}::date,
          ${payload.supervisorName || null},
          ${payload.contractorName || null},
          ${payload.verifyDescription || null},
          ${payload.verifyImage ? JSON.stringify(payload.verifyImage) : null}::jsonb,
          ${payload.literature || null},
          ${payload.msds || null},
          ${payload.license || null},
          ${payload.cir || null},
          ${payload.eprNumber || null},
          ${payload.plasticCategory || null},
          ${payload.leafletInfo || null}
        )
      `
    }

    finalPackSizes.push({ ...pack, verifySlug })
  }

  return finalPackSizes
}

function dateOnly(value: Date | string | null): string {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)
  return date.toISOString().slice(0, 10)
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
