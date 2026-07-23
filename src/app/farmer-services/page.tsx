import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ChevronRight, ClipboardCheck, MapPinned, Sprout, UsersRound } from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import Header from "@/components/layout/header"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"

export const metadata: Metadata = {
  title: "Farmer Services | Adhunik Crop Care",
  description: "Explore practical field guidance, crop planning, and farmer support from Adhunik Crop Care.",
}

const SERVICES = [
  [MapPinned, "Field understanding", "Share your crop, location, and growing conditions to begin a useful conversation."],
  [ClipboardCheck, "Season planning", "Build a simple, stage-wise plan for nutrition, soil care, and crop protection."],
  [Sprout, "Product guidance", "Compare suitable product options and application information before you buy."],
]

export default function FarmerServicesPage() {
  return (
    <div className="min-h-screen bg-[#f5f7f0] text-[#17382d]">
      <AnnouncementBar /><Header /><CartDrawer />
      <main>
        <section className="relative isolate overflow-hidden px-4 pb-20 pt-32 sm:pt-40">
          <Image src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1800&q=88" alt="Farmer checking a healthy crop" fill priority sizes="100vw" className="-z-20 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#073b2f]/85 via-[#073b2f]/65 to-[#073b2f]/30" />
          <div className="mx-auto max-w-7xl py-10 text-white sm:py-20">
            <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-white/65"><Link href="/">Home</Link><ChevronRight className="h-3.5 w-3.5" /><span>Farmer Services</span></nav>
            <div className="mt-14 max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[.22em] text-[#d7e99d]">Practical support</p>
              <h1 className="mt-4 font-display text-5xl leading-[.95] sm:text-7xl">Better decisions begin in the field.</h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/78">Use this sample support page to learn how crop conversations, seasonal planning, and product guidance can work together.</p>
              <Link href="/contact" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#d7e99d] px-7 text-sm font-bold text-[#17382d] transition hover:bg-white">Talk to our team <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:py-28">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#689c30]">How support works</p><h2 className="mt-4 font-display text-4xl leading-tight sm:text-6xl">From a question to a clearer next step.</h2></div>
            <p className="max-w-xl leading-7 text-[#607069]">Every farm is different. These example steps keep the conversation focused on the crop stage, field conditions, and practical choices available to you.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {SERVICES.map(([Icon, title, copy], index) => { const ServiceIcon = Icon as typeof Sprout; return <article key={title as string} className="rounded-[2rem] border border-[#d9e3d4] bg-white p-7 shadow-sm"><span className="font-display text-5xl text-[#689c30]/20">0{index + 1}</span><ServiceIcon className="mt-10 h-7 w-7 text-[#2f6c42]" /><h3 className="mt-5 font-display text-3xl">{title as string}</h3><p className="mt-3 leading-7 text-[#65736b]">{copy as string}</p></article> })}
          </div>
        </section>

        <section className="bg-[#dce9cf] px-4 py-16 sm:py-20"><div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-[2.5rem] bg-[#123f31] p-8 text-white sm:p-12 lg:flex-row lg:items-center lg:justify-between"><div><UsersRound className="h-8 w-8 text-[#d7e99d]" /><h2 className="mt-5 font-display text-4xl sm:text-5xl">Ready to start a crop conversation?</h2></div><Link href="/contact" className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[#d7e99d] px-7 text-sm font-bold text-[#17382d]">Contact support</Link></div></section>
      </main>
      <SiteFooter />
    </div>
  )
}
