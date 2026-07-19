"use client"

import { useState } from "react"
import Image from "next/image"
import {
  CheckCircle2,
  ChevronDown,
  Minus,
  PackageCheck,
  Play,
  Plus,
  ShieldCheck,
  ShoppingBag,
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
  unit?: string
  benefits: string[]
  usage: string[]
  video: {
    title: string
    caption: string
    src: string
    poster: string
  }
}

const DETAIL_SECTIONS = [
  "Benefits",
  "Usage Instructions",
  "Dosage",
  "Ingredients",
  "Safety Information",
  "Storage Instructions",
] as const

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-[#e9c46a]">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${index < Math.round(rating) ? "fill-current" : ""}`}
          aria-hidden
        />
      ))}
    </div>
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

export default function ProductDetailView({ product }: { product: ProductDetail }) {
  const [activeImage, setActiveImage] = useState(0)
  const [activeOption, setActiveOption] = useState<number | null>(null)  // null = no size chosen yet
  const [quantity, setQuantity] = useState(1)
  const [pincode, setPincode] = useState("")
  const [checkedPin, setCheckedPin] = useState("")
  const [openDetails, setOpenDetails] = useState<string[]>(["Benefits", "Usage Instructions"])
  const { addItem, openCart } = useCart()

  const selected = activeOption !== null ? product.options[activeOption] : null
  const cartProduct = {
    name: `${product.title}`,
    price: selected?.price ?? product.options[0].price,
    img: product.images[0].src,
    badge: product.category,
    size: selected?.label,             // size goes into the cart item
  }

  function addQuantityToCart() {
    if (activeOption === null) return  // guard: size required
    for (let index = 0; index < quantity; index += 1) {
      addItem(cartProduct)
    }
    openCart()
  }

  function toggleDetail(section: string) {
    setOpenDetails((current) =>
      current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section]
    )
  }

  const detailMap = {
    Benefits: product.benefits,
    "Usage Instructions": product.usage,
    Dosage: product.dosage,
    Ingredients: product.ingredients,
    "Safety Information": product.safety,
    "Storage Instructions": product.storage,
  }

  return (
    <main className="pt-36 sm:pt-40">
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:pb-16">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div className="grid gap-4 sm:grid-cols-[5.5rem_1fr]">
            {/* Thumbnails */}
            <div className="order-2 flex gap-3 overflow-x-auto pb-1 sm:order-1 sm:flex-col sm:overflow-visible">
              {product.images.map((image, index) => (
                <button
                  key={image.src}
                  type="button"
                  onClick={() => setActiveImage(index)}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-white transition-colors sm:h-24 sm:w-20 ${
                  activeImage === index
                      ? "border-[#033927]"
                      : "border-border/60 hover:border-[#689c30]/60"
                  }`}
                  aria-label={`Show product image ${index + 1}`}
                >
                  <Image src={image.src} alt={image.alt} fill sizes="96px" className="object-contain p-2" />
                </button>
              ))}
            </div>

            {/* Main image */}
            <div
              className="order-1 relative aspect-square overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm sm:order-2"
            >
              <Image
                src={product.images[activeImage].src}
                alt={product.images[activeImage].alt}
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 52vw"
                className="object-contain p-5"
              />
              {selected && (
                <div className="absolute left-5 top-5 rounded-full bg-[#033927] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white">
                  {selected.discount}
                </div>
              )}
              {/* Dot indicators */}
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
            </div>
          </div>

          <aside className="px-1 py-2 sm:px-3 lg:py-4">
            <div className="flex flex-wrap items-center gap-3">
              <Stars rating={product.rating} />
              <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
            </div>

            <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">
              {product.title}
            </h1>
            <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-[#033927]">
              {product.category}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              {product.stockQuantity !== undefined ? (
                <span className="rounded-full border border-[#689c30]/20 bg-[#689c30]/10 px-3 py-1 text-[#033927]">
                  {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of stock"}
                </span>
              ) : null}
              {product.sku ? (
                <span className="rounded-full border border-border/60 bg-background px-3 py-1 text-foreground/70">
                  SKU {product.sku}
                </span>
              ) : null}
              {product.brand ? (
                <span className="rounded-full border border-border/60 bg-background px-3 py-1 text-foreground/70">
                  {product.brand}
                </span>
              ) : null}
            </div>

            <div className="mt-6">
              <div className="text-sm font-semibold">
                Pack size
                {activeOption === null && (
                  <span className="ml-2 text-xs font-normal text-amber-600">— please select a size</span>
                )}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {product.options.map((option, index) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setActiveOption(index)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      activeOption === index
                        ? "border-[#033927] bg-[#033927] text-white"
                        : "border-border bg-background hover:border-[#689c30]/60 hover:bg-[#689c30]/10"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className={`mt-1 block text-xs ${activeOption === index ? "text-white/75" : "text-muted-foreground"}`}>
                      {option.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <span className="font-display text-4xl">
                {selected ? selected.price : product.options[0].price}
              </span>
              <span className="pb-1 text-lg text-muted-foreground line-through">
                {selected ? selected.originalPrice : product.options[0].originalPrice}
              </span>
              {selected && (
                <span className="mb-1 rounded-full bg-[#033927] px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
                  {selected.discount}
                </span>
              )}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <div className="inline-flex h-12 items-center rounded-full border border-border bg-background p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  className="grid h-10 w-10 place-items-center rounded-full text-black transition-colors hover:bg-[#689c30] hover:!text-black"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" aria-hidden />
                </button>
                <span className="min-w-12 text-center text-sm font-bold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.min(12, value + 1))}
                  className="grid h-10 w-10 place-items-center rounded-full text-black transition-colors hover:bg-[#689c30] hover:!text-black"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <button
                type="button"
                onClick={addQuantityToCart}
                disabled={activeOption === null}
                className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold text-white transition-colors ${
                  activeOption === null
                    ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                    : "bg-[#033927] hover:bg-[#689c30] hover:!text-black"
                }`}
              >
                <ShoppingBag className="h-4 w-4" aria-hidden />
                {activeOption === null ? "Select a pack size" : "Add to Cart"}
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-border/60 bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Truck className="h-4 w-4 text-[#689c30]" aria-hidden />
                Check delivery
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={pincode}
                  onChange={(event) => setPincode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter pincode"
                  className="h-11 min-w-0 flex-1 rounded-full border border-border bg-card px-4 text-sm outline-none transition focus:border-[#689c30]"
                />
                <button
                  type="button"
                  onClick={() => setCheckedPin(pincode)}
                  className="h-11 rounded-full bg-[#033927] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#689c30] hover:!text-black"
                >
                  Check
                </button>
              </div>
              {checkedPin && (
                <p className="mt-3 flex items-center gap-2 text-sm text-[#689c30]">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Delivery available to {checkedPin}. Dispatch in 24-48 hours.
                </p>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Genuine product", ShieldCheck],
                ["Farm tested", PackageCheck],
                ["Fast dispatch", Truck],
              ].map(([label, Icon]) => (
                <div key={label as string} className="rounded-2xl bg-background p-3 text-center text-xs font-medium">
                  <Icon className="mx-auto mb-2 h-4 w-4 text-[#689c30]" aria-hidden />
                  {label as string}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[#033927]">
              Product Details
            </div>
            <h2 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">
              Built for visible field performance.
            </h2>
            {product.description.includes("<") ? (
              <div
                className="mt-5 space-y-3 leading-7 text-foreground/72"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <p className="mt-5 leading-7 text-foreground/72">{product.description}</p>
            )}
          </div>

          <div className="space-y-3">
            {DETAIL_SECTIONS.map((section) => {
              const isOpen = openDetails.includes(section)
              return (
                <div key={section} className="rounded-3xl border border-border/50 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleDetail(section)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-display text-xl hover:text-[#689c30]"
                  >
                    {section}
                    <ChevronDown
                      className="h-5 w-5"
                      aria-hidden
                    />
                  </button>
                  {isOpen && (
                    <ul className="space-y-2 border-t border-border/50 px-5 py-5 text-sm leading-6 text-foreground/72">
                      {detailMap[section].map((item) => (
                        <li key={item} className="flex gap-2">
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#689c30]" aria-hidden />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {product.video.src ? (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[#033927]">
                Product Video
              </div>
              <h2 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">
                See how farmers use it in the field.
              </h2>
              <p className="mt-4 text-foreground/70">{product.video.caption}</p>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-white shadow-sm">
              <div className="relative aspect-video">
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  src={product.video.src}
                  poster={product.video.poster}
                  muted
                  loop
                  autoPlay
                  playsInline
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white sm:p-7">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-white/70">
                      Demo preview
                    </div>
                    <h3 className="mt-2 font-display text-2xl">{product.video.title}</h3>
                  </div>
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/20 backdrop-blur-md">
                    <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[#033927]">
              Recommended Products
            </div>
            <h2 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">
              You May Also Like
            </h2>
          </div>
        </div>

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
    </main>
  )
}
