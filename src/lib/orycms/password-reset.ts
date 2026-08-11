import crypto from "crypto"
import bcrypt from "bcryptjs"
import { orycmsPrisma } from "./prisma"
import { emailBaseUrl, sendAdminPasswordResetEmail, sendAdminPasswordResetSuccessEmail } from "../email/mailer"
import { logAdminAudit } from "./invitation"

export const RESET_TOKEN_EXPIRY_MINUTES = 15
export const RESET_TOKEN_EXPIRY_MS = RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000
export const REQUEST_COOLDOWN_MS = 60 * 1000 // 1 minute cooldown per request

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex")
}

export async function createAndSendAdminPasswordReset(email: string) {
  const cleanEmail = email.toLowerCase().trim()
  if (!cleanEmail) {
    throw new Error("Email address is required.")
  }

  const GENERIC_RESPONSE = {
    success: true,
    message: "If an account exists with this email, a password reset link has been sent.",
  }

  // Find active, non-deleted OryCMS user
  const [userRow] = await orycmsPrisma.$queryRaw<{
    email: string
    fullName: string
    id: string
    status: string
  }[]>`
    SELECT id, email, "fullName", status
    FROM orycms_users
    WHERE lower(email) = ${cleanEmail} AND "deletedAt" IS NULL
    LIMIT 1
  `

  if (!userRow || userRow.status !== "active") {
    // Return generic message to prevent email enumeration
    return GENERIC_RESPONSE
  }

  // Check rate limiting / cooldown on latest reset token created for this user
  const [latestToken] = await orycmsPrisma.$queryRaw<{ createdAt: Date }[]>`
    SELECT "createdAt"
    FROM orycms_password_reset_tokens
    WHERE "userId" = ${userRow.id}::uuid
    ORDER BY "createdAt" DESC
    LIMIT 1
  `

  if (latestToken) {
    const elapsed = Date.now() - new Date(latestToken.createdAt).getTime()
    if (elapsed < REQUEST_COOLDOWN_MS) {
      // Return generic message without generating another token right away
      return GENERIC_RESPONSE
    }
  }

  const rawToken = crypto.randomBytes(32).toString("hex")
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS)

  // Invalidate previous unused reset tokens for this user
  await orycmsPrisma.$executeRaw`
    UPDATE orycms_password_reset_tokens
    SET used = true
    WHERE "userId" = ${userRow.id}::uuid AND used = false
  `

  // Insert new reset token
  await orycmsPrisma.$executeRaw`
    INSERT INTO orycms_password_reset_tokens (id, "userId", "tokenHash", "expiresAt", used, "createdAt")
    VALUES (gen_random_uuid(), ${userRow.id}::uuid, ${tokenHash}, ${expiresAt}, false, now())
  `

  const resetUrl = `${emailBaseUrl()}/admin/reset-password?token=${rawToken}`

  const delivery = await sendAdminPasswordResetEmail({
    to: userRow.email,
    fullName: userRow.fullName || userRow.email,
    resetUrl,
  })

  await logAdminAudit({
    action: "admin_password_reset_requested",
    targetUserId: userRow.id,
    details: { email: userRow.email, expiresAt: expiresAt.toISOString(), smtpSkipped: delivery && "skipped" in delivery ? delivery.skipped : false },
  })

  // Return resetUrl in dev mode if SMTP is not configured so developer can reset directly
  const isDevWithoutSmtp = process.env.NODE_ENV !== "production" && delivery && "skipped" in delivery && delivery.skipped
  if (isDevWithoutSmtp) {
    return {
      success: true,
      message: `[Dev Mode] Password reset link created! (SMTP not configured). Link: ${resetUrl}`,
      devResetUrl: resetUrl,
    }
  }

  return GENERIC_RESPONSE
}

export async function validateAdminPasswordResetToken(rawToken: string) {
  if (!rawToken || typeof rawToken !== "string") {
    return { valid: false, reason: "INVALID_TOKEN", message: "Invalid password reset token." }
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
    FROM orycms_password_reset_tokens t
    JOIN orycms_users u ON u.id = t."userId"
    WHERE t."tokenHash" = ${tokenHash} AND u."deletedAt" IS NULL
    LIMIT 1
  `

  if (!tokenRow) {
    return { valid: false, reason: "NOT_FOUND", message: "Password reset link is invalid or unknown." }
  }

  if (tokenRow.used) {
    return { valid: false, reason: "ALREADY_USED", message: "This password reset link has already been used." }
  }

  if (new Date() > new Date(tokenRow.expiresAt)) {
    return { valid: false, reason: "EXPIRED", message: "This password reset link has expired. Reset links are valid for 15 minutes." }
  }

  if (tokenRow.userStatus !== "active") {
    return { valid: false, reason: "INACTIVE_USER", message: "This admin account is currently inactive." }
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

export async function completeAdminPasswordReset(rawToken: string, newPassword: string) {
  const validation = await validateAdminPasswordResetToken(rawToken)
  if (!validation.valid || !validation.data) {
    throw new Error(validation.message || "Invalid or expired password reset token.")
  }

  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long.")
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  const { tokenId, userId, email } = validation.data

  // Mark token as used
  await orycmsPrisma.$executeRaw`
    UPDATE orycms_password_reset_tokens
    SET used = true
    WHERE id = ${tokenId}::uuid
  `

  // Update user password and updatedAt
  await orycmsPrisma.$executeRaw`
    UPDATE orycms_users
    SET "passwordHash" = ${passwordHash},
        "updatedAt" = now()
    WHERE id = ${userId}::uuid AND "deletedAt" IS NULL
  `

  // Invalidate all active sessions for this user for security
  await orycmsPrisma.$executeRaw`
    DELETE FROM orycms_sessions
    WHERE "userId" = ${userId}::uuid
  `

  await logAdminAudit({
    action: "admin_password_reset_completed",
    targetUserId: userId,
    details: { email },
  })

  // Send confirmation email to user notifying them of password change and session signouts
  await sendAdminPasswordResetSuccessEmail({
    to: email,
    email,
    fullName: validation.data.fullName || email,
  })

  return { success: true, userId, email }
}
