import { NextResponse } from "next/server"
import { listOryCMSProducts } from "@/lib/orycms/products"

export const runtime = "nodejs"

export async function GET() {
  try {
    const data = await listOryCMSProducts({ publishedOnly: true })
    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } },
    )
  } catch {
    return NextResponse.json({ success: true, data: [] })
  }
}
