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
const rateHits = new Map<string, { count: number; resetAt: number }>()

export type StorefrontUserDTO = {
  avatar?: string | null
  defaultAddress?: Record<string, unknown> | null
  email: string
  emailVerified: boolean
  firstName: string
  id: string
  joinedAt: string
  lastName: string
  phone: string
}

type UserRow = {
  avatar: string | null
  created_at: Date
  default_address: Prisma.JsonValue | null
  email: string
  email_verified_at: Date | null
  first_name: string
  id: string
  last_name: string
  password_hash: string
  phone: string | null
}

export async function ensureStorefrontAuthSchema() {
  await orycmsPrisma.$executeRawUnsafe(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE IF NOT EXISTS storefront_users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      first_name text NOT NULL,
      last_name text NOT NULL,
      email text NOT NULL UNIQUE,
      email_verified_at timestamptz,
      phone text,
      password_hash text NOT NULL,
      avatar text,
      default_address jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS storefront_refresh_tokens (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      token_hash text NOT NULL UNIQUE,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS storefront_auth_tokens (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      token_hash text NOT NULL UNIQUE,
      type text NOT NULL,
      expires_at timestamptz NOT NULL,
      used_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS storefront_orders (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      number text NOT NULL UNIQUE,
      status text NOT NULL DEFAULT 'processing',
      payment_status text NOT NULL DEFAULT 'pending',
      payment_method text NOT NULL DEFAULT 'cash_on_delivery',
      razorpay_order_id text,
      razorpay_payment_id text,
      razorpay_signature text,
      contact jsonb,
      shipping_address jsonb,
      delivery_method text,
      subtotal numeric(12,2) NOT NULL DEFAULT 0,
      shipping_total numeric(12,2) NOT NULL DEFAULT 0,
      discount_total numeric(12,2) NOT NULL DEFAULT 0,
      invoice_number text,
      refund_status text NOT NULL DEFAULT 'none',
      cancelled_at timestamptz,
      reservation_expires_at timestamptz,
      stock_released_at timestamptz,
      payment_timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
      tracking text,
      invoice_url text,
      items jsonb NOT NULL DEFAULT '[]'::jsonb,
      total numeric(12,2) NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cash_on_delivery';
    ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS razorpay_order_id text;
    ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS razorpay_payment_id text;
    ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS razorpay_signature text;
    ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS contact jsonb;
    ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS shipping_address jsonb;
    ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS delivery_method text;
    ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS subtotal numeric(12,2) NOT NULL DEFAULT 0;
    ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS shipping_total numeric(12,2) NOT NULL DEFAULT 0;
    ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS discount_total numeric(12,2) NOT NULL DEFAULT 0;
    ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS invoice_number text;
    ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS refund_status text NOT NULL DEFAULT 'none';
    ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
    ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS reservation_expires_at timestamptz;
    ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS stock_released_at timestamptz;
    ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS payment_timeline jsonb NOT NULL DEFAULT '[]'::jsonb;
    CREATE TABLE IF NOT EXISTS storefront_payment_transactions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id uuid NOT NULL,
      user_id uuid,
      provider text NOT NULL DEFAULT 'razorpay',
      event text NOT NULL,
      status text NOT NULL,
      amount numeric(12,2),
      razorpay_order_id text,
      razorpay_payment_id text,
      razorpay_refund_id text,
      raw_payload jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS storefront_idempotency_keys (
      key text PRIMARY KEY,
      user_id uuid NOT NULL,
      endpoint text NOT NULL,
      order_id uuid,
      response jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS storefront_email_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id uuid NOT NULL,
      type text NOT NULL,
      recipient text NOT NULL,
      provider_id text,
      status text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(order_id, type)
    );
    CREATE INDEX IF NOT EXISTS storefront_refresh_tokens_user_id_idx ON storefront_refresh_tokens (user_id);
    CREATE INDEX IF NOT EXISTS storefront_auth_tokens_user_id_idx ON storefront_auth_tokens (user_id);
    CREATE INDEX IF NOT EXISTS storefront_orders_user_id_idx ON storefront_orders (user_id);
    CREATE INDEX IF NOT EXISTS storefront_payment_transactions_order_id_idx ON storefront_payment_transactions (order_id);
  `)
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
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
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
  if (phone.length < 10) throw new Error("Enter a valid mobile number.")

  const [existing] = await orycmsPrisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM storefront_users WHERE lower(email) = lower(${email}) LIMIT 1
  `
  if (existing) throw new Error("An account already exists with this email.")

  const passwordHash = await bcrypt.hash(input.password, 12)
  const [user] = await orycmsPrisma.$queryRaw<UserRow[]>`
    INSERT INTO storefront_users (first_name, last_name, email, phone, password_hash)
    VALUES (${firstName}, ${lastName}, ${email}, ${phone}, ${passwordHash})
    RETURNING *
  `
  const verifyToken = await createAuthToken(user.id, "verify_email", 24 * 60 * 60)

  return { user: toUserDTO(user), verifyToken }
}

export async function authenticateUser(emailInput: string, password: string) {
  await ensureStorefrontAuthSchema()
  const email = emailInput.trim().toLowerCase()
  if (!validateEmail(email) || !password) throw new Error("Invalid email or password.")

  const [user] = await orycmsPrisma.$queryRaw<UserRow[]>`
    SELECT * FROM storefront_users WHERE lower(email) = lower(${email}) LIMIT 1
  `
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new Error("Invalid email or password.")
  }

  return toUserDTO(user)
}

export async function getUserById(id: string) {
  await ensureStorefrontAuthSchema()
  const [user] = await orycmsPrisma.$queryRaw<UserRow[]>`
    SELECT * FROM storefront_users WHERE id = ${id}::uuid LIMIT 1
  `
  return user ? toUserDTO(user) : null
}

export async function updateUserProfile(userId: string, input: Partial<StorefrontUserDTO>) {
  await ensureStorefrontAuthSchema()
  const firstName = input.firstName?.trim()
  const lastName = input.lastName?.trim()
  const phone = input.phone ? normalizePhone(input.phone) : undefined
  const avatar = input.avatar?.trim() || null
  const defaultAddress = input.defaultAddress ?? null

  if (!firstName || !lastName) throw new Error("Name is required.")
  if (phone && phone.length < 10) throw new Error("Enter a valid mobile number.")

  const [user] = await orycmsPrisma.$queryRaw<UserRow[]>`
    UPDATE storefront_users
    SET first_name = ${firstName},
        last_name = ${lastName},
        phone = ${phone ?? null},
        avatar = ${avatar},
        default_address = ${JSON.stringify(defaultAddress)}::jsonb,
        updated_at = now()
    WHERE id = ${userId}::uuid
    RETURNING *
  `

  return toUserDTO(user)
}

export async function createSessionCookies(userId: string) {
  const refreshToken = randomToken(48)
  const refreshHash = hash(refreshToken)
  const accessToken = signJwt({ sub: userId }, ACCESS_TTL_SECONDS)
  await ensureStorefrontAuthSchema()
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

export async function clearAuthCookies(response = NextResponse.json({ success: true, data: null })) {
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
  if (accessPayload?.sub) return getUserById(accessPayload.sub)

  const refresh = cookieStore.get(REFRESH_COOKIE)?.value
  if (!refresh) return null
  await ensureStorefrontAuthSchema()
  const [row] = await orycmsPrisma.$queryRaw<{ user_id: string }[]>`
    SELECT user_id FROM storefront_refresh_tokens
    WHERE token_hash = ${hash(refresh)} AND expires_at > now()
    LIMIT 1
  `
  return row?.user_id ? getUserById(row.user_id) : null
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
    SELECT * FROM storefront_users WHERE lower(email) = lower(${email}) LIMIT 1
  `
  return user ? toUserDTO(user) : null
}

export async function requestKey(prefix: string) {
  const h = await headers()
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local"
  return `${prefix}:${ip}`
}

export function toUserDTO(user: UserRow): StorefrontUserDTO {
  return {
    avatar: user.avatar,
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
  }
}

function signJwt(payload: { sub: string }, ttlSeconds: number) {
  const header = { alg: "HS256", typ: "JWT" }
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds }
  const encoded = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(body))}`
  return `${encoded}.${base64url(hmac(encoded))}`
}

function verifyJwt(token: string) {
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
