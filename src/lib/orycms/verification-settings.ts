import { orycmsPrisma } from "@/lib/orycms/prisma"

export type VerificationSettings = {
  email: string
  phone: string
  address: string
}

export async function getOryCMSVerificationSettings(): Promise<VerificationSettings> {
  try {
    const [row] = await orycmsPrisma.$queryRaw<{ email: string; phone: string; address: string }[]>`
      SELECT email, phone, address FROM orycms_verification_settings
      LIMIT 1
    `
    if (!row) {
      return {
        email: "",
        phone: "",
        address: "",
      }
    }
    return {
      email: row.email ?? "",
      phone: row.phone ?? "",
      address: row.address ?? "",
    }
  } catch {
    return {
      email: "",
      phone: "",
      address: "",
    }
  }
}

export async function updateOryCMSVerificationSettings(input: VerificationSettings): Promise<VerificationSettings> {
  const email = input.email.trim()
  const phone = input.phone.trim()
  const address = input.address.trim()

  if (!email) throw new Error("Email is required.")
  if (!phone) throw new Error("Phone number is required.")
  if (!address) throw new Error("Address is required.")

  const [existing] = await orycmsPrisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM orycms_verification_settings LIMIT 1
  `

  if (existing) {
    await orycmsPrisma.$executeRaw`
      UPDATE orycms_verification_settings
      SET email = ${email}, phone = ${phone}, address = ${address}, updated_at = now()
      WHERE id = ${existing.id}::uuid
    `
  } else {
    await orycmsPrisma.$executeRaw`
      INSERT INTO orycms_verification_settings (email, phone, address)
      VALUES (${email}, ${phone}, ${address})
    `
  }

  return { email, phone, address }
}
