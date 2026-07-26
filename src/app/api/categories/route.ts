import { NextResponse } from "next/server"
import { listOryCMSCategories } from "@/lib/orycms/categories"

export const runtime = "nodejs"

export async function GET() {
  try {
    const categories = await listOryCMSCategories({ activeOnly: true })
    return NextResponse.json(
      { success: true, data: categories.map(({ id, name, slug }) => ({ id, name, slug })) },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } },
    )
  } catch {
    return NextResponse.json({ success: true, data: [] })
  }
}
