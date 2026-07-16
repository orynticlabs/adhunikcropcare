import type { LucideIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ChevronRight, Leaf } from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import Header from "@/components/layout/header"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"

export type LegalSection = {
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

type LegalPageProps = {
  eyebrow: string
  title: string
  intro: string
  updated: string
  icon: LucideIcon
  accent: "leaf" | "gold" | "sage"
  sections: LegalSection[]
  noteTitle: string
  note: string
}

const THEMES = {
  leaf: {
    hero: "bg-[#063a2a]",
    accent: "text-[#bdd879]",
    badge: "bg-[#bdd879] text-[#033927]",
    panel: "bg-[#dce9cb]",
    number: "text-[#689c30]",
  },
  gold: {
    hero: "bg-[#203e31]",
    accent: "text-[#e9c46a]",
    badge: "bg-[#e9c46a] text-[#203129]",
    panel: "bg-[#f1dfaa]",
    number: "text-[#9a7a35]",
  },
  sage: {
    hero: "bg-[#314a3d]",
    accent: "text-[#d5dfaa]",
    badge: "bg-[#d5dfaa] text-[#203129]",
    panel: "bg-[#e4eadb]",
    number: "text-[#607d45]",
  },
} as const

function sectionId(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export default function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  icon: Icon,
  accent,
  sections,
  noteTitle,
  note,
}: LegalPageProps) {
  const theme = THEMES[accent]

  return (
    <div className="min-h-screen overflow-hidden bg-[#f0f4f1] text-[#203129]">
      <AnnouncementBar />
      <Header />
      <CartDrawer />

      <main>
        <section className={`relative isolate overflow-hidden pb-24 pt-36 text-white sm:pt-44 ${theme.hero}`}>
          <Image
            src="/hero-field-Dp98Y55X.jpg"
            alt="Sunlit agricultural field"
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover object-center"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(3,57,39,.76),rgba(3,57,39,.48)_58%,rgba(3,57,39,.18))]" />
          <div className="absolute -right-24 top-16 h-[420px] w-[420px] rounded-full border border-white/10" />
          <div className="absolute right-10 top-44 h-[180px] w-[180px] rounded-full border border-white/10" />
          <Leaf className="absolute -bottom-28 -left-20 h-96 w-96 rotate-12 text-white/[0.035]" strokeWidth={0.6} />

          <div className="relative mx-auto max-w-7xl px-4">
            <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className={theme.accent}>{eyebrow}</span>
            </nav>

            <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_.65fr] lg:items-end">
              <div>
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${theme.badge}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h1 className="mt-7 max-w-4xl font-display text-5xl leading-[.96] tracking-tight sm:text-7xl">
                  {title}
                </h1>
              </div>
              <div>
                <p className="max-w-xl text-base leading-7 text-white/68">{intro}</p>
                <p className={`mt-5 text-xs font-bold uppercase tracking-[0.18em] ${theme.accent}`}>
                  Last updated: {updated}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[280px_1fr]">
            <aside className="h-fit lg:sticky lg:top-32">
              <div className={`rounded-[2rem] p-6 ${theme.panel}`}>
                <p className="text-xs font-bold uppercase tracking-[0.2em]">On this page</p>
                <nav className="mt-5 space-y-1">
                  {sections.map((section, index) => (
                    <a
                      key={section.title}
                      href={`#${sectionId(section.title)}`}
                      className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm text-[#415248] hover:bg-white/45 hover:text-[#203129]"
                    >
                      <span className={`font-display ${theme.number}`}>{String(index + 1).padStart(2, "0")}</span>
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>

              <div className="mt-5 rounded-[2rem] bg-[#063a2a] p-6 text-white">
                <p className="font-display text-2xl">{noteTitle}</p>
                <p className="mt-3 text-sm leading-6 text-white/60">{note}</p>
                <Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#bdd879]">
                  Contact us <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>

            <div className="space-y-5">
              {sections.map((section, index) => (
                <article
                  id={sectionId(section.title)}
                  key={section.title}
                  className="scroll-mt-32 rounded-[2.25rem] border border-[#d7e0da] bg-white p-7 shadow-[0_12px_35px_rgba(3,57,39,.05)] sm:p-10"
                >
                  <div className="flex items-start gap-5">
                    <span className={`font-display text-4xl ${theme.number}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-display text-3xl leading-tight sm:text-4xl">{section.title}</h2>
                      <div className="mt-5 space-y-4 text-[15px] leading-7 text-[#5f6b62]">
                        {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                        {section.bullets && (
                          <ul className="space-y-3">
                            {section.bullets.map((bullet) => (
                              <li key={bullet} className="flex gap-3">
                                <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${theme.badge}`} />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
