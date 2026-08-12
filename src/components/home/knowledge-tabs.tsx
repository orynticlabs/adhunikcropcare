"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronLeft, ChevronRight, Leaf, Sprout } from "lucide-react"
import { ProductCard } from "@/components/products/product-card"
import {
  ensureProductImages,
  productPrimaryImage,
  type OryCMSProductDTO,
} from "@/lib/orycms/product-utils"

type Season = "Kharif" | "Rabi" | "Zaid"

const SEASONS: Season[] = ["Kharif", "Rabi", "Zaid"]

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount)
}

function comparePrice(price: number) {
  return formatINR(Math.round(price * 1.15))
}

export default function KnowledgeTabs({
  products = [],
}: {
  products?: OryCMSProductDTO[]
}) {
  const [active, setActive] = useState<Season>("Kharif")
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const scrollAmount = container.clientWidth * 0.75
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
  }

  const seasonProducts = products.filter(
    (p) => p.seasonalCategory?.toLowerCase() === active.toLowerCase(),
  )

  return (
    <div className="mt-7">
      {/* Tab bar */}
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-1.5 rounded-full bg-background/80 p-1.5 shadow-sm border border-border/50 h-12">
        {SEASONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActive(s)}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-all duration-200 cursor-pointer select-none ${
              active === s
                ? "bg-[#033927] text-white shadow-md"
                : "text-foreground/75 hover:text-[#033927] hover:bg-accent/40"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Dynamic Products Carousel & Controls */}
      <div className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <div className="text-left">
            <h3 className="font-display text-2xl sm:text-3xl text-foreground font-bold">
              {active} Season Products
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Specially selected crop care formulations recommended for {active} season farming
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-input bg-white text-black shadow-xs transition-colors hover:border-[#689c30] hover:bg-[#689c30] hover:!text-black cursor-pointer select-none"
              aria-label={`Previous ${active} products`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-input bg-white text-black shadow-xs transition-colors hover:border-[#689c30] hover:bg-[#689c30] hover:!text-black cursor-pointer select-none"
              aria-label={`Next ${active} products`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="mx-0 sm:-mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-5 scrollbar-none sm:gap-5 scroll-smooth"
        >
          {seasonProducts.length > 0 ? (
            seasonProducts.map((p) => {
              const price = p.salePrice ?? p.price

              return (
                <ProductCard
                  key={p.id}
                  slug={p.slug}
                  href={`/products/${p.slug}`}
                  name={p.name}
                  image={productPrimaryImage(p)}
                  images={ensureProductImages(p).map((image) => image.url)}
                  overlayLabel={p.category}
                  price={formatINR(price)}
                  originalPrice={comparePrice(price)}
                  badge={p.featured ? "Featured" : p.category}
                  subtitle={p.shortDescription}
                  className="w-[calc(100vw-4rem)] max-w-[20rem] basis-[calc(100vw-4rem)] flex-shrink-0 snap-start sm:w-[20rem] sm:basis-[20rem]"
                  imageSizes="(max-width: 640px) 75vw, 320px"
                />
              )
            })
          ) : (
            <div className="min-w-full rounded-3xl border border-dashed border-border bg-card/80 p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#689c30]/10 mb-3">
                <Sprout className="h-6 w-6 text-[#689c30]" />
              </div>
              <p className="text-sm font-medium">No published products listed under {active} season yet.</p>
            </div>
          )}
        </div>

        {/* Redirect CTA to products page with season filter preselected */}
        <div className="mt-6 text-center">
          <Link
            href={`/products?season=${active}`}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[#033927] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#689c30] hover:!text-black cursor-pointer select-none shadow-xs"
          >
            View All {active} Products <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  )
}
