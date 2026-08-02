"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Leaf, Play } from "lucide-react"

import { ReelCardSkeleton } from "@/components/ui/skeleton"

export type CropSuccessStory = {
  product: string
  thumbnail?: string
  video: string
}

export default function CropSuccessStories({ stories: propStories }: { stories?: CropSuccessStory[] }) {
  const [stories, setStories] = useState<CropSuccessStory[]>(propStories ?? [])
  const [loaded, setLoaded] = useState(Boolean(propStories && propStories.length > 0))

  useEffect(() => {
    if (propStories && propStories.length > 0) {
      setStories(propStories)
      setLoaded(true)
      return
    }

    let isMounted = true
    fetch("/api/reels")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.reels)) {
          setStories(data.reels)
        }
      })
      .catch(() => {
        if (isMounted) setStories([])
      })
      .finally(() => {
        if (isMounted) setLoaded(true)
      })

    return () => {
      isMounted = false
    }
  }, [propStories])

  if (!loaded) {
    return (
      <section className="relative py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mx-auto max-w-2xl mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[#033927]">
              <Leaf className="h-3 w-3" aria-hidden /> Video Guides
            </div>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.1] tracking-tight">
              Watch real results in action.
            </h2>
          </div>
          <ReelCardSkeleton count={3} />
        </div>
      </section>
    )
  }

  if (stories.length === 0) return null

  return <CropSuccessStoriesCarousel stories={stories} />
}


function CropSuccessStoriesCarousel({ stories: reelStories }: { stories: CropSuccessStory[] }) {
  const [active, setActive] = useState(0)
  const [visibleSlots, setVisibleSlots] = useState(5)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const directionRef = useRef(0)
  const touchX = useRef(0)
  const total = reelStories.length

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

            {reelStories.map((story, storyIndex) => {
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
                    ) : story.thumbnail ? (
                      <Image
                        src={story.thumbnail}
                        alt={`${story.product} field demonstration preview`}
                        fill
                        sizes="(max-width: 639px) 304px, (max-width: 1279px) 320px, 20vw"
                        className="object-cover"
                      />
                    ) : (
                      <video
                        className="absolute inset-0 h-full w-full object-cover"
                        src={story.video}
                        muted
                        playsInline
                        preload="metadata"
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
                      <h3 className="mt-3 font-display text-base leading-tight sm:text-xl lg:text-2xl">
                        {story.product}
                      </h3>
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
            {reelStories.map((story, index) => (
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
                aria-label={`Show ${story.product} story`}
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
