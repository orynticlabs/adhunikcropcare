import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { listOryCMSOrders } from "@/lib/orycms/orders"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await listOryCMSOrders() })
  } catch (error) {
    return ordersError(error, "Failed to load orders.")
  }
}

function ordersError(error: unknown, fallback: string) {
  if (error instanceof Response) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: error.status },
    )
  }

  return NextResponse.json(
    { success: false, error: { code: "ORDERS_ERROR", message: error instanceof Error ? error.message : fallback } },
    { status: 500 },
  )
}
