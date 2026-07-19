import { NextResponse } from "next/server"
import { listOryCMSProducts } from "@/lib/orycms/products"

export const runtime = "nodejs"

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: await listOryCMSProducts({ publishedOnly: true }) })
  } catch {
    return NextResponse.json({ success: true, data: [] })
  }
}
