"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Leaf, Play } from "lucide-react"

const STORIES = [
  {
    product: "Field Story 01",
    result: "Increased Yield by 28%",
    farmer: "Ramesh Patel",
    location: "Nashik, Maharashtra",
    thumbnail: "https://cdn.shopify.com/s/files/1/0579/7924/0580/files/ebd18c8c-45b7-46f7-ae6b-875404629700_thumbnail.jpg?v=1777898677",
    video: "https://cdn.shopify.com/videos/c/vp/1fd4b8e04f13460c9ebea85425f8bbba/1fd4b8e04f13460c9ebea85425f8bbba.SD-480p-0.9Mbps-83328126.mp4",
  },
  {
    product: "Field Story 02",
    result: "Reduced Pest Damage",
    farmer: "Kavita Sharma",
    location: "Kota, Rajasthan",
    thumbnail: "https://cdn.shopify.com/s/files/1/0579/7924/0580/files/d160b558-f001-4b4c-bd6a-6b60570fe6a1_thumbnail.jpg?v=1777898683",
    video: "https://cdn.shopify.com/videos/c/vp/8cdae9552e114b3a98617dcf2ba809af/8cdae9552e114b3a98617dcf2ba809af.SD-480p-0.9Mbps-83328136.mp4",
  },
  {
    product: "Field Story 03",
    result: "Improved Soil Health",
    farmer: "Harpreet Singh",
    location: "Ludhiana, Punjab",
    thumbnail: "https://cdn.shopify.com/s/files/1/0579/7924/0580/files/f5b9959a-1bad-4627-9f06-5f029e5c3145_thumbnail.jpg?v=1777898685",
    video: "https://cdn.shopify.com/videos/c/vp/c30ef9875a0342cfa57d149f4c8b7938/c30ef9875a0342cfa57d149f4c8b7938.SD-480p-0.9Mbps-83328138.mp4",
  },
  {
    product: "Field Story 04",
    result: "Stronger Root Growth",
    farmer: "Meena Reddy",
    location: "Guntur, Andhra Pradesh",
    thumbnail: "https://cdn.shopify.com/s/files/1/0579/7924/0580/files/888b6123-0f4f-4ed1-9d2e-b80f85b3dfa7_thumbnail.jpg?v=1776429462",
    video: "https://cdn.shopify.com/videos/c/vp/fdeb9a03e2db43f7a0b98e7fe191c81e/fdeb9a03e2db43f7a0b98e7fe191c81e.SD-480p-0.9Mbps-81870814.mp4",
  },
  {
    product: "Field Story 05",
    result: "Healthier Crop Stand",
    farmer: "Imran Khan",
    location: "Bharuch, Gujarat",
    thumbnail: "https://cdn.shopify.com/s/files/1/0579/7924/0580/files/ebd18c8c-45b7-46f7-ae6b-875404629700_thumbnail.jpg?v=1777898677",
    video: "https://cdn.shopify.com/videos/c/vp/1fd4b8e04f13460c9ebea85425f8bbba/1fd4b8e04f13460c9ebea85425f8bbba.SD-480p-0.9Mbps-83328126.mp4",
  },
  {
    product: "Field Story 06",
    result: "Better Field Recovery",
    farmer: "Sunita Yadav",
    location: "Indore, Madhya Pradesh",
    thumbnail: "https://cdn.shopify.com/s/files/1/0579/7924/0580/files/d160b558-f001-4b4c-bd6a-6b60570fe6a1_thumbnail.jpg?v=1777898683",
    video: "https://cdn.shopify.com/videos/c/vp/8cdae9552e114b3a98617dcf2ba809af/8cdae9552e114b3a98617dcf2ba809af.SD-480p-0.9Mbps-83328136.mp4",
  },
]

export default function CropSuccessStories() {
  const [active, setActive] = useState(0)
  const [visibleSlots, setVisibleSlots] = useState(5)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const directionRef = useRef(0)
  const touchX = useRef(0)
  const total = STORIES.length

  useEffect(() => {
    const updateSlots = () => {
      const viewport = window.innerWidth
      let nextSlots = 5

      if (viewport < 640) {
        nextSlots = 1
      } else if (viewport < 1280) {
        nextSlots = 3
      }

      setVisibleSlots((currentSlots) => {
        if (currentSlots === nextSlots) return currentSlots
        directionRef.current = 0
        return nextSlots
      })
    }

    updateSlots()
    window.addEventListener("resize", updateSlots, { passive: true })
    return () => window.removeEventListener("resize", updateSlots)
  }, [])

  const cardGap = visibleSlots === 1 ? 12 : visibleSlots === 3 ? 16 : 20

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const startTimer = () => {
    stopTimer()
    intervalRef.current = setInterval(() => {
      directionRef.current = 1
      setActive((current) => (current + 1) % total)
    }, 4500)
  }

  useEffect(() => {
    startTimer()
    return stopTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total])

  const goNext = () => {
    directionRef.current = 1
    setActive((current) => (current + 1) % total)
  }
  const goPrev = () => {
    directionRef.current = -1
    setActive((current) => (current - 1 + total) % total)
  }

  function handleTouchStart(event: React.TouchEvent) {
    touchX.current = event.touches[0].clientX
    stopTimer()
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const delta = event.changedTouches[0].clientX - touchX.current
    if (delta > 50) goPrev()
    if (delta < -50) goNext()
    window.setTimeout(startTimer, 1000)
  }

  return (
    <section
      id="crop-success-stories"
      aria-label="Crop Success Stories"
      className="relative overflow-hidden py-12 sm:py-16 lg:py-20"
    >
      <div className="relative">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[#033927]">
            <Leaf className="h-3 w-3" aria-hidden /> Field demonstrations
          </div>
          <h2 className="mt-5 font-display text-3xl leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
            Watch Results. Trust Performance.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Real farmers, real fields, and real outcomes powered by Adhunik Crop Care
            solutions across India.
          </p>
        </div>

        <div
          className="relative mt-7 w-full touch-pan-y select-none overflow-visible px-4 pb-5 pt-8 sm:mt-10 sm:px-6 sm:pb-8 lg:px-8"
          onMouseEnter={stopTimer}
          onMouseLeave={startTimer}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={startTimer}
        >
          <div className="relative mx-auto w-full max-w-[1440px]">
            <div
              aria-hidden
              className="mx-auto aspect-[9/16] w-[min(19rem,calc(100vw-2rem))] sm:w-[min(20rem,calc((100vw-5rem)/3))] xl:w-[calc((min(100vw,90rem)-9rem)/5)]"
            />

            {STORIES.map((story, storyIndex) => {
              let offset = (storyIndex - active + total) % total
              if (offset > total / 2) offset -= total

              const isCenter = offset === 0
              const isVisible = Math.abs(offset) <= Math.floor(visibleSlots / 2)
              const translateY = isCenter ? "-1.25rem" : "0.5rem"

              return (
                <article
                  key={story.product}
                  className="absolute left-1/2 top-0 w-[min(19rem,calc(100vw-2rem))] will-change-transform transition-[transform,opacity] duration-[950ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-0 sm:w-[min(20rem,calc((100vw-5rem)/3))] xl:w-[calc((min(100vw,90rem)-9rem)/5)]"
                  style={{
                    transform: `translateX(calc(-50% + ${offset * 100}% + ${offset * cardGap}px)) translateY(${translateY})`,
                    opacity: isCenter ? 1 : isVisible ? 0.8 : 0,
                    pointerEvents: isCenter ? "auto" : "none",
                    zIndex: isCenter ? 20 : isVisible ? 10 - Math.abs(offset) : 0,
                  }}
                  aria-hidden={!isCenter}
                >
                  <div
                    className={`group relative aspect-[9/16] w-full overflow-hidden rounded-[22px] border shadow-luxe sm:rounded-[26px] lg:rounded-[28px] ${
                      isCenter
                        ? "border-white/70 bg-card"
                        : "border-white/45 bg-card/80 shadow-soft"
                    }`}
                  >
                    {isCenter ? (
                      <video
                        key={story.video}
                        className="absolute inset-0 h-full w-full object-cover"
                        src={story.video}
                        poster={story.thumbnail}
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <Image
                        src={story.thumbnail}
                        alt={`${story.result} field demonstration preview`}
                        fill
                        sizes="(max-width: 639px) 304px, (max-width: 1279px) 320px, 20vw"
                        className="object-cover"
                      />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/5" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/20" />

                    {!isCenter && (
                      <div className="absolute inset-0 grid place-items-center">
                        <span className="grid h-14 w-14 place-items-center rounded-full border border-white/40 bg-white/18 text-white shadow-soft backdrop-blur-md">
                          <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden />
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-4 lg:p-5">
                      <div className="inline-flex rounded-full bg-[#689c30] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-white shadow-soft sm:text-[10px] lg:text-xs">
                        {story.result}
                      </div>
                      <h3 className="mt-3 font-display text-base leading-tight sm:text-xl lg:text-2xl">
                        {story.result}
                      </h3>
                      <p className="mt-1.5 text-[11px] leading-snug text-white/78 sm:text-xs lg:text-sm">
                        {story.farmer} · {story.location}
                      </p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-3 px-4 sm:mt-5 sm:gap-4">
          <button
            type="button"
            onClick={goPrev}
            onMouseEnter={stopTimer}
            onMouseLeave={startTimer}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-soft backdrop-blur-sm transition-colors hover:border-[#689c30] hover:text-[#689c30] sm:h-9 sm:w-9"
            aria-label="Previous crop success story"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>

          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            {STORIES.map((story, index) => (
              <button
                key={story.product}
                type="button"
                onClick={() => {
                  directionRef.current = index > active ? 1 : -1
                  setActive(index)
                }}
                onMouseEnter={stopTimer}
                onMouseLeave={startTimer}
                className={`rounded-full transition-all duration-300 ${
                  index === active
                    ? "h-2 w-8 bg-[#689c30]"
                    : "h-2 w-2 bg-border hover:bg-[#689c30]"
                }`}
                aria-label={`Show ${story.result} story`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={goNext}
            onMouseEnter={stopTimer}
            onMouseLeave={startTimer}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-soft backdrop-blur-sm transition-colors hover:border-[#689c30] hover:text-[#689c30] sm:h-9 sm:w-9"
            aria-label="Next crop success story"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  )
}
