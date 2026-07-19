import type { Prisma } from "@prisma/client"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export const PRODUCT_STATUSES = ["draft", "published"] as const

export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

export type ProductImageInput = {
  id?: string
  url: string
  name?: string
}

export type PackSizeInput = {
  size: string
  price: number
}

export type OryCMSProductInput = {
  brand?: string
  category: string
  featured: boolean
  fullDescription?: string
  images: ProductImageInput[]
  metaDescription?: string
  metaTitle?: string
  name: string
  packSizes: PackSizeInput[]
  price: number
  salePrice?: number | null
  shortDescription: string
  sku: string
  slug?: string
  status: ProductStatus
  stockQuantity: number
  tags: string[]
  unit: string
}

export type OryCMSProductDTO = OryCMSProductInput & {
  createdAt: string
  id: string
  slug: string
  updatedAt: string
}

type OryCMSProductRow = {
  brand: string | null
  category: string
  created_at: Date
  featured: boolean
  full_description: string | null
  id: string
  images: Prisma.JsonValue
  meta_description: string | null
  meta_title: string | null
  name: string
  pack_sizes: Prisma.JsonValue
  price: Prisma.Decimal | number | string
  sale_price: Prisma.Decimal | number | string | null
  short_description: string
  sku: string
  slug: string
  status: string
  stock_quantity: number
  tags: Prisma.JsonValue
  unit: string
  updated_at: Date
}

const fallbackImage =
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80"

export async function listOryCMSProducts(options: { publishedOnly?: boolean } = {}) {
  await ensureOryCMSProductsSchema()

  const products = options.publishedOnly
    ? await orycmsPrisma.$queryRaw<OryCMSProductRow[]>`
        SELECT * FROM orycms_products
        WHERE status = 'published' AND deleted_at IS NULL
        ORDER BY featured DESC, updated_at DESC
      `
    : await orycmsPrisma.$queryRaw<OryCMSProductRow[]>`
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
          images = ${JSON.stringify(payload.images)}::jsonb,
          meta_description = ${data.metaDescription},
          meta_title = ${data.metaTitle},
          name = ${data.name},
          pack_sizes = ${JSON.stringify(payload.packSizes)}::jsonb,
          price = ${data.price},
          sale_price = ${data.salePrice},
          short_description = ${data.shortDescription},
          sku = ${data.sku},
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
          images,
          meta_description,
          meta_title,
          name,
          pack_sizes,
          price,
          sale_price,
          short_description,
          sku,
          slug,
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
          ${JSON.stringify(payload.images)}::jsonb,
          ${data.metaDescription},
          ${data.metaTitle},
          ${data.name},
          ${JSON.stringify(payload.packSizes)}::jsonb,
          ${data.price},
          ${data.salePrice},
          ${data.shortDescription},
          ${data.sku},
          ${slug},
          ${data.status},
          ${data.stockQuantity},
          ${JSON.stringify(payload.tags)}::jsonb,
          ${data.unit}
        )
        RETURNING *
      `

  if (!product) throw new Error("Product not found.")

  return toProductDTO(product)
}

export async function deleteOryCMSProduct(id: string) {
  await ensureOryCMSProductsSchema()
  await orycmsPrisma.$executeRaw`
    UPDATE orycms_products
    SET deleted_at = now(),
        slug = slug || '-deleted-' || left(id::text, 8),
        sku = sku || '-deleted-' || left(id::text, 8),
        updated_at = now()
    WHERE id = ${id}::uuid
      AND deleted_at IS NULL
  `
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
    fullDescription: input.fullDescription?.trim(),
    images: input.images.filter((image) => image.url.trim()),
    metaDescription: input.metaDescription?.trim(),
    metaTitle: input.metaTitle?.trim(),
    name: input.name.trim(),
    packSizes: input.packSizes
      .map((pack) => ({ price: Number(pack.price), size: pack.size.trim() }))
      .filter((pack) => pack.size && Number.isFinite(pack.price)),
    price: Number(input.price),
    salePrice: input.salePrice ? Number(input.salePrice) : null,
    shortDescription: input.shortDescription.trim(),
    sku: input.sku.trim(),
    slug: input.slug?.trim(),
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
    images: input.images as unknown as Prisma.InputJsonValue,
    metaDescription: input.metaDescription || null,
    metaTitle: input.metaTitle || null,
    name: input.name,
    packSizes: input.packSizes as unknown as Prisma.InputJsonValue,
    price: input.price,
    salePrice: input.salePrice || null,
    shortDescription: input.shortDescription,
    sku: input.sku,
    slug: input.slug,
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
    id: product.id,
    images: normalizeImages(product.images),
    metaDescription: product.meta_description ?? "",
    metaTitle: product.meta_title ?? "",
    name: product.name,
    packSizes: normalizePackSizes(product.pack_sizes),
    price: Number(product.price),
    salePrice: product.sale_price ? Number(product.sale_price) : null,
    shortDescription: product.short_description,
    sku: product.sku,
    slug: product.slug,
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
  await orycmsPrisma.$executeRawUnsafe(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE IF NOT EXISTS orycms_products (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      slug text NOT NULL UNIQUE,
      short_description text NOT NULL,
      full_description text,
      category text NOT NULL,
      brand text,
      sku text NOT NULL UNIQUE,
      price numeric(12,2) NOT NULL,
      sale_price numeric(12,2),
      pack_sizes jsonb NOT NULL DEFAULT '[]'::jsonb,
      stock_quantity integer NOT NULL,
      unit text NOT NULL,
      status text NOT NULL DEFAULT 'draft',
      featured boolean NOT NULL DEFAULT false,
      images jsonb NOT NULL DEFAULT '[]'::jsonb,
      tags jsonb NOT NULL DEFAULT '[]'::jsonb,
      meta_title text,
      meta_description text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz
    );
    ALTER TABLE orycms_products ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
    CREATE INDEX IF NOT EXISTS orycms_products_status_idx ON orycms_products (status);
    CREATE INDEX IF NOT EXISTS orycms_products_category_idx ON orycms_products (category);
    CREATE INDEX IF NOT EXISTS orycms_products_deleted_at_idx ON orycms_products (deleted_at);
  `)
}
