import { ensureStorefrontAuthSchema } from "@/lib/storefront-auth"
import { ensureOryCMSAdminUserSchema } from "@/lib/orycms/users"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export type OryCMSNotificationDTO = {
  body: string
  id: string
  kind: "order" | "customer" | "admin-user" | "system"
  read: boolean
  time: string
  timestamp: string
  title: string
}

type EventRow = {
  body: string
  id: string
  kind: OryCMSNotificationDTO["kind"]
  timestamp: Date | string
  title: string
}

export async function listOryCMSNotifications() {
  await ensureStorefrontAuthSchema()
  await ensureOryCMSAdminUserSchema()

  const rows = await orycmsPrisma.$queryRawUnsafe<EventRow[]>(`
    SELECT id::text,
           'order' AS kind,
           'Order confirmed' AS title,
           concat('Order ', number, ' · ', payment_method, ' · ₹', total) AS body,
           created_at AS timestamp
    FROM storefront_orders
    WHERE created_at >= now() - interval '7 days'

    UNION ALL

    SELECT id::text,
           'customer' AS kind,
           'New customer registered' AS title,
           concat(first_name, ' ', last_name, ' · ', email) AS body,
           created_at AS timestamp
    FROM storefront_users
    WHERE deleted_at IS NULL
      AND created_at >= now() - interval '7 days'

    UNION ALL

    SELECT id::text,
           'admin-user' AS kind,
           'Admin user created' AS title,
           concat(COALESCE("fullName", email), ' · ', email) AS body,
           "createdAt" AS timestamp
    FROM orycms_users
    WHERE "deletedAt" IS NULL
      AND "createdAt" >= now() - interval '7 days'

    ORDER BY timestamp DESC
    LIMIT 20
  `)

  return rows.map((row) => ({
    body: row.body,
    id: `${row.kind}-${row.id}`,
    kind: row.kind,
    read: false,
    time: relativeTime(row.timestamp),
    timestamp: iso(row.timestamp),
    title: row.title,
  }))
}

function relativeTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value)
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return "now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}
