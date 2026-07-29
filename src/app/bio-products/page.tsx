import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Atom, ChevronRight, Dna, FlaskConical, Leaf, Network, Orbit, Sparkles } from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import HeaderServer from "@/components/layout/header-server"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"
import FarmersNotCustomersSection from "@/components/home/farmers-not-customers-section"
import CropSuccessStories from "@/components/home/crop-success-stories"

export const metadata: Metadata = {
  title: "Bio Pesticides & Organics | Adhunik Crop Care India",
  description:
    "Eco-friendly bio pesticides & organic crop protection reducing chemical residues, enriching soil microflora, and supporting sustainable agriculture.",
  keywords: [
    "biopesticides India",
    "bio pesticides manufacturer in India",
    "organic crop protection",
    "reduce chemical residues crops",
    "soil microflora health",
  ],
  openGraph: {
    title: "Bio Pesticides & Organics | Adhunik Crop Care India",
    description:
      "Eco-friendly bio pesticides & organic crop protection reducing chemical residues, enriching soil microflora, and supporting sustainable agriculture.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bio Pesticides & Organics | Adhunik Crop Care India",
    description:
      "Eco-friendly bio pesticides & organic crop protection reducing chemical residues, enriching soil microflora, and supporting sustainable agriculture.",
  },
}

const CULTURES = [
  [Dna,"Nitrogen fixers","Support biological nitrogen availability around active roots."],
  [Orbit,"Phosphate solubilizers","Help mobilize phosphorus held in less available soil forms."],
  [Network,"Mycorrhizal partners","Extend the effective root network for water and nutrient exploration."],
  [Atom,"Potash mobilizers","Support biological movement of potassium within the root environment."],
]

export default function BioProductsPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#eff5ef] text-[#17382d]">
      <AnnouncementBar /><HeaderServer /><CartDrawer />
      <main>
      <section className="relative isolate overflow-hidden bg-[#062f24] pb-16 pt-32 text-white sm:pb-20 sm:pt-40 lg:min-h-[760px] lg:pb-24 lg:pt-44">
          <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:34px_34px]" />
          <div className="absolute left-[58%] top-36 h-80 w-80 rounded-full border border-[#bdd879]/30" /><div className="absolute left-[64%] top-52 h-48 w-48 rounded-full border border-dashed border-[#e9c46a]/40" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-[1fr_.9fr] lg:items-center">
            <div>
              <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-white/50"><Link href="/">Home</Link><ChevronRight className="h-3.5 w-3.5" /><span className="text-[#bdd879]">Bio Products</span></nav>
              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-bold uppercase tracking-[.18em]"><FlaskConical className="h-4 w-4 text-[#e9c46a]" />The living laboratory</div>
          <h1 className="mt-7 font-display text-4xl leading-[.92] sm:text-6xl lg:text-[7rem]">Tiny organisms.<span className="block text-[#bdd879]">Field-scale impact.</span></h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-white/65">Beneficial microbes work where chemistry, roots, moisture, and living soil meet—helping build a more active nutrient environment.</p>
          <div className="mt-9 flex flex-wrap gap-3"><a href="#cultures" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#033927] px-7 text-sm font-bold text-white transition-colors hover:bg-[#689c30] hover:!text-black">Enter the lab <ArrowRight className="h-4 w-4" /></a><Link href="/contact" className="inline-flex h-12 items-center rounded-full bg-[#033927] px-7 text-sm font-bold text-white transition-colors hover:bg-[#689c30] hover:!text-black">Get guidance</Link></div>
            </div>
            <div className="relative hidden aspect-square lg:block">
              <div className="absolute inset-[9%] overflow-hidden rounded-full border border-white/20 shadow-2xl"><Image src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1000&q=90" alt="Biological research laboratory" fill priority sizes="40vw" className="object-cover" /><div className="absolute inset-0 bg-[#064331]/25" /></div>
              {[["N","top-0 left-1/2 -translate-x-1/2"],["P","bottom-[8%] left-0"],["K","bottom-[8%] right-0"]].map(([letter,pos])=><span key={letter} className={`absolute ${pos} grid h-20 w-20 place-items-center rounded-full border-8 border-[#062f24] bg-[#bdd879] font-display text-3xl text-[#17382d]`}>{letter}</span>)}
            </div>
          </div>
        </section>

        <section id="cultures" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4">
          <div className="text-center"><p className="text-xs font-bold uppercase tracking-[.22em] text-[#689c30]">Meet the cultures</p><h2 className="mt-4 font-display text-4xl sm:text-6xl lg:text-7xl">A community below ground.</h2></div>
            <div className="mt-14 grid gap-px overflow-hidden rounded-[2.75rem] bg-[#bfcdbf] sm:grid-cols-2">
            {CULTURES.map(([Icon,title,copy],i)=>{const I=Icon as typeof Leaf;return <div key={title as string} className="relative bg-white p-6 sm:p-10"><span className="absolute right-7 top-5 font-display text-5xl text-[#689c30]/10 sm:text-6xl">0{i+1}</span><I className="h-8 w-8 text-[#689c30]" /><h3 className="mt-12 font-display text-3xl sm:text-4xl">{title as string}</h3><p className="mt-4 max-w-md leading-7 text-[#647269]">{copy as string}</p></div>})}
            </div>
          </div>
        </section>

        <section className="bg-[#dce9cb] py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[10rem_10rem_3rem_3rem]"><Image src="https://images.unsplash.com/photo-1531058020387-3be344556be6?w=1000&q=90" alt="Microbiology culture research" fill sizes="40vw" className="object-cover" /></div>
          <div><Sparkles className="h-8 w-8 text-[#689c30]" /><h2 className="mt-7 font-display text-4xl leading-tight sm:text-6xl lg:text-7xl">Biology needs the right conditions.</h2><p className="mt-6 max-w-xl text-base leading-7 text-[#5e6f63] sm:text-lg sm:leading-8">Microbial inputs are living systems. Moisture, temperature, storage, timing, compatibility, and application practice influence their field performance.</p>
              <div className="mt-9 grid grid-cols-2 gap-4">{["Adequate moisture","Correct storage","Compatible inputs","Timely application"].map(x=><div key={x} className="rounded-2xl bg-white/60 p-4 font-bold">{x}</div>)}</div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4"><div className="rounded-[2rem] bg-[#062f24] p-6 text-white sm:rounded-[3rem] sm:p-12 lg:flex lg:items-center lg:justify-between lg:p-16"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#e9c46a]">Explore the bio range</p><h2 className="mt-4 max-w-3xl font-display text-3xl sm:text-5xl">Bring beneficial biology into your crop program.</h2></div><Link href="/products?q=Bio%20Products" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#bdd879] px-7 font-bold text-[#17382d] transition-colors hover:bg-white hover:text-[#17382d] lg:mt-0">View bio products <ArrowRight className="h-4 w-4" /></Link></div></div>
        </section>

        <FarmersNotCustomersSection />
        <CropSuccessStories />
      </main>
      <SiteFooter />
    </div>
  )
}
