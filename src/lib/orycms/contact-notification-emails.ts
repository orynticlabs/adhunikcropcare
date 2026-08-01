import { orycmsPrisma } from "@/lib/orycms/prisma"
import { validateEmail } from "@/lib/storefront-auth"

export type OryCMSContactNotificationEmailDTO = {
  createdAt: string
  email: string
  enabled: boolean
  id: string
  label: string | null
  updatedAt: string
}

type ContactNotificationEmailRow = {
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

function toDTO(row: ContactNotificationEmailRow): OryCMSContactNotificationEmailDTO {
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

async function ensureTable() {
  await orycmsPrisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS orycms_contact_notification_emails (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      label TEXT,
      enabled BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
}

export async function listContactNotificationEmails(): Promise<OryCMSContactNotificationEmailDTO[]> {
  await ensureTable()
  const rows = await orycmsPrisma.$queryRawUnsafe<ContactNotificationEmailRow[]>(
    `SELECT ${SELECT} FROM orycms_contact_notification_emails ORDER BY created_at ASC`,
  )
  return rows.map(toDTO)
}

export async function createContactNotificationEmail(input: CreateInput): Promise<OryCMSContactNotificationEmailDTO> {
  await ensureTable()
  const email = normalizeEmail(input.email)
  const label = normalizeLabel(input.label)
  if (!validateEmail(email)) throw new Error("Enter a valid email address.")

  try {
    const [row] = await orycmsPrisma.$queryRaw<ContactNotificationEmailRow[]>`
      INSERT INTO orycms_contact_notification_emails (id, email, label, enabled, created_at, updated_at)
      VALUES (gen_random_uuid(), ${email}, ${label}, true, now(), now())
      RETURNING id, email, label, enabled, created_at AS "createdAt", updated_at AS "updatedAt"
    `
    return toDTO(row)
  } catch (error) {
    if (isUniqueViolation(error)) throw new Error("This email is already on the contact notifications list.")
    throw error
  }
}

export async function updateContactNotificationEmail(id: string, input: UpdateInput): Promise<OryCMSContactNotificationEmailDTO> {
  await ensureTable()
  const [current] = await orycmsPrisma.$queryRaw<ContactNotificationEmailRow[]>`
    SELECT id, email, label, enabled, created_at AS "createdAt", updated_at AS "updatedAt"
    FROM orycms_contact_notification_emails WHERE id = ${id}::uuid LIMIT 1
  `
  if (!current) throw new Error("Recipient not found.")

  const email = input.email === undefined ? current.email : normalizeEmail(input.email)
  const label = input.label === undefined ? current.label : normalizeLabel(input.label)
  const enabled = input.enabled === undefined ? current.enabled : Boolean(input.enabled)
  if (!validateEmail(email)) throw new Error("Enter a valid email address.")

  try {
    const [row] = await orycmsPrisma.$queryRaw<ContactNotificationEmailRow[]>`
      UPDATE orycms_contact_notification_emails
      SET email = ${email}, label = ${label}, enabled = ${enabled}, updated_at = now()
      WHERE id = ${id}::uuid
      RETURNING id, email, label, enabled, created_at AS "createdAt", updated_at AS "updatedAt"
    `
    return toDTO(row)
  } catch (error) {
    if (isUniqueViolation(error)) throw new Error("This email is already on the contact notifications list.")
    throw error
  }
}

export async function deleteContactNotificationEmail(id: string): Promise<void> {
  await ensureTable()
  const affected = await orycmsPrisma.$executeRaw`
    DELETE FROM orycms_contact_notification_emails WHERE id = ${id}::uuid
  `
  if (Number(affected) === 0) throw new Error("Recipient not found.")
}

export async function getEnabledContactNotificationRecipients(): Promise<string[]> {
  await ensureTable()
  const rows = await orycmsPrisma.$queryRaw<{ email: string }[]>`
    SELECT email FROM orycms_contact_notification_emails WHERE enabled = true ORDER BY created_at ASC
  `
  return rows.map((row) => row.email)
}
