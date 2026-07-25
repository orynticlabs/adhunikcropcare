import "server-only"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export type OryCMSNotificationSettings = {
  emailAlerts: boolean
  pushAlerts: boolean
  marketingDigest: boolean
}

const DEFAULTS: OryCMSNotificationSettings = {
  emailAlerts: true,
  pushAlerts: true,
  marketingDigest: true,
}

const SELECT = `email_alerts AS "emailAlerts", push_alerts AS "pushAlerts", marketing_digest AS "marketingDigest"`

export async function ensureOryCMSNotificationSettingsSchema() {
  await orycmsPrisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS orycms_notification_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email_alerts BOOLEAN NOT NULL DEFAULT true,
      push_alerts BOOLEAN NOT NULL DEFAULT true,
      marketing_digest BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `
}

export async function getOryCMSNotificationSettings(): Promise<OryCMSNotificationSettings> {
  await ensureOryCMSNotificationSettingsSchema()
  const rows = await orycmsPrisma.$queryRawUnsafe<OryCMSNotificationSettings[]>(
    `SELECT ${SELECT} FROM orycms_notification_settings ORDER BY created_at ASC LIMIT 1`,
  )
  return rows[0] ?? DEFAULTS
}

export async function upsertOryCMSNotificationSettings(input: Partial<OryCMSNotificationSettings>) {
  await ensureOryCMSNotificationSettingsSchema()
  const current = await getOryCMSNotificationSettings()
  const cleanInput = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined))
  const merged = { ...current, ...cleanInput }
  const existing = await orycmsPrisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM orycms_notification_settings ORDER BY created_at ASC LIMIT 1`,
  )

  if (existing[0]) {
    await orycmsPrisma.$executeRawUnsafe(
      `UPDATE orycms_notification_settings
       SET email_alerts = $2, push_alerts = $3, marketing_digest = $4, updated_at = now()
       WHERE id = $1::uuid`,
      existing[0].id,
      merged.emailAlerts,
      merged.pushAlerts,
      merged.marketingDigest,
    )
  } else {
    await orycmsPrisma.$executeRawUnsafe(
      `INSERT INTO orycms_notification_settings (email_alerts, push_alerts, marketing_digest)
       VALUES ($1, $2, $3)`,
      merged.emailAlerts,
      merged.pushAlerts,
      merged.marketingDigest,
    )
  }

  return getOryCMSNotificationSettings()
}
