import { cn } from "@/lib/utils"

/** Base shimmer block used across storefront loading states. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted/60", className)} aria-hidden />
}

/** Card placeholder matching the storefront ProductCard shape. */
export function ProductCardSkeleton() {
  return (
    <div className="flex h-full min-h-[21rem] sm:min-h-[28rem] w-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card">
      <Skeleton className="aspect-square w-full rounded-none shrink-0" />
      <div className="flex flex-1 flex-col justify-between p-3 sm:p-4 space-y-2 sm:space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <Skeleton className="h-4 sm:h-5 w-16 sm:w-20" />
          <Skeleton className="h-7 sm:h-8 w-16 sm:w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}

/** A responsive grid of product card skeletons that mirrors the products page grid. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}

/** Accordion item skeleton loader matching FAQ list items. */
export function AccordionSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading questions">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border/50 bg-card/60 p-5 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-5 w-3/4 rounded-lg" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Reel card skeleton placeholder matching exact storefront video carousel layout. */
export function ReelCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5" aria-busy="true" aria-label="Loading video demonstrations">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="relative aspect-[9/16] w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-[22px] border border-border/50 bg-card shadow-luxe sm:w-[min(20rem,calc((100vw-5rem)/3))] sm:rounded-[26px] lg:rounded-[28px] xl:w-[calc((min(100vw,90rem)-9rem)/5)]"
        >
          <Skeleton className="h-full w-full rounded-none" />
          <div className="absolute inset-x-0 bottom-0 p-4 space-y-2 bg-gradient-to-t from-black/80 to-transparent">
            <Skeleton className="h-5 w-3/4 bg-white/30 rounded-md" />
            <Skeleton className="h-3 w-1/2 bg-white/20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}


/** Testimonial / Review card skeleton. */
export function ReviewCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border/50 bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

/** Announcement Bar text skeleton. */
export function AnnouncementSkeleton() {
  return (
    <div className="flex items-center justify-center py-2 bg-[#033927]" aria-busy="true">
      <Skeleton className="h-4 w-64 bg-white/20 rounded-full" />
    </div>
  )
}

