"use client"

import { useMemo } from "react"
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
  imageSizes = "(max-width: 640px) 100vw, 33vw",
}: ProductCardProps) {
  const supportingLine = buildSubtitle(badge, subtitle)
  const gallery = useMemo(() => (images && images.length > 0 ? images : [image]), [image, images])

  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-[#e2e7df] bg-white shadow-sm transition-colors duration-200 hover:border-[#b9cdb3] hover:shadow-md ${className}`}
    >
      <Link href={href} className="relative block aspect-square overflow-hidden bg-white" aria-label={`View ${name}`}>
        <Image
          src={gallery[0] ?? image}
          alt={name}
          fill
          sizes={imageSizes}
          className="object-contain object-center p-4"
        />

        {overlayLabel ? (
          <div className="absolute right-3 top-3 rounded-full border border-[#d7e0da] bg-white px-3 py-1 text-[11px] font-semibold text-[#173c31]">
            {overlayLabel}
          </div>
        ) : null}

        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md border border-[#d7e0da] bg-white px-2.5 py-1 text-xs font-medium text-[#173c31]">
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

      <div className="space-y-4 px-4 pb-4 pt-5 sm:px-5 sm:pb-5">
        <div className="space-y-1.5">
          <Link
            href={href}
            className="block font-display text-[1.55rem] leading-[1.05] tracking-[-0.02em] text-[#171717] transition-colors group-hover:text-[#171717]"
          >
            <span className="line-clamp-2">{name}</span>
          </Link>
        </div>

        <div className="space-y-3.5">
          <p className="line-clamp-2 pr-2 text-[0.98rem] leading-5 text-[#66584a]">
            {supportingLine}
          </p>

          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="min-w-0 flex-1">
              <div className="font-sans text-[1.65rem] font-semibold leading-none text-[#171717]">
                {price}
              </div>
              {originalPrice ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-[#908272] line-through decoration-[#b8a48f] decoration-[1.5px]">
                    {originalPrice}
                  </span>
                </div>
              ) : null}
            </div>

            <Link
              href={href}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#033927] px-4.5 text-sm font-semibold text-white transition-colors hover:bg-[#689c30] hover:!text-black"
            >
              View Product
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
