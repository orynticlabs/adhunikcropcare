"use client"

import { useEffect, useState, type ReactNode } from "react"
import Image from "next/image"
import {
  Check,
  Copy,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from "lucide-react"
import { ProductCard } from "@/components/products/product-card"
import { useCart } from "@/features/cart/cart-context"

type ProductImage = {
  src: string
  alt: string
}

type ProductOption = {
  label: string
  price: string
  originalPrice: string
  discount: string
}

type RecommendedProduct = {
  name: string
  desc: string
  price: string
  img: string
  badge: string
  rating: string
  images?: string[]
  slug?: string
}

export type ProductDetail = {
  brand?: string
  category: string
  description: string
  dosage: string[]
  images: ProductImage[]
  ingredients: string[]
  options: ProductOption[]
  rating: number
  recommended: RecommendedProduct[]
  reviews: number
  safety: string[]
  sku?: string
  slug?: string
  stockQuantity?: number
  storage: string[]
  title: string
  shortDescription?: string
  unit?: string
  benefits: string[]
  usage: string[]
  specifications?: string
  howToUse?: string
  shippingReturns?: string
  video: {
    title: string
    caption: string
    src: string
    poster: string
  }
}

type Review = {
  name: string
  date: string
  stars: number
  title: string
  body: string
  verified: boolean
}

type ServiceabilityResult = {
  serviceable: boolean
  reason?: string
  codAvailable?: boolean
  estimatedDeliveryDays?: string | null
  estimatedDeliveryDate?: string | null
  couriers: { name: string; etd?: string; estimatedDeliveryDays?: string; rate?: number; cod?: boolean }[]
}

const SAMPLE_REVIEWS: Review[] = [
  {
    name: "Ramesh Patil",
    date: "12 Jul, 2026",
    stars: 5,
    title: "Visible results on my crop",
    body: "Applied as recommended and saw stronger, greener growth within a few weeks. Easy to use in the field and the results speak for themselves.",
    verified: true,
  },
  {
    name: "Suresh Kumar",
    date: "05 Jul, 2026",
    stars: 5,
    title: "Great value for money",
    body: "One pack covered my whole plot. No wastage, consistent quality, and my yield improved noticeably this season. Will reorder.",
    verified: true,
  },
  {
    name: "Anita Deshmukh",
    date: "28 Jun, 2026",
    stars: 4,
    title: "Works as promised",
    body: "Saw healthier foliage within three weeks. Wish it came with a small crop-wise dosage card, but the product itself is excellent.",
    verified: true,
  },
  {
    name: "Vijay Nair",
    date: "20 Jun, 2026",
    stars: 5,
    title: "Simple and effective",
    body: "No complicated mixing. Followed the label and my plants responded well. A dependable input from Adhunik.",
    verified: false,
  },
  {
    name: "Kavita Rao",
    date: "11 Jun, 2026",
    stars: 5,
    title: "Reliable for every season",
    body: "I have been using this across multiple crops and the quality is consistent. My soil and plants are visibly healthier.",
    verified: true,
  },
]

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[#e9c46a]">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${index < Math.round(rating) ? "fill-current" : ""}`}
          aria-hidden
        />
      ))}
    </span>
  )
}

function productHref(name: string) {
  return `/products/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`
}

function comparePrice(price: string, uplift = 1.2) {
  const amount = Number(price.replace(/[^\d]/g, "")) || 0
  const originalAmount = Math.ceil((amount * uplift) / 10) * 10
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(originalAmount)
}

// Distribute the total review count across 5..1 stars based on the rating,
// so the breakdown bars stay proportional without a real review source.
function ratingBreakdown(total: number, rating: number) {
  const weights = rating >= 4.5
    ? [0.87, 0.09, 0.02, 0.015, 0.005]
    : [0.6, 0.25, 0.1, 0.03, 0.02]
  const counts = weights.map((w) => Math.round(total * w))
  return [5, 4, 3, 2, 1].map((stars, i) => ({ stars, count: counts[i] }))
}

// Split free-text admin content into lines for list rendering.
function contentLines(value?: string) {
  return (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean)
}

function isHtml(value?: string) {
  return Boolean(value && value.includes("<"))
}

export default function ProductDetailView({ product }: { product: ProductDetail }) {
  const [activeImage, setActiveImage] = useState(0)
  const [activeOption, setActiveOption] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [pincode, setPincode] = useState("")
  const [checkedPin, setCheckedPin] = useState("")
  const [serviceability, setServiceability] = useState<ServiceabilityResult | null>(null)
  const [checkingPin, setCheckingPin] = useState(false)
  const [pinError, setPinError] = useState("")
  const [couponCopied, setCouponCopied] = useState(false)
  const [openSpec, setOpenSpec] = useState<string>("Product Specifications")
  const [visibleReviews, setVisibleReviews] = useState(3)
  const { addItem, openCart } = useCart()

  const selected = product.options[activeOption]
  const totalReviews = product.reviews
  const breakdown = ratingBreakdown(totalReviews, product.rating)

  // Auto-rotate the gallery. Pauses while the user is hovering the image.
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused || product.images.length <= 1) return
    const timer = window.setInterval(() => {
      setActiveImage((i) => (i + 1) % product.images.length)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [paused, product.images.length])

  function addQuantityToCart() {
    for (let index = 0; index < quantity; index += 1) {
      addItem({
        name: product.title,
        price: selected.price,
        img: product.images[0].src,
        badge: product.category,
        size: selected.label,
      })
    }
    openCart()
  }

  function copyCoupon() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("ADHUNIK10").catch(() => {})
    }
    setCouponCopied(true)
  }

  async function checkPincode() {
    const pin = pincode.trim()
    if (!/^\d{6}$/.test(pin)) {
      setPinError("Enter a valid 6-digit pincode.")
      return
    }
    setCheckingPin(true)
    setPinError("")
    setServiceability(null)
    try {
      const response = await fetch(`/api/shiprocket/serviceability?pincode=${pin}`)
      const json = await response.json()
      if (!json.success) throw new Error(json.error?.message ?? "Unable to check delivery.")
      setCheckedPin(pin)
      setServiceability(json.data as ServiceabilityResult)
    } catch (error) {
      setPinError(error instanceof Error ? error.message : "Unable to check delivery.")
    } finally {
      setCheckingPin(false)
    }
  }

  const descriptionBullets = product.benefits.filter(Boolean)
  const specRows: Array<[string, string]> = [
    ["Category", product.category],
    ...(product.brand ? ([["Brand", product.brand]] as Array<[string, string]>) : []),
    ...(product.unit ? ([["Pack unit", product.unit]] as Array<[string, string]>) : []),
    ...(product.sku ? ([["SKU", product.sku]] as Array<[string, string]>) : []),
    ...(product.stockQuantity !== undefined
      ? ([["Availability", product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of stock"]] as Array<[string, string]>)
      : []),
  ]

  const specLines = contentLines(product.specifications)
  const howToUseLines = contentLines(product.howToUse)
  const usageLines = howToUseLines.length > 0 ? howToUseLines : product.usage

  const specSections: Array<{ title: string; render: () => ReactNode }> = [
    {
      title: "Product Specifications",
      render: () => {
        if (isHtml(product.specifications)) {
          return (
            <div
              className="richtext text-sm text-foreground/75"
              dangerouslySetInnerHTML={{ __html: product.specifications as string }}
            />
          )
        }
        // "Key: value" lines render as a definition grid; anything else falls back
        // to the derived spec rows so the section is never empty.
        const paired = specLines
          .map((line) => {
            const idx = line.indexOf(":")
            return idx > 0 ? ([line.slice(0, idx).trim(), line.slice(idx + 1).trim()] as [string, string]) : null
          })
          .filter((row): row is [string, string] => row !== null)
        const rows = paired.length > 0 ? paired : specLines.length === 0 ? specRows : null

        if (rows) {
          return (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {rows.map(([key, value]) => (
                <div key={key} className="contents">
                  <dt className="text-foreground/60">{key}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          )
        }

        return (
          <ul className="space-y-2 text-sm leading-6 text-foreground/75">
            {specLines.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#689c30]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )
      },
    },
    {
      title: "How to Use",
      render: () =>
        isHtml(product.howToUse) ? (
          <div
            className="richtext text-sm text-foreground/75"
            dangerouslySetInnerHTML={{ __html: product.howToUse as string }}
          />
        ) : (
          <ul className="space-y-2 text-sm leading-6 text-foreground/75">
            {usageLines.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#689c30]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ),
    },
    {
      title: "Shipping & Returns",
      render: () =>
        isHtml(product.shippingReturns) ? (
          <div
            className="richtext text-sm text-foreground/75"
            dangerouslySetInnerHTML={{ __html: product.shippingReturns as string }}
          />
        ) : (
          <p className="text-sm leading-6 text-foreground/75">
            {product.shippingReturns?.trim() ||
              "Free shipping on orders above ₹499. 30-day replacement for damaged products. Dispatched within 24–48 hours of order confirmation."}
          </p>
        ),
    },
  ]

  return (
    <main className="pt-36 sm:pt-40">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Left: sticky image */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div
              className="relative overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1 rounded-md bg-[#033927] px-3 py-1 text-xs font-semibold text-white">
                <Sparkles className="h-3.5 w-3.5" aria-hidden /> Bestseller
              </span>
              <div className="relative aspect-square">
                <Image
                  src={product.images[activeImage].src}
                  alt={product.images[activeImage].alt}
                  fill
                  priority
                  sizes="(max-width: 1023px) 100vw, 50vw"
                  className="object-contain"
                />
              </div>
              {/* Dot indicators */}
              {product.images.length > 1 && (
                <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
                  {product.images.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full border border-[#b9cdb3] ${
                        i === activeImage ? "bg-[#0d5a48]" : "bg-white"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="mt-6 flex items-center justify-center">
                <div className="flex gap-2 rounded-xl border border-border/60 bg-white p-2 shadow-sm">
                  {product.images.map((image, i) => (
                    <button
                      key={image.src}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      aria-label={`Show product image ${i + 1}`}
                      className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 transition-colors ${
                        i === activeImage ? "border-[#033927]" : "border-transparent hover:border-[#689c30]/60"
                      }`}
                    >
                      <Image src={image.src} alt="" fill sizes="64px" className="object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: content */}
          <div className="space-y-8">
            <div>
              <h1 className="font-display text-3xl leading-tight tracking-tight md:text-4xl">
                {product.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-foreground/80">
                <span className="inline-flex items-center gap-1 font-semibold text-[#033927]">
                  <Star className="h-4 w-4 fill-current text-[#e9c46a]" aria-hidden /> {product.rating.toFixed(1)}
                </span>
                <span>({totalReviews} reviews)</span>
                <span className="text-foreground/30">|</span>
                <span className="text-sm font-semibold uppercase tracking-widest text-[#033927]">
                  {product.category}
                </span>
              </div>

              {product.shortDescription?.trim() && (
                <p className="mt-4 text-sm leading-relaxed text-foreground/75">
                  {product.shortDescription}
                </p>
              )}

              <div className="mt-5 flex items-baseline gap-3">
                <span className="font-display text-3xl text-[#033927]">{selected.price}</span>
                <span className="text-lg text-foreground/50 line-through">{selected.originalPrice}</span>
                <span className="rounded-md bg-[#689c30]/15 px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-[#033927]">
                  {selected.discount}
                </span>
              </div>
              <p className="mt-1 text-xs text-foreground/60">(Incl. of all taxes)</p>
            </div>

            {/* Size */}
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-foreground/70">Pack Size</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {product.options.map((opt, index) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setActiveOption(index)}
                    className={`relative min-w-[140px] rounded-lg border-2 px-5 py-3 text-left transition ${
                      activeOption === index
                        ? "border-[#033927] bg-white"
                        : "border-border/60 bg-white hover:border-[#689c30]/60"
                    }`}
                  >
                    <div className="text-sm font-semibold">{opt.label}</div>
                    <div className="text-sm text-foreground/70">{opt.price}</div>
                    {activeOption === index && (
                      <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-[#033927] text-white">
                        <Check className="h-3 w-3" aria-hidden />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery */}
            <div>
              <p className="text-base font-bold">Delivery Estimate</p>
              <div className="mt-3 flex items-center rounded-lg border border-border/60 bg-white px-4 py-3">
                <input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => { if (e.key === "Enter") void checkPincode() }}
                  placeholder="Enter pincode"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground/40"
                />
                <button
                  type="button"
                  onClick={() => void checkPincode()}
                  disabled={checkingPin}
                  className="text-sm font-semibold text-[#033927] transition-colors hover:text-[#689c30] disabled:opacity-50"
                >
                  {checkingPin ? "Checking…" : "Check"}
                </button>
              </div>
              {pinError && <p className="mt-2 text-sm text-red-600">{pinError}</p>}
              {checkedPin && serviceability && (
                serviceability.serviceable ? (
                  <div className="mt-3 space-y-2 rounded-lg border border-[#689c30]/30 bg-[#689c30]/5 p-3 text-sm">
                    <p className="flex items-center gap-2 font-semibold text-[#033927]">
                      <Truck className="h-4 w-4 text-[#689c30]" aria-hidden />
                      Delivery available to {checkedPin}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {serviceability.estimatedDeliveryDate && (
                        <span><span className="text-foreground/60">Est. delivery:</span> <strong>{serviceability.estimatedDeliveryDate}</strong></span>
                      )}
                      <span>
                        <span className="text-foreground/60">COD:</span>{" "}
                        <strong>{serviceability.codAvailable ? "Available" : "Not available"}</strong>
                      </span>
                    </div>
                    {serviceability.couriers.length > 0 && (
                      <div className="text-xs text-foreground/70">
                        <span className="text-foreground/60">Couriers:</span>{" "}
                        {serviceability.couriers.slice(0, 3).map((c) => c.name).join(", ")}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 flex items-center gap-2 text-sm text-red-600">
                    <Truck className="h-4 w-4" aria-hidden />
                    {serviceability.reason === "unconfigured"
                      ? "Delivery checking is temporarily unavailable."
                      : `Sorry, delivery is not available to ${checkedPin}.`}
                  </p>
                )
              )}
            </div>

            {/* Buy */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex h-12 items-center rounded-full border border-border bg-white p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="grid h-10 w-10 place-items-center rounded-full text-[#033927] transition-colors hover:bg-[#689c30] hover:!text-black"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" aria-hidden />
                </button>
                <span className="min-w-[40px] text-center text-sm font-bold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(12, q + 1))}
                  className="grid h-10 w-10 place-items-center rounded-full text-[#033927] transition-colors hover:bg-[#689c30] hover:!text-black"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <button
                type="button"
                onClick={addQuantityToCart}
                className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#033927] px-6 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#689c30] hover:!text-black"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden />
                Add to Cart
              </button>
            </div>

            {/* Offers */}
            <div>
              <p className="text-base font-bold">Offers for you</p>
              <div className="mt-3 rounded-lg border border-dashed border-[#689c30]/50 bg-[#689c30]/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[#033927]">10% off unlocked!</p>
                  <button
                    type="button"
                    onClick={copyCoupon}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#033927] transition-colors hover:text-[#689c30]"
                  >
                    {couponCopied ? "Copied" : "ADHUNIK10"} <Copy className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
                <p className="mt-1 text-sm text-foreground/70">Free shipping + Flat 10% off unlocked!</p>
              </div>
            </div>

            {/* Description */}
            {product.description.trim() &&
              product.description.trim() !== product.shortDescription?.trim() && (
                <div className="space-y-3">
                  <h2 className="text-xl font-bold">Product Description</h2>
                  {product.description.includes("<") ? (
                    <div
                      className="richtext text-sm text-foreground/80"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  ) : (
                    <p className="text-sm leading-relaxed text-foreground/80" style={{ textAlign: "justify" }}>{product.description}</p>
                  )}
                  {descriptionBullets.length > 0 && (
                    <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground/80">
                      {descriptionBullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

            {/* Guarantee */}
            <div className="flex items-center justify-between rounded-xl bg-[#689c30]/10 p-5">
              <p className="text-base font-bold text-[#033927]">
                30 days Guaranteed Replacement of Damaged Product
              </p>
              <Sparkles className="h-8 w-8 shrink-0 text-[#689c30]" aria-hidden />
            </div>

            {/* Specs */}
            <div className="space-y-3">
              {specSections.map(({ title, render }) => {
                const isOpen = openSpec === title
                return (
                  <div key={title} className="rounded-lg border border-border/60 bg-white p-5">
                    <button
                      type="button"
                      onClick={() => setOpenSpec(isOpen ? "" : title)}
                      className="flex w-full cursor-pointer items-center justify-between text-left text-base font-bold"
                    >
                      {title}
                      {isOpen ? (
                        <Minus className="h-5 w-5 text-[#689c30]" aria-hidden />
                      ) : (
                        <Plus className="h-5 w-5 text-[#689c30]" aria-hidden />
                      )}
                    </button>
                    {isOpen && <div className="mt-4">{render()}</div>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-20 border-t border-border/50 pt-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold">Customer Reviews</h2>
              <div className="mt-2 flex items-center gap-2 text-sm text-foreground/70">
                <Stars rating={product.rating} />
                <span className="font-semibold text-foreground">{product.rating.toFixed(1)} out of 5</span>
                <span>· Based on {totalReviews} reviews</span>
              </div>
            </div>
            <button
              type="button"
              className="rounded-md border-2 border-[#033927] bg-white px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[#033927] transition-colors hover:bg-[#033927] hover:text-white"
            >
              Write a Review
            </button>
          </div>

          {/* Rating breakdown */}
          <div className="mt-8 grid max-w-md gap-2">
            {breakdown.map((row) => (
              <div key={row.stars} className="flex items-center gap-3 text-sm">
                <span className="w-12 text-foreground/70">{row.stars} star</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full bg-[#033927]"
                    style={{ width: `${totalReviews ? (row.count / totalReviews) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-8 text-right text-foreground/60">{row.count}</span>
              </div>
            ))}
          </div>

          {/* Reviews list */}
          <div className="mt-10 space-y-6">
            {SAMPLE_REVIEWS.slice(0, visibleReviews).map((r) => (
              <div key={r.name} className="rounded-xl border border-border/60 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#033927]/10 text-sm font-bold text-[#033927]">
                      {r.name.split(" ").map((w) => w[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{r.name}</p>
                      {r.verified && (
                        <p className="text-xs font-medium text-[#689c30]">✓ Verified Buyer</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-foreground/50">{r.date}</span>
                </div>
                <div className="mt-3">
                  <Stars rating={r.stars} />
                </div>
                <p className="mt-2 font-semibold">{r.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/75">{r.body}</p>
              </div>
            ))}
          </div>

          {visibleReviews < SAMPLE_REVIEWS.length && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleReviews(SAMPLE_REVIEWS.length)}
                className="rounded-md border border-border/60 bg-white px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-black/5"
              >
                Load more reviews
              </button>
            </div>
          )}
        </section>

        {/* Recommended */}
        {product.recommended.length > 0 && (
          <section className="mt-20 border-t border-border/50 pt-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[#033927]">
              Recommended Products
            </div>
            <h2 className="mt-5 font-display text-3xl leading-tight sm:text-4xl">You May Also Like</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {product.recommended.map((item) => (
                <ProductCard
                  key={item.name}
                  href={item.slug ? `/products/${item.slug}` : productHref(item.name)}
                  name={item.name}
                  image={item.img}
                  images={item.images}
                  price={item.price}
                  originalPrice={comparePrice(item.price)}
                  badge={item.badge}
                  subtitle={item.desc}
                  rating={Number(item.rating)}
                  reviews={Number(item.rating) * 40}
                  imageSizes="(max-width: 1023px) 50vw, 25vw"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
