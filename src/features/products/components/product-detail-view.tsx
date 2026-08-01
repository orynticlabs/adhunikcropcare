"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import Image from "next/image"
import {
  Award,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Leaf,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Truck,
  X,
} from "lucide-react"
import { ProductCard } from "@/components/products/product-card"
import { useCart } from "@/features/cart/cart-context"
import { useAuth } from "@/features/auth/auth-context"

type ProductImage = {
  src: string
  alt: string
  id?: string
  packSizes?: string[]
}

type ProductOption = {
  label: string
  price: string
  originalPrice: string
  discount: string
  imageId?: string
  imageUrl?: string
  imageIds?: string[]
  imageUrls?: string[]
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
  defaultOptionIndex?: number
  description: string
  dosage: string[]
  images: ProductImage[]
  ingredients: string[]
  options: ProductOption[]
  packSizeImagesEnabled?: boolean
  rating: number
  recommended: RecommendedProduct[]
  similarProducts?: RecommendedProduct[]
  differentCategoryProducts?: RecommendedProduct[]
  bestSellerProducts?: RecommendedProduct[]
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
  id?: string
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
  return [5, 4, 3, 2, 1].map((stars, i) => ({
    stars,
    count: counts[i],
    percentage: total > 0 ? Math.round((counts[i] / total) * 100) : 0,
  }))
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
  const [imgVisible, setImgVisible] = useState(true)
  const [activeOption, setActiveOption] = useState(product.defaultOptionIndex ?? 0)
  const [quantity, setQuantity] = useState(1)
  const [pincode, setPincode] = useState("")
  const [checkedPin, setCheckedPin] = useState("")
  const [serviceability, setServiceability] = useState<ServiceabilityResult | null>(null)
  const [checkingPin, setCheckingPin] = useState(false)
  const [pinError, setPinError] = useState("")
  const [couponCopied, setCouponCopied] = useState(false)
  const [openSpec, setOpenSpec] = useState<string>(
    product.specifications?.trim()
      ? "Product Specifications"
      : product.howToUse?.trim()
      ? "How to Use"
      : product.shippingReturns?.trim()
      ? "Shipping & Returns"
      : ""
  )
  const [visibleReviews, setVisibleReviews] = useState(3)

  type LiveOffer = { id: string; name: string; code: string | null; shortText: string | null; bgColor: string | null; textColor: string | null; badgeText: string | null; buttonText: string | null }
  const [offers, setOffers] = useState<LiveOffer[] | null>(null)
  const [offerIndex, setOfferIndex] = useState(0)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const offerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const offerTextRef  = useRef<HTMLDivElement>(null)
  const { openAuthModal, user } = useAuth()
  const { addItem, openCart } = useCart()
  const [liveReviews, setLiveReviews] = useState<Review[]>([])
  const [liveAverageRating, setLiveAverageRating] = useState<number>(0)
  const [liveTotalReviews, setLiveTotalReviews] = useState<number>(0)
  const [liveBreakdown, setLiveBreakdown] = useState<Array<{ stars: number; count: number; percentage: number }>>([
    { stars: 5, count: 0, percentage: 0 },
    { stars: 4, count: 0, percentage: 0 },
    { stars: 3, count: 0, percentage: 0 },
    { stars: 2, count: 0, percentage: 0 },
    { stars: 1, count: 0, percentage: 0 },
  ])
  const [reviewsLoading, setReviewsLoading] = useState(true)

  // Write a review modal state
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [ratingInput, setRatingInput] = useState(5)
  const [titleInput, setTitleInput] = useState("")
  const [commentInput, setCommentInput] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState("")
  const [reviewSuccess, setReviewSuccess] = useState(false)

  const handleWriteReviewClick = () => {
    if (!user) {
      openAuthModal("signin")
      return
    }
    setShowReviewModal(true)
    setReviewError("")
    setReviewSuccess(false)
  }

  // Load live reviews from database API
  useEffect(() => {
    if (!product.slug) return
    setReviewsLoading(true)
    fetch(`/api/products/${product.slug}/reviews`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          const { averageRating, totalReviews, breakdown, reviews } = json.data
          setLiveAverageRating(averageRating)
          setLiveTotalReviews(totalReviews)
          if (Array.isArray(breakdown) && breakdown.length > 0) setLiveBreakdown(breakdown)
          if (Array.isArray(reviews)) setLiveReviews(reviews)
        }
      })
      .catch(() => {})
      .finally(() => setReviewsLoading(false))
  }, [product.slug])

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!commentInput.trim()) { setReviewError("Please enter your review comment."); return }
    if (ratingInput < 1 || ratingInput > 5) { setReviewError("Please select a rating from 1 to 5 stars."); return }

    setSubmittingReview(true)
    setReviewError("")
    try {
      const response = await fetch(`/api/products/${product.slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: ratingInput,
          title: titleInput,
          comment: commentInput,
        }),
      })
      const json = await response.json()
      if (!json.success) throw new Error(json.error?.message ?? "Failed to submit review.")

      if (json.data?.summary) {
        setLiveAverageRating(json.data.summary.averageRating)
        setLiveTotalReviews(json.data.summary.totalReviews)
        setLiveBreakdown(json.data.summary.breakdown)
        setLiveReviews(json.data.summary.reviews)
      }

      setReviewSuccess(true)
      setTimeout(() => {
        setShowReviewModal(false)
        setReviewSuccess(false)
        setTitleInput("")
        setCommentInput("")
      }, 1500)
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Failed to submit review.")
    } finally {
      setSubmittingReview(false)
    }
  }

  const selected = product.options[activeOption]
  const selectedPackLabel = selected?.label?.trim() || ""

  const visibleImages = useMemo(() => {
    if (!product.packSizeImagesEnabled) return product.images

    const filtered = product.images.filter((img) => {
      if (!img.packSizes || img.packSizes.length === 0) {
        return true
      }
      if (selectedPackLabel && img.packSizes.includes(selectedPackLabel)) {
        return true
      }
      if (selected?.imageIds && img.id && selected.imageIds.includes(img.id)) return true
      if (selected?.imageUrls && selected.imageUrls.includes(img.src)) return true
      if (selected?.imageId && img.id === selected.imageId) return true
      if (selected?.imageUrl && img.src === selected.imageUrl) return true

      return false
    })

    return filtered.length > 0 ? filtered : product.images
  }, [product.images, product.packSizeImagesEnabled, selectedPackLabel, selected?.imageId, selected?.imageIds, selected?.imageUrl, selected?.imageUrls])

  useEffect(() => {
    if (!product.packSizeImagesEnabled) return

    const option = product.options[activeOption]
    if (!option) return

    let targetIndex = -1
    const optionUrls = option.imageUrls || (option.imageUrl ? [option.imageUrl] : [])
    const optionIds = option.imageIds || (option.imageId ? [option.imageId] : [])

    if (optionUrls.length > 0) {
      targetIndex = visibleImages.findIndex((img) => optionUrls.includes(img.src))
    }
    if (targetIndex === -1 && optionIds.length > 0) {
      targetIndex = visibleImages.findIndex((img) => img.id && optionIds.includes(img.id))
    }
    if (targetIndex === -1 && option.label) {
      targetIndex = visibleImages.findIndex((img) => img.packSizes?.includes(option.label))
    }

    const targetSrc = targetIndex >= 0 ? visibleImages[targetIndex]?.src : visibleImages[0]?.src
    if (targetSrc) {
      const preloader = new window.Image()
      preloader.src = targetSrc
    }

    if (targetIndex >= 0) {
      setActiveImage(targetIndex)
    } else {
      setActiveImage(0)
    }
  }, [activeOption, product.options, product.packSizeImagesEnabled, visibleImages])

  const displayRating = liveTotalReviews > 0 ? liveAverageRating : (reviewsLoading ? product.rating : 0)
  const displayTotalReviews = liveTotalReviews > 0 ? liveTotalReviews : (reviewsLoading ? product.reviews : 0)
  const displayBreakdown = liveTotalReviews > 0 ? liveBreakdown : (reviewsLoading ? ratingBreakdown(product.reviews, product.rating) : [
    { stars: 5, count: 0, percentage: 0 },
    { stars: 4, count: 0, percentage: 0 },
    { stars: 3, count: 0, percentage: 0 },
    { stars: 2, count: 0, percentage: 0 },
    { stars: 1, count: 0, percentage: 0 },
  ])
  const displayReviewsList = liveTotalReviews > 0 ? liveReviews : (reviewsLoading ? SAMPLE_REVIEWS : [])

  // Auto-rotate the gallery. Pauses while the user is hovering the image.
  const [paused, setPaused] = useState(false)

  function goToImage(index: number) {
    if (index === activeImage) return
    setImgVisible(false)
    setTimeout(() => {
      setActiveImage(index)
      setImgVisible(true)
    }, 220)
  }

  useEffect(() => {
    if (paused || visibleImages.length <= 1) return
    const timer = window.setInterval(() => {
      setImgVisible(false)
      setTimeout(() => {
        setActiveImage((i) => {
          const next = (i + 1) % visibleImages.length
          return next
        })
        setImgVisible(true)
      }, 220)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [paused, visibleImages.length])

  function addQuantityToCart() {
    if (product.stockQuantity === 0) return
    for (let index = 0; index < quantity; index += 1) {
      addItem({
        name: product.title,
        price: selected.price,
        img: product.images[0].src,
        badge: product.category,
        productSlug: product.slug,
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

  // Fetch live offers
  useEffect(() => {
    const params = new URLSearchParams()
    if (product.slug) params.set("productSlug", product.slug)
    if (product.category) params.set("categorySlug", product.category)
    fetch(`/api/storefront/discounts/offers?${params}`)
      .then((r) => r.json())
      .then((json) => { if (json.success && Array.isArray(json.data)) setOffers(json.data) })
      .catch(() => {})
  }, [product.slug, product.category])

  // Rotate offers carousel
  useEffect(() => {
    if (!offers || offers.length <= 1) return
    if (offerTimerRef.current) clearInterval(offerTimerRef.current)
    offerTimerRef.current = setInterval(() => {
      const el = offerTextRef.current
      if (!el) return
      el.style.opacity   = "0"
      el.style.transform = "translateY(-6px)"
      setTimeout(() => {
        setOfferIndex((i) => (i + 1) % (offers?.length ?? 1))
        el.style.transition = "none"
        el.style.opacity    = "0"
        el.style.transform  = "translateY(6px)"
        void el.offsetHeight
        el.style.transition = "opacity 300ms ease, transform 300ms ease"
        el.style.opacity    = "1"
        el.style.transform  = "translateY(0)"
      }, 300)
    }, 4000)
    return () => { if (offerTimerRef.current) clearInterval(offerTimerRef.current) }
  }, [offers, offerIndex])

  function copyOfferCode(code: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {})
    }
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
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

  const specSections: Array<{ title: string; render: () => ReactNode }> = [
    ...(product.specifications?.trim()
      ? [
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
              const paired = specLines
                .map((line) => {
                  const idx = line.indexOf(":")
                  return idx > 0 ? ([line.slice(0, idx).trim(), line.slice(idx + 1).trim()] as [string, string]) : null
                })
                .filter((row): row is [string, string] => row !== null)

              if (paired.length > 0) {
                return (
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    {paired.map(([key, value]) => (
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
        ]
      : []),
    ...(product.howToUse?.trim()
      ? [
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
                  {howToUseLines.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#689c30]" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ),
          },
        ]
      : []),
    ...(product.shippingReturns?.trim()
      ? [
          {
            title: "Shipping & Returns",
            render: () =>
              isHtml(product.shippingReturns) ? (
                <div
                  className="richtext text-sm text-foreground/75"
                  dangerouslySetInnerHTML={{ __html: product.shippingReturns as string }}
                />
              ) : (
                <p className="text-sm leading-6 text-foreground/75">{product.shippingReturns?.trim()}</p>
              ),
          },
        ]
      : []),
  ]

  const isNotCurrentProduct = (item: RecommendedProduct) =>
    item.slug !== product.slug && item.name?.trim().toLowerCase() !== product.title?.trim().toLowerCase()

  const similarList = (product.similarProducts ?? []).filter(isNotCurrentProduct)
  const differentList = (product.differentCategoryProducts ?? []).filter(isNotCurrentProduct)
  const bestSellerList = (product.bestSellerProducts ?? []).filter(isNotCurrentProduct)

  return (
    <main className="pt-36 sm:pt-40">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Left: sticky image */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div
              className="relative overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm group"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1 rounded-md bg-[#033927] px-3 py-1 text-xs font-semibold text-white">
                <Sparkles className="h-3.5 w-3.5" aria-hidden /> Bestseller
              </span>

              {/* Main image with crossfade + hover zoom */}
              {(() => {
                const currentImg = visibleImages[activeImage] || visibleImages[0] || product.images[0]
                return (
                  <div className="relative aspect-square w-full overflow-hidden">
                    {currentImg ? (
                      <Image
                        src={currentImg.src}
                        alt={currentImg.alt || product.title}
                        fill
                        priority
                        sizes="(max-width: 1023px) calc(100vw - 2rem), calc(50vw - 3rem)"
                        className="object-cover transition-all duration-300 group-hover:scale-110"
                        style={{ opacity: imgVisible ? 1 : 0, transition: "opacity 220ms ease, transform 300ms ease" }}
                      />
                    ) : null}
                  </div>
                )
              })()}

              {/* Prev / Next arrows — only when multiple images */}
              {visibleImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => goToImage((activeImage - 1 + visibleImages.length) % visibleImages.length)}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition hover:bg-white hover:shadow-md cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4 text-[#033927]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToImage((activeImage + 1) % visibleImages.length)}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition hover:bg-white hover:shadow-md cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4 text-[#033927]" />
                  </button>

                  {/* Dot indicators — clickable */}
                  <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                    {visibleImages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => goToImage(i)}
                        aria-label={`Show image ${i + 1}`}
                        className={`rounded-full border border-[#b9cdb3] transition-all duration-300 cursor-pointer ${
                          i === activeImage ? "w-4 h-1.5 bg-[#0d5a48]" : "h-1.5 w-1.5 bg-white/70 hover:bg-white"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {visibleImages.length > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                {visibleImages.map((image, i) => (
                  <button
                    key={`${image.src}-${i}`}
                    type="button"
                    onClick={() => goToImage(i)}
                    aria-label={`Show product image ${i + 1}`}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-[#f8faf7] transition-all duration-200 cursor-pointer ${
                      i === activeImage ? "border-[#033927] scale-105 shadow-sm" : "border-transparent hover:border-[#689c30]/60"
                    }`}
                  >
                    <Image src={image.src} alt={image.alt || ""} fill sizes="64px" className="object-contain p-1.5" />
                  </button>
                ))}
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
                  <Star className="h-4 w-4 fill-current text-[#e9c46a]" aria-hidden /> {displayRating > 0 ? displayRating.toFixed(1) : "0.0"}
                </span>
                <span>({displayTotalReviews} reviews)</span>
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
                    <p className="text-xs">
                      <span className="text-foreground/60">Est. delivery:</span>{" "}
                      <strong>{serviceability.estimatedDeliveryDate ?? "To be confirmed"}</strong>
                    </p>
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
                disabled={product.stockQuantity === 0}
                className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#033927] px-6 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#689c30] hover:!text-black disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:hover:!text-white"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden />
                {product.stockQuantity === 0 ? "Out of Stock" : "Add to Cart"}
              </button>
            </div>

            {/* Offers / Coupon Card — Only rendered when active coupons exist */}
            {offers && offers.length > 0 ? (
              <div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-[#689c30]" aria-hidden />
                  <p className="text-base font-bold text-[#033927]">Exclusive Offers for You</p>
                </div>

                <div
                  ref={offerTextRef}
                  className="mt-3 relative overflow-hidden rounded-xl border border-[#689c30]/30 bg-gradient-to-r from-[#f7faf5] via-[#f1f6ec] to-[#eaf2e3] p-4 shadow-xs transition-all duration-300"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {offers[offerIndex % offers.length]?.badgeText && (
                        <span className="rounded-full bg-[#033927] px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[#eaf2e3] shadow-2xs">
                          {offers[offerIndex % offers.length].badgeText}
                        </span>
                      )}
                      <p className="font-bold text-sm tracking-tight text-[#033927]">
                        {offers[offerIndex % offers.length]?.name}
                      </p>
                    </div>
                    {offers[offerIndex % offers.length]?.code && (
                      <button
                        type="button"
                        onClick={() => copyOfferCode(offers[offerIndex % offers.length].code!)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#689c30]/40 bg-white/90 px-3 py-1 text-xs font-mono font-bold text-[#033927] shadow-2xs transition-all hover:bg-white hover:border-[#689c30] hover:shadow-xs active:scale-95 cursor-pointer"
                        title="Click to copy coupon code"
                      >
                        <span>{copiedCode === offers[offerIndex % offers.length].code ? "COPIED!" : offers[offerIndex % offers.length].code}</span>
                        {copiedCode === offers[offerIndex % offers.length].code ? (
                          <Check className="h-3.5 w-3.5 text-[#689c30]" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-[#689c30]" />
                        )}
                      </button>
                    )}
                  </div>
                  {offers[offerIndex % offers.length]?.shortText && (
                    <p className="mt-1.5 text-xs text-foreground/75 font-medium leading-relaxed">
                      {offers[offerIndex % offers.length].shortText}
                    </p>
                  )}
                  {offers.length > 1 && (
                    <div className="mt-3 flex items-center justify-between border-t border-[#689c30]/15 pt-2">
                      <div className="flex items-center gap-1.5">
                        {offers.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setOfferIndex(i)}
                            className={`rounded-full transition-all duration-300 cursor-pointer ${
                              i === (offerIndex % offers.length) ? "w-4 h-1.5 bg-[#033927]" : "w-1.5 h-1.5 bg-[#033927]/30 hover:bg-[#033927]/60"
                            }`}
                            aria-label={`Go to offer ${i + 1}`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-semibold text-[#033927]/70">
                        Offer {(offerIndex % offers.length) + 1} of {offers.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

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
                7 days Guaranteed Replacement of Damaged Product
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
                <Stars rating={displayRating} />
                <span className="font-semibold text-foreground">{displayRating > 0 ? displayRating.toFixed(1) : "0.0"} out of 5</span>
                <span>· Based on {displayTotalReviews} reviews</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleWriteReviewClick}
              className="rounded-md border-2 border-[#033927] bg-white px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[#033927] transition-colors hover:bg-[#033927] hover:!text-white"
            >
              Write a Review
            </button>
          </div>

          {/* Rating breakdown */}
          <div className="mt-8 grid max-w-md gap-2">
            {displayBreakdown.map((row) => (
              <div key={row.stars} className="flex items-center gap-3 text-sm">
                <span className="w-12 text-foreground/70">{row.stars} star</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full bg-[#033927] transition-all duration-500"
                    style={{ width: `${row.percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-foreground/60">{row.count}</span>
              </div>
            ))}
          </div>

          {/* Reviews list */}
          {displayReviewsList.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-border/70 bg-card/40 p-8 text-center">
              <p className="text-base font-semibold text-foreground">No reviews yet for this product.</p>
              <p className="mt-1 text-sm text-muted-foreground">Be the first to share your experience!</p>
              <button
                type="button"
                onClick={handleWriteReviewClick}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#033927] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#689c30] hover:text-black"
              >
                Write First Review
              </button>
            </div>
          ) : (
            <div className="mt-10 space-y-6">
              {displayReviewsList.slice(0, visibleReviews).map((r, i) => (
                <div key={r.id || `${r.name}-${i}`} className="rounded-xl border border-border/60 bg-white p-5 shadow-xs">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#033927]/10 text-sm font-bold text-[#033927]">
                        {r.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
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
                  {r.title?.trim() && <p className="mt-2 font-semibold text-foreground">{r.title}</p>}
                  <p className="mt-1 text-sm leading-relaxed text-foreground/75">{r.body}</p>
                </div>
              ))}
            </div>
          )}

          {visibleReviews < displayReviewsList.length && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleReviews(displayReviewsList.length)}
                className="rounded-md border border-border/60 bg-white px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-black/5"
              >
                Load more reviews ({displayReviewsList.length - visibleReviews} remaining)
              </button>
            </div>
          )}
        </section>

        {/* Write a Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-white p-6 shadow-2xl sm:p-8">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="absolute right-4 top-4 rounded-full p-2 text-foreground/50 hover:bg-black/5 hover:text-foreground"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="font-display text-2xl font-bold text-[#033927]">Write a Product Review</h3>
              <p className="mt-1 text-xs text-foreground/60">Sharing your honest feedback helps fellow farmers make informed choices.</p>

              {user && (
                <div className="mt-4 rounded-xl border border-[#033927]/15 bg-[#033927]/5 px-3.5 py-2.5 text-xs font-semibold text-[#033927] flex items-center justify-between">
                  <span>Posting review as <strong>{[user.firstName, user.lastName].filter(Boolean).join(" ")}</strong></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#689c30]">✓ Verified Account</span>
                </div>
              )}

              {reviewSuccess ? (
                <div className="mt-6 rounded-xl border border-[#689c30]/40 bg-[#689c30]/10 p-5 text-center">
                  <p className="font-bold text-[#033927]">Thank you for your review!</p>
                  <p className="mt-1 text-xs text-foreground/75">Your review has been submitted and added successfully.</p>
                </div>
              ) : (
                <form onSubmit={submitReview} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70">Rating *</label>
                    <div className="mt-1.5 flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingInput(star)}
                          className="p-1 text-2xl transition hover:scale-110"
                          aria-label={`Rate ${star} stars`}
                        >
                          <Star
                            className={`h-7 w-7 ${star <= ratingInput ? "fill-[#e9c46a] text-[#e9c46a]" : "text-border"}`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm font-semibold text-[#033927]">{ratingInput} Star{ratingInput > 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70">Review Title (Optional)</label>
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      placeholder="e.g. Great results on my crop"
                      className="mt-1 w-full rounded-lg border border-border/80 bg-background px-3.5 py-2 text-sm outline-none focus:border-[#033927]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70">Your Review *</label>
                    <textarea
                      required
                      rows={4}
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Share details about crop performance, application ease, or yield improvement..."
                      className="mt-1 w-full rounded-lg border border-border/80 bg-background px-3.5 py-2 text-sm outline-none focus:border-[#033927]"
                    />
                  </div>

                  {reviewError && (
                    <p className="text-xs font-semibold text-red-600">{reviewError}</p>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReviewModal(false)}
                      className="rounded-lg border border-border/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground/70 hover:bg-black/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="rounded-lg bg-[#033927] px-6 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#689c30] hover:text-black disabled:opacity-50"
                    >
                      {submittingReview ? "Submitting…" : "Submit Review"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Section 1: Similar Products (Same Category) */}
        {similarList.length > 0 && (
          <section className="mt-20 border-t border-border/50 pt-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[#033927]">
              <Sparkles className="h-3.5 w-3.5 text-[#689c30]" aria-hidden /> Similar Products
            </div>
            <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">Products of Similar Kind</h2>
            <p className="mt-1 text-sm text-foreground/70">Formulated for similar crop care, soil health, and protection needs</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {similarList.map((item, idx) => (
                <ProductCard
                  key={`sim-${item.name}-${idx}`}
                  slug={item.slug}
                  href={item.slug ? `/products/${item.slug}` : productHref(item.name)}
                  name={item.name}
                  image={item.img}
                  images={item.images}
                  price={item.price}
                  originalPrice={comparePrice(item.price)}
                  badge={item.badge}
                  subtitle={item.desc}
                  imageSizes="(max-width: 639px) calc(50vw - 1rem), (max-width: 1023px) calc(50vw - 1.5rem), 25vw"
                />
              ))}
            </div>
          </section>
        )}

        {/* Section 2: Explore Other Categories */}
        {differentList.length > 0 && (
          <section className="mt-16 border-t border-border/50 pt-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[#033927]">
              <Leaf className="h-3.5 w-3.5 text-[#689c30]" aria-hidden /> Explore Other Categories
            </div>
            <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">You May Also Like</h2>
            <p className="mt-1 text-sm text-foreground/70">Discover complementary agricultural solutions across our full organic product line</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {differentList.map((item, idx) => (
                <ProductCard
                  key={`diff-${item.name}-${idx}`}
                  slug={item.slug}
                  href={item.slug ? `/products/${item.slug}` : productHref(item.name)}
                  name={item.name}
                  image={item.img}
                  images={item.images}
                  price={item.price}
                  originalPrice={comparePrice(item.price)}
                  badge={item.badge}
                  subtitle={item.desc}
                  imageSizes="(max-width: 639px) calc(50vw - 1rem), (max-width: 1023px) calc(50vw - 1.5rem), 25vw"
                />
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Best Sellers */}
        {bestSellerList.length > 0 && (
          <section className="mt-16 border-t border-border/50 pt-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[#033927]">
              <Award className="h-3.5 w-3.5 text-[#689c30]" aria-hidden /> Best Sellers
            </div>
            <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">Top Rated Farmers&apos; Choice</h2>
            <p className="mt-1 text-sm text-foreground/70">Our most trusted and highly rated crop care inputs chosen by farmers across India</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {bestSellerList.map((item, idx) => (
                <ProductCard
                  key={`best-${item.name}-${idx}`}
                  slug={item.slug}
                  href={item.slug ? `/products/${item.slug}` : productHref(item.name)}
                  name={item.name}
                  image={item.img}
                  images={item.images}
                  price={item.price}
                  originalPrice={comparePrice(item.price)}
                  badge={item.badge}
                  subtitle={item.desc}
                  imageSizes="(max-width: 639px) calc(50vw - 1rem), (max-width: 1023px) calc(50vw - 1.5rem), 25vw"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
