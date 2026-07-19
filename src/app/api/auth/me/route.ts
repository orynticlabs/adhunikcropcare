import { NextResponse } from "next/server"
import { currentUser } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function GET() {
  const user = await currentUser()
  return NextResponse.json({ success: true, data: { user } })
}
