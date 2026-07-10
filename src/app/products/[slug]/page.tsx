import AnnouncementBar from "@/components/layout/announcement-bar"
import CartDrawer from "@/features/cart/components/cart-drawer"
import Header from "@/components/layout/header"
import ProductDetailView, { ProductDetail } from "@/features/products/components/product-detail-view"
import SiteFooter from "@/components/layout/site-footer"

const PRODUCT: ProductDetail = {
  title: "Adhunik Bio NPK",
  category: "Bio Fertilizer",
  rating: 4.8,
  reviews: 284,
  images: [
    {
      src: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=85",
      alt: "Adhunik Bio NPK product pack with healthy crop background",
    },
    {
      src: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&q=85",
      alt: "Organic soil and crop nutrition application",
    },
    {
      src: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=85",
      alt: "Field crop treated with Adhunik Bio NPK",
    },
    {
      src: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=85",
      alt: "Farmland result after balanced nutrition program",
    },
  ],
  options: [
    { label: "1 kg", price: "₹ 349", originalPrice: "₹ 499", discount: "30% OFF" },
    { label: "5 kg", price: "₹ 1,249", originalPrice: "₹ 1,799", discount: "31% OFF" },
    { label: "25 kg", price: "₹ 5,499", originalPrice: "₹ 7,250", discount: "24% OFF" },
  ],
  description:
    "Adhunik Bio NPK is a premium bio-fertilizer formulated with beneficial microbial cultures that help improve nutrient availability, root activity, and crop vigor. It supports balanced nitrogen, phosphorus, and potassium uptake while helping farmers improve soil biological activity over repeated applications.",
  benefits: [
    "Improves nutrient uptake for stronger vegetative growth.",
    "Supports healthy root development and crop establishment.",
    "Helps improve soil microbial activity and long-term fertility.",
    "Compatible with integrated nutrient management programs.",
    "Useful across vegetables, cereals, pulses, fruits, and plantation crops.",
  ],
  usage: [
    "Apply during early growth stage or as recommended by an agronomist.",
    "Mix with well-decomposed compost, farmyard manure, or soil before broadcasting.",
    "Maintain adequate soil moisture after application for best microbial activity.",
    "Avoid mixing directly with strong chemical pesticides or fungicides.",
  ],
  dosage: [
    "Seed treatment: 10-20 g per kg seed, depending on crop requirement.",
    "Soil application: 1-2 kg per acre with compost or farmyard manure.",
    "Nursery application: 5-10 g per square meter mixed into growing media.",
    "Repeat application after 30-45 days for long-duration crops if required.",
  ],
  ingredients: [
    "Nitrogen-fixing beneficial microbes.",
    "Phosphate-solubilizing microbial cultures.",
    "Potash-mobilizing microbial cultures.",
    "Organic carrier material suitable for field application.",
  ],
  safety: [
    "Use gloves while handling and wash hands after application.",
    "Keep away from children, animal feed, and drinking water.",
    "Do not inhale dust during mixing or broadcasting.",
    "For agricultural use only.",
  ],
  storage: [
    "Store in a cool, dry, and shaded place.",
    "Keep the pack tightly closed after opening.",
    "Avoid direct sunlight and high heat exposure.",
    "Use before expiry date for best microbial performance.",
  ],
  video: {
    title: "Bio NPK Field Application Demo",
    caption:
      "Watch a muted preview of Bio NPK being used in field conditions, with practical application flow and farmer result context.",
    src: "https://cdn.shopify.com/videos/c/vp/1fd4b8e04f13460c9ebea85425f8bbba/1fd4b8e04f13460c9ebea85425f8bbba.SD-480p-0.9Mbps-83328126.mp4",
    poster:
      "https://cdn.shopify.com/s/files/1/0579/7924/0580/files/ebd18c8c-45b7-46f7-ae6b-875404629700_thumbnail.jpg?v=1777898677",
  },
  recommended: [
    {
      name: "Vermi+ Compost 25kg",
      desc: "Organic compost for soil structure, microbial activity, and steady crop nutrition.",
      price: "₹ 599",
      img: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=700&q=80",
      badge: "Organic",
      rating: "4.7",
    },
    {
      name: "NeemGuard Spray 1L",
      desc: "Bio pest support for reducing crop damage in integrated protection schedules.",
      price: "₹ 449",
      img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&q=80",
      badge: "Bio Pesticide",
      rating: "4.6",
    },
    {
      name: "SoilRich Booster",
      desc: "Soil conditioner designed to improve root zone response and nutrient efficiency.",
      price: "₹ 899",
      img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=700&q=80",
      badge: "Soil Care",
      rating: "4.8",
    },
    {
      name: "MyCo Root Power",
      desc: "Mycorrhiza-based root support for improved crop stand and establishment.",
      price: "₹ 749",
      img: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=700&q=80",
      badge: "Bio",
      rating: "4.7",
    },
  ],
}

export function generateStaticParams() {
  return [{ slug: "adhunik-bio-npk" }]
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  await params

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <Header />
      <CartDrawer />
      <ProductDetailView product={PRODUCT} />
      <SiteFooter />
    </div>
  )
}
