import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { packOryCMSOrder } from "@/lib/orycms/orders"

export const runtime = "nodejs"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireOryCMSUser(request)
    const result = await packOryCMSOrder((await params).id, user)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: error.status })
    }
    return NextResponse.json(
      { success: false, error: { code: "PACK_ERROR", message: error instanceof Error ? error.message : "Failed to mark order as packed." } },
      { status: error instanceof Error ? 400 : 500 },
    )
  }
}
