import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  Handshake,
  HeartHandshake,
  Leaf,
  MapPin,
  ShieldCheck,
  Sprout,
  Users,
} from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import Header from "@/components/layout/header"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"

export const metadata: Metadata = {
  title: "About Us | Adhunik Crop Care",
  description:
    "Learn about Adhunik Crop Care, our farmer-first philosophy, agricultural expertise, and commitment to dependable crop solutions.",
}

const VALUES = [
  {
    icon: Handshake,
    title: "Farmer first",
    copy: "Every product and service begins with a real field need, practical economics, and long-term farmer trust.",
  },
  {
    icon: FlaskConical,
    title: "Science with purpose",
    copy: "We translate crop science into solutions that are clear to use and relevant to Indian growing conditions.",
  },
  {
    icon: Leaf,
    title: "Progress with care",
    copy: "Productivity matters most when it supports healthier soil, responsible use, and resilient farming systems.",
  },
]

const MILESTONES = [
  ["180+", "Projects developed"],
  ["7,500+", "Satisfied clients"],
  ["115+", "Team members"],
  ["100%", "Service commitment"],
]

const PROMISES = [
  "Practical recommendations for crop and growth stage",
  "A broad portfolio spanning nutrition and crop care",
  "Clear product, dosage, safety, and storage guidance",
  "Long-term relationships beyond a single purchase",
]

export default function AboutPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <AnnouncementBar />
      <Header />
      <CartDrawer />

      <main>
        <section className="relative isolate overflow-hidden bg-[#063a2a] pb-44 pt-32 text-white sm:pb-28 sm:pt-40 lg:min-h-[720px] lg:pt-44">
          <Image
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1800&q=90"
            alt="Adhunik Crop Care team working alongside Indian farmers"
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(105deg,rgba(3,57,39,.76)_0%,rgba(3,57,39,.52)_54%,rgba(3,57,39,.12)_100%)]" />
          <div className="absolute -right-28 top-20 h-[480px] w-[480px] rounded-full border border-white/10" />
          <div className="absolute -right-5 top-44 h-[250px] w-[250px] rounded-full border border-white/10" />

          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-4 lg:pb-28">
            <div>
              <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                <Link href="/" className="hover:text-white">Home</Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-[#c9df93]">About Us</span>
              </nav>
              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
                <Sprout className="h-3.5 w-3.5 text-[#e9c46a]" />
                Rooted in Indian agriculture
              </div>
              <h1 className="mt-7 max-w-3xl font-display text-4xl leading-[.98] tracking-tight sm:text-6xl lg:text-[5.6rem]">
                Growing trust,
                <span className="block text-[#bdd879]">one field at a time.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-white/72 sm:text-lg">
                Adhunik Crop Care combines agricultural knowledge, dependable products,
                and farmer-focused service to help Indian farms become more productive,
                resilient, and ready for tomorrow.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="#our-story"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-[#033927] px-7 text-sm font-bold text-white shadow-xl transition-colors hover:bg-[#689c30] hover:!text-black"
                >
                  Discover our story <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center rounded-full bg-[#033927] px-7 text-sm font-semibold text-white shadow-xl transition-colors hover:bg-[#689c30] hover:!text-black"
                >
                  Connect with us
                </Link>
              </div>
            </div>

            <div className="relative hidden min-h-[480px] lg:block">
              <div className="absolute right-0 top-0 aspect-[4/5] w-[360px] overflow-hidden rounded-[3rem] border border-white/20 shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=90"
                  alt="Productive farmland at sunrise"
                  fill
                  sizes="360px"
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-0 left-0 w-64 rounded-[2rem] border-8 border-[#063a2a] bg-white p-6 text-[#17382d] shadow-2xl">
                <HeartHandshake className="h-7 w-7 text-[#689c30]" />
                <p className="mt-6 font-display text-3xl">Partnership over transactions.</p>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-white/8 backdrop-blur-md">
            <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:grid-cols-4">
              {MILESTONES.map(([value, label]) => (
                <div key={label} className="border-white/10 px-4 py-5 text-center sm:border-r last:border-r-0">
                  <p className="font-display text-2xl text-[#d8e8b2]">{value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/50">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="our-story" className="relative py-20 sm:py-28">
          <div className="absolute left-0 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-[#689c30]/10 blur-3xl" />
          <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div className="relative min-h-[420px] sm:min-h-[540px]">
              <div className="absolute left-0 top-0 h-[330px] w-[82%] overflow-hidden rounded-[2rem] sm:h-[440px] sm:w-[78%] sm:rounded-[2.75rem]">
                <Image
                  src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1000&q=90"
                  alt="A healthy crop representing Adhunik Crop Care's growth"
                  fill
                  sizes="(max-width: 1024px) 80vw, 36vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-0 right-0 w-[68%] rounded-[1.75rem] bg-[#e9c46a] p-5 text-[#17382d] shadow-2xl sm:w-[58%] sm:rounded-[2.25rem] sm:p-7">
                <MapPin className="h-6 w-6" />
                <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em]">Our focus</p>
                <p className="mt-2 font-display text-2xl sm:text-3xl">Indian fields. Indian realities.</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#689c30]">Our story</p>
              <h2 className="mt-4 font-display text-4xl leading-tight sm:text-6xl">
                Built where knowledge
                <span className="block text-[#689c30]">meets the field.</span>
              </h2>
              <div className="mt-7 space-y-5 text-base leading-7 text-foreground/68">
                <p>
                  Adhunik Crop Care was shaped by a straightforward belief: farmers
                  deserve solutions that perform in real conditions and guidance they
                  can confidently put into practice.
                </p>
                <p>
                  Our work connects crop protection, plant nutrition, organic care,
                  soil health, and farmer education. This integrated approach helps us
                  look beyond a single problem and support the complete crop journey.
                </p>
                <p>
                  As agriculture evolves, we continue to invest in stronger products,
                  clearer knowledge, and closer relationships with the people who grow
                  the food and raw materials our communities depend on.
                </p>
              </div>
              <Link href="/products" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#033927]">
                Explore our solutions <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-[#e5ece7] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#689c30]">What guides us</p>
              <h2 className="mt-4 font-display text-4xl leading-tight sm:text-6xl">
                Values that show up in every season.
              </h2>
            </div>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {VALUES.map(({ icon: Icon, title, copy }, index) => (
                <article key={title} className="group rounded-[2.25rem] bg-white p-8 shadow-[0_14px_40px_rgba(3,57,39,.07)] transition-transform duration-500 hover:-translate-y-2 sm:p-10">
                  <div className="flex items-center justify-between">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#dce9cb] text-[#033927]">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="font-display text-5xl text-[#033927]/10">0{index + 1}</span>
                  </div>
                  <h3 className="mt-12 font-display text-3xl">{title}</h3>
                  <p className="mt-4 leading-7 text-foreground/62">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4">
            <div className="overflow-hidden rounded-[2.75rem] bg-[#063a2a] text-white shadow-2xl">
              <div className="grid lg:grid-cols-[1.05fr_.95fr]">
                <div className="p-8 sm:p-12 lg:p-16">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[#d8e8b2]">
                    <ShieldCheck className="h-4 w-4" /> Our promise
                  </div>
                  <h2 className="mt-7 font-display text-4xl leading-tight sm:text-6xl">
                    Useful in the field. Responsible for the future.
                  </h2>
                  <div className="mt-8 space-y-4">
                    {PROMISES.map((promise) => (
                      <div key={promise} className="flex gap-3 border-t border-white/10 pt-4">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#bdd879]" />
                        <p className="text-sm leading-6 text-white/72">{promise}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px bg-white/10">
                  {[
                    [Users, "People", "Farmer relationships"],
                    [Award, "Quality", "Dependable standards"],
                    [Sprout, "Growth", "Field-led progress"],
                    [Leaf, "Care", "Soil-conscious thinking"],
                  ].map(([Icon, title, copy]) => {
                    const TileIcon = Icon as typeof Leaf
                    return (
                      <div key={title as string} className="flex min-h-52 flex-col justify-end bg-[#0a4433] p-6 sm:p-8">
                        <TileIcon className="h-7 w-7 text-[#bdd879]" />
                        <h3 className="mt-8 font-display text-2xl">{title as string}</h3>
                        <p className="mt-2 text-sm text-white/50">{copy as string}</p>
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
              <Leaf className="absolute -right-12 -top-16 h-72 w-72 rotate-12 text-white/20" strokeWidth={0.8} />
              <div className="relative max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em]">Grow with Adhunik</p>
                <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
                  Let&apos;s build stronger fields together.
                </h2>
              </div>
              <Link
                href="/contact"
                className="relative mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#033927] px-7 text-sm font-bold text-white shadow-xl transition-colors hover:bg-[#689c30] hover:!text-black lg:mt-0"
              >
                Contact our team <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
