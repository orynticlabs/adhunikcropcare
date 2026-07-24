"use client"

import { useEffect, useRef, useState } from "react"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import type { ProductReview } from "@/lib/orycms/reviews"

type TestimonialsCarouselProps = {
  reviews?: ProductReview[]
}

type Slot = "center" | "left" | "right" | "far-left" | "far-right"

function slot(idx: number, active: number, n: number): Slot {
  if (n <= 1) return "center"
  if (n === 2) return idx === active ? "center" : "right"
  const d = (idx - active + n) % n
  if (d === 0) return "center"
  if (d === 1) return "right"
  if (d === n - 1) return "left"
  if (d < n / 2) return "far-right"
  return "far-left"
}

function buildTransform(s: Slot, off: number): React.CSSProperties {
  const T = "580ms cubic-bezier(0.4, 0, 0.2, 1)"
  switch (s) {
    case "center":
      return { transform: `translateX(0px) translateY(0px) scale(1)`, opacity: 1, zIndex: 10, transition: T }
    case "left":
      return { transform: `translateX(-${off}px) translateY(28px) scale(0.91)`, opacity: 0.78, zIndex: 5, transition: T }
    case "right":
      return { transform: `translateX(${off}px) translateY(28px) scale(0.91)`, opacity: 0.78, zIndex: 5, transition: T }
    case "far-left":
      return { transform: `translateX(-${off * 2}px) translateY(44px) scale(0.82)`, opacity: 0, zIndex: 1, transition: T }
    case "far-right":
      return { transform: `translateX(${off * 2}px) translateY(44px) scale(0.82)`, opacity: 0, zIndex: 1, transition: T }
  }
}

export default function TestimonialsCarousel({ reviews: propReviews }: TestimonialsCarouselProps) {
  const [reviews, setReviews] = useState<ProductReview[]>(propReviews ?? [])
  const [loaded, setLoaded] = useState(Boolean(propReviews))
  const [active, setActive] = useState(0)
  const [cardW, setCardW] = useState(380)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchX = useRef(0)

  useEffect(() => {
    if (propReviews) {
      setReviews(propReviews.slice(0, 10))
      setLoaded(true)
      return
    }

    let isMounted = true
    fetch("/api/reviews/top")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data.reviews)) {
          setReviews(data.reviews.slice(0, 10))
        }
      })
      .catch(() => {
        if (isMounted) setReviews([])
      })
      .finally(() => {
        if (isMounted) setLoaded(true)
      })

    return () => {
      isMounted = false
    }
  }, [propReviews])

  const n = reviews.length
  const gap = 28
  const offset = cardW + gap

  useEffect(() => {
    const calc = () => setCardW(Math.min(380, window.innerWidth * 0.82))
    calc()
    window.addEventListener("resize", calc, { passive: true })
    return () => window.removeEventListener("resize", calc)
  }, [])

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const startTimer = () => {
    stopTimer()
    if (n <= 1) return
    intervalRef.current = setInterval(() => {
      setActive((i) => (i + 1) % n)
    }, 3500)
  }

  useEffect(() => {
    if (n > 1) {
      startTimer()
    }
    return stopTimer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])

  const goNext = () => n > 1 && setActive((i) => (i + 1) % n)
  const goPrev = () => n > 1 && setActive((i) => (i - 1 + n) % n)

  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX
    stopTimer()
  }

  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchX.current
    if (dx > 50) goPrev()
    if (dx < -50) goNext()
    setTimeout(startTimer, 800)
  }

  if (loaded && n === 0) {
    return null
  }

  if (!loaded || n === 0) {
    return null
  }

  return (
    <div className="mt-8 select-none">
      <div
        className="relative"
        style={{ height: "360px" }}
        onMouseEnter={stopTimer}
        onMouseLeave={startTimer}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {reviews.map((item, i) => {
          const s = slot(i, active, n)
          const starsCount = Math.min(5, Math.max(1, item.stars))
          const initial = item.name.trim().charAt(0).toUpperCase() || "F"
          const roleSubtitle = item.title ? item.title : item.verified ? "Verified Buyer" : item.date

          return (
            <div
              key={item.id || `rev-${i}`}
              style={{
                position: "absolute",
                top: 0,
                left: `calc(50% - ${cardW / 2}px)`,
                width: `${cardW}px`,
                pointerEvents: s === "center" ? "auto" : "none",
                ...buildTransform(s, offset),
              }}
            >
              <div
                className={`h-full rounded-3xl border p-8 transition-[box-shadow,border-color] duration-500 flex flex-col justify-between ${
                  s === "center"
                    ? "border-[#689c30]/25 bg-card shadow-luxe"
                    : "border-border/40 bg-card/80 shadow-soft"
                }`}
              >
                <div>
                  <div className="flex gap-1 text-[#e9c46a]">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star
                        key={k}
                        className={`h-4 w-4 ${k < starsCount ? "fill-current" : "text-muted-foreground/30"}`}
                        aria-hidden
                      />
                    ))}
                  </div>

                  <p className="mt-4 line-clamp-4 text-foreground/80 leading-relaxed text-sm sm:text-base">
                    &ldquo;{item.body}&rdquo;
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#689c30] to-[#033927] font-display text-lg font-semibold text-white">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{item.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{roleSubtitle}</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {n > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={goPrev}
            className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-border hover:border-[#689c30] hover:text-[#689c30] transition-colors"
            aria-label="Previous review"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            {reviews.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Review ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === active ? "w-6 h-[6px] bg-[#689c30]" : "w-[6px] h-[6px] bg-border hover:bg-[#689c30]"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-border hover:border-[#689c30] hover:text-[#689c30] transition-colors"
            aria-label="Next review"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
