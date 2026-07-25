import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { addProductReview, getProductReviewSummary } from "@/lib/orycms/reviews"
import { checkRateLimit } from "@/lib/rate-limit"
import { currentUser } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  if (!slug) {
    return NextResponse.json({ success: false, error: { message: "Invalid product slug." } }, { status: 400 })
  }

  try {
    const summary = await getProductReviewSummary(slug)
    return NextResponse.json(
      { success: true, data: summary },
      {
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
        },
      }
    )
  } catch {
    return NextResponse.json({
      success: true,
      data: { averageRating: 0, totalReviews: 0, breakdown: [], reviews: [] },
    })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { allowed } = await checkRateLimit("review-submit", 5, 300_000)
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: { message: "Too many review submissions. Please wait a few minutes." } },
      { status: 429 }
    )
  }

  const user = await currentUser()
  if (!user) {
    return NextResponse.json(
      { success: false, error: { message: "You must be logged in to submit a review." } },
      { status: 401 }
    )
  }

  const { slug } = await params
  if (!slug) {
    return NextResponse.json({ success: false, error: { message: "Invalid product slug." } }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { rating, title, comment } = body

    if (!comment || typeof comment !== "string" || !comment.trim()) {
      return NextResponse.json({ success: false, error: { message: "Please enter your review comment." } }, { status: 400 })
    }

    const numRating = Number(rating)
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json({ success: false, error: { message: "Please select a valid rating (1 to 5 stars)." } }, { status: 400 })
    }

    const review = await addProductReview({
      productSlug: slug,
      userId: user.id,
      rating: Math.round(numRating),
      title: title && typeof title === "string" ? title : "",
      comment,
    })

    const updatedSummary = await getProductReviewSummary(slug)

    return NextResponse.json({
      success: true,
      data: { review, summary: updatedSummary },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit review."
    return NextResponse.json({ success: false, error: { message } }, { status: 500 })
  }
}
