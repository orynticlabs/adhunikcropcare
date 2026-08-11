import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { createOryCMSAdminSession, setOryCMSAdminSessionCookie } from "@/lib/orycms/auth"
import { ensureOryCMSAdminUserSchema, touchOryCMSAdminLastLogin } from "@/lib/orycms/users"

export async function POST(request: NextRequest) {
  try {
    await ensureOryCMSAdminUserSchema()
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

    const [user] = await orycmsPrisma.$queryRaw<
      { email: string; id: string; passwordHash: string; roleId: string | null; roleName: string | null; status: string }[]
    >`
      SELECT u.email, u.id, u."passwordHash", u."roleId", u.status, r.name AS "roleName"
      FROM orycms_users u
      LEFT JOIN orycms_roles r ON r.id = u."roleId"
      WHERE lower(u.email) = lower(${email.toLowerCase().trim()}) AND u."deletedAt" IS NULL
      LIMIT 1
    `
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

    if (!user.roleId || !user.roleName) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ADMIN_ROLE_REQUIRED",
            message: "This account does not have admin access.",
          },
        },
        { status: 403 },
      )
    }

    const { rawToken, session } = await createOryCMSAdminSession(user.id)
    await touchOryCMSAdminLastLogin(user.id)

    const response = NextResponse.json({
      success: true,
      data: {
        email: user.email,
        roleName: user.roleName,
        session: { expiresAt: session.expiresAt, id: session.id },
        userId: user.id,
      },
    })

    setOryCMSAdminSessionCookie(response, rawToken)

    return response
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "LOGIN_FAILED", message: "Login failed." } },
      { status: 500 },
    )
  }
}
