import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { listOryCMSProducts } from "@/lib/orycms/products"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const products = await listOryCMSProducts()
    return NextResponse.json({ success: true, data: products })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : "Failed to load products." },
      },
      { status: 500 }
    )
  }
}
