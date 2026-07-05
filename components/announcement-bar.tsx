"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Tag } from "lucide-react"

const ANNOUNCEMENTS = [
  {
    text: "Free shipping on all orders above",
    highlight: "₹999",
    suffix: " — Pan India delivery",
    code: null,
  },
  {
    text: "Use code",
    highlight: "ORGANIC20",
    suffix: " for 20% off your first order",
    code: true,
  },
  {
    text: "Kharif Season Sale —",
    highlight: "Up to 35% off",
    suffix: " on crop fertilizers",
    code: null,
  },
  {
    text: "Buy 2 Get 1 FREE",
    highlight: null,
    suffix: " on all bio products this week only",
    code: null,
  },
  {
    text: "Use code",
    highlight: "SOIL15",
    suffix: " for 15% off soil care range",
    code: true,
  },
  {
    text: "Smart Drip Kits now restocked —",
    highlight: "Limited stock",
    suffix: ", order today",
    code: null,
  },
]

const INTERVAL_MS = 4000
const FADE_MS     = 320

export default function AnnouncementBar() {
  const [index, setIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* CSS-driven fade: toggle a class so transitions are GPU-composited */
  const textRef = useRef<HTMLDivElement>(null)

  function goTo(next: number) {
    const el = textRef.current
    if (!el) return

    /* fade out + slide up */
    el.style.opacity   = "0"
    el.style.transform = "translateY(-6px)"

    setTimeout(() => {
      setIndex(next)
      /* reset below, then fade in */
      el.style.transition = "none"
      el.style.opacity    = "0"
      el.style.transform  = "translateY(6px)"
      /* force reflow so the reset applies before the transition restarts */
      void el.offsetHeight
      el.style.transition = `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`
      el.style.opacity    = "1"
      el.style.transform  = "translateY(0)"
    }, FADE_MS)
  }

  function next() { goTo((index + 1) % ANNOUNCEMENTS.length) }
  function prev() { goTo((index - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length) }

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(next, INTERVAL_MS)
  }

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const ann = ANNOUNCEMENTS[index]

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] h-9 bg-[#0B3D2E] text-white flex items-center justify-center overflow-hidden select-none"
      role="status"
      aria-live="polite"
    >
      {/* Subtle gradient sheen */}
      <div className="pointer-events-none absolute inset-0 bg-[#0B3D2E]" />

      {/* Prev arrow — desktop only */}
      <button
        onClick={() => { prev(); resetTimer() }}
        className="absolute left-3 hidden sm:flex items-center justify-center h-5 w-5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
        aria-label="Previous offer"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>

      {/* Message */}
      <div
        ref={textRef}
        className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-white/90 px-10 text-center"
        style={{ transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease` }}
      >
        {ann.code && (
          <Tag className="h-3 w-3 shrink-0 text-[--gold]" aria-hidden />
        )}

        <span>{ann.text}&nbsp;</span>

        {ann.highlight && (
          ann.code ? (
            /* Coupon code pill */
            <span className="inline-flex items-center rounded px-1.5 py-0.5 bg-white/20 font-mono font-bold tracking-wider text-white leading-none">
              {ann.highlight}
            </span>
          ) : (
            /* Bold accent text */
            <span className="font-semibold text-[--gold]">{ann.highlight}</span>
          )
        )}

        {ann.suffix && <span>{ann.suffix}</span>}
      </div>

      {/* Next arrow — desktop only */}
      <button
        onClick={() => { next(); resetTimer() }}
        className="absolute right-8 hidden sm:flex items-center justify-center h-5 w-5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
        aria-label="Next offer"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1">
        {ANNOUNCEMENTS.map((_, i) => (
          <button
            key={i}
            onClick={() => { goTo(i); resetTimer() }}
            aria-label={`Go to offer ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === index
                ? "w-3.5 h-[3px] bg-white"
                : "w-[3px] h-[3px] bg-white/35 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
