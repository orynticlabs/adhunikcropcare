import { NextResponse } from "next/server"
import { getTopProductReviews } from "@/lib/orycms/reviews"

export async function GET() {
  try {
    const reviews = await getTopProductReviews(10)
    return NextResponse.json(
      { reviews },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    )
  } catch (error) {
    console.error("Error in GET /api/reviews/top:", error)
    return NextResponse.json({ reviews: [] }, { status: 500 })
  }
}
