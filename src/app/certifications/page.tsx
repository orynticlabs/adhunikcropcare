import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Check,
  ChevronRight,
  FileCheck2,
  Fingerprint,
  Leaf,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import Header from "@/components/layout/header"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"

export const metadata: Metadata = {
  title: "Certifications & Standards | Adhunik Crop Care",
  description:
    "Explore Adhunik Crop Care quality standards, certification framework, traceability practices, and sustainability commitments.",
}

const CERTIFICATES = [
  {
    code: "01",
    icon: BadgeCheck,
    name: "ISO 9001",
    label: "Quality management",
    copy: "A structured quality framework supporting documented processes, consistency, review, and continuous improvement.",
    tone: "bg-[#dce9cb]",
  },
  {
    code: "02",
    icon: ShieldCheck,
    name: "Product stewardship",
    label: "Responsible handling",
    copy: "Clear attention to product information, storage, safety communication, and responsible agricultural application.",
    tone: "bg-[#f0dfaa]",
  },
  {
    code: "03",
    icon: Leaf,
    name: "Sustainability",
    label: "Field-conscious progress",
    copy: "A commitment to solutions and operational choices that consider soil, resource use, and long-term farm resilience.",
    tone: "bg-[#d5e5df]",
  },
]

const PROCESS = [
  ["Define", "Standards and responsibilities are documented before work begins."],
  ["Verify", "Records, materials, and processes are checked against defined requirements."],
  ["Review", "Results, feedback, and deviations are examined for corrective action."],
  ["Improve", "Learning is carried forward into products, systems, and field support."],
]

const PRINCIPLES = [
  "Clear product and application information",
  "Documented quality checks and records",
  "Responsible storage and handling guidance",
  "Farmer feedback connected to improvement",
  "Traceable decisions across key processes",
  "Periodic review of operational standards",
]

export default function CertificationsPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#eef2ed] text-[#203129]">
      <AnnouncementBar />
      <Header />
      <CartDrawer />

      <main>
        <section className="relative isolate overflow-hidden bg-[#f5f2e9] pb-20 pt-36 sm:pt-44">
          <div className="absolute left-0 top-0 h-full w-[36%] bg-[#063a2a]" />
          <div className="absolute -right-24 top-20 h-96 w-96 rounded-full border border-[#9eab9d]/30" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-[.75fr_1.25fr] lg:items-center">
            <div className="relative min-h-[520px]">
              <div className="absolute inset-y-0 left-0 right-8 overflow-hidden rounded-[2.75rem] border-8 border-[#f5f2e9] shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1100&q=90"
                  alt="Quality review and certification documentation"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 38vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#062f24]/65 via-transparent to-transparent" />
                <div className="absolute bottom-7 left-7 right-7 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8e8b2]">Evidence over claims</p>
                  <p className="mt-2 font-display text-3xl">Quality becomes trust when it can be verified.</p>
                </div>
              </div>
              <div className="absolute -right-1 top-12 grid h-28 w-28 place-items-center rounded-full border-8 border-[#f5f2e9] bg-[#e9c46a] text-[#17382d] shadow-xl">
                <Award className="h-10 w-10" />
              </div>
            </div>

            <div className="lg:pl-8">
              <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#78847b]">
                <Link href="/" className="hover:text-[#033927]">Home</Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-[#689c30]">Certifications</span>
              </nav>
              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#c7d0c7] bg-white/55 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]">
                <Fingerprint className="h-4 w-4 text-[#689c30]" />
                Standards you can trace
              </div>
              <h1 className="mt-7 font-display text-5xl leading-[.95] tracking-tight sm:text-7xl">
                Trust should leave
                <span className="block italic text-[#689c30]">a clear trail.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-[#5f6b62] sm:text-lg">
                Our certification and quality framework turns intent into documented
                practice—connecting standards, verification, responsibility, and improvement.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#standards" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#033927] px-7 text-sm font-bold text-white shadow-xl transition-colors hover:bg-[#689c30] hover:!text-black">
                  Explore standards <ArrowRight className="h-4 w-4" />
                </a>
                <Link href="/contact" className="inline-flex h-12 items-center rounded-full border border-[#b8c4b9] bg-white px-7 text-sm font-bold">
                  Request information
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="standards" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#689c30]">Our standards framework</p>
                <h2 className="mt-4 font-display text-4xl leading-tight sm:text-6xl">
                  Three layers of confidence.
                </h2>
              </div>
              <p className="max-w-2xl leading-7 text-[#667369] lg:justify-self-end">
                Certification is one part of a broader system. Product responsibility,
                documented quality, and sustainability thinking work together to shape
                how we operate.
              </p>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {CERTIFICATES.map(({ code, icon: Icon, name, label, copy, tone }) => (
                <article key={name} className={`group rounded-[2.5rem] p-8 transition-transform duration-500 hover:-translate-y-2 sm:p-10 ${tone}`}>
                  <div className="flex items-start justify-between">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/65 text-[#033927] shadow-sm">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="font-display text-5xl text-[#033927]/12">{code}</span>
                  </div>
                  <p className="mt-12 text-xs font-bold uppercase tracking-[0.18em] text-[#68805d]">{label}</p>
                  <h3 className="mt-2 font-display text-4xl">{name}</h3>
                  <p className="mt-4 leading-7 text-[#52635a]">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#063a2a] py-20 text-white sm:py-28">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#d8e8b2]">
                  <ScanLine className="h-4 w-4" /> From standard to action
                </div>
                <h2 className="mt-6 font-display text-4xl leading-tight sm:text-6xl">
                  Quality is a loop,
                  <span className="block text-[#bdd879]">not a finish line.</span>
                </h2>
                <p className="mt-6 max-w-lg leading-7 text-white/62">
                  Our working model follows a repeatable path that can be reviewed,
                  corrected, and strengthened over time.
                </p>
              </div>

              <div className="relative">
                <div className="absolute bottom-0 left-[31px] top-0 w-px bg-white/15" />
                <div className="space-y-5">
                  {PROCESS.map(([title, copy], index) => (
                    <div key={title} className="relative grid grid-cols-[64px_1fr] gap-5">
                      <span className="relative z-10 grid h-16 w-16 place-items-center rounded-full border border-white/15 bg-[#0a4433] font-display text-xl text-[#e9c46a]">
                        0{index + 1}
                      </span>
                      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                        <h3 className="font-display text-3xl">{title}</h3>
                        <p className="mt-2 leading-6 text-white/58">{copy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid overflow-hidden rounded-[2.75rem] bg-white shadow-[0_20px_65px_rgba(3,57,39,.08)] lg:grid-cols-[1.1fr_.9fr]">
              <div className="p-8 sm:p-12 lg:p-14">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#689c30]">What the framework supports</p>
                <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
                  Built into everyday decisions.
                </h2>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {PRINCIPLES.map((principle) => (
                    <div key={principle} className="flex gap-3 rounded-2xl bg-[#eef2ed] p-4">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#689c30] text-white">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <p className="text-sm leading-6 text-[#58675e]">{principle}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative min-h-[440px]">
                <Image
                  src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1100&q=90"
                  alt="Team reviewing quality documentation"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#063a2a]/65 to-transparent" />
                <div className="absolute bottom-7 left-7 right-7 rounded-[1.75rem] border border-white/20 bg-white/12 p-5 text-white backdrop-blur-xl">
                  <FileCheck2 className="h-6 w-6 text-[#e9c46a]" />
                  <p className="mt-5 font-display text-2xl">Document. Verify. Improve.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="relative overflow-hidden rounded-[2.75rem] bg-[#e9c46a] px-7 py-12 sm:px-12 lg:flex lg:items-center lg:justify-between lg:px-16">
              <Sparkles className="absolute -right-10 -top-16 h-64 w-64 text-white/25" strokeWidth={0.7} />
              <div className="relative max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#665728]">Need formal documentation?</p>
                <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
                  Connect with our quality team.
                </h2>
              </div>
              <Link href="/contact" className="relative mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#033927] px-7 text-sm font-bold text-white shadow-xl transition-colors hover:bg-[#689c30] hover:!text-black lg:mt-0">
                Request details <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
