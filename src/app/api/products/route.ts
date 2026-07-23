import { NextResponse } from "next/server"
import { listOryCMSProducts } from "@/lib/orycms/products"

export const runtime = "nodejs"

const CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=600"

export async function GET() {
  try {
    return NextResponse.json(
      { success: true, data: await listOryCMSProducts({ publishedOnly: true }) },
      { headers: { "Cache-Control": CACHE_CONTROL } },
    )
  } catch {
    return NextResponse.json({ success: true, data: [] }, { headers: { "Cache-Control": "no-store" } })
  }
}
