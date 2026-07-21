import AnnouncementBar from "@/components/layout/announcement-bar"
import CartDrawer from "@/features/cart/components/cart-drawer"
import CropSuccessStories from "@/components/home/crop-success-stories"
import Header from "@/components/layout/header"
import ProductDetailView, { ProductDetail } from "@/features/products/components/product-detail-view"
import SiteFooter from "@/components/layout/site-footer"
import TestimonialsCarousel from "@/components/home/testimonials-carousel"
import { Leaf } from "lucide-react"
import {
  ensureProductImages,
  getPublishedOryCMSProductBySlug,
  listOryCMSProducts,
  productPrimaryImage,
  type OryCMSProductDTO,
} from "@/lib/orycms/products"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export function generateStaticParams() {
  return []
}

const inr = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  style: "currency",
})

function formatINR(amount: number) {
  return inr.format(amount)
}

function comparePrice(amount: number, uplift = 1.2) {
  return formatINR(Math.ceil((amount * uplift) / 10) * 10)
}

function discountLabel(price: number, originalPrice: number) {
  if (originalPrice <= price) return "Best Price"

  return `${Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF`
}

function mapOryCMSProductToDetail(
  product: OryCMSProductDTO,
  recommended: OryCMSProductDTO[] = [],
): ProductDetail {
  const images = ensureProductImages(product).map((image) => ({
    alt: image.name || product.name,
    src: image.url,
  }))
  const packs =
    product.packSizes.length > 0
      ? product.packSizes
      : [{ price: product.salePrice ?? product.price, size: `1 ${product.unit}` }]
  const options = packs.map((pack) => {
    const original = product.salePrice && product.price > product.salePrice ? product.price : pack.price

    return {
      discount: discountLabel(pack.price, original),
      label: pack.size,
      originalPrice: comparePrice(original, original === pack.price ? 1.2 : 1),
      price: formatINR(pack.price),
    }
  })

  return {
    benefits:
      product.tags.length > 0
        ? product.tags.map((tag) => `${tag} support for healthier crop performance.`)
        : [product.shortDescription],
    brand: product.brand,
    category: product.category,
    description: product.fullDescription || product.shortDescription,
    dosage: packs.map((pack) => `${pack.size}: use as recommended by crop, soil condition, and agronomist guidance.`),
    howToUse: product.howToUse,
    images,
    ingredients: [
      product.brand ? `${product.brand} formulation` : `${product.category} formulation`,
      `${product.unit} based pack unit`,
      "Quality agricultural input for field use",
    ],
    options,
    rating: 4.8,
    recommended: recommended.slice(0, 4).map((item) => ({
      badge: item.featured ? "Featured" : item.category,
      desc: item.shortDescription,
      img: productPrimaryImage(item),
      images: ensureProductImages(item).map((image) => image.url),
      name: item.name,
      price: formatINR(item.salePrice ?? item.price),
      rating: "4.8",
      slug: item.slug,
    })),
    reviews: 120,
    safety: [
      "Use gloves while handling and wash hands after application.",
      "Keep away from children, animal feed, and drinking water.",
      "Follow label guidance and local agronomy recommendations.",
    ],
    shippingReturns: product.shippingReturns,
    shortDescription: product.shortDescription,
    sku: product.sku,
    slug: product.slug,
    specifications: product.specifications,
    stockQuantity: product.stockQuantity,
    storage: [
      "Store in a cool, dry, and shaded place.",
      "Keep the pack tightly closed after opening.",
      "Avoid direct sunlight and high heat exposure.",
    ],
    title: product.name,
    unit: product.unit,
    usage: [
      "Apply during the recommended crop stage for best results.",
      "Use with adequate soil moisture or irrigation support where applicable.",
      "Avoid mixing with incompatible chemicals unless advised by an agronomist.",
    ],
    video: {
      caption: product.shortDescription,
      poster: productPrimaryImage(product),
      src: "",
      title: product.name,
    },
  }
}

async function loadProduct(slug: string) {
  try {
    const product = await getPublishedOryCMSProductBySlug(slug)
    if (!product) return null

    const allProducts = await listOryCMSProducts({ publishedOnly: true })
    return mapOryCMSProductToDetail(
      product,
      allProducts.filter((item) => item.id !== product.id),
    )
  } catch {
    return null
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await loadProduct(slug)

  if (!product) notFound()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <Header />
      <CartDrawer />
      <ProductDetailView product={product} />

      {/* Testimonials — "Farmers, not customers." */}
      <section className="relative overflow-hidden py-12 sm:py-16 bg-gradient-to-b from-accent/20 to-transparent">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mx-auto max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[#033927]">
              <Leaf className="h-3 w-3" aria-hidden /> Voices from the field
            </div>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight">
              Farmers, not customers.
            </h2>
          </div>

          <TestimonialsCarousel />
        </div>
      </section>

      {/* "Watch Results. Trust Performance." */}
      <CropSuccessStories />

      <SiteFooter />
    </div>
  )
}
