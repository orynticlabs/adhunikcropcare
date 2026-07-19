import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Leaf,
  PackageCheck,
  Recycle,
  ShieldCheck,
  Sparkles,
  Sprout,
  SunMedium,
  Waves,
} from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import Header from "@/components/layout/header"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"

export const metadata: Metadata = {
  title: "Organic Range | Adhunik Crop Care",
  description:
    "Discover compost, vermicompost, neem cake, and organic plant care solutions created for living soil and resilient crops.",
}

const CYCLE = [
  {
    number: "01",
    icon: Recycle,
    title: "Return",
    copy: "Organic material is returned to the field instead of being treated as waste.",
  },
  {
    number: "02",
    icon: Waves,
    title: "Rebuild",
    copy: "Better structure helps soil hold moisture, air, and nutrients around active roots.",
  },
  {
    number: "03",
    icon: Sprout,
    title: "Regenerate",
    copy: "Living soil supports steady crop establishment and a more resilient field system.",
  },
]

const STANDARDS = [
  [Leaf, "Plant-based choices", "Thoughtful inputs selected to support crop and soil health."],
  [ShieldCheck, "Responsible formulations", "Designed for practical use within integrated farm programs."],
  [PackageCheck, "Clear field guidance", "Straightforward dosage, application, storage, and safety information."],
  [Sparkles, "Quality-minded process", "Consistent products prepared for dependable farm application."],
] as const

export default function OrganicRangePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f3f0e8] text-[#203129]">
      <AnnouncementBar />
      <Header />
      <CartDrawer />

      <main>
        <section className="relative isolate min-h-[760px] overflow-hidden pt-36 sm:pt-44">
          <Image
            src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1800&q=90"
            alt="Hands nurturing healthy organic soil and young plants"
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(24,46,34,.74)_0%,rgba(24,46,34,.52)_48%,rgba(24,46,34,.1)_100%)]" />
          <div className="absolute -left-20 top-32 h-72 w-72 rounded-full border border-[#e9c46a]/20" />
          <div className="absolute left-4 top-48 h-40 w-40 rounded-full border border-[#e9c46a]/20" />

          <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div className="text-white">
              <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                <Link href="/" className="hover:text-white">Home</Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-[#d5dfaa]">Organic Range</span>
              </nav>
              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
                <Leaf className="h-3.5 w-3.5 text-[#e9c46a]" />
                Grown from a respect for living soil
              </div>
              <h1 className="mt-7 max-w-3xl font-display text-5xl leading-[.95] tracking-tight sm:text-7xl lg:text-[5.6rem]">
                Farm in rhythm
                <span className="block italic text-[#d5dfaa]">with nature.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
                Organic plant care that helps return goodness to the soil—through
                compost, neem-based inputs, natural nourishment, and field-ready guidance.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="#organic-products"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-[#033927] px-7 text-sm font-bold text-white shadow-xl transition-colors hover:bg-[#689c30] hover:!text-black"
                >
                  Discover the range <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center rounded-full bg-[#033927] px-7 text-sm font-semibold text-white shadow-xl transition-colors hover:bg-[#689c30] hover:!text-black"
                >
                  Plan organic nutrition
                </Link>
              </div>
            </div>

            <div className="relative hidden min-h-[500px] lg:block">
              <div className="absolute right-4 top-0 h-[390px] w-[310px] rotate-3 overflow-hidden rounded-[10rem_10rem_2.5rem_2.5rem] border border-white/20 shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=900&q=90"
                  alt="Healthy organic crop growth"
                  fill
                  sizes="310px"
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-0 left-2 h-[280px] w-[230px] -rotate-3 overflow-hidden rounded-[2.5rem_2.5rem_8rem_8rem] border-8 border-[#f3f0e8] shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=700&q=90"
                  alt="Organic soil and crop roots"
                  fill
                  sizes="230px"
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-12 right-0 rounded-[2rem] bg-[#f3f0e8] p-5 text-[#203129] shadow-2xl">
                <p className="font-display text-4xl">Soil first.</p>
                <p className="mt-1 text-xs uppercase tracking-[0.15em] text-[#667369]">Every season after.</p>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-[#172f24]/80 backdrop-blur">
            <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:grid-cols-4">
              {[
                ["Organic", "Matter"],
                ["Living", "Soil"],
                ["Steady", "Nutrition"],
                ["Resilient", "Crops"],
              ].map(([value, label]) => (
                <div key={value} className="border-white/10 px-4 py-5 text-center sm:border-r last:border-r-0">
                  <p className="font-display text-xl text-[#e9c46a]">{value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-20 sm:py-28">
          <div className="absolute right-0 top-12 h-72 w-72 translate-x-1/2 rounded-full bg-[#d5dfaa]/35 blur-3xl" />
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
              <div className="relative mx-auto aspect-square w-full max-w-lg">
                <div className="absolute inset-8 rounded-full border border-[#9aab71]/40" />
                <div className="absolute inset-20 rounded-full border border-dashed border-[#9aab71]/60" />
                <div className="absolute inset-[31%] grid place-items-center rounded-full bg-[#1b4938] text-center text-white shadow-2xl">
                  <div>
                    <Leaf className="mx-auto h-7 w-7 text-[#e9c46a]" />
                    <p className="mt-2 font-display text-2xl">Living soil</p>
                  </div>
                </div>
                {CYCLE.map(({ number, icon: Icon, title }, index) => {
                  const positions = [
                    "left-1/2 top-0 -translate-x-1/2",
                    "bottom-[8%] right-0",
                    "bottom-[8%] left-0",
                  ]
                  return (
                    <div key={number} className={`absolute ${positions[index]} w-36 rounded-3xl bg-white p-4 text-center shadow-[0_16px_40px_rgba(43,62,48,.12)]`}>
                      <Icon className="mx-auto h-5 w-5 text-[#689c30]" />
                      <p className="mt-2 text-[10px] font-bold tracking-[0.16em] text-[#9a7a35]">{number}</p>
                      <p className="font-display text-xl">{title}</p>
                    </div>
                  )
                })}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#689c30]">The organic cycle</p>
                <h2 className="mt-4 font-display text-4xl leading-tight sm:text-6xl">
                  What leaves the soil
                  <span className="block text-[#689c30]">should nourish it again.</span>
                </h2>
                <p className="mt-6 max-w-xl text-base leading-7 text-[#5f6b62]">
                  Organic farming is a cycle of return, renewal, and response. The range
                  is built around improving the root environment—not chasing only the
                  next visible flush of growth.
                </p>
                <div className="mt-8 space-y-5">
                  {CYCLE.map(({ number, title, copy }) => (
                    <div key={number} className="flex gap-4 border-t border-[#cfd8ca] pt-5">
                      <span className="font-display text-2xl text-[#9a7a35]">{number}</span>
                      <div>
                        <h3 className="font-display text-2xl">{title}</h3>
                        <p className="mt-1 leading-6 text-[#667369]">{copy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="organic-products" className="bg-[#203e31] py-20 text-white sm:py-28">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#e9c46a]">Organic essentials</p>
                <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight sm:text-6xl">
                  Simple inputs. Deeper field value.
                </h2>
              </div>
              <Link href="/products?q=Organic" className="inline-flex items-center gap-2 text-sm font-bold text-[#d5dfaa] hover:text-white">
                View all organic products <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-12 rounded-[2.25rem] border border-dashed border-white/20 bg-white/10 p-10 text-center text-white/75">
              Published organic products are loaded from OryCMS on the main products page.
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4">
            <div className="overflow-hidden rounded-[2.75rem] border border-[#d5d8cc] bg-white shadow-[0_20px_60px_rgba(43,62,48,.08)]">
              <div className="grid lg:grid-cols-[.9fr_1.1fr]">
                <div className="relative min-h-[420px]">
                  <Image
                    src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1000&q=90"
                    alt="Farmer working with organic soil inputs"
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#172f24]/60 to-transparent" />
                  <div className="absolute bottom-7 left-7 right-7 rounded-3xl bg-[#f3f0e8]/90 p-5 backdrop-blur">
                    <p className="font-display text-2xl">Made for real field routines.</p>
                    <p className="mt-1 text-sm text-[#667369]">Clear, practical, and easy to integrate season after season.</p>
                  </div>
                </div>
                <div className="p-8 sm:p-12 lg:p-14">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#689c30]">The Adhunik standard</p>
                  <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
                    Organic should still feel precise.
                  </h2>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {STANDARDS.map(([Icon, title, copy]) => (
                      <div key={title} className="rounded-3xl bg-[#eef1e8] p-5">
                        <Icon className="h-6 w-6 text-[#689c30]" />
                        <h3 className="mt-5 font-display text-2xl">{title}</h3>
                        <p className="mt-2 text-sm leading-6 text-[#667369]">{copy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="relative overflow-hidden rounded-[2.75rem] bg-[#d5dfaa] px-7 py-12 sm:px-12 lg:flex lg:items-center lg:justify-between lg:px-16">
              <SunMedium className="absolute -right-10 -top-16 h-64 w-64 text-white/25" strokeWidth={0.8} />
              <div className="relative max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#53653d]">
                  <CheckCircle2 className="h-4 w-4" /> Start with the soil
                </div>
                <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
                  Build an organic program around your field.
                </h2>
              </div>
              <Link
                href="/contact"
                className="relative mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#033927] px-7 text-sm font-bold text-white shadow-xl transition-colors hover:bg-[#689c30] hover:!text-black lg:mt-0"
              >
                Get organic guidance <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
