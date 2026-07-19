import crypto from "crypto"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { ORYCMS_SESSION_COOKIE } from "@/lib/orycms/config"

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const SESSION_MAX_AGE = SESSION_TTL_MS / 1000

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    const { email = "", password = "" } = (await request.json()) as {
      email?: string
      password?: string
    }

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Email and password are required." },
        },
        { status: 422 },
      )
    }

    const user = await orycmsPrisma.oryCMSUser.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { email: true, id: true, passwordHash: true, status: true },
    })
    const valid = await bcrypt.compare(
      password,
      user?.passwordHash ?? "$2a$12$invalidhashfortimingprotection0000000000000000000000",
    )

    if (!user || !valid) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } },
        { status: 401 },
      )
    }

    if (user.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ACCOUNT_INACTIVE",
            message: "This account is inactive. Contact your administrator.",
          },
        },
        { status: 403 },
      )
    }

    const rawToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
    const session = await orycmsPrisma.oryCMSSession.create({
      data: {
        expiresAt,
        tokenHash: hashToken(rawToken),
        userId: user.id,
      },
      select: { expiresAt: true, id: true },
    })

    const response = NextResponse.json({
      success: true,
      data: {
        email: user.email,
        session: { expiresAt: session.expiresAt, id: session.id },
        userId: user.id,
      },
    })

    response.cookies.set({
      name: ORYCMS_SESSION_COOKIE,
      value: rawToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("OryCMS Prisma login error:", error)
    return NextResponse.json(
      { success: false, error: { code: "LOGIN_FAILED", message: "Login failed." } },
      { status: 500 },
    )
  }
}
