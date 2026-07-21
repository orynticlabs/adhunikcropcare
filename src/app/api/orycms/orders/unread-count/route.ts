import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { getUnreadOrderCount, markOrdersViewed } from "@/lib/orycms/orders"

export const runtime = "nodejs"

// Live unread-orders count for the sidebar badge.
export async function GET(request: NextRequest) {
  try {
    const user = await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: { count: await getUnreadOrderCount(user.id) } })
  } catch (error) {
    return unreadError(error)
  }
}

// Called when the admin opens the Orders module — clears the badge.
export async function POST(request: NextRequest) {
  try {
    const user = await requireOryCMSUser(request)
    await markOrdersViewed(user.id)
    return NextResponse.json({ success: true, data: { count: 0 } })
  } catch (error) {
    return unreadError(error)
  }
}

function unreadError(error: unknown) {
  if (error instanceof Response) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: error.status })
  }
  return NextResponse.json(
    { success: false, error: { code: "UNREAD_ERROR", message: error instanceof Error ? error.message : "Failed to load unread count." } },
    { status: 500 },
  )
}
