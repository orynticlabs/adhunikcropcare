"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ChevronRight, Star, Leaf, SlidersHorizontal,
  ChevronDown, X,
} from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import Header from "@/components/layout/header"
import CartDrawer from "@/features/cart/components/cart-drawer"
import SiteFooter from "@/components/layout/site-footer"
import SizeCartButton from "@/features/cart/components/size-cart-button"
import { formatCurrency } from "@/features/cart/cart-context"

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

const PRODUCTS = [
  // Fertilizers
  {
    name: "Adhunik Bio NPK", priceValue: 1249, badge: "Bestseller", category: "Fertilizers",
    img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
    sizes: ["1 kg", "5 kg", "25 kg"], defaultSize: "5 kg", rating: 4.8, reviews: 284,
  },
  {
    name: "NPK 19-19-19 Water Soluble", priceValue: 799, badge: "Popular", category: "Fertilizers",
    img: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80",
    sizes: ["500 g", "1 kg", "5 kg"], defaultSize: "1 kg", rating: 4.6, reviews: 156,
  },
  {
    name: "Humic Acid Granules", priceValue: 549, badge: "Soil Booster", category: "Fertilizers",
    img: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80",
    sizes: ["1 kg", "5 kg"], defaultSize: "1 kg", rating: 4.5, reviews: 98,
  },
  // Organic
  {
    name: "Vermi+ Compost 25kg", priceValue: 599, badge: "Organic", category: "Organic",
    img: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80",
    sizes: ["10 kg", "25 kg", "50 kg"], defaultSize: "25 kg", rating: 4.7, reviews: 203,
  },
  {
    name: "Neem Cake Powder", priceValue: 349, badge: "Organic", category: "Organic",
    img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80",
    sizes: ["1 kg", "5 kg", "25 kg"], defaultSize: "5 kg", rating: 4.5, reviews: 119,
  },
  {
    name: "Enriched Cow Manure", priceValue: 299, badge: "Farm Fresh", category: "Organic",
    img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
    sizes: ["10 kg", "25 kg"], defaultSize: "10 kg", rating: 4.4, reviews: 87,
  },
  // Bio Products
  {
    name: "MyCo Root Power", priceValue: 749, badge: "Bio", category: "Bio Products",
    img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
    sizes: ["250 g", "500 g", "1 kg"], defaultSize: "500 g", rating: 4.7, reviews: 142,
  },
  {
    name: "Rhizo-Fix Biofertilizer", priceValue: 449, badge: "New", category: "Bio Products",
    img: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80",
    sizes: ["250 g", "500 g"], defaultSize: "250 g", rating: 4.6, reviews: 63,
  },
  {
    name: "Azospirillum Culture", priceValue: 399, badge: "Nitrogen Fix", category: "Bio Products",
    img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80",
    sizes: ["250 g", "500 g"], defaultSize: "250 g", rating: 4.5, reviews: 41,
  },
  // Soil Care
  {
    name: "SoilRich Booster", priceValue: 899, badge: "New", category: "Soil Care",
    img: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80",
    sizes: ["1 kg", "5 kg"], defaultSize: "1 kg", rating: 4.8, reviews: 176,
  },
  {
    name: "pH Balance Pro", priceValue: 449, badge: "Soil Care", category: "Soil Care",
    img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80",
    sizes: ["1 kg", "5 kg"], defaultSize: "1 kg", rating: 4.3, reviews: 54,
  },
  // Pest Management
  {
    name: "NeemGuard Spray 1L", priceValue: 449, badge: "Bio Pesticide", category: "Pest Management",
    img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
    sizes: ["500 ml", "1 L", "5 L"], defaultSize: "1 L", rating: 4.6, reviews: 198,
  },
  {
    name: "Sticky Trap Kit 20-Pack", priceValue: 299, badge: "IPM", category: "Pest Management",
    img: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80",
    sizes: undefined, defaultSize: undefined, rating: 4.4, reviews: 76,
  },
  // Irrigation
  {
    name: "DripFlow Starter Kit", priceValue: 4999, badge: "Smart", category: "Irrigation",
    img: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80",
    sizes: undefined, defaultSize: undefined, rating: 4.9, reviews: 91,
  },
  {
    name: "Micro Sprinkler Set", priceValue: 1899, badge: "Water Saver", category: "Irrigation",
    img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80",
    sizes: undefined, defaultSize: undefined, rating: 4.5, reviews: 44,
  },
]

function productHref(name: string) {
  return `/products/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < Math.round(rating) ? "fill-[--gold] text-[--gold]" : "fill-border text-border"}`}
          aria-hidden
        />
      ))}
    </div>
  )
}

/* ── Page ───────────────────────────────────────────── */
export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [priceRange,    setPriceRange]    = useState(0)
  const [sortBy,        setSortBy]        = useState("featured")
  const [priceOpen,     setPriceOpen]     = useState(false)
  const [sortOpen,      setSortOpen]      = useState(false)

  const filtered = useMemo(() => {
    let result = [...PRODUCTS]
    if (activeCategory !== "All") result = result.filter(p => p.category === activeCategory)
    const { min, max } = PRICE_RANGES[priceRange]
    result = result.filter(p => p.priceValue >= min && p.priceValue <= max)
    if (sortBy === "price-asc")  result.sort((a, b) => a.priceValue - b.priceValue)
    if (sortBy === "price-desc") result.sort((a, b) => b.priceValue - a.priceValue)
    if (sortBy === "rating")     result.sort((a, b) => b.rating - a.rating)
    return result
  }, [activeCategory, priceRange, sortBy])

  const activeFiltersCount = (activeCategory !== "All" ? 1 : 0) + (priceRange !== 0 ? 1 : 0)

  function clearFilters() { setActiveCategory("All"); setPriceRange(0) }

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Header />
      <CartDrawer />

      <main>

        {/* ══ Hero Banner ═══════════════════════════════════════════ */}
        <div className="relative h-[320px] sm:h-[420px] lg:h-[540px] overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&q=90"
            alt="Adhunik Crop Care — golden farmland at sunset"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[--moss]/85 via-[--moss]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-background/30" />

          {/* Content — bottom-left aligned */}
          <div className="absolute inset-x-0 bottom-0 pb-8 sm:pb-12 lg:pb-16">
            <div className="mx-auto max-w-7xl px-4">

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
                  { val: "80+", label: "Products"   },
                  { val: "6",   label: "Categories" },
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
        <div className="sticky top-[5.5rem] z-30 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
          <div className="mx-auto max-w-7xl px-3 sm:px-4">

            {/* Single row: pills scroll inside their own div; controls stay pinned */}
            <div className="flex items-center gap-2 sm:gap-3 py-3">

              {/* Category pills — only this inner element scrolls horizontally */}
              <div className="flex-1 min-w-0 overflow-x-auto scrollbar-none">
                <div className="flex gap-1.5 sm:gap-2 w-max">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`shrink-0 rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                        activeCategory === cat
                          ? "bg-[--leaf] text-white shadow-sm"
                          : "border border-border/60 text-foreground/70 bg-background hover:border-[--leaf]/50 hover:text-[--leaf]"
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
                        ? "border-[--leaf] bg-[--leaf]/10 text-[--leaf]"
                        : "border-border/60 text-foreground/70 hover:border-[--leaf]/50 hover:text-[--leaf]"
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                    <span className="hidden sm:inline">Price</span>
                    {priceRange !== 0 && <span className="h-1.5 w-1.5 rounded-full bg-[--leaf]" />}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${priceOpen ? "rotate-180" : ""}`} aria-hidden />
                  </button>

                  {priceOpen && (
                    <>
                      <div className="fixed inset-0 z-[1]" onClick={() => setPriceOpen(false)} />
                      <div className="absolute left-0 top-full mt-2 z-[2] min-w-[210px] rounded-2xl border border-border/60 bg-popover p-1.5 shadow-luxe">
                        {PRICE_RANGES.map((range, i) => (
                          <button
                            key={range.label}
                            type="button"
                            onClick={() => { setPriceRange(i); setPriceOpen(false) }}
                            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                              priceRange === i
                                ? "bg-[--leaf]/10 font-semibold text-[--leaf]"
                                : "text-foreground/80 hover:text-[--leaf]"
                            }`}
                          >
                            {priceRange === i && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[--leaf]" />}
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
                    className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3.5 py-1.5 text-sm font-medium text-foreground/70 hover:border-[--leaf]/50 hover:text-[--leaf] transition"
                  >
                    <span className="hidden sm:inline">{SORT_OPTIONS.find(s => s.value === sortBy)?.label ?? "Sort"}</span>
                    <span className="sm:hidden">Sort</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${sortOpen ? "rotate-180" : ""}`} aria-hidden />
                  </button>

                  {sortOpen && (
                    <>
                      <div className="fixed inset-0 z-[1]" onClick={() => setSortOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 z-[2] min-w-[210px] rounded-2xl border border-border/60 bg-popover p-1.5 shadow-luxe">
                        {SORT_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => { setSortBy(opt.value); setSortOpen(false) }}
                            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                              sortBy === opt.value
                                ? "bg-[--leaf]/10 font-semibold text-[--leaf]"
                                : "text-foreground/80 hover:text-[--leaf]"
                            }`}
                          >
                            {sortBy === opt.value && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[--leaf]" />}
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
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[--leaf]/20 bg-[--leaf]/10 px-3 py-1 text-xs font-medium text-[--leaf]">
                    {activeCategory}
                    <button type="button" onClick={() => setActiveCategory("All")} aria-label="Remove category filter">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {priceRange !== 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[--leaf]/20 bg-[--leaf]/10 px-3 py-1 text-xs font-medium text-[--leaf]">
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
                <span className="text-[--moss]"> in {activeCategory}</span>
              )}
            </p>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-[--leaf] transition-colors underline underline-offset-2"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Empty state */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-[--leaf]/8 mb-5">
                <Leaf className="h-10 w-10 text-[--leaf]/40" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-2xl">No products found</h3>
              <p className="mt-2 text-muted-foreground max-w-xs">
                Try a different category or price range.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 rounded-full bg-[--leaf] px-7 h-10 text-sm font-semibold text-white hover:bg-[--moss] transition"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map(p => {
                const price = formatCurrency(p.priceValue)
                return (
                  <div
                    key={p.name}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-border/40 bg-card shadow-soft hover:shadow-luxe transition-all duration-300"
                  >
                    {/* Product image */}
                    <Link
                      href={productHref(p.name)}
                      className="relative block aspect-[4/3] overflow-hidden bg-accent/30 shrink-0"
                      tabIndex={-1}
                      aria-label={`View ${p.name}`}
                    >
                      <Image
                        src={p.img}
                        alt={p.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      {/* Badge */}
                      <span className="absolute top-3 left-3 rounded-full bg-background/92 border border-border/40 px-2.5 py-0.5 text-[11px] font-semibold shadow-sm backdrop-blur-sm">
                        {p.badge}
                      </span>
                    </Link>

                    {/* Card body */}
                    <div className="flex flex-col flex-1 gap-3 p-4 sm:p-5">
                      <Link
                        href={productHref(p.name)}
                        className="font-display text-base sm:text-lg leading-snug hover:text-[--leaf] transition-colors"
                      >
                        {p.name}
                      </Link>

                      <div className="flex items-center gap-2">
                        <Stars rating={p.rating} />
                        <span className="text-xs text-muted-foreground">({p.reviews})</span>
                      </div>

                      <div className="mt-auto pt-1">
                        <div className="mb-3 font-display text-xl text-[--moss]">{price}</div>
                        <SizeCartButton
                          product={{ name: p.name, price, img: p.img, badge: p.badge, sizes: p.sizes, defaultSize: p.defaultSize }}
                        />
                      </div>
                    </div>
                  </div>
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
