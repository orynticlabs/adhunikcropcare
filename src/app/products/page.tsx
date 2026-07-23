"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ChevronRight, Leaf, SlidersHorizontal,
  ChevronDown, X,
} from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import { ProductCard } from "@/components/products/product-card"
import { ProductGridSkeleton } from "@/components/ui/skeleton"
import Header from "@/components/layout/header"
import CartDrawer from "@/features/cart/components/cart-drawer"
import SiteFooter from "@/components/layout/site-footer"
import { formatCurrency } from "@/features/cart/cart-context"
import { matchesSearchQuery } from "@/lib/search"

/* ── Constants ──────────────────────────────────────── */
const CATEGORIES = [
  "All",
  "Fertilizers",
  "Organic",
  "Bio Products",
  "Soil Care",
  "Pest Management",
  "Irrigation",
]

const PRICE_RANGES = [
  { label: "All Prices",        min: 0,    max: Infinity },
  { label: "Under ₹500",       min: 0,    max: 499      },
  { label: "₹500 – ₹1,000",   min: 500,  max: 999      },
  { label: "₹1,000 – ₹3,000", min: 1000, max: 2999     },
  { label: "Above ₹3,000",    min: 3000, max: Infinity  },
]

const SORT_OPTIONS = [
  { label: "Featured",           value: "featured"   },
  { label: "Price: Low to High", value: "price-asc"  },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Top Rated",          value: "rating"     },
]

const CATEGORY_SEARCH_TERMS: Record<string, string> = {
  Fertilizers: "crop fertilizer fertilizers nutrition npk plant growth promoter",
  Organic: "organic products natural compost manure",
  "Bio Products": "bio biological biofertilizer products",
  "Soil Care": "soil care conditioner booster",
  "Pest Management": "pest management pesticide insecticide crop protection neem weedicide",
  Irrigation: "irrigation drip sprinkler water",
}

type StoreProduct = {
  badge: string
  category: string
  defaultSize?: string
  images?: string[]
  img: string
  name: string
  priceValue: number
  rating: number
  reviews: number
  shortDescription?: string
  sizes?: string[]
  slug?: string
}

type CmsProduct = {
  category: string
  featured: boolean
  images: { url: string }[]
  name: string
  packSizes: { price: number; size: string }[]
  price: number
  salePrice: number | null
  shortDescription: string
  slug: string
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function productHref(product: Pick<StoreProduct, "name" | "slug">) {
  return `/products/${product.slug || slugify(product.name)}`
}

function comparePrice(priceValue: number, uplift = 1.22) {
  return formatCurrency(Math.ceil((priceValue * uplift) / 10) * 10)
}

function cmsProductToStoreProduct(product: CmsProduct): StoreProduct {
  const images = product.images.map((image) => image.url).filter(Boolean)
  const priceValue = product.salePrice ?? product.price

  return {
    badge: product.featured ? "Featured" : product.category,
    category: product.category,
    defaultSize: product.packSizes[0]?.size,
    images,
    img: images[0] || "/placeholder.svg",
    name: product.name,
    priceValue,
    rating: 4.8,
    reviews: 120,
    shortDescription: product.shortDescription,
    sizes: product.packSizes.map((pack) => pack.size),
    slug: product.slug,
  }
}

/* ── Page ───────────────────────────────────────────── */
function ProductsPageContent() {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get("q")?.trim() ?? ""
  const [activeCategory, setActiveCategory] = useState("All")
  const [priceRange,    setPriceRange]    = useState(0)
  const [sortBy,        setSortBy]        = useState("featured")
  const [priceOpen,     setPriceOpen]     = useState(false)
  const [sortOpen,      setSortOpen]      = useState(false)
  const [cmsProducts,   setCmsProducts]   = useState<StoreProduct[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  useEffect(() => {
    let alive = true

    fetch("/api/products")
      .then((response) => response.json())
      .then((json) => {
        if (alive && json.success && Array.isArray(json.data)) {
          setCmsProducts(json.data.map(cmsProductToStoreProduct))
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setProductsLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const products = cmsProducts
  const categories = useMemo(
    () => Array.from(new Set([...CATEGORIES, ...products.map((product) => product.category)])),
    [products],
  )
  const filtered = useMemo(() => {
    let result = [...products]
    if (searchQuery) {
      result = result.filter((product) =>
        matchesSearchQuery(searchQuery, [
          product.name,
          product.category,
          product.badge,
          product.sizes?.join(" "),
          CATEGORY_SEARCH_TERMS[product.category],
        ]),
      )
    }
    if (activeCategory !== "All") result = result.filter(p => p.category === activeCategory)
    const { min, max } = PRICE_RANGES[priceRange]
    result = result.filter(p => p.priceValue >= min && p.priceValue <= max)
    if (sortBy === "price-asc")  result.sort((a, b) => a.priceValue - b.priceValue)
    if (sortBy === "price-desc") result.sort((a, b) => b.priceValue - a.priceValue)
    if (sortBy === "rating")     result.sort((a, b) => b.rating - a.rating)
    return result
  }, [activeCategory, priceRange, products, searchQuery, sortBy])

  const activeFiltersCount = (activeCategory !== "All" ? 1 : 0) + (priceRange !== 0 ? 1 : 0)

  function clearFilters() { setActiveCategory("All"); setPriceRange(0) }

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Header />
      <CartDrawer />

      <main>

        {/* ══ Hero Banner ═══════════════════════════════════════════ */}
        <div className="relative h-[430px] overflow-hidden sm:h-[500px] lg:h-[540px]">
          <Image
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&q=90"
            alt="Adhunik Crop Care — golden farmland at sunset"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#033927]/85 via-[#033927]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-background/30" />

          {/* Content — bottom-left aligned */}
          <div className="absolute inset-0 flex flex-col items-start justify-end pb-8 pt-[6.5rem] text-left sm:pb-12 sm:pt-28 lg:pb-16">
            <div className="mx-auto w-full max-w-7xl px-4">

              {/* Breadcrumb */}
              <nav className="mb-3 sm:mb-5 flex items-center gap-1.5 text-xs sm:text-sm text-white/65">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
                <span className="text-white/90 font-medium">All Products</span>
              </nav>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl text-white leading-none tracking-tight">
                Our Products
              </h1>
              <p className="mt-2 sm:mt-3 max-w-xs sm:max-w-md text-white/70 text-sm sm:text-base lg:text-lg leading-relaxed">
                Premium crop nutrition, bio inputs &amp; smart irrigation — trusted by over 7,500 farmers across India.
              </p>

              {/* Stats row */}
              <div className="mt-4 sm:mt-7 flex gap-5 sm:gap-8">
                {[
                  { val: String(products.length), label: "Products"   },
                  { val: String(Math.max(0, categories.length - 1)),   label: "Categories" },
                  { val: "ISO", label: "Certified"  },
                ].map(s => (
                  <div key={s.label}>
                    <div className="font-display text-xl sm:text-2xl text-white">{s.val}</div>
                    <div className="text-[10px] sm:text-[11px] uppercase tracking-widest text-white/50 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ Filter Section ════════════════════════════════════════ */}
        <div className="sticky top-[6.5rem] z-30 border-b border-border/50 bg-background/95 shadow-sm backdrop-blur-md sm:top-28">
          <div className="mx-auto max-w-7xl px-3 sm:px-4">

            {/* Single row: pills scroll inside their own div; controls stay pinned */}
            <div className="flex items-center gap-2 sm:gap-3 py-3">

              {/* Category pills — only this inner element scrolls horizontally */}
              <div className="flex-1 min-w-0 overflow-x-auto scrollbar-none">
                <div className="flex gap-1.5 sm:gap-2 w-max">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`shrink-0 rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                        activeCategory === cat
                          ? "bg-[#033927] text-white shadow-sm"
                          : "border border-border/60 text-foreground/70 bg-background hover:border-[#689c30]/50 hover:text-[#689c30]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-border/60 shrink-0" />

              {/* Controls — outside the scroll container so dropdowns are never clipped */}
              <div className="flex items-center gap-2 shrink-0">

                {/* Price dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setPriceOpen(v => !v); setSortOpen(false) }}
                    className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
                      priceOpen || priceRange !== 0
                        ? "border-[#689c30] bg-[#689c30]/10 text-[#689c30]"
                        : "border-border/60 text-foreground/70 hover:border-[#689c30]/50 hover:text-[#689c30]"
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                    <span className="hidden sm:inline">Price</span>
                    {priceRange !== 0 && <span className="h-1.5 w-1.5 rounded-full bg-[#689c30]" />}
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                  </button>

                  {priceOpen && (
                    <>
                      <div className="fixed inset-0 z-[1]" onClick={() => setPriceOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 z-[2] min-w-[210px] rounded-2xl border border-border/60 bg-popover p-1.5 shadow-sm">
                        {PRICE_RANGES.map((range, i) => (
                          <button
                            key={range.label}
                            type="button"
                            onClick={() => { setPriceRange(i); setPriceOpen(false) }}
                            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                              priceRange === i
                                ? "bg-[#689c30]/10 font-semibold text-[#689c30]"
                                : "text-foreground/80 hover:text-[#689c30]"
                            }`}
                          >
                            {priceRange === i && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#689c30]" />}
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Sort dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setSortOpen(v => !v); setPriceOpen(false) }}
                    className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3.5 py-1.5 text-sm font-medium text-foreground/70 hover:border-[#689c30]/50 hover:text-[#689c30] transition"
                  >
                    <span className="hidden sm:inline">{SORT_OPTIONS.find(s => s.value === sortBy)?.label ?? "Sort"}</span>
                    <span className="sm:hidden">Sort</span>
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                  </button>

                  {sortOpen && (
                    <>
                      <div className="fixed inset-0 z-[1]" onClick={() => setSortOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 z-[2] min-w-[210px] rounded-2xl border border-border/60 bg-popover p-1.5 shadow-sm">
                        {SORT_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => { setSortBy(opt.value); setSortOpen(false) }}
                            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                              sortBy === opt.value
                                ? "bg-[#689c30]/10 font-semibold text-[#689c30]"
                                : "text-foreground/80 hover:text-[#689c30]"
                            }`}
                          >
                            {sortBy === opt.value && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#689c30]" />}
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Clear badge */}
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-100 transition"
                  >
                    <X className="h-3 w-3" aria-hidden />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Active filter tags */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 pb-3">
                {activeCategory !== "All" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#689c30]/20 bg-[#689c30]/10 px-3 py-1 text-xs font-medium text-[#689c30]">
                    {activeCategory}
                    <button type="button" onClick={() => setActiveCategory("All")} aria-label="Remove category filter">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {priceRange !== 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#689c30]/20 bg-[#689c30]/10 px-3 py-1 text-xs font-medium text-[#689c30]">
                    {PRICE_RANGES[priceRange].label}
                    <button type="button" onClick={() => setPriceRange(0)} aria-label="Remove price filter">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ══ Products Grid ══════════════════════════════════════════ */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">

          {/* Result count */}
          <div className="mb-7 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-foreground">{filtered.length}</span>
              {" "}product{filtered.length !== 1 ? "s" : ""}
              {activeCategory !== "All" && (
                <span className="text-[#033927]"> in {activeCategory}</span>
              )}
              {searchQuery && (
                <span className="text-[#033927]"> matching “{searchQuery}”</span>
              )}
            </p>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-[#689c30] transition-colors underline underline-offset-2"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Empty state */}
          {productsLoading ? (
            <ProductGridSkeleton count={8} />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-[#689c30]/8 mb-5">
                <Leaf className="h-10 w-10 text-[#689c30]/40" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-2xl">No published products found</h3>
              <p className="mt-2 text-muted-foreground max-w-xs">
                Publish products from OryCMS to show them on the storefront.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 h-10 rounded-full bg-[#033927] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#689c30] hover:!text-black"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map(p => {
                const price = formatCurrency(p.priceValue)
                return (
                  <ProductCard
                    key={p.slug ?? p.name}
                    href={productHref(p)}
                    name={p.name}
                    image={p.img}
                    images={p.images}
                    price={price}
                    originalPrice={comparePrice(p.priceValue)}
                    badge={p.badge}
                    subtitle={p.shortDescription || `${p.category} solution for better crop outcomes`}
                    rating={p.rating}
                    reviews={p.reviews}
                    imageSizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) calc(50vw - 2rem), (max-width: 1279px) calc(33vw - 1.5rem), 300px"
                  />
                )
              })}
            </div>
          )}
        </div>

      </main>

      <SiteFooter />
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsPageContent />
    </Suspense>
  )
}
