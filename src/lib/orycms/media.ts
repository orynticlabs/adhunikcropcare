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

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.")
  }

  const folder = process.env.CLOUDINARY_ORYCMS_FOLDER ?? "orycms/media"
  const mediaName = cleanMediaName(options.mediaName) || file.name
  const timestamp = Math.round(Date.now() / 1000).toString()
  const signature = signCloudinaryParams({ folder, timestamp }, apiSecret)
  const form = new FormData()

  form.append("api_key", apiKey)
  form.append("file", file)
  form.append("folder", folder)
  form.append("signature", signature)
  form.append("timestamp", timestamp)

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
  await orycmsPrisma.$executeRawUnsafe(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE IF NOT EXISTS orycms_media_assets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      asset_id text NOT NULL UNIQUE,
      public_id text NOT NULL UNIQUE,
      secure_url text NOT NULL,
      width integer,
      height integer,
      format text NOT NULL,
      bytes integer NOT NULL,
      created_at timestamptz NOT NULL,
      original_filename text,
      resource_type text NOT NULL DEFAULT 'image'
    );
    CREATE INDEX IF NOT EXISTS orycms_media_assets_created_at_idx ON orycms_media_assets (created_at);
  `)
}
