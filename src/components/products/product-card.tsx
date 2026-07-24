"use client"

import { useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"
import { WishlistHeartButton } from "@/features/wishlist/wishlist-heart-button"

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
  rating = 4.8,
  reviews = 199,
  className = "",
  imageSizes = "(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) calc(50vw - 2rem), (max-width: 1279px) calc(33vw - 1.5rem), 300px",
  slug,
}: ProductCardProps) {
  const supportingLine = buildSubtitle(badge, subtitle)
  const gallery = useMemo(() => (images && images.length > 0 ? images : [image]), [image, images])
  const productSlug = slug ?? href.match(/^\/products\/([^/?#]+)/)?.[1]

  return (
    <article
      className={`group relative flex h-full min-h-[28rem] w-full flex-col overflow-hidden rounded-2xl border border-[#e2e7df] bg-white shadow-sm transition-all duration-200 hover:border-[#b9cdb3] hover:shadow-md ${className}`}
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
          <div className="absolute left-3 top-3 z-10 rounded-full border border-[#d7e0da] bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-[#173c31] shadow-sm">
            {overlayLabel}
          </div>
        ) : null}

        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md border border-[#d7e0da] bg-white/95 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-[#173c31] shadow-sm">
          <span>{rating.toFixed(1)}</span>
          <Star className="h-3.5 w-3.5 fill-[#1d6b57] text-[#1d6b57]" />
          <span className="text-[#947f69]">| {reviews}</span>
        </div>
        {gallery.length > 1 ? (
          <div className="absolute bottom-3 right-3 flex gap-1">
            {gallery.slice(0, 4).map((_, index) => (
              <span
                key={index}
                className={`h-1.5 w-1.5 rounded-full border border-[#b9cdb3] ${index === 0 ? "bg-[#0d5a48]" : "bg-white"}`}
              />
            ))}
          </div>
        ) : null}
      </Link>
      {productSlug ? <WishlistHeartButton slug={productSlug} /> : null}

      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
        <div className="h-[3.25rem] flex items-start overflow-hidden">
          <Link
            href={href}
            className="block font-display text-base sm:text-lg font-bold leading-snug tracking-[-0.01em] text-[#171717] transition-colors group-hover:text-[#689c30]"
          >
            <span className="line-clamp-2 break-words">{name}</span>
          </Link>
        </div>

        <div className="mt-1.5 h-[2.75rem] overflow-hidden">
          <p className="line-clamp-2 text-xs sm:text-sm leading-snug sm:leading-snug text-[#66584a]">
            {supportingLine}
          </p>
        </div>

        <div className="mt-auto pt-3 border-t border-border/40 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate font-sans text-base sm:text-lg font-bold leading-none text-[#171717]">
              {price}
            </div>
            <div className="mt-1 h-4">
              {originalPrice ? (
                <span className="text-xs font-medium text-[#908272] line-through decoration-[#b8a48f] decoration-[1.5px]">
                  {originalPrice}
                </span>
              ) : null}
            </div>
          </div>

          <Link
            href={href}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-[#033927] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#689c30] hover:!text-black"
          >
            View Product
          </Link>
        </div>
      </div>
    </article>
  )
}
