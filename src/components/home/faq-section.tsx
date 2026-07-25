"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronDown, Leaf } from "lucide-react"

type FAQItem = {
  id: string
  question: string
  answer: string
}

export default function FAQSection() {
  const [faqs, setFaqs] = useState<FAQItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState<number | null>(null)

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
        if (active) setFaqs([])
      })
      .finally(() => {
        if (active) setLoaded(true)
      })

    return () => {
      active = false
    }
  }, [])

  // If loading complete and 0 FAQs exist in the backend database, hide the entire section completely
  if (loaded && faqs.length === 0) {
    return null
  }

  // Hide section during initial loading until backend check completes
  if (!loaded) {
    return null
  }

  // Display top 6 FAQs on the homepage
  const homepageFaqs = faqs.slice(0, 6)
  const hasMoreFaqs = faqs.length > 6

  return (
    <section id="contact-us" className="relative py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center mx-auto max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[#033927]">
            <Leaf className="h-3 w-3" aria-hidden /> FAQ
          </div>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight">
            Questions, answered.
          </h2>
        </div>

        <div className="mt-7 space-y-3">
          {homepageFaqs.map((faq, i) => (
            <div
              key={faq.id || `${i}-${faq.question.slice(0, 15)}`}
              className={`rounded-2xl border border-border/50 bg-card/70 px-6 shadow-soft transition ${
                open === i ? "shadow-luxe" : ""
              }`}
            >
              <button
                type="button"
                className="flex w-full items-center justify-between py-4 text-left font-display text-lg font-medium cursor-pointer hover:text-[#033927] transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                {faq.question}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                  aria-hidden
                />
              </button>
              {open === i && (
                <div className="pb-4 text-sm text-foreground/70 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* If backend contains more than 6 FAQs, show option to view all FAQs */}
        {hasMoreFaqs && (
          <div className="mt-8 text-center">
            <Link
              href="/faqs"
              className="inline-flex items-center gap-2.5 rounded-full border border-[#d7e0da] bg-white px-6 py-3 text-sm font-semibold text-[#033927] transition-colors hover:bg-[#033927] hover:!text-white"
            >
              View all FAQs ({faqs.length}) <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
