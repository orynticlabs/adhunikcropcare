"use client"

import { useEffect, useState } from "react"
import { Leaf } from "lucide-react"
import TestimonialsCarousel from "@/components/home/testimonials-carousel"
import type { ProductReview } from "@/lib/orycms/reviews"

import { ReviewCardSkeleton } from "@/components/ui/skeleton"

export default function FarmersNotCustomersSection() {
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true
    fetch("/api/reviews/top")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data.reviews)) {
          setReviews(data.reviews.slice(0, 10))
        }
      })
      .catch(() => {
        if (isMounted) setReviews([])
      })
      .finally(() => {
        if (isMounted) setLoaded(true)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // If loading finished and 0 reviews exist in DB, hide section completely
  if (loaded && reviews.length === 0) {
    return null
  }

  return (
    <section className="relative overflow-hidden py-12 sm:py-16 bg-gradient-to-b from-accent/20 to-transparent">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mx-auto max-w-2xl mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[#033927]">
            <Leaf className="h-3 w-3" aria-hidden /> Voices from the field
          </div>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight">
            Farmers, not customers.
          </h2>
        </div>

        {!loaded ? <ReviewCardSkeleton count={3} /> : <TestimonialsCarousel reviews={reviews} />}
      </div>
    </section>
  )
}

