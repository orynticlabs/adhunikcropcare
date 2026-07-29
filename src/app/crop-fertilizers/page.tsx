import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Check,
  ChevronRight,
  Droplets,
  FlaskConical,
  Gauge,
  Leaf,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  Wheat,
} from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import HeaderServer from "@/components/layout/header-server"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"
import FarmersNotCustomersSection from "@/components/home/farmers-not-customers-section"
import CropSuccessStories from "@/components/home/crop-success-stories"

export const metadata: Metadata = {
  title: "Bio Fertilizers & Plant Nutrition | Adhunik Crop Care",
  description:
    "Innovative bio fertilizers, Bio DAP, micronutrients & plant growth promoters enhancing root growth, soil fertility, and crop yields across India.",
  keywords: [
    "bio fertilizer manufacturing company in India",
    "Bio DAP manufacturer India",
    "plant growth promoters India",
    "soil conditioners",
    "micronutrient formulations agriculture",
  ],
  openGraph: {
    title: "Bio Fertilizers & Plant Nutrition | Adhunik Crop Care",
    description:
      "Innovative bio fertilizers, Bio DAP, micronutrients & plant growth promoters enhancing root growth, soil fertility, and crop yields across India.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bio Fertilizers & Plant Nutrition | Adhunik Crop Care",
    description:
      "Innovative bio fertilizers, Bio DAP, micronutrients & plant growth promoters enhancing root growth, soil fertility, and crop yields across India.",
  },
}

const PROGRAMS = [
  {
    stage: "01",
    icon: Sprout,
    title: "Root & establishment",
    copy: "A strong start with phosphorus-led nutrition and biological support for a wider, more active root zone.",
    tone: "bg-[#dce9cb]",
  },
  {
    stage: "02",
    icon: Sun,
    title: "Vegetative growth",
    copy: "Balanced NPK and micronutrients designed to support canopy development, colour, and crop vigour.",
    tone: "bg-[#f2df9c]",
  },
  {
    stage: "03",
    icon: Wheat,
    title: "Flowering & harvest",
    copy: "Potassium-forward nutrition for flowering, fruit development, grain filling, quality, and resilience.",
    tone: "bg-[#d3e7de]",
  },
]

const BENEFITS = [
  "Crop-stage focused formulations",
  "Suitable for integrated nutrient programs",
  "Clear application and dosage guidance",
  "Options for soil, drip, and foliar use",
]

export default function CropFertilizersPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <AnnouncementBar />
      <HeaderServer />
      <CartDrawer />

      <main>
        <section className="relative isolate overflow-hidden bg-[#063a2a] pb-44 pt-32 text-white sm:pb-36 sm:pt-40 lg:min-h-[760px] lg:pb-24 lg:pt-44">
          <Image
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&q=90"
            alt="Healthy crop field supported by balanced fertilizer nutrition"
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(105deg,rgba(3,57,39,.74)_5%,rgba(3,57,39,.5)_49%,rgba(3,57,39,.1)_100%)]" />
          <div className="absolute -right-24 top-20 h-[420px] w-[420px] rounded-full border border-white/15" />
          <div className="absolute -right-4 top-40 h-[260px] w-[260px] rounded-full border border-white/15" />

          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-4 lg:pb-24">
            <div>
              <nav className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-white/60">
                <Link href="/" className="hover:text-white">Home</Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-[#c9df93]">Crop Fertilizers</span>
              </nav>
              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-[#e9c46a]" />
                Nutrition engineered for Indian fields
              </div>
              <h1 className="mt-7 max-w-3xl font-display text-4xl leading-[.98] tracking-tight sm:text-6xl lg:text-[5.7rem]">
                Feed the crop.
                <span className="block text-[#bdd879]">Build the soil.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-white/72 sm:text-lg">
                A complete crop nutrition range that brings balanced NPK, micronutrients,
                biological activity, and practical field guidance into one clear program.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="#fertilizer-range"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-[#033927] px-7 text-sm font-bold text-white shadow-xl transition-colors hover:bg-[#689c30] hover:!text-black"
                >
                  Explore the range <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center rounded-full bg-white px-7 text-sm font-semibold text-[#033927] shadow-xl transition-colors hover:bg-[#033927] hover:!text-white"
                >
                  Ask an agronomist
                </Link>
              </div>
            </div>

            <div className="relative mx-auto hidden w-full max-w-xl lg:block">
              <div className="relative ml-auto aspect-[5/4] w-[88%] overflow-hidden rounded-[2.5rem] border border-white/20 shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1000&q=90"
                  alt="Agronomist inspecting a healthy crop"
                  fill
                  sizes="38vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#032b20]/70 via-transparent to-white/5" />
                <div className="absolute bottom-6 left-6 max-w-xs">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8e8b2]">Field promise</p>
                  <p className="mt-2 font-display text-3xl">Right nutrient. Right stage.</p>
                </div>
              </div>
              <div className="relative -mt-10 mr-12 grid grid-cols-3 overflow-hidden rounded-[2rem] border border-white/60 bg-white text-[#17382d] shadow-2xl">
                {[
                  [Leaf, "Soil", "Foundation"],
                  [Droplets, "Drip", "Precision"],
                  [Sparkles, "Foliar", "Response"],
                ].map(([Icon, title, label]) => {
                  const MethodIcon = Icon as typeof Leaf
                  return (
                    <div key={title as string} className="border-r border-[#dce5df] p-5 last:border-r-0">
                      <MethodIcon className="h-5 w-5 text-[#689c30]" />
                      <p className="mt-4 font-display text-xl">{title as string}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#6d7d73]">{label as string}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-white/8 backdrop-blur-md">
            <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/10 px-4 sm:grid-cols-4">
              {[
                ["Balanced", "Crop nutrition"],
                ["Flexible", "Application"],
                ["Tested", "Field approach"],
                ["Supported", "By agronomists"],
              ].map(([value, label]) => (
                <div key={value} className="px-4 py-5 text-center">
                  <p className="font-display text-xl text-[#d8e8b2]">{value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/50">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-20 sm:py-28">
          <div className="absolute left-0 top-28 h-72 w-72 -translate-x-1/2 rounded-full bg-[#689c30]/10 blur-3xl" />
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#689c30]">The nutrition pathway</p>
                <h2 className="mt-4 font-display text-4xl leading-tight sm:text-6xl">
                  One field.
                  <span className="block text-[#689c30]">Three decisive moments.</span>
                </h2>
              </div>
              <p className="max-w-2xl text-base leading-7 text-foreground/65 lg:justify-self-end">
                Fertilizer works best as a planned sequence, not a single application.
                Our stage-based approach helps farmers match nutrition to what the crop
                is trying to achieve at that moment.
              </p>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {PROGRAMS.map(({ stage, icon: Icon, title, copy, tone }) => (
                <article key={stage} className={`${tone} group rounded-[2.25rem] p-7 transition-transform duration-500 hover:-translate-y-2 sm:p-9`}>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-5xl text-[#033927]/18">{stage}</span>
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/65 text-[#033927] shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <h3 className="mt-12 font-display text-3xl text-[#17382d]">{title}</h3>
                  <p className="mt-4 leading-7 text-[#40584e]">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="fertilizer-range" className="bg-[#e5ece7] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#689c30]">Featured formulations</p>
                <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight sm:text-6xl">
                  A smarter shelf for every crop plan.
                </h2>
              </div>
              <Link href="/products?q=Fertilizers" className="inline-flex items-center gap-2 text-sm font-bold text-[#033927]">
                View all fertilizers <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-12 rounded-[2.25rem] border border-dashed border-[#033927]/20 bg-white p-10 text-center text-[#40584e]">
              Published fertilizer products are loaded from OryCMS on the main products page.
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4">
            <div className="overflow-hidden rounded-[2.75rem] bg-[#063a2a] text-white shadow-2xl">
              <div className="grid lg:grid-cols-[1.1fr_.9fr]">
                <div className="p-8 sm:p-12 lg:p-16">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[#d8e8b2]">
                    <ShieldCheck className="h-4 w-4" /> Built for field confidence
                  </div>
                  <h2 className="mt-7 font-display text-4xl leading-tight sm:text-6xl">
                    Nutrition that fits the way you farm.
                  </h2>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {BENEFITS.map((benefit) => (
                      <div key={benefit} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#bdd879] text-[#033927]">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm leading-6 text-white/75">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px bg-white/10">
                  {[
                    [FlaskConical, "Balanced formulas", "Macro + micro nutrition"],
                    [Droplets, "Flexible use", "Drip and foliar options"],
                    [Gauge, "Efficient uptake", "Purpose-led application"],
                    [Leaf, "Soil mindful", "Integrated crop programs"],
                  ].map(([Icon, title, copy]) => {
                    const FeatureIcon = Icon as typeof Leaf
                    return (
                      <div key={title as string} className="bg-[#0a4433] p-6 sm:p-8 lg:flex lg:flex-col lg:justify-end">
                        <FeatureIcon className="h-7 w-7 text-[#bdd879]" />
                        <h3 className="mt-8 font-display text-xl sm:text-2xl">{title as string}</h3>
                        <p className="mt-2 text-xs leading-5 text-white/50 sm:text-sm">{copy as string}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="relative overflow-hidden rounded-[2.75rem] bg-[#e9c46a] px-7 py-12 text-[#17382d] sm:px-12 lg:flex lg:items-center lg:justify-between lg:px-16">
              <div className="absolute -right-12 -top-24 font-display text-[18rem] leading-none text-white/18">N</div>
              <div className="relative max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em]">Not sure where to begin?</p>
                <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
                  Start with your crop, soil, and growth stage.
                </h2>
              </div>
              <Link
                href="/contact"
                className="relative mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#033927] px-7 text-sm font-bold text-white shadow-xl transition-colors hover:bg-[#689c30] hover:!text-black lg:mt-0"
              >
                Get crop guidance <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <FarmersNotCustomersSection />
        <CropSuccessStories />
      </main>

      <SiteFooter />
    </div>
  )
}
