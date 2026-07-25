import { NextResponse } from "next/server"
import { isOryCMSSetupComplete } from "@/lib/orycms/setup"

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: { initialized: await isOryCMSSetupComplete() },
    })
  } catch (error) {
    console.error("OryCMS setup status error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SETUP_STATUS_FAILED", message: "Unable to check setup status." } },
      { status: 500 },
    )
  }
}
