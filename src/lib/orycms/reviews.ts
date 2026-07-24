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

export async function getProductReviewSummary(productSlug: string): Promise<ProductReviewSummary> {
  let reviews: ProductReview[] = []

  try {
    const dbReviews = await orycmsPrisma.$queryRaw<
      Array<{
        id: string
        product_slug: string
        reviewer_name: string
        reviewer_email: string
        rating: number
        title: string
        comment: string
        verified: boolean
        created_at: Date
      }>
    >`
      SELECT * FROM storefront_product_reviews
      WHERE product_slug = ${productSlug}
      ORDER BY created_at DESC
    `

    reviews = dbReviews.map((r) => ({
      id: r.id,
      productSlug: r.product_slug,
      name: r.reviewer_name,
      email: r.reviewer_email,
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
    // If DB table doesn't exist yet, fallback to in-memory store
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

  return {
    averageRating,
    totalReviews,
    breakdown,
    reviews,
  }
}

export async function checkProductOrderVerification(email: string, productSlug: string): Promise<boolean> {
  if (!email || !email.trim()) return false
  try {
    const orders = await orycmsPrisma.storefrontOrder.findMany({
      where: {
        OR: [
          { contact: { path: ["email"], equals: email.trim().toLowerCase() } },
          { shippingAddress: { path: ["email"], equals: email.trim().toLowerCase() } },
        ],
      },
      select: { items: true, status: true, paymentStatus: true },
    })

    return orders.some((order) => {
      if (Array.isArray(order.items)) {
        return order.items.some((item) => {
          if (item && typeof item === "object" && !Array.isArray(item)) {
            const record = item as Record<string, unknown>
            return record.slug === productSlug || record.id === productSlug
          }
          return false
        })
      }
      return false
    })
  } catch {
    return false
  }
}

export async function addProductReview(input: {
  productSlug: string
  reviewerName: string
  reviewerEmail: string
  rating: number
  title: string
  comment: string
  verified?: boolean
}): Promise<ProductReview> {
  const stars = Math.min(5, Math.max(1, Math.round(input.rating)))
  const name = input.reviewerName.trim() || "Anonymous Farmer"
  const email = input.reviewerEmail.trim().toLowerCase()
  const title = input.title.trim()
  const comment = input.comment.trim()
  let verified = Boolean(input.verified)

  if (!verified && email) {
    verified = await checkProductOrderVerification(email, input.productSlug)
  }

  const newReview: ProductReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productSlug: input.productSlug,
    name,
    email,
    stars,
    title,
    body: comment,
    verified,
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
        (product_slug, reviewer_name, reviewer_email, rating, title, comment, verified)
      VALUES
        (${input.productSlug}, ${name}, ${email}, ${stars}, ${title}, ${comment}, ${verified})
    `
  } catch {
    // Fallback to in-memory store if table is missing in live DB
    if (!memoryReviewsStore[input.productSlug]) {
      memoryReviewsStore[input.productSlug] = []
    }
    memoryReviewsStore[input.productSlug].unshift(newReview)
  }

  return newReview
}

export async function getTopProductReviews(limit = 10): Promise<ProductReview[]> {
  try {
    const dbReviews = await orycmsPrisma.$queryRaw<
      Array<{
        id: string
        product_slug: string
        reviewer_name: string
        reviewer_email: string
        rating: number
        title: string
        comment: string
        verified: boolean
        created_at: Date
      }>
    >`
      SELECT * FROM storefront_product_reviews
      ORDER BY rating DESC, created_at DESC
      LIMIT ${limit}
    `

    if (dbReviews.length > 0) {
      return dbReviews.map((r) => ({
        id: r.id,
        productSlug: r.product_slug,
        name: r.reviewer_name,
        email: r.reviewer_email,
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
    }
  } catch {
    const allMemoryReviews = Object.values(memoryReviewsStore).flat()
    if (allMemoryReviews.length > 0) {
      return allMemoryReviews
        .sort((a, b) => b.stars - a.stars || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)
    }
  }

  return []
}
