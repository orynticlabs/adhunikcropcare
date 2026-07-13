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
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    if (gallery.length <= 1) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % gallery.length)
    }, 3000)

    return () => window.clearInterval(timer)
  }, [gallery])

  return (
    <article
      className={`group overflow-hidden rounded-[1.9rem] border border-[#e7ddd1] bg-[#fbf8f2] shadow-[0_10px_30px_rgba(61,43,31,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(61,43,31,0.14)] ${className}`}
    >
      <Link href={href} className="relative block aspect-square overflow-hidden bg-[#e7d2b5]" aria-label={`View ${name}`}>
        <Image
          src={gallery[activeImage % gallery.length] ?? image}
          alt={name}
          fill
          sizes={imageSizes}
          className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(38,24,14,0.16)] via-transparent to-transparent" />

        {overlayLabel ? (
          <div className="absolute right-3 top-3 rounded-full bg-[rgba(251,248,242,0.2)] px-3 py-1 text-[11px] font-semibold text-white shadow-sm ring-1 ring-white/25 backdrop-blur-md">
            {overlayLabel}
          </div>
        ) : null}

        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-[rgba(251,248,242,0.95)] px-2.5 py-1 text-xs font-medium text-[#173c31] shadow-sm ring-1 ring-[rgba(61,43,31,0.08)] backdrop-blur-sm">
          <span>{rating.toFixed(1)}</span>
          <Star className="h-3.5 w-3.5 fill-[#1d6b57] text-[#1d6b57]" />
          <span className="text-[#947f69]">| {reviews}</span>
        </div>
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
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#0d5a48] px-4.5 text-sm font-semibold text-white transition-colors hover:bg-[#084838] hover:text-white"
            >
              View Product
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
