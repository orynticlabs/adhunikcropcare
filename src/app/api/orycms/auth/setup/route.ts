import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createOryCMSAdminSession, setOryCMSAdminSessionCookie } from "@/lib/orycms/auth"
import { createInitialOryCMSSuperAdmin } from "@/lib/orycms/setup"

export async function POST(request: NextRequest) {
  try {
    const user = await createInitialOryCMSSuperAdmin(await request.json())
    const { rawToken, session } = await createOryCMSAdminSession(user.id)

    const response = NextResponse.json(
      {
        success: true,
        data: {
          email: user.email,
          roleName: user.roleName,
          session: { expiresAt: session.expiresAt, id: session.id },
          userId: user.id,
        },
      },
      { status: 201 },
    )
    setOryCMSAdminSessionCookie(response, rawToken)
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : "Setup failed."
    const setupAlreadyComplete = message === "OryCMS setup is already completed."
    return NextResponse.json(
      {
        success: false,
        error: {
          code: setupAlreadyComplete ? "SETUP_ALREADY_COMPLETED" : "VALIDATION_ERROR",
          message,
        },
      },
      { status: setupAlreadyComplete ? 409 : 422 },
    )
  }
}
