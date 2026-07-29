import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ChevronRight, ClipboardCheck, MapPinned, Sprout, UsersRound } from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import Header from "@/components/layout/header"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"
import FarmersNotCustomersSection from "@/components/home/farmers-not-customers-section"
import CropSuccessStories from "@/components/home/crop-success-stories"

export const metadata: Metadata = {
  title: "Crop Protection Programs & Advisory | Adhunik Crop Care",
  description:
    "Crop-specific protection programs for rice, cotton, tomato, okra, fruits & vegetables. Integrated pest control for healthier crops & profits.",
  keywords: [
    "Rice pest control India",
    "Cotton pest management",
    "Tomato pest control chemicals",
    "Okra pest control",
    "Sunflower insect management",
    "Fruit tree insect control",
    "Corn earworm management",
    "Vegetable crop protection",
  ],
  openGraph: {
    title: "Crop Protection Programs & Advisory | Adhunik Crop Care",
    description:
      "Crop-specific protection programs for rice, cotton, tomato, okra, fruits & vegetables. Integrated pest control for healthier crops & profits.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crop Protection Programs & Advisory | Adhunik Crop Care",
    description:
      "Crop-specific protection programs for rice, cotton, tomato, okra, fruits & vegetables. Integrated pest control for healthier crops & profits.",
  },
}

const SERVICES = [
  [MapPinned, "Field understanding", "Share your crop, location, and growing conditions to begin a useful conversation."],
  [ClipboardCheck, "Season planning", "Build a simple, stage-wise plan for nutrition, soil care, and crop protection."],
  [Sprout, "Product guidance", "Compare suitable product options and application information before you buy."],
]

const CROP_SOLUTIONS = [
  { crop: "Rice Pest Control", desc: "Targeted protection against stem borers, leaf folders, & brown plant hoppers in paddy fields." },
  { crop: "Cotton Pest Management", desc: "Effective control of bollworms, whiteflies, aphids, & sucking pests in cotton farming." },
  { crop: "Tomato Pest Control", desc: "Comprehensive solutions against fruit borers, whiteflies, leaf miners, & early blight." },
  { crop: "Okra Pest Control", desc: "Specialized protection for shoot and fruit borers, yellow vein mosaic virus vectors." },
  { crop: "Sunflower Pest Control", desc: "Protects sunflower crops against head caterpillars, cutworms, and sucking insect attack." },
  { crop: "Fruit Tree Insect Control", desc: "Targeted sprays for mango hopper, citrus psylla, apple codling moth, & pomegranate fruit borer." },
  { crop: "Corn Earworm Management", desc: "Field-tested formulations controlling corn earworms, fall armyworms, & stalk borers." },
  { crop: "Potato Beetle Control", desc: "Protects potato crops against Colorado potato beetles, tuber moths, & late blight disease." },
  { crop: "Vegetable Crop Protection", desc: "Tailored crop protection schedules for brinjal, chilli, cabbage, cauliflower, & gourds." },
  { crop: "Horticultural Disease Management", desc: "Integrated disease control programs for grapes, pomegranates, citrus, & berries." },
]

export default function FarmerServicesPage() {
  return (
    <div className="min-h-screen bg-[#f5f7f0] text-[#17382d]">
      <AnnouncementBar /><Header /><CartDrawer />
      <main>
        <section className="relative isolate overflow-hidden bg-[#173f31] px-4 pb-20 pt-32 text-white sm:pt-40"><Image src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=1800&q=88" alt="Farmer receiving crop advice in green field" fill priority sizes="100vw" className="-z-20 object-cover opacity-45" /><div className="absolute inset-0 -z-10 bg-[#0c3126]/60" /><div className="mx-auto max-w-7xl"><nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-white/65"><Link href="/">Home</Link><ChevronRight className="h-3.5 w-3.5" /><span>Farmer Services</span></nav><div className="mt-16 grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#d7e99d]">Guidance for the field</p><h1 className="mt-5 font-display text-5xl leading-[.94] sm:text-7xl">Crop-Specific Protection Programs</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/78">Our technical agronomist team develops integrated crop management solutions helping Indian farmers achieve healthier crops and higher farm profitability.</p></div><Link href="/contact" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-bold text-[#033927] transition-colors hover:bg-[#033927] hover:!text-white">Ask a crop question <ArrowRight className="h-4 w-4" /></Link></div></div></section>

        {/* Crop Specific Protection Programs Section */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-[#689c30]">Integrated Crop Management</span>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-5xl">Targeted Solutions for Various Crops</h2>
            <p className="mt-4 text-foreground/75 leading-relaxed">Explore customized pest and disease protection programs developed specifically for your crop varieties and growing conditions.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CROP_SOLUTIONS.map((item) => (
              <div key={item.crop} className="rounded-2xl border border-border bg-white p-6 shadow-sm hover:border-[#689c30] transition">
                <h3 className="font-display text-xl font-bold text-[#033927]">{item.crop}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:py-20 border-t border-border/40">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#689c30]">How support works</p><h2 className="mt-4 font-display text-4xl leading-tight sm:text-6xl">From a question to a clearer next step.</h2></div>
            <p className="max-w-xl leading-7 text-[#607069]">Every farm is different. These steps keep the conversation focused on your crop stage, field conditions, and practical chemical and biological choices.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {SERVICES.map(([Icon, title, copy], index) => { const ServiceIcon = Icon as typeof Sprout; return <article key={title as string} className="rounded-[2rem] border border-[#d9e3d4] bg-white p-7 shadow-sm"><span className="font-display text-5xl text-[#689c30]/20">0{index + 1}</span><ServiceIcon className="mt-10 h-7 w-7 text-[#2f6c42]" /><h3 className="mt-5 font-display text-3xl">{title as string}</h3><p className="mt-3 leading-7 text-[#65736b]">{copy as string}</p></article> })}
          </div>
        </section>

        <section className="bg-[#dce9cf] px-4 py-16 sm:py-20"><div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-[2.5rem] bg-[#123f31] p-8 text-white sm:p-12 lg:flex-row lg:items-center lg:justify-between"><div><UsersRound className="h-8 w-8 text-[#d7e99d]" /><h2 className="mt-5 font-display text-4xl sm:text-5xl">Ready to start a crop conversation?</h2></div><Link href="/contact" className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[#d7e99d] px-7 text-sm font-bold text-[#17382d] transition-colors hover:bg-white hover:text-[#17382d]">Contact support</Link></div></section>

        <FarmersNotCustomersSection />
        <CropSuccessStories />
      </main>
      <SiteFooter />
    </div>
  )
}
