import { orycmsPrisma } from "@/lib/orycms/prisma"

export type ProductReview = {
  id: string
  productSlug: string
  name: string
  email: string
  stars: number
  title: string
  body: string
  verified: boolean
  date: string
  createdAt: string
}

export type ReviewBreakdownItem = {
  stars: number
  count: number
  percentage: number
}

export type ProductReviewSummary = {
  averageRating: number
  totalReviews: number
  breakdown: ReviewBreakdownItem[]
  reviews: ProductReview[]
}

const memoryReviewsStore: Record<string, ProductReview[]> = {}
const summaryCache: Map<string, { data: ProductReviewSummary; timestamp: number }> = new Map()
let topReviewsCache: { data: ProductReview[]; timestamp: number } | null = null
const CACHE_TTL_MS = 30_000 // 30 seconds cache for lightning fast responses

export function invalidateReviewCaches(productSlug?: string) {
  topReviewsCache = null
  if (productSlug) {
    summaryCache.delete(productSlug)
  } else {
    summaryCache.clear()
  }
}

export async function getProductReviewSummary(productSlug: string): Promise<ProductReviewSummary> {
  const cached = summaryCache.get(productSlug)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  let reviews: ProductReview[] = []

  try {
    const dbReviews = await orycmsPrisma.$queryRaw<
      Array<{
        id: string
        product_slug: string
        user_id: string
        first_name: string | null
        last_name: string | null
        rating: number
        title: string
        comment: string
        verified: boolean
        created_at: Date
      }>
    >`
      SELECT
        r.id,
        r.product_slug,
        r.user_id,
        r.rating,
        r.title,
        r.comment,
        r.verified,
        r.created_at,
        u.first_name,
        u.last_name
      FROM storefront_product_reviews r
      JOIN storefront_users u ON r.user_id = u.id
      WHERE r.product_slug = ${productSlug}
      ORDER BY r.created_at DESC
    `

    reviews = dbReviews.map((r) => ({
      id: r.id,
      productSlug: r.product_slug,
      name: [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || "Verified Farmer",
      email: "",
      stars: Math.min(5, Math.max(1, Math.round(Number(r.rating)))),
      title: r.title,
      body: r.comment,
      verified: Boolean(r.verified),
      date: new Date(r.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      createdAt: new Date(r.created_at).toISOString(),
    }))
  } catch {
    // If DB query fails or table structure is changing, fallback to in-memory store
    reviews = memoryReviewsStore[productSlug] ?? []
  }

  const totalReviews = reviews.length
  let averageRating = 0
  const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

  if (totalReviews > 0) {
    let sum = 0
    for (const rev of reviews) {
      sum += rev.stars
      const s = Math.min(5, Math.max(1, Math.round(rev.stars)))
      starCounts[s] = (starCounts[s] ?? 0) + 1
    }
    averageRating = Math.round((sum / totalReviews) * 10) / 10
  }

  const breakdown: ReviewBreakdownItem[] = [5, 4, 3, 2, 1].map((stars) => {
    const count = starCounts[stars] ?? 0
    return {
      stars,
      count,
      percentage: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0,
    }
  })

  const summary: ProductReviewSummary = {
    averageRating,
    totalReviews,
    breakdown,
    reviews,
  }

  summaryCache.set(productSlug, { data: summary, timestamp: Date.now() })
  return summary
}

export async function addProductReview(input: {
  productSlug: string
  userId: string
  rating: number
  title?: string
  comment: string
}): Promise<ProductReview> {
  const stars = Math.min(5, Math.max(1, Math.round(input.rating)))
  const title = (input.title ?? "").trim() || `${stars} Star Review`
  const comment = input.comment.trim()

  let reviewerName = "Verified Farmer"
  try {
    const userRows = await orycmsPrisma.$queryRaw<Array<{ first_name: string; last_name: string }>>`
      SELECT first_name, last_name FROM storefront_users WHERE id = ${input.userId}::uuid LIMIT 1
    `
    if (userRows[0]) {
      reviewerName = [userRows[0].first_name, userRows[0].last_name].filter(Boolean).join(" ").trim() || reviewerName
    }
  } catch {
    // Ignore user lookup error if table fallback is used
  }

  const newReview: ProductReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productSlug: input.productSlug,
    name: reviewerName,
    email: "",
    stars,
    title,
    body: comment,
    verified: true,
    date: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    createdAt: new Date().toISOString(),
  }

  try {
    await orycmsPrisma.$executeRaw`
      INSERT INTO storefront_product_reviews
        (product_slug, user_id, rating, title, comment, verified)
      VALUES
        (${input.productSlug}, ${input.userId}::uuid, ${stars}, ${title}, ${comment}, true)
    `
  } catch {
    // Fallback to in-memory store if table is missing in live DB
    if (!memoryReviewsStore[input.productSlug]) {
      memoryReviewsStore[input.productSlug] = []
    }
    memoryReviewsStore[input.productSlug].unshift(newReview)
  }

  invalidateReviewCaches(input.productSlug)
  return newReview
}

export async function getTopProductReviews(limit = 10): Promise<ProductReview[]> {
  if (topReviewsCache && Date.now() - topReviewsCache.timestamp < CACHE_TTL_MS) {
    return topReviewsCache.data.slice(0, limit)
  }

  try {
    const dbReviews = await orycmsPrisma.$queryRaw<
      Array<{
        id: string
        product_slug: string
        user_id: string
        first_name: string | null
        last_name: string | null
        rating: number
        title: string
        comment: string
        verified: boolean
        created_at: Date
      }>
    >`
      SELECT
        r.id,
        r.product_slug,
        r.user_id,
        r.rating,
        r.title,
        r.comment,
        r.verified,
        r.created_at,
        u.first_name,
        u.last_name
      FROM storefront_product_reviews r
      JOIN storefront_users u ON r.user_id = u.id
      ORDER BY r.rating DESC, r.created_at DESC
      LIMIT ${limit}
    `

    if (dbReviews.length > 0) {
      const formatted = dbReviews.map((r) => ({
        id: r.id,
        productSlug: r.product_slug,
        name: [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || "Verified Farmer",
        email: "",
        stars: Math.min(5, Math.max(1, Math.round(Number(r.rating)))),
        title: r.title,
        body: r.comment,
        verified: Boolean(r.verified),
        date: new Date(r.created_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        createdAt: new Date(r.created_at).toISOString(),
      }))

      topReviewsCache = { data: formatted, timestamp: Date.now() }
      return formatted
    }
  } catch {
    const allMemoryReviews = Object.values(memoryReviewsStore).flat()
    if (allMemoryReviews.length > 0) {
      const formatted = allMemoryReviews
        .sort((a, b) => b.stars - a.stars || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)

      topReviewsCache = { data: formatted, timestamp: Date.now() }
      return formatted
    }
  }

  return []
}
