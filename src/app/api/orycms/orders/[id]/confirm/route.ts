import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { confirmOryCMSOrder } from "@/lib/orycms/orders"

export const runtime = "nodejs"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireOryCMSUser(request)
    const result = await confirmOryCMSOrder((await params).id, user)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return confirmError(error, "Failed to confirm order.")
  }
}

function confirmError(error: unknown, fallback: string) {
  if (error instanceof Response) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: error.status },
    )
  }
  return NextResponse.json(
    { success: false, error: { code: "CONFIRM_ERROR", message: error instanceof Error ? error.message : fallback } },
    { status: error instanceof Error ? 400 : 500 },
  )
}
