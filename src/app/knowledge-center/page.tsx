import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BookOpen, ChevronRight, PlayCircle, Sprout } from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import Header from "@/components/layout/header"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"

export const metadata: Metadata = { title: "Knowledge Center | Adhunik Crop Care", description: "Sample crop-learning resources, field notes, and practical guides from Adhunik Crop Care." }

const RESOURCES = [
  ["Seasonal note", "Preparing the field before the next crop cycle", "A sample checklist for soil observation, residue management, and input planning."],
  ["How-to guide", "Reading water movement around the root zone", "A practical primer on infiltration, moisture, and timing."],
  ["Field video", "Crop-stage observations worth recording", "Simple notes that make future field decisions easier."],
]

export default function KnowledgeCenterPage() {
  return (
    <div className="min-h-screen bg-[#fbfaf4] text-[#17382d]">
      <AnnouncementBar /><Header /><CartDrawer />
      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-32 sm:pt-40 lg:grid-cols-[1fr_.9fr] lg:items-center lg:pb-24">
          <div><nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#738078]"><Link href="/">Home</Link><ChevronRight className="h-3.5 w-3.5" /><span>Knowledge Center</span></nav><p className="mt-12 text-xs font-bold uppercase tracking-[.22em] text-[#689c30]">Learn in the field</p><h1 className="mt-5 font-display text-5xl leading-[.94] sm:text-7xl">Practical knowledge, ready when you are.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-[#627069]">This sample learning hub brings together field notes, simple guides, and crop-care topics in a format built for everyday decisions.</p><Link href="/products" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#033927] px-7 text-sm font-bold text-white transition hover:bg-[#689c30] hover:!text-black">Explore products <ArrowRight className="h-4 w-4" /></Link></div>
          <div className="relative min-h-[360px] overflow-hidden rounded-[3rem] shadow-xl sm:min-h-[500px]"><Image src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&q=88" alt="Field learning and crop observation" fill priority sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#073b2f]/60 via-transparent to-transparent" /><div className="absolute bottom-6 left-6 rounded-2xl bg-white/88 p-4 backdrop-blur"><BookOpen className="h-6 w-6 text-[#417e34]" /><p className="mt-2 text-sm font-bold">Sample learning library</p></div></div>
        </section>

        <section className="border-y border-[#e2e8da] bg-[#eff4e9] py-16 sm:py-20"><div className="mx-auto max-w-7xl px-4"><div className="flex items-end justify-between gap-6"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#689c30]">Featured resources</p><h2 className="mt-4 font-display text-4xl sm:text-5xl">Start with the basics.</h2></div><PlayCircle className="hidden h-10 w-10 text-[#689c30] sm:block" /></div><div className="mt-10 grid gap-4 lg:grid-cols-3">{RESOURCES.map(([type, title, copy]) => <article key={title} className="rounded-[2rem] bg-white p-7 shadow-sm"><span className="text-xs font-bold uppercase tracking-[.17em] text-[#689c30]">{type}</span><h3 className="mt-6 font-display text-3xl leading-tight">{title}</h3><p className="mt-4 leading-7 text-[#68766e]">{copy}</p><Link href="/contact" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#174c37]">Ask a question <ArrowRight className="h-4 w-4" /></Link></article>)}</div></div></section>

        <section className="mx-auto max-w-7xl px-4 py-20"><div className="rounded-[2.5rem] border border-[#dbe5d4] bg-white p-8 text-center sm:p-14"><Sprout className="mx-auto h-9 w-9 text-[#689c30]" /><h2 className="mt-5 font-display text-4xl sm:text-5xl">Need guidance for a specific crop?</h2><p className="mx-auto mt-4 max-w-xl leading-7 text-[#66746c]">Send our team the crop stage and field context. We will use it to guide the next conversation.</p><Link href="/farmer-services" className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-[#033927] px-7 text-sm font-bold text-white">Explore farmer services <ArrowRight className="h-4 w-4" /></Link></div></section>
      </main>
      <SiteFooter />
    </div>
  )
}
