import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowRight, ChevronRight, CloudRain, Droplet, Gauge, Leaf, Radio, Waves } from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import Header from "@/components/layout/header"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"

export const metadata: Metadata = { title: "Irrigation Solutions | Adhunik Crop Care", description: "Explore drip, sprinkler, and water-management solutions for efficient irrigation." }

const FLOW = [
  [CloudRain,"Source","Know water availability, quality, pressure, and seasonal reliability."],
  [Gauge,"Control","Filter, regulate, schedule, and measure before water enters the field."],
  [Waves,"Deliver","Move water evenly through drip lines, sprinklers, or micro systems."],
  [Droplet,"Root zone","Place the right amount where active roots can use it."],
]

export default function IrrigationPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#edf5f2] text-[#17382d]">
      <AnnouncementBar /><Header /><CartDrawer />
      <main>
        <section className="relative min-h-[760px] overflow-hidden pb-24 pt-36 sm:pt-44">
          <Image src="https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=1800&q=90" alt="Irrigated green agricultural field" fill priority sizes="100vw" className="-z-20 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#eaf5f1]/95 via-[#eaf5f1]/72 to-[#eaf5f1]/10" />
          <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-[#718179]"><Link href="/">Home</Link><ChevronRight className="h-3.5 w-3.5" /><span className="text-[#16826d]">Irrigation Solutions</span></nav>
              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#bed7d0] bg-white/55 px-4 py-2 text-xs font-bold uppercase tracking-[.18em]"><Droplet className="h-4 w-4 text-[#16826d]" />Designed around every drop</div>
              <h1 className="mt-7 font-display text-5xl leading-[.92] sm:text-8xl lg:text-[7rem]">Water should move<span className="block italic text-[#16826d]">with purpose.</span></h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-[#5d7069]">Efficient irrigation connects source, pressure, filtration, timing, delivery, and the root zone into one dependable system.</p>
              <div className="mt-9 flex flex-wrap gap-3"><a href="#water-flow" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#033927] px-7 text-sm font-bold text-white transition-colors hover:bg-[#689c30] hover:!text-black">Follow the flow <ArrowDown className="h-4 w-4" /></a><Link href="/contact" className="inline-flex h-12 items-center rounded-full bg-[#033927] px-7 text-sm font-bold text-white transition-colors hover:bg-[#689c30] hover:!text-black">Plan a system</Link></div>
            </div>
            <div className="hidden lg:block"><div className="ml-auto grid w-[470px] grid-cols-2 gap-4">
              <div className="col-span-2 rounded-[2.5rem] bg-[#075949] p-8 text-white shadow-2xl"><Radio className="h-7 w-7 text-[#9bd3c5]" /><p className="mt-12 text-xs font-bold uppercase tracking-[.2em] text-[#9bd3c5]">System signal</p><p className="mt-2 font-display text-4xl">Measure before you irrigate.</p></div>
              <div className="rounded-[2rem] bg-white/85 p-6 backdrop-blur"><p className="font-display text-4xl text-[#16826d]">30–50%</p><p className="mt-2 text-sm text-[#65766f]">Potential water savings with suitable micro-irrigation planning.</p></div>
              <div className="relative min-h-52 overflow-hidden rounded-[2rem]"><Image src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=700&q=88" alt="Precision farm irrigation" fill sizes="230px" className="object-cover" /></div>
            </div></div>
          </div>
        </section>

        <section id="water-flow" className="bg-[#075949] py-20 text-white sm:py-28">
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center"><p className="text-xs font-bold uppercase tracking-[.22em] text-[#9bd3c5]">The water journey</p><h2 className="mt-4 font-display text-5xl sm:text-7xl">From source to root.</h2></div>
            <div className="relative mt-14 grid gap-5 lg:grid-cols-4">
              <div className="absolute left-[12%] right-[12%] top-9 hidden h-px bg-[#9bd3c5]/25 lg:block" />
              {FLOW.map(([Icon,title,copy],i)=>{const I=Icon as typeof Leaf;return <div key={title as string} className="relative rounded-[2.2rem] border border-white/10 bg-white/6 p-7 backdrop-blur"><span className="relative z-10 grid h-16 w-16 place-items-center rounded-full bg-[#9bd3c5] text-[#075949]"><I className="h-6 w-6" /></span><p className="mt-8 text-xs font-bold tracking-[.18em] text-[#e9c46a]">0{i+1}</p><h3 className="mt-2 font-display text-3xl">{title as string}</h3><p className="mt-3 leading-6 text-white/58">{copy as string}</p></div>})}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="relative min-h-[520px] overflow-hidden rounded-[2.75rem] lg:col-span-2"><Image src="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1300&q=90" alt="Modern crop irrigation system" fill sizes="66vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#06483b]/80 via-transparent to-transparent" /><div className="absolute bottom-8 left-8 max-w-xl text-white"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#9bd3c5]">Drip systems</p><h2 className="mt-3 font-display text-5xl">Precision along every row.</h2></div></div>
              <div className="flex flex-col gap-6"><div className="flex-1 rounded-[2.5rem] bg-[#d8eee8] p-8"><Droplet className="h-7 w-7 text-[#16826d]" /><h3 className="mt-12 font-display text-4xl">Micro irrigation</h3><p className="mt-4 leading-7 text-[#60736c]">Low-volume delivery designed around crop spacing and root activity.</p></div><div className="flex-1 rounded-[2.5rem] bg-[#e9c46a] p-8"><Waves className="h-7 w-7" /><h3 className="mt-12 font-display text-4xl">Sprinkler systems</h3><p className="mt-4 leading-7 text-[#62582f]">Flexible coverage for suitable crops, soils, and field dimensions.</p></div></div>
            </div>
          </div>
        </section>

        <section className="pb-24"><div className="mx-auto max-w-7xl px-4"><div className="rounded-[3rem] bg-[#d8eee8] p-8 sm:p-12 lg:flex lg:items-center lg:justify-between lg:p-16"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#16826d]">Build the right system</p><h2 className="mt-4 max-w-3xl font-display text-5xl">Match irrigation to water, crop, soil, and field.</h2></div><Link href="/products?q=Irrigation" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#033927] px-7 font-bold text-white transition-colors hover:bg-[#689c30] hover:!text-black lg:mt-0">Explore irrigation <ArrowRight className="h-4 w-4" /></Link></div></div></section>
      </main>
      <SiteFooter />
    </div>
  )
}
