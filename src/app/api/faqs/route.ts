import { NextResponse } from "next/server"
import { listOryCMSFaqs } from "@/lib/orycms/faqs"

export const runtime = "nodejs"

export async function GET() {
  try {
    const faqs = await listOryCMSFaqs({ publishedOnly: true })
    return NextResponse.json(
      { success: true, data: faqs },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    )
  } catch (error) {
    console.error("Error in GET /api/faqs:", error)
    return NextResponse.json({ success: true, data: [] })
  }
}
