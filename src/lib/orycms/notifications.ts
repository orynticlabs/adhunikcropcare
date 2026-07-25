import "server-only"
import { getOryCMSNotificationSettings } from "@/lib/orycms/notification-settings"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export type OryCMSNotificationKind = "order" | "payment" | "shipment" | "inventory" | "customer" | "admin-user" | "system"

export type OryCMSNotificationDTO = {
  body: string
  category: string
  entityId: string | null
  entityType: string | null
  id: string
  kind: OryCMSNotificationKind
  read: boolean
  targetUrl: string
  time: string
  timestamp: string
  title: string
}

export type OryCMSNotificationFilters = {
  filter?: string | null
  limit?: number
  page?: number
}

type NotificationRow = {
  id: string
  type: OryCMSNotificationKind
  title: string
  message: string
  entity_id: string | null
  entity_type: string | null
  target_url: string
  is_read: boolean
  created_at: Date | string
}

export async function ensureOryCMSNotificationsSchema() {
  await orycmsPrisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS orycms_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      entity_id TEXT,
      entity_type TEXT,
      target_url TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
    )
  `
  await orycmsPrisma.$executeRaw`
    CREATE UNIQUE INDEX IF NOT EXISTS orycms_notifications_dedupe_key
      ON orycms_notifications (type, entity_type, entity_id, title)
  `
  await orycmsPrisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS orycms_notifications_is_read_created_at_idx
      ON orycms_notifications (is_read, created_at)
  `
}

export async function createOryCMSNotification(input: {
  type: OryCMSNotificationKind
  title: string
  message: string
  entityId?: string | null
  entityType?: string | null
  targetUrl: string
}) {
  const settings = await getOryCMSNotificationSettings()
  if (!settings.pushAlerts) return

  await ensureOryCMSNotificationsSchema()
  await orycmsPrisma.$executeRawUnsafe(
    `INSERT INTO orycms_notifications (type, title, message, entity_id, entity_type, target_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (type, entity_type, entity_id, title) DO NOTHING`,
    input.type,
    input.title,
    input.message,
    input.entityId ?? null,
    input.entityType ?? null,
    input.targetUrl,
  )
}

export async function listOryCMSNotifications(filters: OryCMSNotificationFilters = {}) {
  await ensureOryCMSNotificationsSchema()
  const where: string[] = []
  const values: unknown[] = []
  const filter = (filters.filter ?? "all").toLowerCase()
  if (filter === "unread") where.push("is_read = false")
  else if (["order", "payment", "shipment", "inventory", "customer", "system"].includes(filter)) {
    values.push(filter)
    where.push(`type = $${values.length}`)
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : ""
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.max(1, Math.min(100, filters.limit ?? 100))
  const offset = (page - 1) * limit
  const countRows = await orycmsPrisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint AS count FROM orycms_notifications ${whereSql}`,
    ...values,
  )
  const rows = await orycmsPrisma.$queryRawUnsafe<NotificationRow[]>(
    `SELECT id, type, title, message, entity_id, entity_type, target_url, is_read, created_at
     FROM orycms_notifications
     ${whereSql}
     ORDER BY created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    ...values,
  )
  return {
    items: rows.map(serializeNotification),
    page,
    pageSize: limit,
    total: Number(countRows[0]?.count ?? 0),
  }
}

export async function markOryCMSNotificationRead(id: string) {
  await ensureOryCMSNotificationsSchema()
  await orycmsPrisma.$executeRaw`UPDATE orycms_notifications SET is_read = true WHERE id = ${id}::uuid`
}

export async function markAllOryCMSNotificationsRead() {
  await ensureOryCMSNotificationsSchema()
  await orycmsPrisma.$executeRaw`UPDATE orycms_notifications SET is_read = true WHERE is_read = false`
}

export async function clearReadOryCMSNotifications() {
  await ensureOryCMSNotificationsSchema()
  await orycmsPrisma.$executeRaw`DELETE FROM orycms_notifications WHERE is_read = true`
}

function serializeNotification(row: NotificationRow): OryCMSNotificationDTO {
  return {
    body: row.message,
    category: categoryLabel(row.type),
    entityId: row.entity_id,
    entityType: row.entity_type,
    id: row.id,
    kind: row.type,
    read: row.is_read,
    targetUrl: row.target_url,
    time: relativeTime(row.created_at),
    timestamp: iso(row.created_at),
    title: row.title,
  }
}

function categoryLabel(kind: OryCMSNotificationKind) {
  if (kind === "order") return "Orders"
  if (kind === "payment") return "Payments"
  if (kind === "shipment") return "Shipments"
  if (kind === "inventory") return "Inventory"
  if (kind === "customer") return "Customers"
  return "System"
}

function relativeTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value)
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  if (hours < 48) return "Yesterday"
  return `${Math.floor(hours / 24)} days ago`
}

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}
