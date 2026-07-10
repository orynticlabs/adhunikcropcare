"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Leaf, Play } from "lucide-react"

const STORIES = [
  {
    product: "Adhunik Bio NPK",
    result: "Increased Yield by 28%",
    farmer: "Ramesh Patel",
    location: "Nashik, Maharashtra",
    thumbnail: "https://cdn.shopify.com/s/files/1/0579/7924/0580/files/ebd18c8c-45b7-46f7-ae6b-875404629700_thumbnail.jpg?v=1777898677",
    video: "https://cdn.shopify.com/videos/c/vp/1fd4b8e04f13460c9ebea85425f8bbba/1fd4b8e04f13460c9ebea85425f8bbba.SD-480p-0.9Mbps-83328126.mp4",
  },
  {
    product: "NeemGuard Spray",
    result: "Reduced Pest Damage",
    farmer: "Kavita Sharma",
    location: "Kota, Rajasthan",
    thumbnail: "https://cdn.shopify.com/s/files/1/0579/7924/0580/files/d160b558-f001-4b4c-bd6a-6b60570fe6a1_thumbnail.jpg?v=1777898683",
    video: "https://cdn.shopify.com/videos/c/vp/8cdae9552e114b3a98617dcf2ba809af/8cdae9552e114b3a98617dcf2ba809af.SD-480p-0.9Mbps-83328136.mp4",
  },
  {
    product: "Vermi+ Compost 25kg",
    result: "Improved Soil Health",
    farmer: "Harpreet Singh",
    location: "Ludhiana, Punjab",
    thumbnail: "https://cdn.shopify.com/s/files/1/0579/7924/0580/files/f5b9959a-1bad-4627-9f06-5f029e5c3145_thumbnail.jpg?v=1777898685",
    video: "https://cdn.shopify.com/videos/c/vp/c30ef9875a0342cfa57d149f4c8b7938/c30ef9875a0342cfa57d149f4c8b7938.SD-480p-0.9Mbps-83328138.mp4",
  },
  {
    product: "SoilRich Booster",
    result: "Stronger Root Growth",
    farmer: "Meena Reddy",
    location: "Guntur, Andhra Pradesh",
    thumbnail: "https://cdn.shopify.com/s/files/1/0579/7924/0580/files/888b6123-0f4f-4ed1-9d2e-b80f85b3dfa7_thumbnail.jpg?v=1776429462",
    video: "https://cdn.shopify.com/videos/c/vp/fdeb9a03e2db43f7a0b98e7fe191c81e/fdeb9a03e2db43f7a0b98e7fe191c81e.SD-480p-0.9Mbps-81870814.mp4",
  },
  {
    product: "MyCo Root Power",
    result: "Healthier Crop Stand",
    farmer: "Imran Khan",
    location: "Bharuch, Gujarat",
    thumbnail: "https://cdn.shopify.com/s/files/1/0579/7924/0580/files/ebd18c8c-45b7-46f7-ae6b-875404629700_thumbnail.jpg?v=1777898677",
    video: "https://cdn.shopify.com/videos/c/vp/1fd4b8e04f13460c9ebea85425f8bbba/1fd4b8e04f13460c9ebea85425f8bbba.SD-480p-0.9Mbps-83328126.mp4",
  },
  {
    product: "Crop Shield Plus",
    result: "Better Field Recovery",
    farmer: "Sunita Yadav",
    location: "Indore, Madhya Pradesh",
    thumbnail: "https://cdn.shopify.com/s/files/1/0579/7924/0580/files/d160b558-f001-4b4c-bd6a-6b60570fe6a1_thumbnail.jpg?v=1777898683",
    video: "https://cdn.shopify.com/videos/c/vp/8cdae9552e114b3a98617dcf2ba809af/8cdae9552e114b3a98617dcf2ba809af.SD-480p-0.9Mbps-83328136.mp4",
  },
]

export default function CropSuccessStories() {
  const [active, setActive] = useState(0)
  const [visibleSlots, setVisibleSlots] = useState(6)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchX = useRef(0)
  const total = STORIES.length

  useEffect(() => {
    const updateSlots = () => {
      const viewport = window.innerWidth
      if (viewport < 640) {
        setVisibleSlots(3)
      } else if (viewport < 1024) {
        setVisibleSlots(4)
      } else {
        setVisibleSlots(6)
      }
    }

    updateSlots()
    window.addEventListener("resize", updateSlots, { passive: true })
    return () => window.removeEventListener("resize", updateSlots)
  }, [])

  const activeSlot = Math.max(1, Math.floor((visibleSlots - 1) / 2))
  const visibleStories = useMemo(() => {
    return Array.from({ length: visibleSlots }, (_, slotIndex) => {
      const storyIndex = (active - activeSlot + slotIndex + total) % total
      return {
        ...STORIES[storyIndex],
        storyIndex,
        slotIndex,
      }
    })
  }, [active, activeSlot, total, visibleSlots])

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const startTimer = () => {
    stopTimer()
    intervalRef.current = setInterval(() => {
      setActive((current) => (current + 1) % total)
    }, 3000)
  }

  useEffect(() => {
    startTimer()
    return stopTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total])

  const goNext = () => setActive((current) => (current + 1) % total)
  const goPrev = () => setActive((current) => (current - 1 + total) % total)

  function handleTouchStart(event: React.TouchEvent) {
    touchX.current = event.touches[0].clientX
    stopTimer()
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const delta = event.changedTouches[0].clientX - touchX.current
    if (delta > 50) goPrev()
    if (delta < -50) goNext()
    window.setTimeout(startTimer, 900)
  }

  return (
    <section
      id="crop-success-stories"
      aria-label="Crop Success Stories"
      className="relative overflow-hidden py-14 sm:py-20"
    >
      <div className="relative">
        <div className="text-center mx-auto max-w-3xl px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[--moss]">
            <Leaf className="h-3 w-3" aria-hidden /> Field demonstrations
          </div>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight">
            Watch Results. Trust Performance.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Real farmers, real fields, and real outcomes powered by Adhunik Crop Care
            solutions across India.
          </p>
        </div>

        <div
          className="relative mt-10 w-full select-none overflow-visible pb-8 pt-8"
          onMouseEnter={stopTimer}
          onMouseLeave={startTimer}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="grid w-full items-start gap-2 sm:gap-3 lg:gap-4"
            style={{ gridTemplateColumns: `repeat(${visibleSlots}, minmax(0, 1fr))` }}
          >
            {visibleStories.map((story) => {
              const isCenter = story.slotIndex === activeSlot

              return (
                <article
                  key={`${story.product}-${story.storyIndex}`}
                  className={`min-w-0 transition-transform duration-700 ease-out ${
                    isCenter ? "relative z-20 -translate-y-8" : "relative z-10 translate-y-4"
                  }`}
                  aria-hidden={!isCenter}
                >
                  <div
                    className={`group relative aspect-[9/16] overflow-hidden rounded-[28px] border shadow-luxe ${
                      isCenter
                        ? "border-white/70 bg-card"
                        : "border-white/45 bg-card/80 shadow-soft"
                    }`}
                  >
                    {isCenter ? (
                      <video
                        key={story.product}
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
                        alt={`${story.product} field demonstration preview`}
                        fill
                        sizes="(max-width: 639px) 33vw, (max-width: 1023px) 25vw, 17vw"
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
                      <div className="inline-flex rounded-full bg-[--leaf] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-white shadow-soft sm:text-[10px] lg:text-xs">
                        {story.result}
                      </div>
                      <h3 className="mt-3 font-display text-base leading-tight sm:text-xl lg:text-2xl">
                        {story.product}
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

        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={goPrev}
            onMouseEnter={stopTimer}
            onMouseLeave={startTimer}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-soft backdrop-blur-sm hover:border-[--leaf] hover:text-[--leaf]"
            aria-label="Previous crop success story"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>

          <div className="flex items-center gap-2">
            {STORIES.map((story, index) => (
              <button
                key={story.product}
                type="button"
                onClick={() => setActive(index)}
                onMouseEnter={stopTimer}
                onMouseLeave={startTimer}
                className={`rounded-full transition-all duration-300 ${
                  index === active
                    ? "h-2 w-8 bg-[--moss]"
                    : "h-2 w-2 bg-border hover:bg-[--leaf]"
                }`}
                aria-label={`Show ${story.product} story`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={goNext}
            onMouseEnter={stopTimer}
            onMouseLeave={startTimer}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-soft backdrop-blur-sm hover:border-[--leaf] hover:text-[--leaf]"
            aria-label="Next crop success story"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  )
}