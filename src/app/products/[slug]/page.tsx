import AnnouncementBar from "@/components/layout/announcement-bar"
import CartDrawer from "@/features/cart/components/cart-drawer"
import CropSuccessStories from "@/components/home/crop-success-stories"
import HeaderServer from "@/components/layout/header-server"
import ProductDetailView, { ProductDetail } from "@/features/products/components/product-detail-view"
import SiteFooter from "@/components/layout/site-footer"
import {
  ensureProductImages,
  getBestSellingProducts,
  getPublishedOryCMSProductBySlug,
  listOryCMSProducts,
  productPrimaryImage,
  type OryCMSProductDTO,
} from "@/lib/orycms/products"
import { listOryCMSReelVideos } from "@/lib/orycms/reel-videos"
import { notFound } from "next/navigation"

export const revalidate = 300 // 5-minute ISR — serves cached HTML, re-renders in background

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

function mapToRecommendedDTO(item: OryCMSProductDTO) {
  return {
    badge: item.featured ? "Featured" : item.category,
    desc: item.shortDescription,
    img: productPrimaryImage(item),
    images: ensureProductImages(item).map((image) => image.url),
    name: item.name,
    price: formatINR(item.salePrice ?? item.price),
    rating: "4.8",
    slug: item.slug,
  }
}

async function loadProduct(slug: string) {
  try {
    const [product, allProducts] = await Promise.all([
      getPublishedOryCMSProductBySlug(slug),
      listOryCMSProducts({ publishedOnly: true }),
    ])
    if (!product) return null

    // Ensure current product is strictly excluded from all recommendation sections
    const otherProducts = allProducts.filter((item) => item.id !== product.id && item.slug !== product.slug)

    const currentCat = product.category?.trim().toLowerCase() || ""

    // 1. Similar products: same category from database
    const similar = otherProducts
      .filter((item) => (item.category?.trim().toLowerCase() || "") === currentCat)
      .map(mapToRecommendedDTO)

    // 2. You May Also Like: different categories from database
    const different = otherProducts
      .filter((item) => (item.category?.trim().toLowerCase() || "") !== currentCat)
      .map(mapToRecommendedDTO)

    // 3. Top Rated Farmers' Choice: best sellers sorted by highest order sales from storefront_orders table
    const sortedBestSellers = await getBestSellingProducts(otherProducts)
    const bestSellers = sortedBestSellers.map(mapToRecommendedDTO)

    const baseDetail = mapOryCMSProductToDetail(product, otherProducts)

    return {
      ...baseDetail,
      similarProducts: similar,
      differentCategoryProducts: different,
      bestSellerProducts: bestSellers,
    }
  } catch {
    return null
  }
}

async function getPublishedReels() {
  try {
    return (await listOryCMSReelVideos({ publishedOnly: true })).map((reel) => ({
      farmer: reel.farmer,
      location: reel.location,
      product: reel.title,
      result: reel.result,
      thumbnail: reel.posterUrl,
      video: reel.videoUrl,
    }))
  } catch {
    return []
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [product, reels] = await Promise.all([loadProduct(slug), getPublishedReels()])

  if (!product) notFound()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <HeaderServer />
      <CartDrawer />
      <ProductDetailView product={product} />

      {/* "Watch Results. Trust Performance." */}
      <CropSuccessStories stories={reels} />

      <SiteFooter />
    </div>
  )
}
