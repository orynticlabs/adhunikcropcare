import "server-only"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export type ShipmentNotificationType = "shipmentCreated" | "shipped" | "outForDelivery" | "delivered" | "cancelled"

export type ShipmentNotificationSettings = {
  enabled: boolean
  shipmentCreated: boolean
  shipped: boolean
  outForDelivery: boolean
  delivered: boolean
  cancelled: boolean
}

const DEFAULTS: ShipmentNotificationSettings = {
  enabled: true,
  shipmentCreated: true,
  shipped: true,
  outForDelivery: true,
  delivered: true,
  cancelled: true,
}

const SELECT = `enabled, shipment_created AS "shipmentCreated", shipped, out_for_delivery AS "outForDelivery", delivered, cancelled`

export async function ensureShipmentNotificationSettingsSchema() {
  await orycmsPrisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS orycms_shiprocket_notification_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      enabled BOOLEAN NOT NULL DEFAULT true,
      shipment_created BOOLEAN NOT NULL DEFAULT true,
      shipped BOOLEAN NOT NULL DEFAULT true,
      out_for_delivery BOOLEAN NOT NULL DEFAULT true,
      delivered BOOLEAN NOT NULL DEFAULT true,
      cancelled BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `
}

export async function getShipmentNotificationSettings(): Promise<ShipmentNotificationSettings> {
  await ensureShipmentNotificationSettingsSchema()
  const rows = await orycmsPrisma.$queryRawUnsafe<ShipmentNotificationSettings[]>(
    `SELECT ${SELECT} FROM orycms_shiprocket_notification_settings ORDER BY created_at ASC LIMIT 1`,
  )
  return rows[0] ?? DEFAULTS
}

export async function upsertShipmentNotificationSettings(input: Partial<ShipmentNotificationSettings>): Promise<ShipmentNotificationSettings> {
  await ensureShipmentNotificationSettingsSchema()
  const current = await getShipmentNotificationSettings()
  const cleanInput = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined))
  const merged = { ...current, ...cleanInput }
  const existing = await orycmsPrisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM orycms_shiprocket_notification_settings ORDER BY created_at ASC LIMIT 1`,
  )
  if (existing[0]) {
    await orycmsPrisma.$executeRawUnsafe(
      `UPDATE orycms_shiprocket_notification_settings SET
         enabled = $2, shipment_created = $3, shipped = $4, out_for_delivery = $5, delivered = $6, cancelled = $7, updated_at = now()
       WHERE id = $1::uuid`,
      existing[0].id,
      merged.enabled,
      merged.shipmentCreated,
      merged.shipped,
      merged.outForDelivery,
      merged.delivered,
      merged.cancelled,
    )
  } else {
    await orycmsPrisma.$executeRawUnsafe(
      `INSERT INTO orycms_shiprocket_notification_settings (enabled, shipment_created, shipped, out_for_delivery, delivered, cancelled)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      merged.enabled,
      merged.shipmentCreated,
      merged.shipped,
      merged.outForDelivery,
      merged.delivered,
      merged.cancelled,
    )
  }
  return getShipmentNotificationSettings()
}

export function isNotificationTypeEnabled(settings: ShipmentNotificationSettings, type: ShipmentNotificationType): boolean {
  return settings.enabled && settings[type]
}
