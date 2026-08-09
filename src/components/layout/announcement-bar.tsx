"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

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
        } else {
          setLiveData([])
        }
      })
      .catch(() => setLiveData([]))
  }, [])

  const totalCount = liveData?.length ?? 0

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
    if (totalCount === 0) return
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, totalCount])

  if (totalCount === 0) return null


  const safeIndex = index % totalCount

  const bgColor   = liveData?.[safeIndex]?.bgColor ?? "#043927"
  const textColor = liveData?.[safeIndex]?.textColor ?? "#ffffff"

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
        className="flex items-center justify-center text-[10px] sm:text-xs font-medium px-3 sm:px-12 text-center w-full max-w-full overflow-hidden leading-[1.3]"
        style={{
          transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
          color: textColor,
        }}
      >
        <div
          className="line-clamp-2 max-h-[28px] overflow-hidden text-ellipsis text-center leading-[1.3] [&_p]:inline [&_p]:m-0 [&_span]:inline"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {liveData?.[safeIndex]?.content && (
            <span
              className="richtext-inline [&_p]:inline [&_p]:m-0 [&_span]:inline"
              // Sanitized server-side before storage
              dangerouslySetInnerHTML={{ __html: liveData[safeIndex].content }}
            />
          )}
          {liveData?.[safeIndex]?.ctaText && liveData[safeIndex]?.ctaUrl && (
            <a
              href={liveData[safeIndex].ctaUrl!}
              className="ml-1.5 inline-block underline font-semibold hover:opacity-80 transition whitespace-nowrap"
              style={{ color: textColor }}
            >
              {liveData[safeIndex].ctaText}
            </a>
          )}
        </div>
      </div>

      {/* Next arrow — desktop only */}
      <button
        onClick={() => { next(); resetTimer() }}
        className="absolute right-3 hidden sm:flex items-center justify-center h-5 w-5 rounded-full opacity-50 hover:opacity-100 hover:bg-white/10 transition"
        aria-label="Next offer"
        style={{ color: textColor }}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex items-center gap-1">
        {Array.from({ length: totalCount }).map((_, i) => (
          <button
            key={i}
            onClick={() => { goTo(i); resetTimer() }}
            aria-label={`Go to offer ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === safeIndex
                ? "w-3 h-[2px] bg-white"
                : "w-[2px] h-[2px] bg-white/35 hover:bg-[#689c30]"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
