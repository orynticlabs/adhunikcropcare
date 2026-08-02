import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Headphones,
  Leaf,
  Mail,
  MapPin,
  MessageCircle,
  Sprout,
  Users,
} from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import HeaderServer from "@/components/layout/header-server"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"
import ContactEnquiryForm from "@/components/contact/contact-enquiry-form"
import FarmersNotCustomersSection from "@/components/home/farmers-not-customers-section"
import CropSuccessStories from "@/components/home/crop-success-stories"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Contact Adhunik Crop Care | Pesticides Company India",
  description:
    "Contact Adhunik Crop Care for pesticide supplies, agricultural queries, dealer partnerships, and agronomy advice. We are here to serve Indian farmers.",
  keywords: [
    "contact Adhunik Crop Care",
    "pesticides company contact India",
    "agricultural chemical support",
    "dealer distributor inquiry pesticides",
  ],
  openGraph: {
    title: "Contact Adhunik Crop Care | Pesticides Company India",
    description:
      "Contact Adhunik Crop Care for pesticide supplies, agricultural queries, dealer partnerships, and agronomy advice. We are here to serve Indian farmers.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Adhunik Crop Care | Pesticides Company India",
    description:
      "Contact Adhunik Crop Care for pesticide supplies, agricultural queries, dealer partnerships, and agronomy advice. We are here to serve Indian farmers.",
  },
}

const CHANNELS = [
  {
    icon: Sprout,
    title: "Crop guidance",
    copy: "Discuss crop stage, field condition, product selection, and application planning.",
    action: "Ask an agronomist",
    href: "mailto:support@adhunikcropcare.com?subject=Crop%20Guidance",
  },
  {
    icon: Headphones,
    title: "Order support",
    copy: "Get assistance with product availability, an existing order, delivery, or account questions.",
    action: "Email support",
    href: "mailto:support@adhunikcropcare.com?subject=Order%20Support",
  },
  {
    icon: Users,
    title: "Business enquiries",
    copy: "Connect regarding dealership, distribution, wholesale, institutional, or partnership requirements.",
    action: "Start a conversation",
    href: "mailto:support@adhunikcropcare.com?subject=Business%20Enquiry",
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f0f4f1] text-[#203129]">
      <AnnouncementBar />
      <HeaderServer />
      <CartDrawer />

      <main>
        <section className="relative isolate overflow-hidden bg-[#063a2a] pb-32 pt-36 text-white sm:pt-44">
          <Image
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&q=90"
            alt="Indian farmland representing Adhunik Crop Care farmer support"
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(3,57,39,.74),rgba(3,57,39,.5)_55%,rgba(3,57,39,.14))]" />
          <div className="absolute -right-20 top-10 h-[430px] w-[430px] rounded-full border border-white/10" />
          <div className="absolute right-10 top-40 h-[210px] w-[210px] rounded-full border border-white/10" />

          <div className="mx-auto max-w-7xl px-4">
            <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-[#c9df93]">Contact Us</span>
            </nav>
            <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_.8fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
                  <MessageCircle className="h-3.5 w-3.5 text-[#e9c46a]" />
                  Let&apos;s talk about your field
                </div>
                <h1 className="mt-7 max-w-4xl font-display text-4xl leading-[.98] tracking-tight sm:text-6xl lg:text-[5.7rem]">
                  The right answer starts
                  <span className="block text-[#bdd879]">with a conversation.</span>
                </h1>
              </div>
              <p className="max-w-lg text-base leading-7 text-white/68 sm:text-lg">
                Whether you need crop advice, product assistance, or want to work with
                Adhunik Crop Care, tell us what you are trying to solve. We will guide
                your enquiry to the right team.
              </p>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-20">
          <div className="mx-auto grid max-w-7xl gap-5 px-4 lg:grid-cols-3">
            {CHANNELS.map(({ icon: Icon, title, copy, action, href }, index) => (
              <article
                key={title}
                className="group rounded-[2.25rem] border border-white/70 bg-white p-7 shadow-[0_18px_55px_rgba(3,57,39,.11)] transition-transform duration-500 hover:-translate-y-2 sm:p-8"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#dce9cb] text-[#033927]">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="font-display text-5xl text-[#033927]/10">0{index + 1}</span>
                </div>
                <h2 className="mt-9 font-display text-3xl">{title}</h2>
                <p className="mt-3 min-h-20 leading-6 text-[#667369]">{copy}</p>
                <a href={href} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#033927]">
                  {action} <ArrowRight className="h-4 w-4" />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#689c30]">Send an enquiry</p>
              <h2 className="mt-4 font-display text-4xl leading-tight sm:text-6xl">
                Tell us what&apos;s happening.
              </h2>
              <p className="mt-6 max-w-md leading-7 text-[#667369]">
                Share a few useful details so our team can understand your requirement
                before responding.
              </p>

              <div className="mt-10 space-y-5">
                {[
                  [Clock3, "Response window", "We aim to respond within one business day."],
                  [Mail, "Email", "support@adhunikcropcare.com"],
                  [MapPin, "Service reach", "Supporting farmers and partners across India."],
                ].map(([Icon, title, copy]) => {
                  const InfoIcon = Icon as typeof Leaf
                  return (
                    <div key={title as string} className="flex gap-4 border-t border-[#d5ddd6] pt-5">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e4ebdd] text-[#689c30]">
                        <InfoIcon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-display text-xl">{title as string}</p>
                        <p className="mt-1 text-sm leading-6 text-[#667369]">{copy as string}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <ContactEnquiryForm />
          </div>
        </section>

        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="overflow-hidden rounded-[2.75rem] bg-[#e9c46a]">
              <div className="grid lg:grid-cols-[1.1fr_.9fr]">
                <div className="p-8 sm:p-12 lg:p-14">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#5e5126]">
                    <CheckCircle2 className="h-4 w-4" /> Prefer direct support?
                  </div>
                  <h2 className="mt-5 max-w-xl font-display text-4xl leading-tight text-[#17382d] sm:text-5xl">
                    Reach the team through the channel that suits you.
                  </h2>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <a
                      href="mailto:support@adhunikcropcare.com"
                      className="inline-flex h-12 items-center gap-2 rounded-full bg-[#033927] px-6 text-sm font-bold text-white shadow-xl transition-colors hover:bg-[#689c30] hover:!text-black"
                    >
                      <Mail className="h-4 w-4" /> Email our team
                    </a>
                    <a
                      href="mailto:support@adhunikcropcare.com?subject=Callback%20Request"
                      className="inline-flex h-12 items-center gap-2 rounded-full border border-[#17382d]/20 bg-white/40 px-6 text-sm font-bold text-[#17382d] hover:text-[#17382d]"
                    >
                      <MessageCircle className="h-4 w-4" /> Request a callback
                    </a>
                  </div>
                </div>
                <div className="relative min-h-80">
                  <Image
                    src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1000&q=90"
                    alt="Adhunik Crop Care field support"
                    fill
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#e9c46a]/35 to-transparent lg:bg-gradient-to-r" />
                </div>
              </div>
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
