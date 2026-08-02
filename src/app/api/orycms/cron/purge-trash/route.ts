import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { purgeExpiredTrashOryCMSProducts } from "@/lib/orycms/products"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  return handlePurge(request)
}

export async function POST(request: NextRequest) {
  return handlePurge(request)
}

async function handlePurge(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid cron secret." } },
        { status: 401 },
      )
    }

    const days = Number(request.nextUrl.searchParams.get("days")) || 60
    const purgedCount = await purgeExpiredTrashOryCMSProducts(days)

    return NextResponse.json({
      success: true,
      message: `Successfully purged ${purgedCount} products soft-deleted more than ${days} days ago.`,
      purgedCount,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to purge expired trash items."
    return NextResponse.json({ success: false, error: { code: "PURGE_ERROR", message } }, { status: 500 })
  }
}
