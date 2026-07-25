import { emailBaseUrl, sendLowStockAdminNotifications } from "@/lib/email/mailer"
import { getOryCMSNotificationSettings } from "@/lib/orycms/notification-settings"
import { getEnabledOrderNotificationRecipients } from "@/lib/orycms/order-notification-emails"
import { createOryCMSNotification, ensureOryCMSNotificationsSchema } from "@/lib/orycms/notifications"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export const LOW_STOCK_THRESHOLD = 8

export async function notifyLowStockProduct(product: { id: string; name: string; stock_quantity: number }) {
  const stock = Number(product.stock_quantity)
  if (stock <= 0 || stock > LOW_STOCK_THRESHOLD) return

  await ensureOryCMSNotificationsSchema()
  const [existing] = await orycmsPrisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM orycms_notifications
    WHERE type = 'inventory'
      AND entity_type = 'product'
      AND entity_id = ${product.id}
      AND title = 'Low Stock'
    LIMIT 1
  `
  if (existing) return

  await createOryCMSNotification({
    type: "inventory",
    title: "Low Stock",
    message: `${product.name} has only ${stock} units left.`,
    entityId: product.id,
    entityType: "product",
    targetUrl: `/admin/products/${product.id}?highlight=${product.id}`,
  }).catch((error) => console.error("OryCMS notification failed", error))

  const settings = await getOryCMSNotificationSettings()
  if (!settings.emailAlerts) return

  const claimed = await claimLowStockEmail(product.id)
  if (!claimed) return

  const recipients = await getEnabledOrderNotificationRecipients()
  await sendLowStockAdminNotifications(recipients, {
    adminProductUrl: `${emailBaseUrl()}/admin/products/${product.id}`,
    productName: product.name,
    stockQuantity: stock,
  }).catch((error) => console.error("Low stock admin email failed", error))
}

async function claimLowStockEmail(productId: string) {
  await orycmsPrisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS orycms_notification_email_markers (
      key TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `
  const affected = await orycmsPrisma.$executeRaw`
    INSERT INTO orycms_notification_email_markers (key)
    VALUES (${`low_stock:${productId}`})
    ON CONFLICT (key) DO NOTHING
  `
  return Number(affected) === 1
}
