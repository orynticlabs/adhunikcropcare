import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Boxes, ChevronRight, FileText, Truck } from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import HeaderServer from "@/components/layout/header-server"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"
import FarmersNotCustomersSection from "@/components/home/farmers-not-customers-section"
import CropSuccessStories from "@/components/home/crop-success-stories"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Bulk Orders & Dealer Support | Adhunik Crop Care",
  description:
    "Partner with Adhunik Crop Care as a dealer or distributor. Advanced manufacturing, reliable supply, and premium crop protection chemicals across India.",
  keywords: [
    "pesticide dealer network India",
    "pesticide distributor inquiry",
    "bulk pesticide orders India",
    "fertilizer wholesale supplier",
    "Adhunik Crop Care dealership",
  ],
  openGraph: {
    title: "Bulk Orders & Dealer Support | Adhunik Crop Care",
    description:
      "Partner with Adhunik Crop Care as a dealer or distributor. Advanced manufacturing, reliable supply, and premium crop protection chemicals across India.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bulk Orders & Dealer Support | Adhunik Crop Care",
    description:
      "Partner with Adhunik Crop Care as a dealer or distributor. Advanced manufacturing, reliable supply, and premium crop protection chemicals across India.",
  },
}

export default function BulkSupportPage() {
  return (
    <div className="min-h-screen bg-[#f2f5ee] text-[#17382d]">
      <AnnouncementBar /><HeaderServer /><CartDrawer />
      <main>
        <section className="relative isolate overflow-hidden bg-[#173f31] px-4 pb-20 pt-32 text-white sm:pt-40"><Image src="https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?w=1800&q=88" alt="Agricultural supply and field planning" fill priority sizes="100vw" className="-z-20 object-cover opacity-55" /><div className="absolute inset-0 -z-10 bg-[#0b3428]/55" /><div className="mx-auto max-w-7xl"><nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-white/65"><Link href="/">Home</Link><ChevronRight className="h-3.5 w-3.5" /><span>Bulk Support</span></nav><div className="mt-16 grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#d5dfaa]">For larger requirements</p><h1 className="mt-5 font-display text-5xl leading-[.94] sm:text-7xl">Plan the order before the season starts.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/78">This sample bulk-support page helps growers, institutions, and dealers start a conversation about quantities, delivery planning, and product requirements.</p></div><div className="flex flex-wrap items-center gap-3"><a href="mailto:support@adhunikcropcare.com?subject=Become%20a%20Distributor%20Inquiry" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#d5dfaa] px-6 text-sm font-bold text-[#17382d] transition-colors hover:bg-white hover:text-[#17382d]">Become a Distributor <ArrowRight className="h-4 w-4" /></a><Link href="/contact" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#17382d]">Request bulk support <ArrowRight className="h-4 w-4" /></Link></div></div></div></section>
        <section className="mx-auto max-w-7xl px-4 py-20 sm:py-28"><div className="grid gap-5 md:grid-cols-3"><article className="rounded-[2rem] bg-white p-8 shadow-sm"><Boxes className="h-8 w-8 text-[#689c30]" /><h2 className="mt-12 font-display text-3xl">Requirement review</h2><p className="mt-4 leading-7 text-[#65746c]">Share the products, expected quantities, and crop timeline you are considering.</p></article><article className="rounded-[2rem] bg-[#dce9cf] p-8"><Truck className="h-8 w-8 text-[#315f45]" /><h2 className="mt-12 font-display text-3xl">Delivery planning</h2><p className="mt-4 leading-7 text-[#5c7063]">Discuss delivery location, timing, and practical handling needs before confirming an order.</p></article><article className="rounded-[2rem] bg-[#173f31] p-8 text-white"><FileText className="h-8 w-8 text-[#d5dfaa]" /><h2 className="mt-12 font-display text-3xl">Clear documentation</h2><p className="mt-4 leading-7 text-white/70">Use the enquiry to clarify product, invoice, and support information for your team.</p></article></div></section>

        <FarmersNotCustomersSection />
        <CropSuccessStories />
      </main>
      <SiteFooter />
    </div>
  )
}
