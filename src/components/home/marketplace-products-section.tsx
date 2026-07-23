"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight, Leaf } from "lucide-react"
import { ProductCard } from "@/components/products/product-card"
import {
  ensureProductImages,
  productPrimaryImage,
  type OryCMSProductDTO,
} from "@/lib/orycms/product-utils"

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

export function MarketplaceProductsSection({
  products,
}: {
  products: OryCMSProductDTO[]
}) {
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

  return (
    <section id="marketplace" className="relative py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[#033927]">
              <Leaf className="h-3 w-3" aria-hidden /> Marketplace
            </div>
            <h2 className="mt-4 sm:mt-5 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.1] tracking-tight">
              Trusted by farmers, loved for results.
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-input bg-white text-black shadow-sm transition-colors hover:border-[#689c30] hover:bg-[#689c30] hover:!text-black active:scale-95"
              aria-label="Previous products"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-input bg-white text-black shadow-sm transition-colors hover:border-[#689c30] hover:bg-[#689c30] hover:!text-black active:scale-95"
              aria-label="Next products"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="mx-0 sm:-mx-4 mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-5 scrollbar-none sm:mt-10 sm:gap-5 sm:pb-6 scroll-smooth"
        >
          {products.length > 0 ? (
            products.map((p) => {
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
                  reviews={120}
                  rating={4.8}
                  className="w-[calc(100vw-4rem)] max-w-[20rem] basis-[calc(100vw-4rem)] flex-shrink-0 snap-start sm:w-[20rem] sm:basis-[20rem]"
                  imageSizes="(max-width: 640px) 75vw, 320px"
                />
              )
            })
          ) : (
            <div className="min-w-full rounded-3xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
              Publish products from OryCMS to show marketplace items here.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
