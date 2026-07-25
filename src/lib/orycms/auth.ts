import crypto from "crypto"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { ORYCMS_SESSION_COOKIE } from "@/lib/orycms/config"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export const ORYCMS_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
export const ORYCMS_SESSION_MAX_AGE = ORYCMS_SESSION_TTL_MS / 1000

export function hashOryCMSAdminSessionToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex")
}

export async function createOryCMSAdminSession(userId: string) {
  const rawToken = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + ORYCMS_SESSION_TTL_MS)
  const session = await orycmsPrisma.oryCMSSession.create({
    data: {
      expiresAt,
      tokenHash: hashOryCMSAdminSessionToken(rawToken),
      userId,
    },
    select: { expiresAt: true, id: true },
  })

  return { rawToken, session }
}

export function setOryCMSAdminSessionCookie(response: NextResponse, rawToken: string) {
  response.cookies.set({
    name: ORYCMS_SESSION_COOKIE,
    value: rawToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ORYCMS_SESSION_MAX_AGE,
    path: "/",
  })
}

export async function requireOryCMSUser(request: NextRequest) {
  const rawToken = request.cookies.get(ORYCMS_SESSION_COOKIE)?.value

  if (!rawToken) {
    throw new Response("Authentication required.", { status: 401 })
  }

  const session = await orycmsPrisma.oryCMSSession.findFirst({
    where: {
      expiresAt: { gt: new Date() },
      tokenHash: hashOryCMSAdminSessionToken(rawToken),
      user: { status: "active" },
    },
    select: {
      user: {
        select: {
          email: true,
          id: true,
          role: { select: { name: true } },
          roleId: true,
        },
      },
    },
  })

  if (!session?.user.roleId || !session.user.role?.name) {
    throw new Response("Session expired or invalid.", { status: 401 })
  }

  return {
    email: session.user.email,
    id: session.user.id,
    roleName: session.user.role.name,
  }
}

export type OryCMSAuthUser = Awaited<ReturnType<typeof requireOryCMSUser>>

/**
 * Like requireOryCMSUser, but additionally enforces that the admin's role is one
 * of `allowed`. Throws a 403 Response otherwise. Used to gate privileged actions
 * such as issuing refunds (Super Admin + Admin only).
 */
export async function requireOryCMSRole(request: NextRequest, allowed: string[]): Promise<OryCMSAuthUser> {
  const user = await requireOryCMSUser(request)
  if (!allowed.includes(user.roleName)) {
    throw new Response("You do not have permission to perform this action.", { status: 403 })
  }
  return user
}

export const REFUND_ALLOWED_ROLES = ["Super Admin", "Admin"]
