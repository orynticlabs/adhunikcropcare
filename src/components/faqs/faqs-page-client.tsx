"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, HelpCircle, Leaf, Search } from "lucide-react"
import type { OryCMSFaqDTO } from "@/lib/orycms/faqs"

export default function FaqsPageClient({
  initialFaqs = [],
}: {
  initialFaqs?: OryCMSFaqDTO[]
}) {
  const [faqs, setFaqs] = useState<OryCMSFaqDTO[]>(initialFaqs)
  const [loading, setLoading] = useState(initialFaqs.length === 0)
  const [search, setSearch] = useState("")
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  useEffect(() => {
    let active = true
    fetch("/api/faqs")
      .then((res) => res.json())
      .then((json) => {
        if (active && json.success && Array.isArray(json.data)) {
          setFaqs(json.data)
        }
      })
      .catch(() => {
        // Keep initial fallback if fetch fails
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const filteredFaqs = faqs.filter(
    (item) =>
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {/* ── Hero Section (Light Green Theme with header offset padding) ─ */}
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#dfebe3] via-[#e8f2eb] to-[#f0f4f1] pb-12 pt-32 text-[#203129] sm:pb-16 sm:pt-40 lg:pt-44">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#d4e5d9]/60 via-transparent to-transparent" />
        <div className="absolute -right-20 top-10 -z-10 h-[430px] w-[430px] rounded-full border border-[#033927]/10 opacity-60" />
        <div className="absolute right-10 top-40 -z-10 h-[210px] w-[210px] rounded-full border border-[#033927]/10 opacity-40" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#203129]/60">
            <Link href="/" className="hover:text-[#033927] transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#203129]/40" />
            <span className="text-[#033927]">Frequently Asked Questions</span>
          </nav>

          <div className="mt-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#033927]/20 bg-[#033927]/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-[#033927]">
              <Leaf className="h-3.5 w-3.5" aria-hidden /> Help & Guidance
            </div>
            <h1 className="mt-4 font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#033927] leading-tight">
              Frequently Asked Questions
            </h1>
            <p className="mt-3.5 text-sm sm:text-base text-[#203129]/80 leading-relaxed max-w-2xl">
              Everything you need to know about our organic farm inputs, pan-India delivery, certifications, and technical agricultural support.
            </p>

            {/* Search input in Hero */}
            <div className="relative mt-8 max-w-xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#203129]/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions (e.g. shipping, organic, wholesale)..."
                className="h-12 w-full rounded-2xl border border-[#033927]/20 bg-white/90 pl-11 pr-4 text-sm text-[#203129] placeholder-[#203129]/50 shadow-soft outline-none focus:border-[#033927] focus:bg-white focus:ring-1 focus:ring-[#033927]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ List Section ──────────────────────────────────── */}
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="space-y-3.5">
          {loading && faqs.length === 0 ? (
            <div className="grid min-h-[180px] place-items-center rounded-2xl border border-border/50 bg-white/60 text-sm text-[#203129]/60">
              Loading questions…
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="grid min-h-[200px] place-items-center rounded-2xl border border-dashed border-border/70 bg-white/50 p-8 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#033927]/5 text-[#033927]">
                <HelpCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-[#033927]">
                {search ? "No matching questions found" : "No FAQs available at the moment"}
              </h3>
              <p className="mt-1 text-xs text-[#203129]/60">
                {search ? "Try searching for another keyword or clear your filter." : "Please check back later or contact our support team."}
              </p>
            </div>
          ) : (
            filteredFaqs.map((faq, i) => (
              <div
                key={faq.id || `${i}-${faq.question.slice(0, 15)}`}
                className={`rounded-2xl border border-border/60 bg-white px-6 shadow-soft transition-all duration-200 ${
                  openIndex === i ? "shadow-luxe border-[#033927]/30" : ""
                }`}
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-5 text-left font-display text-lg font-semibold text-[#033927] cursor-pointer transition-colors"
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  aria-expanded={openIndex === i}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[#033927]/60 transition-transform duration-200 ${
                      openIndex === i ? "rotate-180 text-[#033927]" : ""
                    }`}
                    aria-hidden
                  />
                </button>
                {openIndex === i && (
                  <div className="pb-5 text-sm text-[#203129]/80 leading-relaxed border-t border-border/30 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* ── Help / Support Card ─────────────────────────────── */}
        <div className="mt-14 rounded-3xl border border-[#033927]/15 bg-gradient-to-br from-[#033927]/5 via-white to-[#033927]/10 p-8 text-center shadow-soft">
          <h3 className="font-display text-xl font-bold text-[#033927]">
            Still have questions?
          </h3>
          <p className="mt-2 text-sm text-[#203129]/70 max-w-md mx-auto">
            Can&apos;t find what you&apos;re looking for? Our dedicated agronomist and customer care team is here to assist.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#033927] px-6 text-xs font-semibold text-white shadow-soft transition-transform hover:scale-[1.02] active:scale-98"
            >
              Contact Support
            </Link>
            <a
              href="tel:+919205762766"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#033927]/30 bg-white px-6 text-xs font-semibold text-[#033927] shadow-soft transition-transform hover:scale-[1.02] active:scale-98"
            >
              Call Us (+91 9205762766)
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
