import { revalidateTag, unstable_cache } from "next/cache"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { sanitizeRichText } from "@/lib/orycms/sanitize-html"

export type AnnouncementInput = {
  content: string
  ctaText: string | null
  ctaUrl: string | null
  startsAt: string | null
  endsAt: string | null
  active: boolean
  priority: number
  bgColor: string | null
  textColor: string | null
}

export type AnnouncementDTO = AnnouncementInput & {
  id: string
  createdAt: string
  updatedAt: string
}

type AnnouncementRow = {
  id: string
  content: string
  cta_text: string | null
  cta_url: string | null
  starts_at: Date | string | null
  ends_at: Date | string | null
  active: boolean
  priority: number
  bg_color: string | null
  text_color: string | null
  created_at: Date | string
  updated_at: Date | string
}

function toDTO(row: AnnouncementRow): AnnouncementDTO {
  return {
    id: row.id,
    content: row.content,
    ctaText: row.cta_text,
    ctaUrl: row.cta_url,
    startsAt: row.starts_at ? new Date(row.starts_at).toISOString() : null,
    endsAt: row.ends_at ? new Date(row.ends_at).toISOString() : null,
    active: row.active,
    priority: row.priority,
    bgColor: row.bg_color,
    textColor: row.text_color,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

const STOREFRONT_ANNOUNCEMENTS_CACHE_TAG = "storefront-announcements"

const getActiveAnnouncementsCached = unstable_cache(
  async () => {
    const now = new Date()
    const rows = await orycmsPrisma.$queryRaw<AnnouncementRow[]>`
      SELECT * FROM orycms_announcements
      WHERE deleted_at IS NULL
        AND active = true
        AND (starts_at IS NULL OR starts_at <= ${now})
        AND (ends_at IS NULL OR ends_at >= ${now})
      ORDER BY priority DESC, created_at DESC
    `
    return rows.map(toDTO)
  },
  ["active-orycms-announcements"],
  { revalidate: 60, tags: [STOREFRONT_ANNOUNCEMENTS_CACHE_TAG] },
)

function invalidateAnnouncementsCache() {
  try {
    revalidateTag(STOREFRONT_ANNOUNCEMENTS_CACHE_TAG, { expire: 0 })
  } catch {
    // Ignore outside request context
  }
}

export async function listOryCMSAnnouncements(): Promise<AnnouncementDTO[]> {
  const rows = await orycmsPrisma.$queryRaw<AnnouncementRow[]>`
    SELECT * FROM orycms_announcements
    WHERE deleted_at IS NULL
    ORDER BY priority DESC, created_at DESC
  `
  return rows.map(toDTO)
}

export async function getOryCMSAnnouncement(id: string): Promise<AnnouncementDTO | null> {
  const [row] = await orycmsPrisma.$queryRaw<AnnouncementRow[]>`
    SELECT * FROM orycms_announcements
    WHERE id = ${id}::uuid AND deleted_at IS NULL LIMIT 1
  `
  return row ? toDTO(row) : null
}

export async function getActiveAnnouncements(): Promise<AnnouncementDTO[]> {
  return getActiveAnnouncementsCached()
}

export async function saveOryCMSAnnouncement(input: AnnouncementInput, id?: string): Promise<AnnouncementDTO> {
  const content = sanitizeRichText(input.content)
  const ctaText = input.ctaText?.trim() || null
  const ctaUrl = input.ctaUrl?.trim() || null
  const priority = Number(input.priority) || 0
  const startsAt = input.startsAt ? new Date(input.startsAt) : null
  const endsAt = input.endsAt ? new Date(input.endsAt) : null

  let result: AnnouncementDTO

  if (id) {
    const [row] = await orycmsPrisma.$queryRaw<AnnouncementRow[]>`
      UPDATE orycms_announcements SET
        content = ${content},
        cta_text = ${ctaText},
        cta_url = ${ctaUrl},
        starts_at = ${startsAt},
        ends_at = ${endsAt},
        active = ${input.active},
        priority = ${priority},
        bg_color = ${input.bgColor},
        text_color = ${input.textColor},
        updated_at = now()
      WHERE id = ${id}::uuid AND deleted_at IS NULL
      RETURNING *
    `
    if (!row) throw new Error("Announcement not found.")
    result = toDTO(row)
  } else {
    const [row] = await orycmsPrisma.$queryRaw<AnnouncementRow[]>`
      INSERT INTO orycms_announcements (content, cta_text, cta_url, starts_at, ends_at, active, priority, bg_color, text_color)
      VALUES (${content}, ${ctaText}, ${ctaUrl}, ${startsAt}, ${endsAt}, ${input.active}, ${priority}, ${input.bgColor}, ${input.textColor})
      RETURNING *
    `
    result = toDTO(row)
  }

  invalidateAnnouncementsCache()
  return result
}

export async function deleteOryCMSAnnouncement(id: string): Promise<void> {
  await orycmsPrisma.$executeRaw`
    UPDATE orycms_announcements
    SET deleted_at = now(), updated_at = now()
    WHERE id = ${id}::uuid AND deleted_at IS NULL
  `
  invalidateAnnouncementsCache()
}
