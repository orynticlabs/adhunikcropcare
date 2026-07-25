import { revalidateTag, unstable_cache } from "next/cache"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { deleteOryCMSCloudinaryAsset, uploadOryCMSReelVideo, type OryCMSMediaAssetDTO } from "@/lib/orycms/media"

export const MAX_ORYCMS_REELS = 10

export type OryCMSReelVideoDTO = {
  bytes: number
  createdAt: string
  displayOrder: number
  format: string
  id: string
  posterUrl: string
  status: "draft" | "published"
  title: string
  videoUrl: string
}

type ReelRow = {
  bytes: number
  created_at: Date
  display_order: number
  format: string
  id: string
  poster_url: string | null
  status: string
  title: string
  video_url: string
}

type ReelInput = {
  displayOrder?: number
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
  await ensureOryCMSReelVideoSchema()
  if (options.publishedOnly) return listPublishedReelsCached()

  const rows = await orycmsPrisma.$queryRaw<ReelRow[]>`
    SELECT * FROM orycms_reel_videos
    WHERE deleted_at IS NULL
    ORDER BY display_order ASC, created_at DESC
  `

  return rows.map(toDTO)
}

export async function createOryCMSReelVideo(file: File, input: ReelInput) {
  await ensureOryCMSReelVideoSchema()
  const [{ count }] = await orycmsPrisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count FROM orycms_reel_videos WHERE deleted_at IS NULL
  `
  if (Number(count) >= MAX_ORYCMS_REELS) {
    throw new Error(`You can upload up to ${MAX_ORYCMS_REELS} reels. Delete an existing reel before adding a new one.`)
  }
  const payload = validate(input)
  const asset = await uploadOryCMSReelVideo(file, { mediaName: payload.title })
  const [row] = await orycmsPrisma.$queryRaw<ReelRow[]>`
    INSERT INTO orycms_reel_videos
      (title, video_url, poster_url, asset_id, public_id, format, bytes, status, display_order)
    VALUES
      (${payload.title}, ${asset.secure_url}, ${cloudinaryVideoPoster(asset.secure_url)}, ${asset.asset_id}, ${asset.public_id}, ${asset.format},
       ${asset.bytes}, ${payload.status}, ${payload.displayOrder})
    RETURNING *
  `

  invalidateReelsCache()
  return toDTO(row)
}

export async function deleteOryCMSReelVideo(id: string) {
  await ensureOryCMSReelVideoSchema()
  const [existing] = await orycmsPrisma.$queryRaw<{ public_id: string }[]>`
    SELECT public_id
    FROM orycms_reel_videos
    WHERE id = ${id}::uuid AND deleted_at IS NULL
    LIMIT 1
  `

  if (!existing) throw new Error("Reel video not found.")

  const [activeReferences] = await orycmsPrisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM orycms_reel_videos
    WHERE public_id = ${existing.public_id} AND deleted_at IS NULL
  `

  if (Number(activeReferences?.count ?? 0) <= 1) {
    await deleteOryCMSCloudinaryAsset(existing.public_id, "video")
    await orycmsPrisma.oryCMSMediaAsset.deleteMany({
      where: { publicId: existing.public_id, resourceType: "video" },
    })
  }

  const [row] = await orycmsPrisma.$queryRaw<{ id: string }[]>`
    UPDATE orycms_reel_videos
    SET deleted_at = now(), updated_at = now()
    WHERE id = ${id}::uuid AND deleted_at IS NULL
    RETURNING id
  `

  if (!row) throw new Error("Reel video not found.")
  invalidateReelsCache()
}

async function ensureOryCMSReelVideoSchema() {
  await orycmsPrisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS orycms_reel_videos (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      video_url text NOT NULL,
      poster_url text,
      asset_id text,
      public_id text NOT NULL,
      format text NOT NULL,
      bytes integer NOT NULL DEFAULT 0,
      status text NOT NULL DEFAULT 'published',
      display_order integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz
    )
  `
  await orycmsPrisma.$executeRaw`ALTER TABLE orycms_reel_videos DROP COLUMN IF EXISTS result`
  await orycmsPrisma.$executeRaw`ALTER TABLE orycms_reel_videos DROP COLUMN IF EXISTS farmer`
  await orycmsPrisma.$executeRaw`ALTER TABLE orycms_reel_videos DROP COLUMN IF EXISTS location`
  await orycmsPrisma.$executeRaw`ALTER TABLE orycms_reel_videos DROP COLUMN IF EXISTS prompt`
  await orycmsPrisma.$executeRaw`CREATE INDEX IF NOT EXISTS orycms_reel_videos_status_display_order_idx ON orycms_reel_videos (status, display_order)`
  await orycmsPrisma.$executeRaw`CREATE INDEX IF NOT EXISTS orycms_reel_videos_deleted_at_idx ON orycms_reel_videos (deleted_at)`
}

function validate(input: ReelInput) {
  const payload = {
    displayOrder: Number(input.displayOrder ?? 0),
    status: input.status === "draft" ? "draft" as const : "published" as const,
    title: input.title?.trim() ?? "",
  }

  if (!payload.title) throw new Error("Title is required.")
  if (!Number.isFinite(payload.displayOrder) || payload.displayOrder < 0) payload.displayOrder = 0

  payload.title = payload.title.slice(0, 120)

  return payload
}

function toDTO(row: ReelRow): OryCMSReelVideoDTO {
  return {
    bytes: row.bytes,
    createdAt: row.created_at.toISOString(),
    displayOrder: row.display_order,
    format: row.format,
    id: row.id,
    posterUrl: row.poster_url ?? "",
    status: row.status === "draft" ? "draft" : "published",
    title: row.title,
    videoUrl: row.video_url,
  }
}

function cloudinaryVideoPoster(url: OryCMSMediaAssetDTO["secure_url"]) {
  if (!url.includes("/video/upload/")) return ""
  return url.replace(/\/video\/upload\/(?:v\d+\/)?/, "/video/upload/so_0,f_jpg/").replace(/\.[^/.]+$/, ".jpg")
}
