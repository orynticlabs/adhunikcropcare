import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Check,
  Download,
  FileCheck2,
  Leaf,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import HeaderServer from "@/components/layout/header-server"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"
import { listOryCMSCertificates, type OryCMSCertificateDTO } from "@/lib/orycms/certificates"

export const metadata: Metadata = {
  title: "Certifications & Quality | Adhunik Crop Care",
  description: "View Adhunik Crop Care company certificates, quality practices, verification process, and responsible agriculture commitments.",
}

const STANDARDS = [
  { icon: BadgeCheck, title: "Quality systems", copy: "Documented processes help teams work consistently, review outcomes, and improve over time." },
  { icon: ShieldCheck, title: "Product responsibility", copy: "Clear information, responsible handling guidance, and careful review support better field decisions." },
  { icon: Leaf, title: "Responsible progress", copy: "Quality decisions consider soil health, resource use, farm resilience, and long-term agricultural value." },
]

const PROCESS = [
  ["Define", "Set clear standards, ownership, and measurable requirements."],
  ["Verify", "Check materials, records, and processes against those requirements."],
  ["Review", "Study feedback and deviations to identify corrective action."],
  ["Improve", "Carry verified learning into products, systems, and field support."],
]

const PRINCIPLES = [
  "Clear product and application information",
  "Documented quality checks and records",
  "Responsible storage and handling guidance",
  "Farmer feedback connected to improvement",
  "Traceable decisions across key processes",
  "Periodic review of operational standards",
]

async function getCertificates() {
  try { return await listOryCMSCertificates({ publishedOnly: true }) }
  catch { return [] as OryCMSCertificateDTO[] }
}

export default async function CertificationsPage() {
  const certificates = await getCertificates()

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <AnnouncementBar />
      <HeaderServer />
      <CartDrawer />

      <main>
        <section className="relative isolate overflow-hidden bg-[#edf3e9] pb-16 pt-32 sm:pb-20 sm:pt-40 lg:pb-24 lg:pt-44">
          <div className="pointer-events-none absolute -left-24 top-24 -z-10 h-72 w-72 rounded-full bg-[#bdd879]/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 -z-10 h-80 w-80 rounded-full bg-[#e9c46a]/20 blur-3xl" />

          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:gap-16">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#689c30]/20 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#033927]">
                <Award className="h-4 w-4 text-[#689c30]" aria-hidden /> Company credentials
              </div>
              <h1 className="mt-6 max-w-3xl text-balance font-display text-4xl font-semibold leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl">
                Proof behind every
                <span className="block italic text-[#689c30]">quality promise.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-foreground/70 sm:text-lg sm:leading-8">
                Review our published company certificates and understand the practical quality system behind responsible products, reliable support, and continuous improvement.
              </p>
              <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
                <a href="#company-certificates" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground shadow-luxe transition hover:shadow-xl">
                  View certificates <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
                <Link href="/contact" className="inline-flex h-12 items-center justify-center rounded-full border border-[#033927]/15 bg-white/80 px-7 text-sm font-medium shadow-soft hover:bg-white">
                  Request verification
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
              <div className="absolute -right-3 -top-3 h-full w-full rounded-[2rem] border border-[#689c30]/20 bg-[#dfe9d8] sm:-right-5 sm:-top-5 sm:rounded-[2.5rem]" />
              <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-luxe sm:rounded-[2.5rem]">
                <div className="relative h-40 sm:h-52">
                  <Image src="/hero-field-Dp98Y55X.jpg" alt="Agricultural field representing documented crop care quality" fill priority sizes="(max-width: 1024px) 100vw, 46vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#033927]/75 to-[#033927]/15" />
                  <div className="absolute inset-x-6 bottom-5 flex items-end justify-between gap-4 text-white sm:inset-x-8 sm:bottom-7">
                    <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#bdd879]">Verification dossier</p><p className="mt-1 font-display text-2xl sm:text-3xl">Quality record</p></div>
                    <BadgeCheck className="h-9 w-9 text-[#bdd879] sm:h-11 sm:w-11" aria-hidden />
                  </div>
                </div>
                <div className="p-6 sm:p-8">
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    {[[String(certificates.length), "Published"], ["4-step", "Review"], ["Pan India", "Support"]].map(([value, label]) => (
                      <div key={label} className="min-w-0 border-l-2 border-[#bdd879] pl-2.5 sm:pl-4">
                        <div className="truncate font-display text-lg text-[#033927] sm:text-2xl">{value}</div>
                        <div className="mt-1 truncate text-[9px] uppercase tracking-wider text-foreground/50 sm:text-[11px]">{label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-7 space-y-3 border-t border-border/60 pt-6">
                    {["Documented requirements", "Published company records", "Ongoing quality review"].map((item) => (
                      <div key={item} className="flex items-center gap-3 text-sm text-foreground/70"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#edf3e9] text-[#689c30]"><Check className="h-3.5 w-3.5" /></span>{item}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="company-certificates" className="relative py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeading eyebrow="Company certificates" title="Our published credentials." copy="Certificate entries shown here are maintained by the authorised company team through OryCMS." />

            {certificates.length ? (
              <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
                {certificates.map((certificate) => (
                  <article key={certificate.id} className="group overflow-hidden rounded-3xl border border-border/40 bg-card shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-luxe">
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#f5f7f2]">
                      {certificate.image?.url ? (
                        <Image src={certificate.image.url} alt={`${certificate.title} certificate`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]" />
                      ) : <FileCheck2 className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-[#689c30]/35" />}
                      <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#033927] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow">
                        <BadgeCheck className="h-3.5 w-3.5 text-[#bdd879]" /> Verified record
                      </div>
                    </div>
                    <div className="p-5 sm:p-6">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#689c30]">{certificate.issuingAuthority}</p>
                      <h2 className="mt-2 font-display text-2xl leading-tight">{certificate.title}</h2>
                      {certificate.description ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{certificate.description}</p> : null}
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4 text-xs text-muted-foreground">
                        <span>{certificate.certificateNumber ? `No. ${certificate.certificateNumber}` : certificate.issuedOn ? `Issued ${formatDate(certificate.issuedOn)}` : "Company credential"}</span>
                        {certificate.documentUrl ? <a href={certificate.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-[#033927] hover:text-[#689c30]">View document <Download className="h-3.5 w-3.5" /></a> : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-8 overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-[#edf4e7] to-white p-7 text-center shadow-soft sm:mt-10 sm:p-12">
                <Award className="mx-auto h-10 w-10 text-[#689c30]" />
                <h2 className="mt-4 font-display text-3xl">Certificate gallery ready.</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Published company certificates will appear here after they are added in OryCMS under Content → Certificates.</p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-gradient-to-b from-accent/20 via-transparent to-accent/20 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeading eyebrow="Quality framework" title="Confidence beyond a certificate." copy="Documents matter most when the principles behind them shape everyday work." />
            <div className="mt-8 grid gap-5 sm:mt-10 md:grid-cols-3">
              {STANDARDS.map(({ icon: Icon, title, copy }, index) => (
                <article key={title} className="group rounded-3xl border border-border/40 bg-card/80 p-6 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-luxe sm:p-7">
                  <div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#dce9cb] text-[#033927]"><Icon className="h-6 w-6" /></span><span className="font-display text-4xl text-[#033927]/10">0{index + 1}</span></div>
                  <h3 className="mt-7 font-display text-2xl">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:gap-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[#033927]"><ScanLine className="h-3.5 w-3.5" /> From standard to action</div>
              <h2 className="mt-5 font-display text-3xl leading-[1.08] sm:text-5xl">Quality is a loop,<span className="block text-[#689c30]">not a finish line.</span></h2>
              <p className="mt-4 max-w-lg leading-7 text-foreground/65">Our working model follows a repeatable path that can be checked, corrected, and strengthened over time.</p>
              <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-3xl shadow-luxe">
                <Image src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1100&q=88" alt="Team reviewing quality documentation in a bright office" fill sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#033927]/50 via-transparent to-white/10" />
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/30 bg-white/75 p-4 backdrop-blur-md"><p className="font-display text-xl text-[#033927]">Document. Verify. Improve.</p></div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {PROCESS.map(([title, copy], index) => (
                <article key={title} className="rounded-3xl border border-border/40 bg-card p-6 shadow-soft sm:p-7"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#033927] font-display text-sm text-[#e9c46a]">0{index + 1}</span><h3 className="mt-5 font-display text-2xl">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-12 sm:pb-16 lg:pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid overflow-hidden rounded-[2rem] border border-border/40 bg-card shadow-luxe lg:grid-cols-[1.05fr_.95fr]">
              <div className="p-6 sm:p-10 lg:p-12">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#689c30]">Everyday quality</p><h2 className="mt-4 font-display text-3xl sm:text-5xl">Built into the decisions that matter.</h2>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">{PRINCIPLES.map((item) => <div key={item} className="flex gap-3 rounded-2xl bg-[#f0f4ed] p-4"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#689c30] text-white"><Check className="h-3.5 w-3.5" /></span><p className="text-sm leading-6 text-foreground/65">{item}</p></div>)}</div>
              </div>
              <div className="relative min-h-72 lg:min-h-full"><Image src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1000&q=88" alt="Healthy agricultural field representing responsible quality" fill sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#033927]/50 to-transparent" /></div>
            </div>
          </div>
        </section>

        <section className="pb-20 sm:pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6"><div className="relative overflow-hidden rounded-3xl bg-[#e9c46a] px-6 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-14"><Sparkles className="absolute -right-8 -top-12 h-52 w-52 text-white/25" strokeWidth={0.7} /><div className="relative max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#665728]">Need formal documentation?</p><h2 className="mt-3 font-display text-3xl text-[#17382d] sm:text-5xl">Connect with our quality team.</h2></div><Link href="/contact" className="relative mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#033927] px-7 text-sm font-medium text-white shadow-xl transition hover:bg-[#689c30] hover:!text-black lg:mt-0">Request details <ArrowRight className="h-4 w-4" /></Link></div></div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function SectionHeading({ copy, eyebrow, title }: { copy: string; eyebrow: string; title: string }) {
  return <div className="mx-auto max-w-3xl text-center"><div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[#033927]"><Leaf className="h-3.5 w-3.5" /> {eyebrow}</div><h2 className="mt-4 font-display text-3xl leading-[1.08] sm:text-5xl">{title}</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-foreground/65 sm:text-base">{copy}</p></div>
}

function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { dateStyle: "medium" }) }
