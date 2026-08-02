import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted/70 dark:bg-muted/30", className)} aria-hidden {...props} />;
}

/** Admin Data Table Skeleton Rows */
function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-3 p-4" aria-busy="true" aria-label="Loading data table">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center justify-between gap-4 py-2 border-b border-border/40">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Admin Card Grid Skeleton (for Certificates, Reels, etc.) */
function CardGridSkeleton({ count = 3, cols = "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3", aspect = "aspect-[9/16]" }: { count?: number; cols?: string; aspect?: string }) {
  return (
    <div className={`grid gap-4 ${cols}`} aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
          <div className={`relative ${aspect} w-full bg-surface-muted`}>
            <Skeleton className="h-full w-full rounded-none" />
            <Skeleton className="absolute right-3 top-3 h-5 w-16 rounded-full" />
          </div>
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center justify-between gap-3 pt-1">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


/** Metric Card Skeleton (for Admin Dashboard and Analytics) */
function MetricCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton, TableSkeleton, CardGridSkeleton, MetricCardSkeleton };

