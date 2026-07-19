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
        },
      },
    },
  })

  if (!session) {
    throw new Response("Session expired or invalid.", { status: 401 })
  }

  return session.user
}
