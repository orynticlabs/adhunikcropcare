import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { getOryCMSAnalyticsInsights } from "@/lib/orycms/analytics-insights"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const url = new URL(request.url)
    return NextResponse.json({
      success: true,
      data: await getOryCMSAnalyticsInsights({
        from: url.searchParams.get("from"),
        range: url.searchParams.get("range"),
        to: url.searchParams.get("to"),
      }),
    })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
        { status: error.status },
      )
    }
    return NextResponse.json(
      { success: false, error: { code: "ANALYTICS_ERROR", message: error instanceof Error ? error.message : "Failed to load analytics." } },
      { status: 500 },
    )
  }
}
