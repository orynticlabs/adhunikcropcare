import crypto from "crypto"
import bcrypt from "bcryptjs"
import { orycmsPrisma } from "./prisma"
import { emailBaseUrl, sendAdminInvitationEmail } from "../email/mailer"

export const INVITATION_EXPIRY_HOURS = 24
export const RESEND_COOLDOWN_HOURS = 12
export const RESEND_COOLDOWN_MS = RESEND_COOLDOWN_HOURS * 60 * 60 * 1000

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex")
}

export async function logAdminAudit(input: {
  action: string
  adminEmail?: string | null
  adminId?: string | null
  details?: Record<string, unknown> | null
  ipAddress?: string | null
  targetUserId?: string | null
}) {
  try {
    await orycmsPrisma.$executeRaw`
      INSERT INTO orycms_admin_audit_logs (id, "adminId", "adminEmail", "targetUserId", action, "ipAddress", details, "createdAt")
      VALUES (
        gen_random_uuid(),
        ${input.adminId ?? null}::uuid,
        ${input.adminEmail ?? null},
        ${input.targetUserId ?? null}::uuid,
        ${input.action},
        ${input.ipAddress ?? null},
        ${input.details ? JSON.stringify(input.details) : null}::jsonb,
        now()
      )
    `
  } catch (err) {
    console.error("[AuditLog Error] Failed to record audit event:", err)
  }
}

export function checkResendCooldown(lastInvitedAt: Date | string | null): { allowed: boolean; remainingMs: number } {
  if (!lastInvitedAt) return { allowed: true, remainingMs: 0 }
  const lastTime = new Date(lastInvitedAt).getTime()
  const now = Date.now()
  const elapsed = now - lastTime
  if (elapsed >= RESEND_COOLDOWN_MS) {
    return { allowed: true, remainingMs: 0 }
  }
  return { allowed: false, remainingMs: RESEND_COOLDOWN_MS - elapsed }
}

export async function createAndSendAdminInvitation(userId: string, actor: { email?: string; id: string; name?: string }) {
  const [userRow] = await orycmsPrisma.$queryRaw<{ email: string; fullName: string; lastInvitedAt: Date | null }[]>`
    SELECT email, "fullName", "lastInvitedAt" FROM orycms_users WHERE id = ${userId}::uuid AND "deletedAt" IS NULL LIMIT 1
  `
  if (!userRow) throw new Error("Admin user not found.")

  const cooldown = checkResendCooldown(userRow.lastInvitedAt)
  if (!cooldown.allowed) {
    const hoursLeft = Math.ceil(cooldown.remainingMs / (60 * 60 * 1000))
    throw new Error(`Invitation was sent recently. Please wait ${hoursLeft} hour(s) before resending.`)
  }

  const rawToken = crypto.randomBytes(32).toString("hex")
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000)

  // Invalidate any old unused invitation tokens for this user
  await orycmsPrisma.$executeRaw`
    UPDATE orycms_invitation_tokens SET used = true WHERE "userId" = ${userId}::uuid AND used = false
  `

  // Insert new invitation token
  await orycmsPrisma.$executeRaw`
    INSERT INTO orycms_invitation_tokens (id, "userId", "tokenHash", "expiresAt", used, "invitedByAdminId", "createdAt")
    VALUES (gen_random_uuid(), ${userId}::uuid, ${tokenHash}, ${expiresAt}, false, ${actor.id}::uuid, now())
  `

  // Update user's lastInvitedAt timestamp
  await orycmsPrisma.$executeRaw`
    UPDATE orycms_users SET "lastInvitedAt" = now(), "updatedAt" = now() WHERE id = ${userId}::uuid
  `

  const setupUrl = `${emailBaseUrl()}/admin/set-password?token=${rawToken}`
  await sendAdminInvitationEmail({
    to: userRow.email,
    fullName: userRow.fullName || userRow.email,
    invitedBy: actor.email || actor.name,
    setupUrl,
  })

  await logAdminAudit({
    action: "admin_invited",
    adminEmail: actor.email,
    adminId: actor.id,
    targetUserId: userId,
    details: { expiresAt: expiresAt.toISOString(), setupUrlDomain: emailBaseUrl() },
  })

  return { expiresAt, setupUrl }
}

export async function validateInvitationToken(rawToken: string) {
  if (!rawToken || typeof rawToken !== "string") {
    return { valid: false, reason: "INVALID_TOKEN", message: "Invalid invitation token." }
  }

  const tokenHash = hashToken(rawToken)
  const [tokenRow] = await orycmsPrisma.$queryRaw<{
    createdAt: Date
    expiresAt: Date
    id: string
    used: boolean
    userEmail: string
    userFullName: string
    userId: string
    userStatus: string
  }[]>`
    SELECT
      t.id,
      t."userId",
      t."expiresAt",
      t.used,
      t."createdAt",
      u.email AS "userEmail",
      u."fullName" AS "userFullName",
      u.status AS "userStatus"
    FROM orycms_invitation_tokens t
    JOIN orycms_users u ON u.id = t."userId"
    WHERE t."tokenHash" = ${tokenHash} AND u."deletedAt" IS NULL
    LIMIT 1
  `

  if (!tokenRow) {
    return { valid: false, reason: "NOT_FOUND", message: "Invitation token not found." }
  }

  if (tokenRow.used) {
    return { valid: false, reason: "ALREADY_USED", message: "This invitation link has already been used." }
  }

  if (new Date() > new Date(tokenRow.expiresAt)) {
    return { valid: false, reason: "EXPIRED", message: "This invitation link has expired (valid for 24 hours)." }
  }

  return {
    valid: true,
    data: {
      email: tokenRow.userEmail,
      expiresAt: tokenRow.expiresAt,
      fullName: tokenRow.userFullName,
      tokenId: tokenRow.id,
      userId: tokenRow.userId,
    },
  }
}

export async function completeInvitationPasswordSetup(rawToken: string, password: string) {
  const validation = await validateInvitationToken(rawToken)
  if (!validation.valid || !validation.data) {
    throw new Error(validation.message || "Invalid or expired invitation token.")
  }

  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters long.")
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const { tokenId, userId, email } = validation.data

  // Mark token as used
  await orycmsPrisma.$executeRaw`
    UPDATE orycms_invitation_tokens SET used = true WHERE id = ${tokenId}::uuid
  `

  // Activate user, verify email, clear invited flag
  await orycmsPrisma.$executeRaw`
    UPDATE orycms_users
    SET "passwordHash" = ${passwordHash},
        status = 'active',
        "emailVerified" = true,
        invited = false,
        "updatedAt" = now()
    WHERE id = ${userId}::uuid AND "deletedAt" IS NULL
  `

  await logAdminAudit({
    action: "password_setup_completed",
    targetUserId: userId,
    details: { email },
  })

  return { success: true, userId, email }
}
