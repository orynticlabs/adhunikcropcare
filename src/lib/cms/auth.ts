import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import type { AdminSession } from "./types"

const COOKIE_NAME = "orycms_admin_session"
const SESSION_TTL_MS = 1000 * 60 * 60 * 12

function getSecret() {
  return process.env.CMS_SESSION_SECRET ?? "dev-session-secret-change-me"
}

function getAdminEmail() {
  return process.env.CMS_ADMIN_EMAIL ?? "admin@orycms.local"
}

function getAdminPassword() {
  return process.env.CMS_ADMIN_PASSWORD ?? "admin1234"
}

function base64Url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url")
}

function unbase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8")
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url")
}

function encodeSession(session: AdminSession) {
  const payload = base64Url(JSON.stringify(session))
  return `${payload}.${sign(payload)}`
}

function decodeSession(value: string): AdminSession | null {
  const [payload, signature] = value.split(".")
  if (!payload || !signature) {
    return null
  }

  const expected = sign(payload)
  const expectedBuffer = Buffer.from(expected)
  const providedBuffer = Buffer.from(signature)
  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return null
  }

  try {
    const session = JSON.parse(unbase64Url(payload)) as AdminSession
    if (!session.email || !session.expiresAt || session.expiresAt < Date.now()) {
      return null
    }
    return session
  } catch {
    return null
  }
}

function createSession(email: string): AdminSession {
  const now = Date.now()
  return {
    email,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_MS,
  }
}

export function validateAdminCredentials(email: string, password: string) {
  return email === getAdminEmail() && password === getAdminPassword()
}

export async function getAdminSession() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  return raw ? decodeSession(raw) : null
}

export async function requireAdminSession() {
  const session = await getAdminSession()
  if (!session) {
    return null
  }

  return session
}

export async function setAdminSession(email: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, encodeSession(createSession(email)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}

