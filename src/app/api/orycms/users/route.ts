import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { createOryCMSAdminUser, listOryCMSAdminUsers, updateOryCMSAdminUsers } from "@/lib/orycms/users"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await listOryCMSAdminUsers() })
  } catch (error) {
    return userError(error, "Failed to load users.")
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await createOryCMSAdminUser(await request.json(), actor) }, { status: 201 })
  } catch (error) {
    return userError(error, "Failed to create user.")
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requireOryCMSUser(request)
    const body = (await request.json()) as {
      action?: "activate" | "deactivate" | "delete"
      ids?: string[]
    }

    if (!body.action || !Array.isArray(body.ids) || body.ids.length === 0) {
      return userError(new Error("Select users and an action."), "Invalid request.")
    }

    await updateOryCMSAdminUsers(body.ids, body.action, actor)
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return userError(error, "Failed to update users.")
  }
}

function userError(error: unknown, fallback: string) {
  if (error instanceof Response) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: error.status },
    )
  }

  const message = error instanceof Error ? error.message : fallback
  const validation = message.includes("required") || message.includes("Password") || message.includes("exists") || message.includes("Select")
  const forbidden = message.includes("Only Super Admins") || message.includes("own account") || message.includes("modify Super Admin")

  return NextResponse.json(
    { success: false, error: { code: forbidden ? "FORBIDDEN" : validation ? "VALIDATION_ERROR" : "USER_ERROR", message } },
    { status: forbidden ? 403 : validation ? 422 : 500 },
  )
}
