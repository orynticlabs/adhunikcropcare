import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { deleteOryCMSAdminUser, getOryCMSAdminUser, resetOryCMSAdminPassword, setOryCMSAdminStatus, updateOryCMSAdminUser } from "@/lib/orycms/users"

export const runtime = "nodejs"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    const user = await getOryCMSAdminUser((await params).id)
    if (!user) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "User not found." } }, { status: 404 })
    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    return userError(error, "Failed to load user.")
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireOryCMSUser(request)
    const id = (await params).id
    const body = await request.json() as {
      action?: "activate" | "deactivate" | "reset-password"
      confirmPassword?: string
      password?: string
    }

    if (body.action === "activate" || body.action === "deactivate") {
      await setOryCMSAdminStatus(id, body.action === "activate" ? "active" : "inactive", actor)
      return NextResponse.json({ success: true, data: await getOryCMSAdminUser(id) })
    }
    if (body.action === "reset-password") {
      await resetOryCMSAdminPassword(id, body, actor)
      return NextResponse.json({ success: true, data: null })
    }

    return NextResponse.json({ success: true, data: await updateOryCMSAdminUser(id, body, actor) })
  } catch (error) {
    return userError(error, "Failed to update user.")
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireOryCMSUser(request)
    await deleteOryCMSAdminUser((await params).id, actor)
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return userError(error, "Failed to delete user.")
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
  const validation = message.includes("required") || message.includes("Password") || message.includes("exists")
  const forbidden = message.includes("Only Super Admins") || message.includes("own account") || message.includes("modify Super Admin")

  return NextResponse.json(
    { success: false, error: { code: forbidden ? "FORBIDDEN" : validation ? "VALIDATION_ERROR" : "USER_ERROR", message } },
    { status: forbidden ? 403 : validation ? 422 : 500 },
  )
}
