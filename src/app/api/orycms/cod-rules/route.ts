import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { getOryCMSCodRule, saveOryCMSCodRule } from "@/lib/orycms/cod-rules"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const rule = await getOryCMSCodRule()
    return NextResponse.json({ success: true, data: rule })
  } catch (error) {
    return responseError(error)
  }
}

export async function POST(request: NextRequest) {
  return handleUpdate(request)
}

export async function PATCH(request: NextRequest) {
  return handleUpdate(request)
}

async function handleUpdate(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const body = (await request.json()) as { minOrdersRequired?: number }
    if (typeof body.minOrdersRequired !== "number" || isNaN(body.minOrdersRequired) || body.minOrdersRequired < 0) {
      throw new Error("Minimum orders required must be a non-negative integer.")
    }
    const updated = await saveOryCMSCodRule(body.minOrdersRequired)
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return responseError(error)
  }
}

function responseError(error: unknown) {
  if (error instanceof Response) {
    return NextResponse.json({ error: { message: "Authentication required." }, success: false }, { status: error.status })
  }
  const message = error instanceof Error ? error.message : "Request failed."
  const validation = message.includes("integer") || message.includes("required") || message.includes("Invalid")
  return NextResponse.json({ error: { message }, success: false }, { status: validation ? 422 : 500 })
}
