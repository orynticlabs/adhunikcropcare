import { orycmsPrisma } from "@/lib/orycms/prisma"

export type OryCMSContactEnquiryDTO = {
  countryCode: string
  createdAt: string
  email: string
  fullName: string
  id: string
  location: string
  message: string
  mobileNumber: string
  status: string
  ticketId: string
  topic: string
  updatedAt: string
}

type ContactEnquiryRow = {
  country_code: string
  created_at: Date | string
  email: string
  full_name: string
  id: string
  location: string
  message: string
  mobile_number: string
  status: string
  ticket_id: string | null
  topic: string
  updated_at: Date | string
}

export async function ensureContactEnquiriesTicketSchema() {
  await orycmsPrisma.$executeRaw`
    ALTER TABLE storefront_contact_enquiries
    ADD COLUMN IF NOT EXISTS ticket_id TEXT
  `
  await orycmsPrisma.$executeRaw`
    CREATE UNIQUE INDEX IF NOT EXISTS storefront_contact_enquiries_ticket_id_key
    ON storefront_contact_enquiries(ticket_id)
    WHERE ticket_id IS NOT NULL
  `
}

export async function generateContactTicketId() {
  await ensureContactEnquiriesTicketSchema()
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const prefix = `CNT-${today}`

  // Try generating a random 4-digit unique suffix (0001-9999)
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const num = Math.floor(1 + Math.random() * 9999)
    const suffix = String(num).padStart(4, "0")
    const candidateId = `${prefix}-${suffix}`
    const [existing] = await orycmsPrisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM storefront_contact_enquiries WHERE ticket_id = ${candidateId} LIMIT 1
    `
    if (!existing) return candidateId
  }

  // Fallback: Find lowest unused 4-digit suffix for today (0001-9999)
  const existingRows = await orycmsPrisma.$queryRaw<{ ticket_id: string }[]>`
    SELECT ticket_id FROM storefront_contact_enquiries WHERE ticket_id LIKE ${`${prefix}-%`}
  `
  const usedSuffixes = new Set(existingRows.map((r) => r.ticket_id.split("-").pop() ?? ""))

  for (let num = 1; num <= 9999; num += 1) {
    const candidateSuffix = String(num).padStart(4, "0")
    if (!usedSuffixes.has(candidateSuffix)) {
      return `${prefix}-${candidateSuffix}`
    }
  }

  return `${prefix}-${Date.now().toString().slice(-4)}`
}

export async function listOryCMSContactEnquiries(): Promise<OryCMSContactEnquiryDTO[]> {
  await ensureContactEnquiriesTicketSchema()
  const rows = await orycmsPrisma.$queryRaw<ContactEnquiryRow[]>`
    SELECT id, ticket_id, full_name, country_code, mobile_number, email, topic, location, message, status, created_at, updated_at
    FROM storefront_contact_enquiries
    ORDER BY created_at DESC
    LIMIT 200
  `
  return rows.map(toDTO)
}

export async function updateOryCMSContactEnquiryStatus(id: string, status: string): Promise<OryCMSContactEnquiryDTO> {
  await ensureContactEnquiriesTicketSchema()
  const normalized = status.trim().toLowerCase()
  if (!["new", "read", "closed"].includes(normalized)) throw new Error("Invalid contact status.")
  const [row] = await orycmsPrisma.$queryRaw<ContactEnquiryRow[]>`
    UPDATE storefront_contact_enquiries
    SET status = ${normalized}, updated_at = now()
    WHERE id = ${id}::uuid
    RETURNING id, ticket_id, full_name, country_code, mobile_number, email, topic, location, message, status, created_at, updated_at
  `
  if (!row) throw new Error("Contact enquiry not found.")
  return toDTO(row)
}

function toDTO(row: ContactEnquiryRow): OryCMSContactEnquiryDTO {
  return {
    countryCode: row.country_code,
    createdAt: toIso(row.created_at),
    email: row.email,
    fullName: row.full_name,
    id: row.id,
    location: row.location,
    message: row.message,
    mobileNumber: row.mobile_number,
    status: row.status,
    ticketId: row.ticket_id ?? `CNT-${row.id.slice(0, 8).toUpperCase()}`,
    topic: row.topic,
    updatedAt: toIso(row.updated_at),
  }
}

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}
