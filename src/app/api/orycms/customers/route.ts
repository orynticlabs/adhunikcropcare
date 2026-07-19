import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { bulkUpdateOryCMSCustomers, listOryCMSCustomers } from "@/lib/orycms/customers"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await listOryCMSCustomers() })
  } catch (error) {
    return customerError(error, "Failed to load customers.")
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const body = (await request.json()) as {
      action?: "activate" | "deactivate" | "block" | "unblock" | "delete"
      ids?: string[]
    }

    if (!body.action || !Array.isArray(body.ids) || body.ids.length === 0) {
      return customerError(new Error("Select customers and an action."), "Invalid request.")
    }

    await bulkUpdateOryCMSCustomers(body.ids, body.action)
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return customerError(error, "Failed to update customers.")
  }
}

function customerError(error: unknown, fallback: string) {
  if (error instanceof Response) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: error.status },
    )
  }

  const message = error instanceof Error ? error.message : fallback
  return NextResponse.json(
    { success: false, error: { code: message.includes("Select") ? "VALIDATION_ERROR" : "CUSTOMER_ERROR", message } },
    { status: message.includes("Select") ? 422 : 500 },
  )
}
