import "server-only"
import crypto from "crypto"
import nodemailer from "nodemailer"
import { emailTemplates, type EmailTemplateName } from "./templates"
import { orycmsPrisma } from "../orycms/prisma"

export const OPTIONAL_EMAIL_TYPES = ["cartUpdate", "offerAnnouncement", "saleAnnouncement"] as const
type OptionalEmailType = typeof OPTIONAL_EMAIL_TYPES[number]

type SendInput = Parameters<(typeof emailTemplates)[EmailTemplateName]>[0] & {
  template: EmailTemplateName
  to: string
  userId?: string
}

const optionalTypes = new Set<string>(OPTIONAL_EMAIL_TYPES)

export async function ensureEmailSchema() {
  // Database structure is managed by Prisma migrations.
}

export function emailBaseUrl() {
  return (process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000").replace(/\/$/, "")
}

export function isEmailDeliveryConfigured() {
  return Boolean(getSmtpTransporter())
}

function getSmtpTransporter() {
  const host = process.env.SMTP_HOST
  const portStr = process.env.SMTP_PORT
  const port = portStr ? parseInt(portStr, 10) : 465
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD
  const from = process.env.SMTP_EMAIL_FROM ?? process.env.ORDER_EMAIL_FROM ?? user
  const replyTo = process.env.SMTP_REPLY_TO

  if (!pass || (!host && !user)) {
    return null
  }

  const transporter = host
    ? nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user ? { user, pass } : undefined,
      })
    : nodemailer.createTransport({
        service: "gmail",
        auth: { user: user!, pass },
      })

  return { transporter, from: from ?? "", replyTo }
}

function preferenceToken(userId: string) {
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET ?? process.env.STOREFRONT_AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-email-secret-change-me"
  return crypto.createHmac("sha256", secret).update(userId).digest("hex")
}

export function unsubscribeUrl(userId?: string) {
  return userId ? `${emailBaseUrl()}/api/email/unsubscribe?user=${encodeURIComponent(userId)}&token=${preferenceToken(userId)}` : `${emailBaseUrl()}/privacy-policy`
}

export function validPreferenceToken(userId: string, token: string) {
  const expected = preferenceToken(userId)
  return token.length === expected.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}

export async function disableOptionalEmails(userId: string, types: string[]) {
  await ensureEmailSchema()
  const allowed = types.filter((type): type is OptionalEmailType => optionalTypes.has(type))
  await orycmsPrisma.$executeRaw`
    INSERT INTO storefront_email_preferences (user_id, disabled_types)
    VALUES (${userId}::uuid, ${allowed}::text[])
    ON CONFLICT (user_id) DO UPDATE SET disabled_types = ${allowed}::text[], updated_at = now()
  `
}

async function canSend(userId: string | undefined, template: EmailTemplateName) {
  if (!userId || !optionalTypes.has(template)) return true
  await ensureEmailSchema()
  const [row] = await orycmsPrisma.$queryRaw<{ disabled: boolean }[]>`
    SELECT ${template} = ANY(disabled_types) AS disabled FROM storefront_email_preferences WHERE user_id = ${userId}::uuid
  `
  return !row?.disabled
}

export async function sendEmail(input: SendInput) {
  if (!(await canSend(input.userId, input.template))) return { skipped: true }
  const smtp = getSmtpTransporter()
  if (!smtp) {
    console.warn(`Email ${input.template} skipped: SMTP is not configured.`)
    return { skipped: true }
  }
  const rendered = emailTemplates[input.template]({ ...input, unsubscribeUrl: unsubscribeUrl(input.userId) })
  try {
    const info = await smtp.transporter.sendMail({
      from: smtp.from,
      replyTo: smtp.replyTo,
      to: input.to,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    })
    return { messageId: info.messageId, skipped: false }
  } catch (error) {
    console.error(`[SMTP Error] Delivery failed for template "${input.template}" to "${input.to}":`, error)
    return { error: error instanceof Error ? error.message : String(error), skipped: true }
  }
}

export async function sendAdminEmail(input: Omit<SendInput, "to" | "userId">) {
  const admin = process.env.SMTP_ADMIN_EMAIL
  return admin ? sendEmail({ ...input, to: admin }) : { skipped: true }
}

export type OrderAdminNotificationData = {
  adminOrderUrl?: string
  customerEmail?: string
  customerName?: string
  mobileNumber?: string
  orderDate?: string
  orderNumber?: string
  orderStatus?: string
  paymentMethod?: string
  paymentStatus?: string
  total?: number
}

export type LowStockAdminNotificationData = {
  adminProductUrl?: string
  productName: string
  stockQuantity: number
}

/**
 * Sends the detailed "new order" notification to admin-configured recipients
 * (managed on the Settings page). No unsubscribe/preference gating is applied —
 * these are operational admin addresses, not customers. Skips silently when no
 * recipients are configured or SMTP is not set up, so a missing config
 * never blocks order placement.
 */
export async function sendOrderAdminNotifications(recipients: string[], data: OrderAdminNotificationData) {
  const unique = Array.from(new Set(recipients.map((email) => email.trim().toLowerCase()).filter(Boolean)))
  if (unique.length === 0) return { skipped: true }
  const smtp = getSmtpTransporter()
  if (!smtp) {
    console.warn("Order admin notification skipped: SMTP is not configured.")
    return { skipped: true }
  }
  const rendered = emailTemplates.adminOrderNotification({ ...data, unsubscribeUrl: `${emailBaseUrl()}/admin/settings` })
  try {
    const info = await smtp.transporter.sendMail({
      from: smtp.from,
      replyTo: smtp.replyTo,
      to: unique.join(", "),
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    })
    return { messageId: info.messageId, recipients: unique, skipped: false }
  } catch (error) {
    console.error("[SMTP Error] Order admin notification delivery failed:", error)
    return { error: error instanceof Error ? error.message : String(error), recipients: unique, skipped: true }
  }
}

export async function sendLowStockAdminNotifications(recipients: string[], data: LowStockAdminNotificationData) {
  const unique = Array.from(new Set(recipients.map((email) => email.trim().toLowerCase()).filter(Boolean)))
  if (unique.length === 0) return { skipped: true }
  const smtp = getSmtpTransporter()
  if (!smtp) {
    console.warn("Low stock admin notification skipped: SMTP is not configured.")
    return { skipped: true }
  }
  const rendered = emailTemplates.adminLowStockNotification({ ...data, unsubscribeUrl: `${emailBaseUrl()}/admin/settings` })
  try {
    const info = await smtp.transporter.sendMail({
      from: smtp.from,
      replyTo: smtp.replyTo,
      to: unique.join(", "),
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    })
    return { messageId: info.messageId, recipients: unique, skipped: false }
  } catch (error) {
    console.error("[SMTP Error] Low stock admin notification delivery failed:", error)
    return { error: error instanceof Error ? error.message : String(error), recipients: unique, skipped: true }
  }
}

export type ContactFormNotificationData = {
  adminContactUrl?: string
  email: string
  fullName: string
  location?: string
  message?: string
  mobileNumber?: string
  ticketId: string
  topic: string
  topicLabel?: string
}

export async function sendContactUserConfirmationEmail(data: ContactFormNotificationData) {
  return sendEmail({
    template: "contactUserConfirmation",
    to: data.email,
    ticketId: data.ticketId,
    fullName: data.fullName,
    email: data.email,
    mobileNumber: data.mobileNumber,
    topic: data.topic,
    topicLabel: data.topicLabel,
    location: data.location,
    message: data.message,
    unsubscribeUrl: `${emailBaseUrl()}/privacy-policy`,
  })
}

export async function sendContactAdminNotifications(recipients: string[], data: ContactFormNotificationData) {
  const unique = Array.from(new Set(recipients.map((email) => email.trim().toLowerCase()).filter(Boolean)))
  if (unique.length === 0) return { skipped: true }
  const smtp = getSmtpTransporter()
  if (!smtp) {
    console.warn("Contact admin notification skipped: SMTP is not configured.")
    return { skipped: true }
  }
  const adminContactUrl = data.adminContactUrl ?? `${emailBaseUrl()}/admin/collections/contact`
  const rendered = emailTemplates.contactAdminNotification({
    ...data,
    adminContactUrl,
    unsubscribeUrl: `${emailBaseUrl()}/admin/settings`,
  })
  try {
    const info = await smtp.transporter.sendMail({
      from: smtp.from,
      replyTo: smtp.replyTo,
      to: unique.join(", "),
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    })
    return { messageId: info.messageId, recipients: unique, skipped: false }
  } catch (error) {
    console.error("[SMTP Error] Contact admin notification delivery failed:", error)
    return { error: error instanceof Error ? error.message : String(error), recipients: unique, skipped: true }
  }
}

export type AdminInvitationEmailData = {
  fullName: string
  invitedBy?: string
  setupUrl: string
  to: string
}

export async function sendAdminInvitationEmail(data: AdminInvitationEmailData) {
  return sendEmail({
    template: "adminInvitation",
    to: data.to,
    fullName: data.fullName,
    invitedBy: data.invitedBy,
    setupUrl: data.setupUrl,
    unsubscribeUrl: `${emailBaseUrl()}/privacy-policy`,
  })
}

