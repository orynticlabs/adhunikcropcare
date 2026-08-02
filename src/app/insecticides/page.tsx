import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Bug, CheckCircle2, ChevronRight, ShieldCheck, Sparkles, Sprout } from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import HeaderServer from "@/components/layout/header-server"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"
import FarmersNotCustomersSection from "@/components/home/farmers-not-customers-section"
import CropSuccessStories from "@/components/home/crop-success-stories"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Insecticides Manufacturer in India | Adhunik Crop Care",
  description:
    "Premium insecticides controlling sucking pests, borers & caterpillars. Formulations with Chlorpyrifos, Emamectin, Cypermethrin & Chlorantraniliprole.",
  keywords: [
    "insecticide manufacturer in India",
    "insecticides manufacturers in India",
    "Chlorpyrifos manufacturer India",
    "Emamectin Benzoate 5 SG",
    "Cypermethrin insecticide",
    "Chlorantraniliprole India",
    "pest control chemicals for cotton paddy",
  ],
  openGraph: {
    title: "Insecticides Manufacturer in India | Adhunik Crop Care",
    description:
      "Premium insecticides controlling sucking pests, borers & caterpillars. Formulations with Chlorpyrifos, Emamectin, Cypermethrin & Chlorantraniliprole.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Insecticides Manufacturer in India | Adhunik Crop Care",
    description:
      "Premium insecticides controlling sucking pests, borers & caterpillars. Formulations with Chlorpyrifos, Emamectin, Cypermethrin & Chlorantraniliprole.",
  },
}

const ACTIVE_INGREDIENTS = [
  { name: "Chlorpyrifos", target: "Soil insects, termites & broad-spectrum crop protection" },
  { name: "Emamectin Benzoate 5 SG", target: "Effective control of bollworms & leaf folders in cotton & paddy" },
  { name: "Cypermethrin", target: "Fast knock-down for caterpillars, chewing pests & beetles" },
  { name: "Deltamethrin", target: "Synthetic pyrethroid for sucking pests & fruit borers" },
  { name: "Cartap Hydrochloride", target: "Stem borer & leaf folder control in paddy & sugarcane" },
  { name: "Chlorantraniliprole", target: "Advanced larvicidal protection with long-lasting control" },
  { name: "Diflubenzuron", target: "Insect growth regulator controlling larval stages" },
  { name: "Malathion", target: "Reliable control against aphids, thrips & spider mites" },
  { name: "Monocrotophos", target: "Systemic insect & mite protection for cash crops" },
]

const WHY_CHOOSE_US = [
  "Trusted insecticide manufacturer in India",
  "Advanced manufacturing facility with automated processes",
  "High-quality technical and EC/WP/SG formulations",
  "Strict quality assurance and laboratory testing",
  "Experienced technical and agronomy R&D team",
  "Reliable dealer and distributor network across India",
  "Wide range of field and horticultural crop protection products",
  "Effective formulas against sucking pests, borers, & termites",
  "Consistent product performance under varying climate conditions",
  "Dedicated customer support and field guidance for farmers",
]

export default function InsecticidesPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <AnnouncementBar />
      <HeaderServer />
      <CartDrawer />

      <main>
        {/* Hero Section */}
        <section className="relative isolate overflow-hidden bg-[#063a2a] pt-32 pb-20 text-white sm:pt-40 sm:pb-28">
          <Image
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1800&q=90"
            alt="Insecticides crop protection for healthy fields"
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
              <span className="text-[#bdd879]">Insecticides</span>
            </nav>

            <div className="mt-8 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#e9c46a] backdrop-blur">
                <Bug className="h-4 w-4" />
                Trusted Insecticide Manufacturer in India
              </div>
              <h1 className="mt-6 font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                Premium Insecticides for <span className="text-[#bdd879] italic">Effective Crop Protection</span>
              </h1>
              <p className="mt-6 text-base leading-relaxed text-white/80 sm:text-lg">
                Adhunik Crop Care is a company that people trust to make insecticides in India. We manufacture a comprehensive selection of crop protection formulas designed to shield cotton, paddy, maize, pulses, tea, sugarcane, and horticultural crops from destructive pests.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/products?category=Insecticides"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-bold text-black shadow-xl transition-colors hover:bg-[#689c30] hover:!text-white"
                >
                  View Insecticides <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/bulk-support"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-[#689c30] px-7 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white hover:!text-black"
                >
                  Dealer & Bulk Inquiry
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Formulations & Target Pests Section */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                High-Level Formulations for Total Pest Control
              </h2>
              <p className="mt-4 text-foreground/75">
                Our insecticide range combines contact, systemic, and seed treatment mechanisms to safeguard crops against sucking pests, stem borers, caterpillars, termites, beetles, aphids, and whiteflies.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ACTIVE_INGREDIENTS.map((item) => (
                <div
                  key={item.name}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-[#689c30] hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#689c30]/15 text-[#033927]">
                      <Bug className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-lg font-bold">{item.name}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.target}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Adhunik Crop Care Section */}
        <section className="bg-muted/40 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#689c30]">
                  Why Choose Adhunik Crop Care?
                </span>
                <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
                  Reliable Insecticide Manufacturing & R&D Excellence
                </h2>
                <p className="mt-4 text-foreground/75 leading-relaxed">
                  Our mission is to help farmers improve crop health, reduce pest losses, and achieve higher productivity through innovative, reliable, and sustainable insecticide solutions built in state-of-the-art facilities in India.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {WHY_CHOOSE_US.map((point) => (
                    <div key={point} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-[#689c30] mt-0.5" />
                      <span className="text-sm text-foreground/80">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative aspect-square overflow-hidden rounded-3xl border border-border shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=90"
                  alt="Healthy green farm protected by Adhunik Crop Care insecticides"
                  fill
                  className="object-cover"
                />
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
