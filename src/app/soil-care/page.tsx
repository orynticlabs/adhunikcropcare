import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ChevronRight, Droplets, Gauge, Layers3, Leaf, Microscope, Sprout } from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import HeaderServer from "@/components/layout/header-server"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"
import FarmersNotCustomersSection from "@/components/home/farmers-not-customers-section"
import CropSuccessStories from "@/components/home/crop-success-stories"

export const metadata: Metadata = {
  title: "Soil Care | Adhunik Crop Care",
  description: "Explore soil conditioners, pH support, root-zone care, and practical soil health solutions.",
}

const LAYERS = [
  ["01", "Surface", "Residue, water entry, temperature, and early biological activity.", "bg-[#d7b982]"],
  ["02", "Root zone", "Structure, air, moisture, nutrient exchange, and active roots.", "bg-[#a9794f] text-white"],
  ["03", "Foundation", "Compaction, drainage, mineral balance, and long-term field response.", "bg-[#65452f] text-white"],
]

export default function SoilCarePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f1eee5] text-[#2d3029]">
      <AnnouncementBar /><HeaderServer /><CartDrawer />
      <main>
        <section className="relative overflow-hidden pb-24 pt-36 sm:pt-44">
          <div className="absolute inset-y-0 right-0 hidden w-[45%] lg:block">
            <Image src="https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=1400&q=90" alt="Rich healthy agricultural soil" fill priority sizes="45vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#f1eee5] via-transparent to-transparent" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4">
            <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-[#7e776a]">
              <Link href="/">Home</Link><ChevronRight className="h-3.5 w-3.5" /><span className="text-[#689c30]">Soil Care</span>
            </nav>
            <div className="mt-14 max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#e2dac8] px-4 py-2 text-xs font-bold uppercase tracking-[.18em]"><Layers3 className="h-4 w-4 text-[#689c30]" />Look beneath the crop</span>
          <h1 className="mt-7 font-display text-4xl leading-[.92] sm:text-6xl lg:text-[7rem]">Good harvests have <span className="block italic text-[#8b6645]">deep foundations.</span></h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-[#69675f]">Soil care begins with structure, moisture, pH, biology, and roots working as one connected environment.</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#soil-profile" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#033927] px-7 text-sm font-bold text-white transition-colors hover:bg-[#689c30] hover:!text-black">Read the profile <ArrowRight className="h-4 w-4" /></a>
                <Link href="/contact" className="inline-flex h-12 items-center rounded-full bg-[#033927] px-7 text-sm font-bold text-white transition-colors hover:bg-[#689c30] hover:!text-black">Discuss your soil</Link>
              </div>
            </div>
          </div>
        </section>

        <section id="soil-profile" className="bg-[#e3d7c3] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
              <div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#689c30]">The soil profile</p><h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">Three layers.<br />One living system.</h2></div>
              <div className="overflow-hidden rounded-[2.5rem] shadow-2xl">
                {LAYERS.map(([number, title, copy, tone]) => (
                  <div key={number} className={`grid gap-5 border-b border-black/10 p-7 last:border-0 sm:grid-cols-[70px_160px_1fr] sm:items-center ${tone}`}>
                    <span className="font-display text-4xl opacity-45">{number}</span><h3 className="font-display text-3xl">{title}</h3><p className="leading-7 opacity-75">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-6 lg:grid-cols-4">
              <div className="rounded-[2.5rem] bg-[#254737] p-8 text-white lg:col-span-2 lg:row-span-2">
                <Microscope className="h-8 w-8 text-[#e9c46a]" /><p className="mt-16 text-xs font-bold uppercase tracking-[.2em] text-[#bdd879]">Field diagnosis</p>
                <h2 className="mt-4 font-display text-4xl sm:text-5xl">Treat the condition, not only the symptom.</h2>
                <p className="mt-6 max-w-lg leading-7 text-white/65">Yellowing, weak roots, poor water entry, or uneven growth may begin below ground. Good decisions start by connecting visible symptoms with soil conditions.</p>
              </div>
              {[[Gauge,"Reaction","Understand pH and nutrient availability."],[Droplets,"Moisture","Improve infiltration, holding, and drainage."],[Sprout,"Roots","Create space for active, healthy root growth."],[Leaf,"Biology","Support organic matter and living processes."]].map(([Icon,title,copy]) => { const I=Icon as typeof Leaf; return <div key={title as string} className="rounded-[2.2rem] bg-white p-7"><I className="h-6 w-6 text-[#689c30]" /><h3 className="mt-10 font-display text-3xl">{title as string}</h3><p className="mt-3 leading-6 text-[#6b716b]">{copy as string}</p></div>})}
            </div>
          </div>
        </section>

        <section className="bg-[#254737] py-20 text-white sm:py-28">
          <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#e9c46a]">Soil-care range</p><h2 className="mt-4 font-display text-4xl sm:text-5xl">Tools for the root environment.</h2></div><Link href="/products?q=Soil%20Care" className="font-bold text-[#bdd879]">View all soil products →</Link></div>
            <div className="mt-12 rounded-[2.3rem] border border-dashed border-white/20 bg-white/10 p-10 text-center text-white/75">
              Published soil-care products are loaded from OryCMS on the main products page.
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
