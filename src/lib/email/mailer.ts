import "server-only"
import crypto from "crypto"
import nodemailer from "nodemailer"
import { emailTemplates, type EmailTemplateName } from "@/lib/email/templates"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export const OPTIONAL_EMAIL_TYPES = ["cartUpdate", "wishlistUpdate", "offerAnnouncement", "saleAnnouncement"] as const
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
  return Boolean(process.env.SMTP_GMAIL_USER && process.env.SMTP_GMAIL_APP_PASSWORD)
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
  const user = process.env.SMTP_GMAIL_USER
  const pass = process.env.SMTP_GMAIL_APP_PASSWORD
  if (!user || !pass) {
    console.warn(`Email ${input.template} skipped: Gmail SMTP is not configured.`)
    return { skipped: true }
  }
  const rendered = emailTemplates[input.template]({ ...input, unsubscribeUrl: unsubscribeUrl(input.userId) })
  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } })
  const info = await transporter.sendMail({
    from: process.env.SMTP_EMAIL_FROM ?? user,
    to: input.to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  })
  return { messageId: info.messageId, skipped: false }
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

/**
 * Sends the detailed "new order" notification to admin-configured recipients
 * (managed on the Settings page). No unsubscribe/preference gating is applied —
 * these are operational admin addresses, not customers. Skips silently when no
 * recipients are configured or Gmail SMTP is not set up, so a missing config
 * never blocks order placement.
 */
export async function sendOrderAdminNotifications(recipients: string[], data: OrderAdminNotificationData) {
  const unique = Array.from(new Set(recipients.map((email) => email.trim().toLowerCase()).filter(Boolean)))
  if (unique.length === 0) return { skipped: true }
  const user = process.env.SMTP_GMAIL_USER
  const pass = process.env.SMTP_GMAIL_APP_PASSWORD
  if (!user || !pass) {
    console.warn("Order admin notification skipped: Gmail SMTP is not configured.")
    return { skipped: true }
  }
  const rendered = emailTemplates.adminOrderNotification({ ...data, unsubscribeUrl: `${emailBaseUrl()}/admin/settings` })
  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } })
  const info = await transporter.sendMail({
    from: process.env.SMTP_EMAIL_FROM ?? user,
    to: unique.join(", "),
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  })
  return { messageId: info.messageId, recipients: unique, skipped: false }
}
