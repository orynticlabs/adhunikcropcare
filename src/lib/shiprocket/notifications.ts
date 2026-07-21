import "server-only"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { sendEmail } from "@/lib/email/mailer"
import { emailBaseUrl } from "@/lib/email/mailer"
import type { EmailTemplateName } from "@/lib/email/templates"
import { selectOrderRowById } from "@/lib/storefront-orders"
import { getShipmentByOrderId } from "@/lib/shiprocket/shipments"
import { getShipmentNotificationSettings, isNotificationTypeEnabled, type ShipmentNotificationType } from "@/lib/shiprocket/notification-settings"

export type { ShipmentNotificationType }

const TEMPLATE_BY_TYPE: Record<ShipmentNotificationType, EmailTemplateName> = {
  shipmentCreated: "shipmentCreated",
  shipped: "shipmentShipped",
  outForDelivery: "shipmentOutForDelivery",
  delivered: "shipmentDelivered",
  cancelled: "shipmentCancelled",
}

// Distinct email-log type per notification so each fires at most once per order.
const LOG_TYPE_BY_TYPE: Record<ShipmentNotificationType, string> = {
  shipmentCreated: "shipment_created",
  shipped: "shipment_shipped",
  outForDelivery: "shipment_out_for_delivery",
  delivered: "shipment_delivered",
  cancelled: "shipment_cancelled",
}

/**
 * Sends a customer shipment email, gated by the OryCMS notification toggles and
 * deduped via storefront_email_logs (one send per order+type). Safe to call from
 * the job queue repeatedly — a duplicate is skipped.
 */
export async function sendShipmentNotification(orderId: string, type: ShipmentNotificationType): Promise<{ sent: boolean; reason?: string }> {
  const settings = await getShipmentNotificationSettings()
  if (!isNotificationTypeEnabled(settings, type)) return { sent: false, reason: "disabled" }

  const order = await selectOrderRowById(orderId)
  if (!order) return { sent: false, reason: "order-not-found" }
  const contact = (order.contact ?? {}) as { email?: string; firstName?: string }
  if (!contact.email) return { sent: false, reason: "no-email" }

  const logType = LOG_TYPE_BY_TYPE[type]
  // Idempotency guard: claim the log row first; if it already exists, skip sending.
  const claimed = await orycmsPrisma.$executeRawUnsafe(
    `INSERT INTO storefront_email_logs (order_id, type, recipient, status)
     VALUES ($1::uuid, $2, $3, 'pending')
     ON CONFLICT (order_id, type) DO NOTHING`,
    orderId,
    logType,
    contact.email,
  )
  if (Number(claimed) === 0) return { sent: false, reason: "already-sent" }

  const shipment = await getShipmentByOrderId(orderId)
  const trackingUrl = shipment?.tracking_url
    ?? (shipment?.awb_code ? `${emailBaseUrl()}/account/orders/${orderId}` : undefined)
  const estimatedDelivery = shipment?.estimated_delivery_date
    ? new Date(shipment.estimated_delivery_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : undefined

  try {
    await sendEmail({
      template: TEMPLATE_BY_TYPE[type],
      to: contact.email,
      firstName: contact.firstName,
      orderNumber: order.number,
      awbCode: shipment?.awb_code ?? undefined,
      courierName: shipment?.courier_name ?? undefined,
      estimatedDelivery,
      trackingUrl,
      userId: order.user_id,
      unsubscribeUrl: "", // mailer computes the real per-user URL
    })
    await orycmsPrisma.$executeRawUnsafe(
      `UPDATE storefront_email_logs SET status = 'sent' WHERE order_id = $1::uuid AND type = $2`,
      orderId,
      logType,
    )
    return { sent: true }
  } catch (error) {
    await orycmsPrisma.$executeRawUnsafe(
      `UPDATE storefront_email_logs SET status = 'failed' WHERE order_id = $1::uuid AND type = $2`,
      orderId,
      logType,
    )
    throw error
  }
}
