import { revalidateTag, unstable_cache } from "next/cache"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { uploadOryCMSReelVideo, type OryCMSMediaAssetDTO } from "@/lib/orycms/media"

export type OryCMSReelVideoDTO = {
  bytes: number
  createdAt: string
  displayOrder: number
  farmer: string
  format: string
  id: string
  location: string
  posterUrl: string
  prompt: string
  result: string
  status: "draft" | "published"
  title: string
  videoUrl: string
}

type ReelRow = {
  bytes: number
  created_at: Date
  display_order: number
  farmer: string | null
  format: string
  id: string
  location: string | null
  poster_url: string | null
  prompt: string | null
  result: string
  status: string
  title: string
  video_url: string
}

type ReelInput = {
  displayOrder?: number
  farmer?: string
  location?: string
  prompt?: string
  result?: string
  status?: string
  title?: string
}

const STOREFRONT_REELS_CACHE_TAG = "storefront-reels"

const listPublishedReelsCached = unstable_cache(
  async () => {
    const rows = await orycmsPrisma.$queryRaw<ReelRow[]>`
      SELECT * FROM orycms_reel_videos
      WHERE deleted_at IS NULL AND status = 'published'
      ORDER BY display_order ASC, created_at DESC
    `
    return rows.map(toDTO)
  },
  ["published-orycms-reels"],
  { revalidate: 300, tags: [STOREFRONT_REELS_CACHE_TAG] },
)

function invalidateReelsCache() {
  try {
    revalidateTag(STOREFRONT_REELS_CACHE_TAG, { expire: 0 })
  } catch {
    // Ignore outside request context
  }
}

export async function listOryCMSReelVideos(options: { publishedOnly?: boolean } = {}) {
  if (options.publishedOnly) return listPublishedReelsCached()

  const rows = await orycmsPrisma.$queryRaw<ReelRow[]>`
    SELECT * FROM orycms_reel_videos
    WHERE deleted_at IS NULL
    ORDER BY display_order ASC, created_at DESC
  `

  return rows.map(toDTO)
}

export async function createOryCMSReelVideo(file: File, input: ReelInput) {
  const payload = validate(input)
  const asset = await uploadOryCMSReelVideo(file, { mediaName: payload.title })
  const [row] = await orycmsPrisma.$queryRaw<ReelRow[]>`
    INSERT INTO orycms_reel_videos
      (title, result, farmer, location, prompt, video_url, poster_url, asset_id, public_id, format, bytes, status, display_order)
    VALUES
      (${payload.title}, ${payload.result}, ${payload.farmer || null}, ${payload.location || null}, ${payload.prompt || null},
       ${asset.secure_url}, ${cloudinaryVideoPoster(asset.secure_url)}, ${asset.asset_id}, ${asset.public_id}, ${asset.format},
       ${asset.bytes}, ${payload.status}, ${payload.displayOrder})
    RETURNING *
  `

  invalidateReelsCache()
  return toDTO(row)
}

export async function deleteOryCMSReelVideo(id: string) {
  const [row] = await orycmsPrisma.$queryRaw<{ id: string }[]>`
    UPDATE orycms_reel_videos
    SET deleted_at = now(), updated_at = now()
    WHERE id = ${id}::uuid AND deleted_at IS NULL
    RETURNING id
  `

  if (!row) throw new Error("Reel video not found.")
  invalidateReelsCache()
}

function validate(input: ReelInput) {
  const payload = {
    displayOrder: Number(input.displayOrder ?? 0),
    farmer: input.farmer?.trim() ?? "",
    location: input.location?.trim() ?? "",
    prompt: input.prompt?.trim() ?? "",
    result: input.result?.trim() ?? "",
    status: input.status === "draft" ? ("draft" as const) : ("published" as const),
    title: input.title?.trim() ?? "",
  }

  if (!payload.title) throw new Error("Title is required.")
  if (!payload.result) throw new Error("Result is required.")
  if (!Number.isFinite(payload.displayOrder) || payload.displayOrder < 0) payload.displayOrder = 0

  payload.title = payload.title.slice(0, 120)
  payload.result = payload.result.slice(0, 120)
  payload.farmer = payload.farmer.slice(0, 120)
  payload.location = payload.location.slice(0, 120)
  payload.prompt = payload.prompt.slice(0, 500)

  return payload
}

function toDTO(row: ReelRow): OryCMSReelVideoDTO {
  return {
    bytes: row.bytes,
    createdAt: row.created_at.toISOString(),
    displayOrder: row.display_order,
    farmer: row.farmer ?? "",
    format: row.format,
    id: row.id,
    location: row.location ?? "",
    posterUrl: row.poster_url ?? "",
    prompt: row.prompt ?? "",
    result: row.result,
    status: row.status === "draft" ? "draft" : "published",
    title: row.title,
    videoUrl: row.video_url,
  }
}

function cloudinaryVideoPoster(url: OryCMSMediaAssetDTO["secure_url"]) {
  if (!url.includes("/video/upload/")) return ""
  return url.replace(/\/video\/upload\/(?:v\d+\/)?/, "/video/upload/so_0,f_jpg/").replace(/\.[^/.]+$/, ".jpg")
}
