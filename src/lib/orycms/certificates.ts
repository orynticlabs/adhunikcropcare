import type { Prisma } from "@prisma/client"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export type CertificateImage = { id?: string; name?: string; url: string }
export type CertificateStatus = "draft" | "published"

export type OryCMSCertificateInput = {
  certificateNumber?: string
  description?: string
  displayOrder?: number
  documentUrl?: string
  expiresOn?: string
  image?: CertificateImage | null
  issuedOn?: string
  issuingAuthority: string
  status: CertificateStatus
  title: string
}

export type OryCMSCertificateDTO = OryCMSCertificateInput & {
  createdAt: string
  id: string
  updatedAt: string
}

type CertificateRow = {
  certificate_number: string | null
  created_at: Date
  description: string | null
  display_order: number
  document_url: string | null
  expires_on: Date | null
  id: string
  image: Prisma.JsonValue | null
  issued_on: Date | null
  issuing_authority: string
  status: string
  title: string
  updated_at: Date
}

export async function listOryCMSCertificates(options: { publishedOnly?: boolean } = {}) {
  const rows = options.publishedOnly
    ? await orycmsPrisma.$queryRaw<CertificateRow[]>`
        SELECT * FROM orycms_certificates
        WHERE deleted_at IS NULL AND status = 'published'
        ORDER BY display_order ASC, created_at DESC
      `
    : await orycmsPrisma.$queryRaw<CertificateRow[]>`
        SELECT * FROM orycms_certificates
        WHERE deleted_at IS NULL
        ORDER BY display_order ASC, created_at DESC
      `
  return rows.map(toDTO)
}

export async function saveOryCMSCertificate(input: OryCMSCertificateInput, id?: string) {
  const payload = validate(input)
  const [row] = id
    ? await orycmsPrisma.$queryRaw<CertificateRow[]>`
        UPDATE orycms_certificates SET
          title = ${payload.title}, issuing_authority = ${payload.issuingAuthority},
          certificate_number = ${payload.certificateNumber || null}, description = ${payload.description || null},
          image = ${JSON.stringify(payload.image)}::jsonb, document_url = ${payload.documentUrl || null},
          issued_on = ${payload.issuedOn || null}::date, expires_on = ${payload.expiresOn || null}::date,
          status = ${payload.status}, display_order = ${payload.displayOrder}, updated_at = now()
        WHERE id = ${id}::uuid AND deleted_at IS NULL RETURNING *
      `
    : await orycmsPrisma.$queryRaw<CertificateRow[]>`
        INSERT INTO orycms_certificates
          (title, issuing_authority, certificate_number, description, image, document_url, issued_on, expires_on, status, display_order)
        VALUES
          (${payload.title}, ${payload.issuingAuthority}, ${payload.certificateNumber || null}, ${payload.description || null},
           ${JSON.stringify(payload.image)}::jsonb, ${payload.documentUrl || null}, ${payload.issuedOn || null}::date,
           ${payload.expiresOn || null}::date, ${payload.status}, ${payload.displayOrder})
        RETURNING *
      `
  if (!row) throw new Error("Certificate not found.")
  return toDTO(row)
}

export async function deleteOryCMSCertificate(id: string) {
  await orycmsPrisma.$executeRaw`
    UPDATE orycms_certificates SET deleted_at = now(), updated_at = now()
    WHERE id = ${id}::uuid AND deleted_at IS NULL
  `
}

function validate(input: OryCMSCertificateInput) {
  const payload = {
    certificateNumber: input.certificateNumber?.trim() ?? "",
    description: input.description?.trim() ?? "",
    displayOrder: Number(input.displayOrder ?? 0),
    documentUrl: input.documentUrl?.trim() ?? "",
    expiresOn: input.expiresOn || "",
    image: input.image?.url ? input.image : null,
    issuedOn: input.issuedOn || "",
    issuingAuthority: input.issuingAuthority?.trim() ?? "",
    status: input.status,
    title: input.title?.trim() ?? "",
  }
  if (!payload.title) throw new Error("Certificate title is required.")
  if (!payload.issuingAuthority) throw new Error("Issuing authority is required.")
  if (!payload.image) throw new Error("Certificate image is required.")
  if (!(["draft", "published"] as const).includes(payload.status)) throw new Error("Invalid certificate status.")
  if (!Number.isFinite(payload.displayOrder)) throw new Error("Display order must be a number.")
  if (payload.expiresOn && payload.issuedOn && payload.expiresOn < payload.issuedOn) throw new Error("Expiry date cannot be before issue date.")
  return payload
}

function toDTO(row: CertificateRow): OryCMSCertificateDTO {
  return {
    certificateNumber: row.certificate_number ?? "",
    createdAt: row.created_at.toISOString(),
    description: row.description ?? "",
    displayOrder: row.display_order,
    documentUrl: row.document_url ?? "",
    expiresOn: dateOnly(row.expires_on),
    id: row.id,
    image: normalizeImage(row.image),
    issuedOn: dateOnly(row.issued_on),
    issuingAuthority: row.issuing_authority,
    status: row.status === "published" ? "published" : "draft",
    title: row.title,
    updatedAt: row.updated_at.toISOString(),
  }
}

function normalizeImage(value: Prisma.JsonValue | null): CertificateImage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const image = value as Record<string, unknown>
  const url = typeof image.url === "string" ? image.url : ""
  return url ? { id: typeof image.id === "string" ? image.id : undefined, name: typeof image.name === "string" ? image.name : undefined, url } : null
}

function dateOnly(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : ""
}
