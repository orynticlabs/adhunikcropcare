import crypto from "crypto"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export const ORYCMS_MEDIA_MAX_BYTES = 10 * 1024 * 1024
export const ORYCMS_MEDIA_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "svg", "gif"] as const

const allowedTypes = new Set([
  "image/gif",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/svg+xml",
  "image/webp",
])

export type OryCMSMediaAssetDTO = {
  asset_id: string
  bytes: number
  created_at: string
  format: string
  height: number | null
  id: string
  original_filename: string | null
  public_id: string
  secure_url: string
  width: number | null
}

type CloudinaryUploadResponse = {
  asset_id: string
  bytes: number
  created_at: string
  format: string
  height?: number
  original_filename?: string
  public_id: string
  secure_url: string
  width?: number
}

type UploadOptions = {
  mediaName?: string
  productImage?: boolean
}

export function toMediaDTO(asset: {
  assetId: string
  bytes: number
  createdAt: Date
  format: string
  height: number | null
  id: string
  originalFilename: string | null
  publicId: string
  secureUrl: string
  width: number | null
}): OryCMSMediaAssetDTO {
  return {
    asset_id: asset.assetId,
    bytes: asset.bytes,
    created_at: asset.createdAt.toISOString(),
    format: asset.format,
    height: asset.height,
    id: asset.id,
    original_filename: asset.originalFilename,
    public_id: asset.publicId,
    secure_url: asset.secureUrl,
    width: asset.width,
  }
}

export function validateOryCMSMediaFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? ""

  if (!ORYCMS_MEDIA_EXTENSIONS.includes(extension as (typeof ORYCMS_MEDIA_EXTENSIONS)[number])) {
    return `Only ${ORYCMS_MEDIA_EXTENSIONS.join(", ")} files are allowed.`
  }

  if (!allowedTypes.has(file.type) && extension !== "svg") {
    return "Unsupported image type."
  }

  if (file.size > ORYCMS_MEDIA_MAX_BYTES) {
    return "File is too large. Maximum size is 10 MB."
  }

  return null
}

export async function listOryCMSMedia(search: string) {
  await ensureOryCMSMediaSchema()

  const assets = await orycmsPrisma.oryCMSMediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    where: search
      ? {
          OR: [
            { originalFilename: { contains: search, mode: "insensitive" } },
            { publicId: { contains: search, mode: "insensitive" } },
            { format: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
  })

  return assets.map(toMediaDTO)
}

export async function uploadOryCMSMedia(file: File, options: UploadOptions = {}) {
  await ensureOryCMSMediaSchema()

  const validationError = validateOryCMSMediaFile(file)

  if (validationError) {
    throw new Error(validationError)
  }

  if (options.productImage && !["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Product images must be JPG, PNG, or WebP files.")
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.")
  }

  const folder = (process.env.CLOUDINARY_ORYCMS_FOLDER ?? "orycms/media").replace(/^\/+|\/+$/g, "")
  const mediaName = cleanMediaName(options.mediaName) || file.name
  const contentHash = crypto
    .createHash("sha256")
    .update(Buffer.from(await file.arrayBuffer()))
    .digest("hex")
  const publicId = `${folder}/${options.productImage ? "product-" : ""}${contentHash}`
  const existingAsset = await orycmsPrisma.oryCMSMediaAsset.findUnique({ where: { publicId } })

  if (existingAsset) {
    return toMediaDTO(existingAsset)
  }

  const timestamp = Math.round(Date.now() / 1000).toString()
  const uploadParams: Record<string, string> = {
    folder,
    overwrite: "false",
    public_id: contentHash,
    timestamp,
    unique_filename: "false",
    ...(options.productImage ? { transformation: "c_fill,g_auto,h_1200,w_1200" } : {}),
  }
  const signature = signCloudinaryParams(uploadParams, apiSecret)
  const form = new FormData()

  form.append("api_key", apiKey)
  form.append("file", file)
  Object.entries(uploadParams).forEach(([key, value]) => form.append(key, value))
  form.append("signature", signature)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    body: form,
    method: "POST",
  })
  const json = (await response.json()) as CloudinaryUploadResponse & { error?: { message?: string } }

  if (!response.ok) {
    throw new Error(json.error?.message ?? "Cloudinary upload failed.")
  }

  const asset = await orycmsPrisma.oryCMSMediaAsset.upsert({
    create: {
      assetId: json.asset_id,
      bytes: json.bytes,
      createdAt: new Date(json.created_at),
      format: json.format,
      height: json.height ?? null,
      originalFilename: mediaName,
      publicId: json.public_id,
      secureUrl: json.secure_url,
      width: json.width ?? null,
    },
    update: {
      bytes: json.bytes,
      createdAt: new Date(json.created_at),
      format: json.format,
      height: json.height ?? null,
      originalFilename: mediaName,
      secureUrl: json.secure_url,
      width: json.width ?? null,
    },
    where: { publicId: json.public_id },
  })

  return toMediaDTO(asset)
}

export async function deleteOryCMSMedia(id: string) {
  await ensureOryCMSMediaSchema()

  const asset = await orycmsPrisma.oryCMSMediaAsset.findUnique({ where: { id } })

  if (!asset) {
    throw new Error("Media asset not found.")
  }

  await deleteCloudinaryAsset(asset.publicId)
  await orycmsPrisma.oryCMSMediaAsset.delete({ where: { id } })
}

export async function deleteOryCMSMediaIfUnreferenced(reference: { id?: string; url?: string }) {
  const validId = reference.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reference.id)
    ? reference.id
    : undefined
  const asset = validId
    ? await orycmsPrisma.oryCMSMediaAsset.findUnique({ where: { id: validId } })
    : reference.url
      ? await orycmsPrisma.oryCMSMediaAsset.findFirst({ where: { secureUrl: reference.url } })
      : null

  if (!asset || await isMediaAssetReferenced(asset.id, asset.secureUrl)) return false

  await deleteCloudinaryAsset(asset.publicId)
  await orycmsPrisma.oryCMSMediaAsset.delete({ where: { id: asset.id } })
  return true
}

async function isMediaAssetReferenced(id: string, url: string) {
  const [products, categories, profile] = await Promise.all([
    orycmsPrisma.oryCMSProduct.findMany({
      select: { images: true },
      where: { deletedAt: null },
    }),
    orycmsPrisma.oryCMSCategory.findMany({
      select: { image: true },
      where: { deletedAt: null },
    }),
    orycmsPrisma.oryCMSUser.findFirst({
      select: { id: true },
      where: { deletedAt: null, profilePhoto: url },
    }),
  ])

  return Boolean(
    profile
    || products.some((product) => jsonContainsMedia(product.images, id, url))
    || categories.some((category) => jsonContainsMedia(category.image, id, url)),
  )
}

function jsonContainsMedia(value: unknown, id: string, url: string): boolean {
  if (Array.isArray(value)) return value.some((item) => jsonContainsMedia(item, id, url))
  if (!value || typeof value !== "object") return false

  const item = value as Record<string, unknown>
  if (item.id === id || item.url === url || item.secure_url === url) return true
  return Object.values(item).some((nested) => jsonContainsMedia(nested, id, url))
}

async function deleteCloudinaryAsset(publicId: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured.")
  }

  const timestamp = Math.round(Date.now() / 1000).toString()
  const signature = signCloudinaryParams({ public_id: publicId, timestamp }, apiSecret)
  const form = new URLSearchParams({
    api_key: apiKey,
    public_id: publicId,
    signature,
    timestamp,
  })
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    body: form,
    method: "POST",
  })
  const json = (await response.json()) as { result?: string; error?: { message?: string } }

  if (!response.ok || json.result === "error") {
    throw new Error(json.error?.message ?? "Cloudinary delete failed.")
  }
}

function signCloudinaryParams(params: Record<string, string>, apiSecret: string) {
  const payload = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&")

  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex")
}

function cleanMediaName(value: string | undefined) {
  return value?.trim().replace(/\s+/g, " ").slice(0, 160)
}

async function ensureOryCMSMediaSchema() {
  // Database structure is managed by Prisma migrations.
}
