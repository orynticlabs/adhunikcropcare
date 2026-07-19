import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { getOryCMSDatabaseHealth } from "@/lib/orycms/database-health"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await getOryCMSDatabaseHealth() })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
        { status: error.status },
      )
    }
    return NextResponse.json(
      { success: false, error: { code: "DATABASE_HEALTH_ERROR", message: error instanceof Error ? error.message : "Failed to load database health." } },
      { status: 500 },
    )
  }
}
