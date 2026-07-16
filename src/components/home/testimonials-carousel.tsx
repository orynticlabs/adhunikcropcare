"use client"

import { useEffect, useRef, useState } from "react"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"

const ITEMS = [
  {
    quote: "Adhunik's bio NPK gave us 32% better yield. The team visits us every season — it feels like a partnership.",
    name: "Ramesh Patel", role: "Wheat farmer, Gujarat", initial: "R",
  },
  {
    quote: "Switching to organic was scary. Adhunik made it easy with their farmer hub and free soil testing.",
    name: "Lakshmi Devi", role: "Cotton farmer, Telangana", initial: "L",
  },
  {
    quote: "The smart irrigation kit paid for itself in one season. Premium quality, premium results.",
    name: "Arjun Singh", role: "Vineyard owner, Nashik", initial: "A",
  },
  {
    quote: "Adhunik's soil health programme transformed my barren fields in just two kharif seasons — yields up 40%.",
    name: "Priya Sharma", role: "Vegetable farmer, Madhya Pradesh", initial: "P",
  },
  {
    quote: "Their expert agronomy guidance and bio-products cut our input costs by 25% while improving crop quality.",
    name: "Suresh Nair", role: "Spice farmer, Kerala", initial: "S",
  },
]

type Slot = "center" | "left" | "right" | "far-left" | "far-right"

function slot(idx: number, active: number, n: number): Slot {
  const d = (idx - active + n) % n
  if (d === 0)         return "center"
  if (d === 1)         return "right"
  if (d === n - 1)     return "left"
  if (d < n / 2)       return "far-right"
  return "far-left"
}

function buildTransform(s: Slot, off: number): React.CSSProperties {
  const T = "580ms cubic-bezier(0.4, 0, 0.2, 1)"
  switch (s) {
    case "center":    return { transform: `translateX(0px)      translateY(0px)  scale(1)`,    opacity: 1,    zIndex: 10, transition: T }
    case "left":      return { transform: `translateX(-${off}px) translateY(28px) scale(0.91)`, opacity: 0.78, zIndex: 5,  transition: T }
    case "right":     return { transform: `translateX(${off}px)  translateY(28px) scale(0.91)`, opacity: 0.78, zIndex: 5,  transition: T }
    case "far-left":  return { transform: `translateX(-${off * 2}px) translateY(44px) scale(0.82)`, opacity: 0, zIndex: 1, transition: T }
    case "far-right": return { transform: `translateX(${off * 2}px)  translateY(44px) scale(0.82)`, opacity: 0, zIndex: 1, transition: T }
  }
}

export default function TestimonialsCarousel() {
  const [active, setActive]   = useState(0)
  const [cardW, setCardW] = useState(380)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchX      = useRef(0)
  const n           = ITEMS.length
  const gap         = 28
  const offset      = cardW + gap

  /* ── Responsive card width ───────────────────────────────── */
  useEffect(() => {
    const calc = () => setCardW(Math.min(380, window.innerWidth * 0.82))
    calc()
    window.addEventListener("resize", calc, { passive: true })
    return () => window.removeEventListener("resize", calc)
  }, [])

  /* ── Timer helpers ───────────────────────────────────────── */
  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const startTimer = () => {
    stopTimer()
    intervalRef.current = setInterval(() => {
      setActive(i => (i + 1) % n)
    }, 3000)
  }

  /* ── Auto-advance on mount; clean up on unmount ──────────── */
  useEffect(() => {
    startTimer()
    return stopTimer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])

  const goNext = () => setActive(i => (i + 1) % n)
  const goPrev = () => setActive(i => (i - 1 + n) % n)

  /* ── Swipe ───────────────────────────────────────────────── */
  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX
    stopTimer()
  }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchX.current
    if (dx >  50) goPrev()
    if (dx < -50) goNext()
    setTimeout(startTimer, 800)
  }

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="mt-8 select-none">
      {/* Track — overflow-visible so center card shadow isn't clipped */}
      <div
        className="relative"
        style={{ height: "360px" }}
        onMouseEnter={stopTimer}
        onMouseLeave={startTimer}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {ITEMS.map((item, i) => {
          const s = slot(i, active, n)
          return (
            <div
              key={i}
              style={{
                position : "absolute",
                top      : 0,
                left     : `calc(50% - ${cardW / 2}px)`,
                width    : `${cardW}px`,
                pointerEvents: s === "center" ? "auto" : "none",
                ...buildTransform(s, offset),
              }}
            >
              {/* ── Card ─────────────────────────────────── */}
              <div
                className={`
                  h-full rounded-3xl border p-8
                  transition-[box-shadow,border-color] duration-500
                  ${s === "center"
                    ? "border-[--leaf]/25 bg-card shadow-luxe"
                    : "border-border/40 bg-card/80 shadow-soft"
                  }
                `}
              >
                {/* Stars */}
                <div className="flex gap-1 text-[--gold]">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="h-4 w-4 fill-current" aria-hidden />
                  ))}
                </div>

                {/* Quote */}
                <p className="mt-5 text-foreground/80 leading-relaxed text-sm sm:text-base">
                  &ldquo;{item.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="mt-6 flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[--leaf] to-[--moss] font-display text-lg font-semibold text-cream">
                    {item.initial}
                  </div>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.role}</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Controls ─────────────────────────────────────────── */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          onClick={goPrev}
          className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-border
                     hover:border-[--leaf] hover:text-[--leaf] transition-colors"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-2">
          {ITEMS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Testimonial ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === active
                  ? "w-6 h-[6px] bg-[#689c30]"
                  : "w-[6px] h-[6px] bg-border hover:bg-[--leaf]"
              }`}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-border
                     hover:border-[--leaf] hover:text-[--leaf] transition-colors"
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
