import crypto from "crypto"
import { cookies, headers } from "next/headers"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import type { Prisma } from "@prisma/client"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export const ACCESS_COOKIE = "acc_access"
export const REFRESH_COOKIE = "acc_refresh"
export const CSRF_COOKIE = "acc_csrf"
const ACCESS_TTL_SECONDS = 15 * 60
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60
const AUTH_SECRET = process.env.STOREFRONT_AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-storefront-auth-secret-change-me"
const EMAIL_VERIFICATION_REQUIRED_MESSAGE = "Please verify your email before creating your account."
const MAX_SAVED_ADDRESSES = 4
const rateHits = new Map<string, { count: number; resetAt: number }>()

export type StorefrontUserDTO = {
  defaultAddress?: Record<string, unknown> | null
  email: string
  emailVerified: boolean
  firstName: string
  id: string
  joinedAt: string
  lastName: string
  phone: string
  status?: string
}

type UserRow = {
  created_at: Date
  default_address: Prisma.JsonValue | null
  deleted_at: Date | null
  email: string
  email_verified_at: Date | null
  first_name: string
  id: string
  last_name: string
  last_login_at: Date | null
  password_hash: string
  phone: string | null
  status: string
}

export async function ensureStorefrontAuthSchema() {
  // Database structure is managed by Prisma migrations.
}

export function jsonError(message: string, status = 400, code = "AUTH_ERROR") {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

export function validateEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email)
}

export function validatePassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password)
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").slice(0, 15)
}

export function validateStorefrontPhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone)
}

export async function rateLimit(key: string, limit = 8, windowMs = 60_000) {
  const now = Date.now()
  const hit = rateHits.get(key)
  if (!hit || hit.resetAt < now) {
    rateHits.set(key, { count: 1, resetAt: now + windowMs })
    return
  }
  hit.count += 1
  if (hit.count > limit) throw new Error("Too many attempts. Please wait and try again.")
}

export async function requireCsrf() {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value
  const headerToken = headerStore.get("x-csrf-token")
  if (!safeEqual(cookieToken, headerToken)) {
    throw new Error("Security check failed. Refresh the page and try again.")
  }
}

export async function csrfResponse() {
  const token = randomToken()
  const response = NextResponse.json({ success: true, data: { csrfToken: token } })
  response.cookies.set(CSRF_COOKIE, token, cookieOptions(false, 60 * 60))
  return response
}

export async function createUser(input: {
  email: string
  emailVerificationToken: string
  firstName: string
  lastName: string
  password: string
  phone: string
}) {
  await ensureStorefrontAuthSchema()
  const email = input.email.trim().toLowerCase()
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const phone = normalizePhone(input.phone)

  if (!firstName || !lastName) throw new Error("Name is required.")
  if (!validateEmail(email)) throw new Error("Enter a valid email.")
  if (!validatePassword(input.password)) throw new Error("Password must include 8 characters, an uppercase letter, and a number.")
  if (!validateStorefrontPhone(phone)) throw new Error("Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.")
  if (!input.emailVerificationToken) throw new Error(EMAIL_VERIFICATION_REQUIRED_MESSAGE)

  const [existing] = await orycmsPrisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM storefront_users WHERE lower(email) = lower(${email}) LIMIT 1
  `
  if (existing) throw new Error("An account already exists with this email.")

  const passwordHash = await bcrypt.hash(input.password, 12)
  const [user] = await orycmsPrisma.$queryRaw<UserRow[]>`
    WITH claimed_otp AS (
      UPDATE storefront_signup_otps
      SET consumed_at = now()
      WHERE email = ${email}
        AND verification_token_hash = ${hash(input.emailVerificationToken)}
        AND verified_at IS NOT NULL AND consumed_at IS NULL AND expires_at > now()
      RETURNING id
    )
    INSERT INTO storefront_users (first_name, last_name, email, phone, password_hash, email_verified_at)
    SELECT ${firstName}, ${lastName}, ${email}, ${phone}, ${passwordHash}, now()
    FROM claimed_otp
    RETURNING *
  `
  if (!user) throw new Error(EMAIL_VERIFICATION_REQUIRED_MESSAGE)

  return { user: toUserDTO(user) }
}

export async function createSignupOtp(emailInput: string) {
  const email = emailInput.trim().toLowerCase()
  if (!validateEmail(email)) throw new Error("Enter a valid email.")
  const [existing] = await orycmsPrisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM storefront_users WHERE lower(email) = lower(${email}) LIMIT 1
  `
  if (existing) throw new Error("An account already exists with this email.")
  await orycmsPrisma.$executeRaw`
    UPDATE storefront_signup_otps SET consumed_at = now()
    WHERE email = ${email} AND consumed_at IS NULL
  `
  const otp = crypto.randomInt(100000, 1000000).toString()
  await orycmsPrisma.$executeRaw`
    INSERT INTO storefront_signup_otps (email, otp_hash, expires_at)
    VALUES (${email}, ${hash(otp)}, ${new Date(Date.now() + 5 * 60_000)})
  `
  return { email, otp }
}

export async function verifySignupOtp(emailInput: string, otpInput: string) {
  const email = emailInput.trim().toLowerCase()
  const otp = otpInput.trim()
  if (!validateEmail(email) || !/^\d{6}$/.test(otp)) throw new Error("Enter the valid 6-digit OTP.")
  const verificationToken = randomToken(32)
  const [verified] = await orycmsPrisma.$queryRaw<{ id: string }[]>`
    UPDATE storefront_signup_otps
    SET verified_at = now(),
        verification_token_hash = ${hash(verificationToken)},
        expires_at = now() + interval '10 minutes'
    WHERE id = (
      SELECT id FROM storefront_signup_otps
      WHERE email = ${email} AND consumed_at IS NULL AND verified_at IS NULL
      ORDER BY created_at DESC LIMIT 1
    )
      AND otp_hash = ${hash(otp)}
      AND attempts < 5
      AND expires_at > now()
    RETURNING id
  `
  if (verified) return verificationToken

  const [failed] = await orycmsPrisma.$queryRaw<{ attempts: number; expires_at: Date }[]>`
    UPDATE storefront_signup_otps
    SET attempts = attempts + 1
    WHERE id = (
      SELECT id FROM storefront_signup_otps
      WHERE email = ${email} AND consumed_at IS NULL AND verified_at IS NULL
      ORDER BY created_at DESC LIMIT 1
    )
      AND attempts < 5
      AND expires_at > now()
    RETURNING attempts, expires_at
  `
  if (!failed) throw new Error("OTP has expired or too many attempts were made. Send a new OTP.")
  throw new Error(`The OTP is incorrect. ${Math.max(0, 5 - failed.attempts)} attempt(s) remaining.`)
}

export async function authenticateUser(emailInput: string, password: string) {
  await ensureStorefrontAuthSchema()
  const email = emailInput.trim().toLowerCase()
  if (!validateEmail(email) || !password) throw new Error("Invalid email or password.")

  const [user] = await orycmsPrisma.$queryRaw<UserRow[]>`
    SELECT * FROM storefront_users WHERE lower(email) = lower(${email}) AND deleted_at IS NULL LIMIT 1
  `
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new Error("Invalid email or password.")
  }
  if (!user.email_verified_at) {
    throw new Error("Verify your email before signing in. Create your account after completing email OTP verification.")
  }
  if (user.status !== "active") {
    throw new Error(user.status === "blocked" ? "Your account is blocked. Contact support." : "Your account is inactive. Contact support.")
  }

  await orycmsPrisma.$executeRaw`
    UPDATE storefront_users SET last_login_at = now(), updated_at = now() WHERE id = ${user.id}::uuid
  `

  return toUserDTO(user)
}

export async function getUserById(id: string) {
  await ensureStorefrontAuthSchema()
  const [user] = await orycmsPrisma.$queryRaw<UserRow[]>`
    SELECT * FROM storefront_users WHERE id = ${id}::uuid AND deleted_at IS NULL LIMIT 1
  `
  return user?.status === "active" ? toUserDTO(user) : null
}

export async function updateUserProfile(userId: string, input: Partial<StorefrontUserDTO>) {
  await ensureStorefrontAuthSchema()
  const [current] = await orycmsPrisma.$queryRaw<UserRow[]>`
    SELECT * FROM storefront_users WHERE id = ${userId}::uuid LIMIT 1
  `
  if (!current) throw new Error("User not found.")

  const firstName = input.firstName?.trim() ?? current.first_name
  const lastName = input.lastName?.trim() ?? current.last_name
  const phone = input.phone === undefined ? current.phone : normalizePhone(input.phone)
  const defaultAddress = input.defaultAddress === undefined
    ? current.default_address
    : input.defaultAddress

  if (!firstName || !lastName) throw new Error("Name is required.")
  if (phone && !validateStorefrontPhone(phone)) throw new Error("Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.")
  validateSavedAddresses(defaultAddress)

  const [user] = await orycmsPrisma.$queryRaw<UserRow[]>`
    UPDATE storefront_users
    SET first_name = ${firstName},
        last_name = ${lastName},
        phone = ${phone ?? null},
        default_address = ${JSON.stringify(defaultAddress)}::jsonb,
        updated_at = now()
    WHERE id = ${userId}::uuid
    RETURNING *
  `

  return toUserDTO(user)
}

function validateSavedAddresses(value: Prisma.JsonValue | Record<string, unknown> | null) {
  if (!value || typeof value !== "object" || Array.isArray(value) || !Array.isArray(value.addresses)) return
  if (value.addresses.length > MAX_SAVED_ADDRESSES) {
    throw new Error(`You can save up to ${MAX_SAVED_ADDRESSES} addresses.`)
  }
  for (const address of value.addresses) {
    if (!address || typeof address !== "object") continue
    const savedAddress = address as { address1?: unknown; line1?: unknown; name?: unknown; phone?: unknown; pincode?: unknown }
    if (!String(savedAddress.name ?? "").trim()) {
      throw new Error("Full name is required.")
    }
    if (!/^\d{10}$/.test(String(savedAddress.phone ?? ""))) {
      throw new Error("Enter a valid 10-digit mobile number.")
    }
    if (!String(savedAddress.pincode ?? "").trim()) {
      throw new Error("Pincode is required.")
    }
    if (!/^\d{6}$/.test(String(savedAddress.pincode))) {
      throw new Error("Enter a valid 6-digit pincode.")
    }
    if (!String(savedAddress.address1 ?? savedAddress.line1 ?? "").trim()) {
      throw new Error("Address line 1 is required.")
    }
  }
}

export async function createSessionCookies(userId: string) {
  const refreshToken = randomToken(48)
  const refreshHash = hash(refreshToken)
  const accessToken = signJwt({ sub: userId }, ACCESS_TTL_SECONDS)
  await ensureStorefrontAuthSchema()
  await orycmsPrisma.$executeRaw`DELETE FROM storefront_refresh_tokens WHERE user_id = ${userId}::uuid`
  await orycmsPrisma.$executeRaw`
    INSERT INTO storefront_refresh_tokens (user_id, token_hash, expires_at)
    VALUES (${userId}::uuid, ${refreshHash}, ${new Date(Date.now() + REFRESH_TTL_SECONDS * 1000)})
  `

  return { accessToken, refreshToken }
}

export async function setAuthCookies(response: NextResponse, userId: string) {
  const tokens = await createSessionCookies(userId)
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(true, ACCESS_TTL_SECONDS))
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(true, REFRESH_TTL_SECONDS))
  return response
}

export function setAccessCookie(response: NextResponse, userId: string) {
  response.cookies.set(ACCESS_COOKIE, signJwt({ sub: userId }, ACCESS_TTL_SECONDS), cookieOptions(true, ACCESS_TTL_SECONDS))
  return response
}

export async function clearAuthCookies(response: NextResponse = NextResponse.json({ success: true, data: null })) {
  const cookieStore = await cookies()
  const refresh = cookieStore.get(REFRESH_COOKIE)?.value
  if (refresh) {
    await ensureStorefrontAuthSchema()
    await orycmsPrisma.$executeRaw`DELETE FROM storefront_refresh_tokens WHERE token_hash = ${hash(refresh)}`
  }
  response.cookies.set(ACCESS_COOKIE, "", cookieOptions(true, 0))
  response.cookies.set(REFRESH_COOKIE, "", cookieOptions(true, 0))
  response.cookies.set(CSRF_COOKIE, "", cookieOptions(false, 0))
  return response
}

export async function currentUser() {
  const cookieStore = await cookies()
  const access = cookieStore.get(ACCESS_COOKIE)?.value
  const accessPayload = access ? verifyJwt(access) : null
  if (accessPayload?.sub) {
    const user = await getUserById(accessPayload.sub)
    return user?.emailVerified ? user : null
  }

  const refresh = cookieStore.get(REFRESH_COOKIE)?.value
  if (!refresh) return null
  const row = await getRefreshSession(refresh)
  if (!row?.user_id) return null
  const user = await getUserById(row.user_id)
  return user?.emailVerified ? user : null
}

export async function currentUserResponse() {
  const response = NextResponse.json({ success: true, data: { user: null as StorefrontUserDTO | null } })
  const cookieStore = await cookies()
  const access = cookieStore.get(ACCESS_COOKIE)?.value
  const accessPayload = access ? verifyJwt(access) : null
  if (accessPayload?.sub) {
    const user = await getUserById(accessPayload.sub)
    response.headers.set("cache-control", "no-store")
    return user?.emailVerified ? NextResponse.json({ success: true, data: { user } }, { headers: response.headers }) : clearAuthCookies(response)
  }

  const refresh = cookieStore.get(REFRESH_COOKIE)?.value
  if (!refresh) {
    response.headers.set("cache-control", "no-store")
    return response
  }

  const row = await getRefreshSession(refresh)
  if (!row?.user_id) return clearAuthCookies(response)
  const user = await getUserById(row.user_id)
  if (!user?.emailVerified) return clearAuthCookies(response)

  const refreshed = NextResponse.json({ success: true, data: { user } })
  refreshed.headers.set("cache-control", "no-store")
  return setAccessCookie(refreshed, user.id)
}

export async function requireUser() {
  const user = await currentUser()
  if (!user) throw new Error("Authentication required.")
  return user
}

export async function createAuthToken(userId: string, type: "reset_password" | "verify_email", ttlSeconds: number) {
  await ensureStorefrontAuthSchema()
  const token = randomToken(32)
  await orycmsPrisma.$executeRaw`
    INSERT INTO storefront_auth_tokens (user_id, token_hash, type, expires_at)
    VALUES (${userId}::uuid, ${hash(token)}, ${type}, ${new Date(Date.now() + ttlSeconds * 1000)})
  `
  return token
}

export async function createFreshEmailVerificationToken(userId: string) {
  await ensureStorefrontAuthSchema()
  await orycmsPrisma.$executeRaw`
    UPDATE storefront_auth_tokens
    SET used_at = now()
    WHERE user_id = ${userId}::uuid AND type = 'verify_email' AND used_at IS NULL
  `
  return createAuthToken(userId, "verify_email", 24 * 60 * 60)
}

export async function consumeAuthToken(token: string, type: "reset_password" | "verify_email") {
  await ensureStorefrontAuthSchema()
  const [row] = await orycmsPrisma.$queryRaw<{ id: string; user_id: string }[]>`
    SELECT id, user_id FROM storefront_auth_tokens
    WHERE token_hash = ${hash(token)} AND type = ${type} AND used_at IS NULL AND expires_at > now()
    LIMIT 1
  `
  if (!row) throw new Error("Invalid or expired token.")
  await orycmsPrisma.$executeRaw`UPDATE storefront_auth_tokens SET used_at = now() WHERE id = ${row.id}::uuid`
  return row.user_id
}

export async function verifyStorefrontEmail(token: string) {
  await ensureStorefrontAuthSchema()
  if (!token) throw new Error("Invalid or expired verification link.")

  return orycmsPrisma.$transaction(async (transaction) => {
    const [row] = await transaction.$queryRaw<{
      deleted_at: Date | null
      email_verified_at: Date | null
      expires_at: Date
      id: string
      status: string
      used_at: Date | null
      user_id: string
    }[]>`
      SELECT t.id, t.user_id, t.expires_at, t.used_at,
             u.email_verified_at, u.status, u.deleted_at
      FROM storefront_auth_tokens t
      JOIN storefront_users u ON u.id = t.user_id
      WHERE t.token_hash = ${hash(token)} AND t.type = 'verify_email'
      LIMIT 1
    `

    if (!row || row.status !== "active" || row.deleted_at) throw new Error("Invalid verification link.")
    if (row.email_verified_at) {
      return { status: "already_verified" as const, userId: row.user_id }
    }
    if (new Date(row.expires_at).getTime() <= Date.now()) throw new Error("Verification link has expired. Request a new verification email.")

    const claimed = await transaction.$executeRaw`
      UPDATE storefront_auth_tokens
      SET used_at = now()
      WHERE id = ${row.id}::uuid AND used_at IS NULL AND expires_at > now()
    `

    if (claimed !== 1) {
      const [user] = await transaction.$queryRaw<{ email_verified_at: Date | null }[]>`
        SELECT email_verified_at FROM storefront_users WHERE id = ${row.user_id}::uuid LIMIT 1
      `
      if (user?.email_verified_at) return { status: "already_verified" as const, userId: row.user_id }
      throw new Error("Verification link is no longer valid. Request a new verification email.")
    }

    await transaction.$executeRaw`
      UPDATE storefront_users
      SET email_verified_at = now(), updated_at = now()
      WHERE id = ${row.user_id}::uuid AND status = 'active' AND deleted_at IS NULL
    `
    return { status: "verified" as const, userId: row.user_id }
  })
}

export async function setVerified(userId: string) {
  await orycmsPrisma.$executeRaw`
    UPDATE storefront_users SET email_verified_at = now(), updated_at = now() WHERE id = ${userId}::uuid
  `
}

export async function setPassword(userId: string, password: string) {
  if (!validatePassword(password)) throw new Error("Password must include 8 characters, an uppercase letter, and a number.")
  await orycmsPrisma.$executeRaw`
    UPDATE storefront_users SET password_hash = ${await bcrypt.hash(password, 12)}, updated_at = now()
    WHERE id = ${userId}::uuid
  `
  await orycmsPrisma.$executeRaw`DELETE FROM storefront_refresh_tokens WHERE user_id = ${userId}::uuid`
}

export async function findUserByEmail(emailInput: string) {
  await ensureStorefrontAuthSchema()
  const email = emailInput.trim().toLowerCase()
  const [user] = await orycmsPrisma.$queryRaw<UserRow[]>`
    SELECT * FROM storefront_users WHERE lower(email) = lower(${email}) AND deleted_at IS NULL LIMIT 1
  `
  return user?.status === "active" ? toUserDTO(user) : null
}

export async function requestKey(prefix: string) {
  const h = await headers()
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local"
  return `${prefix}:${ip}`
}

export function toUserDTO(user: UserRow): StorefrontUserDTO {
  return {
    defaultAddress: user.default_address && typeof user.default_address === "object" && !Array.isArray(user.default_address)
      ? (user.default_address as Record<string, unknown>)
      : null,
    email: user.email,
    emailVerified: Boolean(user.email_verified_at),
    firstName: user.first_name,
    id: user.id,
    joinedAt: user.created_at.toISOString(),
    lastName: user.last_name,
    phone: user.phone ?? "",
    status: user.status,
  }
}

function signJwt(payload: { sub: string }, ttlSeconds: number) {
  assertAuthSecret()
  const header = { alg: "HS256", typ: "JWT" }
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds }
  const encoded = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(body))}`
  return `${encoded}.${base64url(hmac(encoded))}`
}

function verifyJwt(token: string) {
  assertAuthSecret()
  try {
    const [header, body, signature] = token.split(".")
    if (!header || !body || !signature) return null
    const expected = base64url(hmac(`${header}.${body}`))
    if (signature.length !== expected.length) return null
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as { exp: number; sub: string }
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null
  } catch {
    return null
  }
}

function hmac(value: string) {
  return crypto.createHmac("sha256", AUTH_SECRET).update(value).digest()
}

function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex")
}

async function getRefreshSession(refresh: string) {
  await ensureStorefrontAuthSchema()
  const [row] = await orycmsPrisma.$queryRaw<{ user_id: string }[]>`
    SELECT t.user_id
    FROM storefront_refresh_tokens t
    JOIN storefront_users u ON u.id = t.user_id
    WHERE t.token_hash = ${hash(refresh)}
      AND t.expires_at > now()
      AND u.status = 'active'
      AND u.deleted_at IS NULL
      AND u.email_verified_at IS NOT NULL
    LIMIT 1
  `
  return row ?? null
}

function safeEqual(left?: string | null, right?: string | null) {
  if (!left || !right || left.length !== right.length) return false
  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right))
}

function assertAuthSecret() {
  if (process.env.NODE_ENV === "production" && AUTH_SECRET === "dev-storefront-auth-secret-change-me") {
    throw new Error("STOREFRONT_AUTH_SECRET is required in production.")
  }
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url")
}

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url")
}

function cookieOptions(httpOnly: boolean, maxAge: number) {
  return {
    httpOnly,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  }
}
