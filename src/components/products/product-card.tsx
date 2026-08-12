"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"

type ProductCardProps = {
  href: string
  name: string
  image: string
  images?: string[]
  overlayLabel?: string
  price: string
  originalPrice?: string
  badge?: string
  subtitle?: string
  rating?: number
  reviews?: number
  className?: string
  imageSizes?: string
  slug?: string
}

function buildSubtitle(badge?: string, subtitle?: string) {
  if (subtitle) {
    return subtitle
  }

  if (badge) {
    return `${badge} pick for healthier crop performance`
  }

  return "Farmer-trusted input for reliable field results"
}

export function ProductCard({
  href,
  name,
  image,
  images,
  overlayLabel,
  price,
  originalPrice,
  badge,
  subtitle,
  rating,
  reviews,
  className = "",
  imageSizes = "(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) calc(50vw - 2rem), (max-width: 1279px) calc(33vw - 1.5rem), 300px",
  slug,
}: ProductCardProps) {
  const supportingLine = buildSubtitle(badge, subtitle)
  const gallery = useMemo(() => (images && images.length > 0 ? images : [image]), [image, images])

  const [liveRating, setLiveRating] = useState<number | undefined>(rating)
  const [liveReviews, setLiveReviews] = useState<number | undefined>(reviews)

  useEffect(() => {
    if (typeof rating === "number" && typeof reviews === "number") {
      setLiveRating(rating)
      setLiveReviews(reviews)
      return
    }

    const targetSlug = slug || (href.startsWith("/products/") ? href.replace("/products/", "").split("/")[0] : "")
    if (!targetSlug) {
      setLiveRating(0)
      setLiveReviews(0)
      return
    }

    let isMounted = true
    fetch(`/api/products/${encodeURIComponent(targetSlug)}/reviews`)
      .then((res) => res.json())
      .then((json) => {
        if (isMounted) {
          if (json.success && json.data) {
            setLiveRating(json.data.averageRating || 0)
            setLiveReviews(json.data.totalReviews || 0)
          } else {
            setLiveRating(0)
            setLiveReviews(0)
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setLiveRating(0)
          setLiveReviews(0)
        }
      })

    return () => {
      isMounted = false
    }
  }, [href, rating, reviews, slug])

  const currentRating = liveRating ?? rating ?? 0
  const currentReviews = liveReviews ?? reviews ?? 0
  const showReviewBadge = currentReviews > 0 && currentRating > 0

  return (
    <article
      className={`group relative flex h-full min-h-[21rem] sm:min-h-[28rem] w-full flex-col overflow-hidden rounded-2xl border border-[#e2e7df] bg-white shadow-sm transition-all duration-200 hover:border-[#b9cdb3] hover:shadow-md ${className}`}
    >
      <Link href={href} className="relative block aspect-square shrink-0 overflow-hidden bg-white" aria-label={`View ${name}`}>
        <Image
          src={gallery[0] ?? image}
          alt={name}
          fill
          sizes={imageSizes}
          className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.05]"
        />

        {overlayLabel ? (
          <div className="absolute left-2.5 top-2.5 sm:left-3 sm:top-3 z-10 rounded-full border border-[#d7e0da] bg-white/95 backdrop-blur-sm px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold text-[#173c31] shadow-sm">
            {overlayLabel}
          </div>
        ) : null}

        {showReviewBadge ? (
          <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 inline-flex items-center gap-1 sm:gap-1.5 rounded-md border border-[#d7e0da] bg-white/95 backdrop-blur-sm px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-medium text-[#173c31] shadow-sm">
            <span>{currentRating.toFixed(1)}</span>
            <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-[#1d6b57] text-[#1d6b57]" />
            <span className="text-[#947f69]">| {currentReviews}</span>
          </div>
        ) : null}

        {gallery.length > 1 ? (
          <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 flex gap-1">
            {gallery.slice(0, 4).map((_, index) => (
              <span
                key={index}
                className={`h-1.5 w-1.5 rounded-full border border-[#b9cdb3] ${index === 0 ? "bg-[#0d5a48]" : "bg-white"}`}
              />
            ))}
          </div>
        ) : null}
      </Link>

      <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-5">
        <div className="h-[2.6rem] sm:h-[3.25rem] flex items-start overflow-hidden">
          <Link
            href={href}
            className="block font-display text-sm sm:text-lg font-bold leading-tight sm:leading-snug tracking-[-0.01em] text-[#171717] transition-colors group-hover:text-[#689c30]"
          >
            <span className="line-clamp-2 break-words">{name}</span>
          </Link>
        </div>

        <div className="mt-1 h-[2.25rem] sm:h-[2.75rem] overflow-hidden">
          <p className="line-clamp-2 text-[11px] sm:text-sm leading-tight sm:leading-snug text-[#66584a]">
            {supportingLine}
          </p>
        </div>

        <div className="mt-auto pt-2.5 sm:pt-3 border-t border-border/40 flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate font-sans text-sm sm:text-lg font-bold leading-none text-[#171717]">
              {price}
            </div>
            <div className="mt-0.5 sm:mt-1 h-3.5 sm:h-4">
              {originalPrice ? (
                <span className="text-[10px] sm:text-xs font-medium text-[#908272] line-through decoration-[#b8a48f] decoration-[1.5px]">
                  {originalPrice}
                </span>
              ) : null}
            </div>
          </div>

          <Link
            href={href}
            className="inline-flex h-8 sm:h-9 shrink-0 items-center justify-center rounded-full bg-[#033927] px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-semibold text-white transition-colors hover:bg-[#689c30] hover:!text-black cursor-pointer select-none"
          >
            View Product
          </Link>
        </div>
      </div>
    </article>
  )
}
