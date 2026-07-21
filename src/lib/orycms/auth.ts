import crypto from "crypto"
import type { NextRequest } from "next/server"
import { ORYCMS_SESSION_COOKIE } from "@/lib/orycms/config"
import { orycmsPrisma } from "@/lib/orycms/prisma"

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex")
}

export async function requireOryCMSUser(request: NextRequest) {
  const rawToken = request.cookies.get(ORYCMS_SESSION_COOKIE)?.value

  if (!rawToken) {
    throw new Response("Authentication required.", { status: 401 })
  }

  const session = await orycmsPrisma.oryCMSSession.findFirst({
    where: {
      expiresAt: { gt: new Date() },
      tokenHash: hashToken(rawToken),
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
