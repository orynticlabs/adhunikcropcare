import "server-only"
import crypto from "crypto"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import type { ShiprocketSettings, ShiprocketSettingsPublic } from "@/lib/shiprocket/types"

const SETTINGS_SELECT = `
  id, api_email AS "apiEmail", api_password_encrypted AS "apiPasswordEncrypted", channel_id AS "channelId",
  pickup_location AS "pickupLocation", pickup_name AS "pickupName", pickup_phone AS "pickupPhone",
  pickup_address1 AS "pickupAddress1", pickup_address2 AS "pickupAddress2", pickup_city AS "pickupCity",
  pickup_state AS "pickupState", pickup_country AS "pickupCountry", pickup_pincode AS "pickupPincode",
  package_length_cm AS "packageLengthCm", package_breadth_cm AS "packageBreadthCm",
  package_height_cm AS "packageHeightCm", package_weight_kg AS "packageWeightKg",
  auto_ship_on_confirm AS "autoShipOnConfirm", enabled,
  created_at AS "createdAt", updated_at AS "updatedAt"
`

type SettingsDbRow = Omit<ShiprocketSettings, "packageLengthCm" | "packageBreadthCm" | "packageHeightCm" | "packageWeightKg" | "createdAt" | "updatedAt"> & {
  packageLengthCm: string | number
  packageBreadthCm: string | number
  packageHeightCm: string | number
  packageWeightKg: string | number
  createdAt: Date | string
  updatedAt: Date | string
}

export type ShiprocketSettingsInput = {
  apiEmail?: string | null
  apiPassword?: string | null
  channelId?: string | null
  pickupLocation?: string | null
  pickupName?: string | null
  pickupPhone?: string | null
  pickupAddress1?: string | null
  pickupAddress2?: string | null
  pickupCity?: string | null
  pickupState?: string | null
  pickupCountry?: string | null
  pickupPincode?: string | null
  packageLengthCm?: number | null
  packageBreadthCm?: number | null
  packageHeightCm?: number | null
  packageWeightKg?: number | null
  autoShipOnConfirm?: boolean
  enabled?: boolean
}

const ENC_PREFIX = "v1:"

function encryptionKey(): Buffer {
  const raw = process.env.SHIPROCKET_ENCRYPTION_KEY
  if (!raw) throw new Error("SHIPROCKET_ENCRYPTION_KEY is not configured.")
  // Accept base64, hex, or a raw passphrase (hashed to 32 bytes).
  const candidates = [tryDecode(raw, "base64"), tryDecode(raw, "hex")]
  for (const buf of candidates) {
    if (buf && buf.length === 32) return buf
  }
  return crypto.createHash("sha256").update(raw).digest()
}

function tryDecode(value: string, encoding: "base64" | "hex"): Buffer | null {
  try {
    const buf = Buffer.from(value, encoding)
    return buf.length > 0 ? buf : null
  } catch {
    return null
  }
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${ENC_PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`
}

export function decryptSecret(payload: string | null | undefined): string | null {
  if (!payload || !payload.startsWith(ENC_PREFIX)) return null
  const [, ivB64, tagB64, dataB64] = payload.split(":")
  if (!ivB64 || !tagB64 || !dataB64) return null
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivB64, "base64"))
    decipher.setAuthTag(Buffer.from(tagB64, "base64"))
    return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8")
  } catch {
    return null
  }
}

function normalizeRow(row: SettingsDbRow): ShiprocketSettings {
  return {
    ...row,
    packageLengthCm: Number(row.packageLengthCm),
    packageBreadthCm: Number(row.packageBreadthCm),
    packageHeightCm: Number(row.packageHeightCm),
    packageWeightKg: Number(row.packageWeightKg),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  }
}

/** The single settings row, or null when Shiprocket has never been configured. */
export async function getShiprocketSettings(): Promise<ShiprocketSettings | null> {
  const rows = await orycmsPrisma.$queryRawUnsafe<SettingsDbRow[]>(
    `SELECT ${SETTINGS_SELECT} FROM orycms_shiprocket_settings ORDER BY created_at ASC LIMIT 1`,
  )
  return rows[0] ? normalizeRow(rows[0]) : null
}

export function toPublicSettings(settings: ShiprocketSettings | null): ShiprocketSettingsPublic | null {
  if (!settings) return null
  const { apiPasswordEncrypted, ...rest } = settings
  return { ...rest, apiPasswordSet: Boolean(apiPasswordEncrypted) }
}

/** Decrypted API credentials for server-side calls, or null when incomplete. */
export async function getShiprocketCredentials(): Promise<{ email: string; password: string } | null> {
  const settings = await getShiprocketSettings()
  if (!settings?.apiEmail || !settings.apiPasswordEncrypted) return null
  const password = decryptSecret(settings.apiPasswordEncrypted)
  if (!password) return null
  return { email: settings.apiEmail, password }
}

export async function upsertShiprocketSettings(input: ShiprocketSettingsInput): Promise<ShiprocketSettings> {
  const existing = await getShiprocketSettings()
  const passwordEncrypted = input.apiPassword
    ? encryptSecret(input.apiPassword.trim())
    : existing?.apiPasswordEncrypted ?? null

  const merged = {
    apiEmail: pick(input.apiEmail, existing?.apiEmail ?? null),
    channelId: pick(input.channelId, existing?.channelId ?? null),
    pickupLocation: pick(input.pickupLocation, existing?.pickupLocation ?? null),
    pickupName: pick(input.pickupName, existing?.pickupName ?? null),
    pickupPhone: pick(input.pickupPhone, existing?.pickupPhone ?? null),
    pickupAddress1: pick(input.pickupAddress1, existing?.pickupAddress1 ?? null),
    pickupAddress2: pick(input.pickupAddress2, existing?.pickupAddress2 ?? null),
    pickupCity: pick(input.pickupCity, existing?.pickupCity ?? null),
    pickupState: pick(input.pickupState, existing?.pickupState ?? null),
    pickupCountry: pick(input.pickupCountry, existing?.pickupCountry ?? "India") ?? "India",
    pickupPincode: normalizePincode(pick(input.pickupPincode, existing?.pickupPincode ?? null)),
    packageLengthCm: numberOr(input.packageLengthCm, existing?.packageLengthCm ?? 10),
    packageBreadthCm: numberOr(input.packageBreadthCm, existing?.packageBreadthCm ?? 10),
    packageHeightCm: numberOr(input.packageHeightCm, existing?.packageHeightCm ?? 10),
    packageWeightKg: numberOr(input.packageWeightKg, existing?.packageWeightKg ?? 0.5),
    autoShipOnConfirm: input.autoShipOnConfirm ?? existing?.autoShipOnConfirm ?? false,
    enabled: input.enabled ?? existing?.enabled ?? false,
  }

  if (merged.enabled) {
    if (!merged.apiEmail || !/^\S+@\S+\.\S+$/.test(merged.apiEmail)) throw new Error("Valid Shiprocket API email is required.")
    if (!passwordEncrypted || !decryptSecret(passwordEncrypted)) throw new Error("Shiprocket API password is required.")
    if (!merged.pickupLocation) throw new Error("Shiprocket pickup location is required.")
    if (!merged.pickupPincode || !/^\d{6}$/.test(merged.pickupPincode.replace(/\D/g, ""))) throw new Error("Valid Shiprocket pickup pincode is required.")
    if (merged.packageLengthCm <= 0 || merged.packageBreadthCm <= 0 || merged.packageHeightCm <= 0 || merged.packageWeightKg <= 0) {
      throw new Error("Shiprocket package dimensions and weight must be greater than zero.")
    }
  }

  if (existing) {
    await orycmsPrisma.$executeRaw`
      UPDATE orycms_shiprocket_settings SET
        api_email = ${merged.apiEmail},
        api_password_encrypted = ${passwordEncrypted},
        channel_id = ${merged.channelId},
        pickup_location = ${merged.pickupLocation},
        pickup_name = ${merged.pickupName},
        pickup_phone = ${merged.pickupPhone},
        pickup_address1 = ${merged.pickupAddress1},
        pickup_address2 = ${merged.pickupAddress2},
        pickup_city = ${merged.pickupCity},
        pickup_state = ${merged.pickupState},
        pickup_country = ${merged.pickupCountry},
        pickup_pincode = ${merged.pickupPincode},
        package_length_cm = ${merged.packageLengthCm},
        package_breadth_cm = ${merged.packageBreadthCm},
        package_height_cm = ${merged.packageHeightCm},
        package_weight_kg = ${merged.packageWeightKg},
        auto_ship_on_confirm = ${merged.autoShipOnConfirm},
        enabled = ${merged.enabled},
        updated_at = now()
      WHERE id = ${existing.id}::uuid
    `
  } else {
    await orycmsPrisma.$executeRaw`
      INSERT INTO orycms_shiprocket_settings (
        api_email, api_password_encrypted, channel_id, pickup_location, pickup_name, pickup_phone,
        pickup_address1, pickup_address2, pickup_city, pickup_state, pickup_country, pickup_pincode,
        package_length_cm, package_breadth_cm, package_height_cm, package_weight_kg,
        auto_ship_on_confirm, enabled
      ) VALUES (
        ${merged.apiEmail}, ${passwordEncrypted}, ${merged.channelId}, ${merged.pickupLocation},
        ${merged.pickupName}, ${merged.pickupPhone}, ${merged.pickupAddress1}, ${merged.pickupAddress2},
        ${merged.pickupCity}, ${merged.pickupState}, ${merged.pickupCountry}, ${merged.pickupPincode},
        ${merged.packageLengthCm}, ${merged.packageBreadthCm}, ${merged.packageHeightCm}, ${merged.packageWeightKg},
        ${merged.autoShipOnConfirm}, ${merged.enabled}
      )
    `
  }

  const saved = await getShiprocketSettings()
  if (!saved) throw new Error("Failed to persist Shiprocket settings.")
  return saved
}

function pick<T>(next: T | null | undefined, fallback: T | null): T | null {
  if (next === undefined) return fallback
  if (typeof next === "string") {
    const trimmed = next.trim()
    return (trimmed.length > 0 ? trimmed : null) as T | null
  }
  return next
}

function numberOr(next: number | null | undefined, fallback: number): number {
  if (next === undefined || next === null || !Number.isFinite(next)) return fallback
  return Math.max(0, Number(next))
}

function normalizePincode(value: string | null) {
  if (!value) return null
  const digits = value.replace(/\D/g, "").slice(0, 6)
  return digits || null
}
