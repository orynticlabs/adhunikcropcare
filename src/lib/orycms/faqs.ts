import { revalidateTag, unstable_cache } from "next/cache"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export type OryCMSFaqDTO = {
  id: string
  question: string
  answer: string
  displayOrder: number
  status: "published" | "draft"
  category: string
  createdAt: string
  updatedAt: string
}

export type OryCMSFaqInput = {
  question: string
  answer: string
  displayOrder?: number
  status?: "published" | "draft"
  category?: string
}

type OryCMSFaqRow = {
  id: string
  question: string
  answer: string
  display_order: number
  status: string
  category: string | null
  created_at: Date
  updated_at: Date
}

function toFaqDTO(row: OryCMSFaqRow): OryCMSFaqDTO {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    displayOrder: Number(row.display_order) || 0,
    status: row.status === "draft" ? "draft" : "published",
    category: row.category || "General",
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function ensureOryCMSFaqsSchema() {
  try {
    await orycmsPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "orycms_faqs" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "question" TEXT NOT NULL,
        "answer" TEXT NOT NULL,
        "display_order" INTEGER NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'published',
        "category" TEXT DEFAULT 'General',
        "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMPTZ(6),
        CONSTRAINT "orycms_faqs_pkey" PRIMARY KEY ("id")
      );
    `
  } catch {
    // Table already exists or database permission error
  }
}

const STOREFRONT_FAQS_CACHE_TAG = "storefront-faqs"

const listPublishedFaqsCached = unstable_cache(
  async () => {
    await ensureOryCMSFaqsSchema()
    try {
      const rows = await orycmsPrisma.$queryRaw<OryCMSFaqRow[]>`
        SELECT * FROM orycms_faqs
        WHERE status = 'published' AND deleted_at IS NULL
        ORDER BY display_order ASC, created_at ASC
      `
      return rows.map(toFaqDTO)
    } catch {
      return []
    }
  },
  ["published-orycms-faqs"],
  { revalidate: 300, tags: [STOREFRONT_FAQS_CACHE_TAG] },
)

export async function listOryCMSFaqs(options: { publishedOnly?: boolean } = {}): Promise<OryCMSFaqDTO[]> {
  if (options.publishedOnly) {
    return listPublishedFaqsCached()
  }

  await ensureOryCMSFaqsSchema()
  try {
    const rows = await orycmsPrisma.$queryRaw<OryCMSFaqRow[]>`
      SELECT * FROM orycms_faqs
      WHERE deleted_at IS NULL
      ORDER BY display_order ASC, created_at ASC
    `
    return rows.map(toFaqDTO)
  } catch {
    return []
  }
}

export async function getOryCMSFaq(id: string): Promise<OryCMSFaqDTO | null> {
  await ensureOryCMSFaqsSchema()
  try {
    const [row] = await orycmsPrisma.$queryRaw<OryCMSFaqRow[]>`
      SELECT * FROM orycms_faqs
      WHERE id = ${id}::uuid AND deleted_at IS NULL
      LIMIT 1
    `
    return row ? toFaqDTO(row) : null
  } catch {
    return null
  }
}

export async function saveOryCMSFaq(input: OryCMSFaqInput, id?: string): Promise<OryCMSFaqDTO> {
  await ensureOryCMSFaqsSchema()

  const question = input.question.trim()
  const answer = input.answer.trim()
  const displayOrder = Number(input.displayOrder) || 0
  const status = input.status === "draft" ? "draft" : "published"
  const category = (input.category || "General").trim()

  if (!question) throw new Error("Question is required.")
  if (!answer) throw new Error("Answer is required.")

  let row: OryCMSFaqRow

  if (id) {
    const [updated] = await orycmsPrisma.$queryRaw<OryCMSFaqRow[]>`
      UPDATE orycms_faqs
      SET
        question = ${question},
        answer = ${answer},
        display_order = ${displayOrder},
        status = ${status},
        category = ${category},
        updated_at = now()
      WHERE id = ${id}::uuid AND deleted_at IS NULL
      RETURNING *
    `
    if (!updated) throw new Error("FAQ not found.")
    row = updated
  } else {
    const [created] = await orycmsPrisma.$queryRaw<OryCMSFaqRow[]>`
      INSERT INTO orycms_faqs (question, answer, display_order, status, category)
      VALUES (${question}, ${answer}, ${displayOrder}, ${status}, ${category})
      RETURNING *
    `
    row = created
  }

  try {
    revalidateTag(STOREFRONT_FAQS_CACHE_TAG, { expire: 0 })
  } catch {
    // Ignore cache revalidation errors outside request context
  }

  return toFaqDTO(row)
}

export async function deleteOryCMSFaq(id: string): Promise<void> {
  await ensureOryCMSFaqsSchema()

  await orycmsPrisma.$executeRaw`
    UPDATE orycms_faqs
    SET deleted_at = now()
    WHERE id = ${id}::uuid
  `

  try {
    revalidateTag(STOREFRONT_FAQS_CACHE_TAG, { expire: 0 })
  } catch {
    // Ignore
  }
}
