import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle2, ChevronRight, FlaskConical, ShieldCheck, Sprout } from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import HeaderServer from "@/components/layout/header-server"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"
import FarmersNotCustomersSection from "@/components/home/farmers-not-customers-section"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Fungicides Manufacturer in India | Adhunik Crop Care",
  description:
    "High performance fungicides including Mancozeb, Copper Oxychloride & Hexaconazole protecting crops from leaf spots, blights, rust, & mildew.",
  keywords: [
    "fungicides manufacturer in India",
    "Mancozeb fungicide manufacturer",
    "Copper Oxychloride India",
    "Hexaconazole fungicide",
    "seed treatment fungicides",
    "organic fungicides for fruits and grapes",
    "blight leaf spot rust control India",
  ],
  openGraph: {
    title: "Fungicides Manufacturer in India | Adhunik Crop Care",
    description:
      "High performance fungicides including Mancozeb, Copper Oxychloride & Hexaconazole protecting crops from leaf spots, blights, rust, & mildew.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fungicides Manufacturer in India | Adhunik Crop Care",
    description:
      "High performance fungicides including Mancozeb, Copper Oxychloride & Hexaconazole protecting crops from leaf spots, blights, rust, & mildew.",
  },
}

const FUNGICIDE_PRODUCTS = [
  { name: "Mancozeb", desc: "Broad-spectrum contact fungicide effective against early & late blights, rust, and downy mildew." },
  { name: "Copper Oxychloride", desc: "Proven copper-based fungicide controlling bacterial leaf spots, blights, and fruit rot." },
  { name: "Hexaconazole", desc: "Systemic triazole fungicide providing protective and curative action against powdery mildew and sheath blight." },
  { name: "Combination Fungicides", desc: "Dual-action synergistic blends preventing resistance buildup and ensuring season-long crop safety." },
  { name: "Seed Treatment Fungicides", desc: "Protects germinating seeds and young seedlings from soil-borne and seed-borne fungal pathogens." },
  { name: "Organic Fruit & Grape Fungicides", desc: "Eco-friendly organic disease control formulated for grapes, apples, pomegranates, and berries." },
]

const TARGET_DISEASES = [
  "Leaf Spot & Sheath Blight",
  "Powdery & Downy Mildew",
  "Rust & Smut Diseases",
  "Anthracnose & Fruit Rot",
  "Damping Off & Root Rot",
  "Bacterial & Fungal Blights",
]

export default function FungicidesPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <AnnouncementBar />
      <HeaderServer />
      <CartDrawer />

      <main>
        {/* Hero Section */}
        <section className="relative isolate overflow-hidden bg-[#063a2a] pt-32 pb-20 text-white sm:pt-40 sm:pb-28">
          <Image
            src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1800&q=90"
            alt="Fungicide disease control in crop fields"
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
              <span className="text-[#bdd879]">Fungicides</span>
            </nav>

            <div className="mt-8 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#e9c46a] backdrop-blur">
                <FlaskConical className="h-4 w-4" />
                Leading Fungicide Manufacturer in India
              </div>
              <h1 className="mt-6 font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                High Performance <span className="text-[#bdd879] italic">Fungicides</span> for Complete Disease Protection
              </h1>
              <p className="mt-6 text-base leading-relaxed text-white/80 sm:text-lg">
                Adhunik Crop Care manufactures superior quality fungicides in India including <strong>Mancozeb</strong>, <strong>Copper Oxychloride</strong>, and <strong>Hexaconazole</strong> to safeguard crops from leaf spots, blights, mildew, rust, and anthracnose throughout the growing cycle.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/products?category=Fungicides"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-bold text-black shadow-xl transition-colors hover:bg-[#689c30] hover:!text-white"
                >
                  Explore Fungicides <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/bulk-support"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-[#689c30] px-7 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white hover:!text-[#033927]"
                >
                  Dealer & Distribution Inquiry
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Product Selection */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Our Selection of Crop Fungicides
              </h2>
              <p className="mt-4 text-foreground/75">
                From preventive seed treatments to combination post-infection therapeutics, our fungicides maintain plant health in grains, pulses, fruits, and vegetables.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FUNGICIDE_PRODUCTS.map((item) => (
                <div
                  key={item.name}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-[#689c30]"
                >
                  <h3 className="font-display text-lg font-bold text-[#033927]">{item.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Target Diseases Grid */}
        <section className="bg-muted/40 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-widest text-[#689c30]">
                Effective Protection
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
                Targeted Disease Control Across Crop Types
              </h2>
              <p className="mt-4 text-foreground/75">
                Our fungicides help farmers take control of fungal threats early to preserve foliage, ensure robust grain filling, and harvest clean market-grade produce.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {TARGET_DISEASES.map((disease) => (
                  <div key={disease} className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
                    <CheckCircle2 className="h-5 w-5 text-[#689c30]" />
                    <span className="font-medium text-foreground/90">{disease}</span>
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
