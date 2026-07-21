import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { listSettlements } from "@/lib/orycms/payments"
import { syncSettlements } from "@/lib/orycms/payments-sync"
import { paymentsError } from "@/lib/orycms/payments-http"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await listSettlements() })
  } catch (error) {
    return paymentsError(error, "Failed to load settlements.")
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const result = await syncSettlements()
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return paymentsError(error, "Failed to sync settlements.")
  }
}
