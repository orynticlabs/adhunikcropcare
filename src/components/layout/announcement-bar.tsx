"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Tag } from "lucide-react"

type AnnouncementDTO = {
  id: string
  content: string
  ctaText: string | null
  ctaUrl: string | null
  active: boolean
  priority: number
  bgColor: string | null
  textColor: string | null
}

const STATIC_ANNOUNCEMENTS = [
  {
    text: "Free shipping on all orders above",
    highlight: "₹999",
    suffix: " — Pan India delivery",
    code: false,
  },
  {
    text: "Kharif Season Sale —",
    highlight: "Up to 35% off",
    suffix: " on crop fertilizers",
    code: false,
  },
  {
    text: "Buy 2 Get 1 FREE",
    highlight: null,
    suffix: " on all bio products this week only",
    code: false,
  },
  {
    text: "Smart Drip Kits now restocked —",
    highlight: "Limited stock",
    suffix: ", order today",
    code: false,
  },
]

const INTERVAL_MS = 4000
const FADE_MS     = 320

export default function AnnouncementBar() {
  const [index, setIndex] = useState(0)
  const [liveData, setLiveData] = useState<AnnouncementDTO[] | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const textRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/storefront/announcements")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setLiveData(json.data)
          setIndex(0)
        }
      })
      .catch(() => {})
  }, [])

  const totalCount = liveData ? liveData.length : STATIC_ANNOUNCEMENTS.length

  function goTo(next: number) {
    const el = textRef.current
    if (!el) return
    el.style.opacity   = "0"
    el.style.transform = "translateY(-6px)"
    setTimeout(() => {
      setIndex(next)
      el.style.transition = "none"
      el.style.opacity    = "0"
      el.style.transform  = "translateY(6px)"
      void el.offsetHeight
      el.style.transition = `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`
      el.style.opacity    = "1"
      el.style.transform  = "translateY(0)"
    }, FADE_MS)
  }

  function next() { goTo((index + 1) % totalCount) }
  function prev() { goTo((index - 1 + totalCount) % totalCount) }

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(next, INTERVAL_MS)
  }

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, totalCount])

  const safeIndex = index % totalCount

  const bgColor   = liveData ? (liveData[safeIndex]?.bgColor ?? "#043927") : "#043927"
  const textColor = liveData ? (liveData[safeIndex]?.textColor ?? "#ffffff") : "#ffffff"

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] h-9 flex items-center justify-center overflow-hidden select-none transition-colors duration-500"
      style={{ backgroundColor: bgColor, color: textColor }}
      role="status"
      aria-live="polite"
    >
      {/* Prev arrow — desktop only */}
      <button
        onClick={() => { prev(); resetTimer() }}
        className="absolute left-3 hidden sm:flex items-center justify-center h-5 w-5 rounded-full opacity-50 hover:opacity-100 hover:bg-white/10 transition"
        aria-label="Previous offer"
        style={{ color: textColor }}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>

      {/* Message */}
      <div
        ref={textRef}
        className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium px-10 text-center"
        style={{
          transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
          color: textColor,
        }}
      >
        {liveData ? (
          /* Live DB content — rich text HTML */
          <>
            {liveData[safeIndex]?.content && (
              <span
                className="richtext-inline"
                // Sanitized server-side before storage
                dangerouslySetInnerHTML={{ __html: liveData[safeIndex].content }}
              />
            )}
            {liveData[safeIndex]?.ctaText && liveData[safeIndex]?.ctaUrl && (
              <a
                href={liveData[safeIndex].ctaUrl!}
                className="ml-2 underline font-semibold hover:opacity-80 transition"
                style={{ color: textColor }}
              >
                {liveData[safeIndex].ctaText}
              </a>
            )}
          </>
        ) : (
          /* Static fallback — same UI as before */
          <>
            {STATIC_ANNOUNCEMENTS[safeIndex].code && (
              <Tag className="h-3 w-3 shrink-0 text-[#e9c46a]" aria-hidden />
            )}
            <span>{STATIC_ANNOUNCEMENTS[safeIndex].text}&nbsp;</span>
            {STATIC_ANNOUNCEMENTS[safeIndex].highlight && (
              STATIC_ANNOUNCEMENTS[safeIndex].code ? (
                <span className="inline-flex items-center rounded px-1.5 py-0.5 bg-white/20 font-mono font-bold tracking-wider text-white leading-none">
                  {STATIC_ANNOUNCEMENTS[safeIndex].highlight}
                </span>
              ) : (
                <span className="font-semibold text-[#e9c46a]">{STATIC_ANNOUNCEMENTS[safeIndex].highlight}</span>
              )
            )}
            {STATIC_ANNOUNCEMENTS[safeIndex].suffix && <span>{STATIC_ANNOUNCEMENTS[safeIndex].suffix}</span>}
          </>
        )}
      </div>

      {/* Next arrow — desktop only */}
      <button
        onClick={() => { next(); resetTimer() }}
        className="absolute right-8 hidden sm:flex items-center justify-center h-5 w-5 rounded-full opacity-50 hover:opacity-100 hover:bg-white/10 transition"
        aria-label="Next offer"
        style={{ color: textColor }}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1">
        {Array.from({ length: totalCount }).map((_, i) => (
          <button
            key={i}
            onClick={() => { goTo(i); resetTimer() }}
            aria-label={`Go to offer ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === safeIndex
                ? "w-3.5 h-[3px] bg-white"
                : "w-[3px] h-[3px] bg-white/35 hover:bg-[#689c30]"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
