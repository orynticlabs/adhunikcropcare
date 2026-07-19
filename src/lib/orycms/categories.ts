import type { Prisma } from "@prisma/client"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export const CATEGORY_STATUSES = ["active", "inactive"] as const

export type CategoryStatus = (typeof CATEGORY_STATUSES)[number]

export type CategoryImageInput = {
  id?: string
  name?: string
  url: string
}

export type OryCMSCategoryInput = {
  displayOrder?: number
  image?: CategoryImageInput | null
  metaDescription?: string
  metaTitle?: string
  name: string
  parentId?: string | null
  slug?: string
  status: CategoryStatus
}

export type OryCMSCategoryDTO = OryCMSCategoryInput & {
  createdAt: string
  id: string
  parentName: string
  productCount: number
  slug: string
  updatedAt: string
}

type OryCMSCategoryRow = {
  created_at: Date
  display_order: number
  id: string
  image: Prisma.JsonValue | null
  meta_description: string | null
  meta_title: string | null
  name: string
  parent_id: string | null
  parent_name: string | null
  product_count: bigint | number | string
  slug: string
  status: string
  updated_at: Date
}

export async function listOryCMSCategories(options: { activeOnly?: boolean } = {}) {
  await ensureOryCMSCategoriesSchema()

  const categories = options.activeOnly
    ? await orycmsPrisma.$queryRaw<OryCMSCategoryRow[]>`
        SELECT c.*, p.name AS parent_name, COUNT(pr.id) AS product_count
        FROM orycms_categories c
        LEFT JOIN orycms_categories p ON p.id = c.parent_id
        LEFT JOIN orycms_products pr ON pr.category = c.name
        WHERE c.deleted_at IS NULL AND c.status = 'active'
        GROUP BY c.id, p.name
        ORDER BY c.display_order ASC, c.name ASC
      `
    : await orycmsPrisma.$queryRaw<OryCMSCategoryRow[]>`
        SELECT c.*, p.name AS parent_name, COUNT(pr.id) AS product_count
        FROM orycms_categories c
        LEFT JOIN orycms_categories p ON p.id = c.parent_id
        LEFT JOIN orycms_products pr ON pr.category = c.name
        WHERE c.deleted_at IS NULL
        GROUP BY c.id, p.name
        ORDER BY c.display_order ASC, c.name ASC
      `

  return categories.map(toCategoryDTO)
}

export async function listActiveOryCMSCategoryNames() {
  const categories = await listOryCMSCategories({ activeOnly: true })
  return categories.map((category) => category.name)
}

export async function getOryCMSCategory(id: string) {
  await ensureOryCMSCategoriesSchema()

  const [category] = await orycmsPrisma.$queryRaw<OryCMSCategoryRow[]>`
    SELECT c.*, p.name AS parent_name, COUNT(pr.id) AS product_count
    FROM orycms_categories c
    LEFT JOIN orycms_categories p ON p.id = c.parent_id
    LEFT JOIN orycms_products pr ON pr.category = c.name
    WHERE c.id = ${id}::uuid AND c.deleted_at IS NULL
    GROUP BY c.id, p.name
    LIMIT 1
  `

  return category ? toCategoryDTO(category) : null
}

export async function saveOryCMSCategory(input: OryCMSCategoryInput, id?: string) {
  await ensureOryCMSCategoriesSchema()

  const payload = validateCategoryInput(input)
  const duplicate = await findDuplicateCategory(payload.name, payload.slug, id)

  if (duplicate?.nameMatch) throw new Error("Category already exist this name.")
  if (duplicate?.slugMatch) throw new Error("Category already exist this slug.")

  const [category] = id
    ? await orycmsPrisma.$queryRaw<OryCMSCategoryRow[]>`
        UPDATE orycms_categories
        SET
          display_order = ${payload.displayOrder},
          image = ${JSON.stringify(payload.image)}::jsonb,
          meta_description = ${payload.metaDescription || null},
          meta_title = ${payload.metaTitle || null},
          name = ${payload.name},
          parent_id = ${payload.parentId}::uuid,
          slug = ${payload.slug},
          status = ${payload.status},
          updated_at = now()
        WHERE id = ${id}::uuid AND deleted_at IS NULL
        RETURNING *, NULL::text AS parent_name, 0 AS product_count
      `
    : await orycmsPrisma.$queryRaw<OryCMSCategoryRow[]>`
        INSERT INTO orycms_categories (
          display_order,
          image,
          meta_description,
          meta_title,
          name,
          parent_id,
          slug,
          status
        )
        VALUES (
          ${payload.displayOrder},
          ${JSON.stringify(payload.image)}::jsonb,
          ${payload.metaDescription || null},
          ${payload.metaTitle || null},
          ${payload.name},
          ${payload.parentId}::uuid,
          ${payload.slug},
          ${payload.status}
        )
        RETURNING *, NULL::text AS parent_name, 0 AS product_count
      `

  if (!category) throw new Error("Category not found.")

  return getOryCMSCategory(category.id)
}

export async function deleteOryCMSCategory(id: string) {
  await ensureOryCMSCategoriesSchema()
  await orycmsPrisma.$executeRaw`
    UPDATE orycms_categories
    SET deleted_at = now(),
        slug = slug || '-deleted-' || left(id::text, 8),
        updated_at = now()
    WHERE id = ${id}::uuid
      AND deleted_at IS NULL
  `
}

export async function bulkDeleteOryCMSCategories(ids: string[]) {
  await Promise.all(ids.filter(Boolean).map((id) => deleteOryCMSCategory(id)))
}

function validateCategoryInput(input: OryCMSCategoryInput) {
  const normalized = {
    displayOrder: Number(input.displayOrder || 0),
    image: input.image?.url ? input.image : null,
    metaDescription: input.metaDescription?.trim() ?? "",
    metaTitle: input.metaTitle?.trim() ?? "",
    name: input.name?.trim() ?? "",
    parentId: input.parentId || null,
    slug: slugify(input.slug || input.name || ""),
    status: input.status,
  }

  if (!normalized.name) throw new Error("Category Name is required.")
  if (!normalized.slug) throw new Error("Slug is required.")
  if (!CATEGORY_STATUSES.includes(normalized.status)) throw new Error("Invalid category status.")
  if (!Number.isFinite(normalized.displayOrder)) throw new Error("Display order must be a number.")

  return normalized
}

async function findDuplicateCategory(name: string, slug: string, id?: string) {
  const [duplicate] = id
    ? await orycmsPrisma.$queryRaw<{ name_match: boolean; slug_match: boolean }[]>`
        SELECT lower(name) = lower(${name}) AS name_match, lower(slug) = lower(${slug}) AS slug_match
        FROM orycms_categories
        WHERE deleted_at IS NULL
          AND id <> ${id}::uuid
          AND (lower(name) = lower(${name}) OR lower(slug) = lower(${slug}))
        LIMIT 1
      `
    : await orycmsPrisma.$queryRaw<{ name_match: boolean; slug_match: boolean }[]>`
        SELECT lower(name) = lower(${name}) AS name_match, lower(slug) = lower(${slug}) AS slug_match
        FROM orycms_categories
        WHERE deleted_at IS NULL
          AND (lower(name) = lower(${name}) OR lower(slug) = lower(${slug}))
        LIMIT 1
      `

  return duplicate
    ? { nameMatch: duplicate.name_match, slugMatch: duplicate.slug_match }
    : null
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function toCategoryDTO(category: OryCMSCategoryRow): OryCMSCategoryDTO {
  return {
    createdAt: category.created_at.toISOString(),
    displayOrder: category.display_order,
    id: category.id,
    image: normalizeImage(category.image),
    metaDescription: category.meta_description ?? "",
    metaTitle: category.meta_title ?? "",
    name: category.name,
    parentId: category.parent_id,
    parentName: category.parent_name ?? "",
    productCount: Number(category.product_count || 0),
    slug: category.slug,
    status: CATEGORY_STATUSES.includes(category.status as CategoryStatus)
      ? (category.status as CategoryStatus)
      : "inactive",
    updatedAt: category.updated_at.toISOString(),
  }
}

function normalizeImage(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const image = value as Record<string, unknown>
  const url = typeof image.url === "string" ? image.url : typeof image.secure_url === "string" ? image.secure_url : ""

  return url
    ? {
        id: typeof image.id === "string" ? image.id : undefined,
        name: typeof image.name === "string" ? image.name : typeof image.original_filename === "string" ? image.original_filename : undefined,
        url,
      }
    : null
}

async function ensureOryCMSCategoriesSchema() {
  // Database structure is managed by Prisma migrations.
}
