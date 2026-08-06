import { orycmsPrisma } from "@/lib/orycms/prisma"
import { validateEmail } from "@/lib/storefront-auth"

export type OryCMSNotificationEmailDTO = {
  createdAt: string
  email: string
  enabled: boolean
  id: string
  label: string | null
  updatedAt: string
}

type NotificationEmailRow = {
  createdAt: Date | string
  email: string
  enabled: boolean
  id: string
  label: string | null
  updatedAt: Date | string
}

type CreateInput = {
  email?: string
  label?: string | null
}

type UpdateInput = {
  email?: string
  enabled?: boolean
  label?: string | null
}

const SELECT = `id, email, label, enabled, created_at AS "createdAt", updated_at AS "updatedAt"`

function normalizeEmail(email: string | undefined) {
  return String(email ?? "").trim().toLowerCase()
}

function normalizeLabel(label: string | null | undefined) {
  const value = String(label ?? "").trim()
  return value.length > 0 ? value : null
}

function toDTO(row: NotificationEmailRow): OryCMSNotificationEmailDTO {
  return {
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    email: row.email,
    enabled: Boolean(row.enabled),
    id: row.id,
    label: row.label,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  }
}

function isUniqueViolation(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "P2010")
    || (error instanceof Error && /duplicate key|unique constraint/i.test(error.message))
}

export async function listNotificationEmails(): Promise<OryCMSNotificationEmailDTO[]> {
  const rows = await orycmsPrisma.$queryRawUnsafe<NotificationEmailRow[]>(
    `SELECT ${SELECT} FROM orycms_notification_emails ORDER BY created_at ASC`,
  )
  return rows.map(toDTO)
}

export async function createNotificationEmail(input: CreateInput): Promise<OryCMSNotificationEmailDTO> {
  const email = normalizeEmail(input.email)
  const label = normalizeLabel(input.label)
  if (!validateEmail(email)) throw new Error("Enter a valid email address.")

  try {
    const [row] = await orycmsPrisma.$queryRaw<NotificationEmailRow[]>`
      INSERT INTO orycms_notification_emails (id, email, label, enabled, created_at, updated_at)
      VALUES (gen_random_uuid(), ${email}, ${label}, true, now(), now())
      RETURNING id, email, label, enabled, created_at AS "createdAt", updated_at AS "updatedAt"
    `
    return toDTO(row)
  } catch (error) {
    if (isUniqueViolation(error)) throw new Error("This email is already on the list.")
    throw error
  }
}

export async function updateNotificationEmail(id: string, input: UpdateInput): Promise<OryCMSNotificationEmailDTO> {
  const [current] = await orycmsPrisma.$queryRaw<NotificationEmailRow[]>`
    SELECT id, email, label, enabled, created_at AS "createdAt", updated_at AS "updatedAt"
    FROM orycms_notification_emails WHERE id = ${id}::uuid LIMIT 1
  `
  if (!current) throw new Error("Recipient not found.")

  const email = input.email === undefined ? current.email : normalizeEmail(input.email)
  const label = input.label === undefined ? current.label : normalizeLabel(input.label)
  const enabled = input.enabled === undefined ? current.enabled : Boolean(input.enabled)
  if (!validateEmail(email)) throw new Error("Enter a valid email address.")

  try {
    const [row] = await orycmsPrisma.$queryRaw<NotificationEmailRow[]>`
      UPDATE orycms_notification_emails
      SET email = ${email}, label = ${label}, enabled = ${enabled}, updated_at = now()
      WHERE id = ${id}::uuid
      RETURNING id, email, label, enabled, created_at AS "createdAt", updated_at AS "updatedAt"
    `
    return toDTO(row)
  } catch (error) {
    if (isUniqueViolation(error)) throw new Error("This email is already on the list.")
    throw error
  }
}

export async function deleteNotificationEmail(id: string): Promise<void> {
  const affected = await orycmsPrisma.$executeRaw`
    DELETE FROM orycms_notification_emails WHERE id = ${id}::uuid
  `
  if (Number(affected) === 0) throw new Error("Recipient not found.")
}

/**
 * Enabled recipient addresses used by email hooks. A fresh DB read on every event
 * means changes on the Settings page take effect immediately without an application restart.
 * Returns an empty array when nothing is configured.
 */
export async function getEnabledNotificationRecipients(): Promise<string[]> {
  const rows = await orycmsPrisma.$queryRaw<{ email: string }[]>`
    SELECT email FROM orycms_notification_emails WHERE enabled = true ORDER BY created_at ASC
  `
  return rows.map((row) => row.email)
}
