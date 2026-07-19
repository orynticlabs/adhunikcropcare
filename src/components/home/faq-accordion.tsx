"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const FAQS = [
  {
    q: "Are your products truly organic?",
    a: "Yes. Every Adhunik product is NPOP & USDA certified organic. We source raw materials from verified farms and carry out third-party lab testing before dispatch.",
  },
  {
    q: "Do you ship across India?",
    a: "We ship pan-India to all 28 states and 8 union territories. Orders above ₹999 qualify for free shipping. Delivery takes 3–7 business days depending on your location.",
  },
  {
    q: "Can I become a wholesale partner?",
    a: "Absolutely. We have a dedicated wholesale and dealer programme. Contact our B2B team at wholesale@adhunikcrop.in or call +919205762766 for a personalised quote.",
  },
  {
    q: "What about international export?",
    a: "We export to 18 countries including the UAE, UK, USA, and South-East Asia. Our export division handles all phytosanitary certificates, APEDA registration, and customs documentation.",
  },
  {
    q: "Is there support for first-time organic farmers?",
    a: "Yes — our Farmer Education Hub offers 12,400+ free video tutorials in 18 Indian languages, a soil-testing helpline, and seasonal field visits from our agronomy team.",
  },
]

export default function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="mt-7 space-y-3">
      {FAQS.map((faq, i) => (
        <div
          key={i}
          className={`rounded-2xl border border-border/50 bg-card/70 px-6 shadow-soft transition ${
            open === i ? "shadow-luxe" : ""
          }`}
        >
          <button
            className="flex w-full items-center justify-between py-4 text-left font-display text-lg font-medium cursor-pointer hover:text-[#033927] transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            {faq.q}
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                open === i ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          </button>
          {open === i && (
            <div className="pb-4 text-sm text-foreground/70 leading-relaxed">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
