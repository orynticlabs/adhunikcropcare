import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle2, ChevronRight, Leaf, ShieldCheck, Sprout } from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import HeaderServer from "@/components/layout/header-server"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"
import FarmersNotCustomersSection from "@/components/home/farmers-not-customers-section"

export const metadata: Metadata = {
  title: "Herbicides Manufacturer in India | Adhunik Crop Care",
  description:
    "Selective & non-selective herbicides including Glyphosate 41 SL. Effective pre & post-emergence weed control for optimal crop nutrient absorption.",
  keywords: [
    "herbicides manufacturer in India",
    "Glyphosate 41 SL manufacturer India",
    "selective herbicides India",
    "non selective herbicide",
    "pre emergence herbicide weed control",
    "post emergence weedicide India",
  ],
  openGraph: {
    title: "Herbicides Manufacturer in India | Adhunik Crop Care",
    description:
      "Selective & non-selective herbicides including Glyphosate 41 SL. Effective pre & post-emergence weed control for optimal crop nutrient absorption.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Herbicides Manufacturer in India | Adhunik Crop Care",
    description:
      "Selective & non-selective herbicides including Glyphosate 41 SL. Effective pre & post-emergence weed control for optimal crop nutrient absorption.",
  },
}

const HERBICIDE_TYPES = [
  {
    title: "Selective Herbicides",
    desc: "Target specific harmful weeds without causing stress or harm to your main crops like cotton, paddy, or sugarcane.",
  },
  {
    title: "Non-Selective Herbicides (e.g. Glyphosate 41 SL)",
    desc: "Provides total weed clearance before planting or along field boundaries, irrigation canals, and non-crop areas.",
  },
  {
    title: "Pre-Emergence Herbicides",
    desc: "Applied to the soil before weed seeds germinate, creating a clean environment for young crop sprouts.",
  },
  {
    title: "Post-Emergence Herbicides",
    desc: "Applied directly to actively growing weeds to arrest weed competition for soil moisture and nutrients.",
  },
]

const KEY_BENEFITS = [
  "Eliminates aggressive weeds competing for water, sunlight, and fertilizer nutrients",
  "Formulated specifically for Indian growing conditions and crop varieties",
  "Improves crop yield potential and overall harvest quality",
  "Reduces manual weeding labor and field management expenses",
  "High-purity technical grade chemical manufacturing",
  "Trusted supply chain and nationwide distributor network",
]

export default function HerbicidesPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <AnnouncementBar />
      <HeaderServer />
      <CartDrawer />

      <main>
        {/* Hero Section */}
        <section className="relative isolate overflow-hidden bg-[#063a2a] pt-32 pb-20 text-white sm:pt-40 sm:pb-28">
          <Image
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&q=90"
            alt="Clean weed-free agricultural field"
            fill
            priority
            className="-z-20 object-cover opacity-35"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#063a2a]/80 via-[#063a2a]/90 to-[#063a2a]" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href="/products" className="hover:text-white">Products</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-[#bdd879]">Herbicides</span>
            </nav>

            <div className="mt-8 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#e9c46a] backdrop-blur">
                <Leaf className="h-4 w-4" />
                Trusted Herbicide Manufacturer in India
              </div>
              <h1 className="mt-6 font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                Advanced Herbicides for <span className="text-[#bdd879] italic">Weed-Free Fields</span>
              </h1>
              <p className="mt-6 text-base leading-relaxed text-white/80 sm:text-lg">
                Adhunik Crop Care manufactures selective and non-selective herbicides in India, including high-grade <strong>Glyphosate 41 SL</strong> and specialized pre & post-emergence weed control formulas designed to maximize plant growth and crop yields.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/products?category=Herbicides"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-bold text-black shadow-xl transition-colors hover:bg-[#689c30] hover:!text-white"
                >
                  Explore Herbicides <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/bulk-support"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-[#689c30] px-7 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white hover:!text-black"
                >
                  Bulk Dealer Inquiry
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Targeted Weed Management Solutions
              </h2>
              <p className="mt-4 text-foreground/75">
                Weed competition deprives crops of vital soil nutrients, moisture, and sunlight. Our herbicides empower farmers in India to maintain clean, highly productive crop ecosystems.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {HERBICIDE_TYPES.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-[#689c30]"
                >
                  <h3 className="font-display text-xl font-bold text-[#033927]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits & Quality */}
        <section className="bg-muted/40 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-widest text-[#689c30]">
                Farmers Choice
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
                Why Indian Farmers Rely on Adhunik Herbicides
              </h2>
              <div className="mt-8 space-y-4">
                {KEY_BENEFITS.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#689c30] mt-0.5" />
                    <span className="text-base text-foreground/80">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <FarmersNotCustomersSection />
      </main>

      <SiteFooter />
    </div>
  )
}
