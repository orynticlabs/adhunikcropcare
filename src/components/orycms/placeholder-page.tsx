import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import type { OryCMSBreadcrumbItem } from "@/components/orycms/breadcrumbs"

export function PlaceholderPage({
  breadcrumbs,
  description,
  eyebrow,
  title,
}: {
  breadcrumbs?: OryCMSBreadcrumbItem[]
  description: string
  eyebrow: string
  title: string
}) {
  return (
    <OryCMSDashboard section={title}>
      <div className="mx-auto max-w-[1400px] space-y-6 p-6 lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <OryCMSBreadcrumbs items={breadcrumbs ?? [{ href: "/admin", label: eyebrow }]} />
            <h1 className="mt-1 text-[26px] font-semibold tracking-tight leading-tight">
              {title}
            </h1>
            <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-border bg-surface/40 px-8 py-16 text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-border bg-surface">
            <span className="text-sm font-semibold">O</span>
          </div>
          <div className="mt-4 text-[13.5px] font-medium text-foreground">
            OryCMS module ready
          </div>
          <p className="mx-auto mt-1.5 max-w-sm text-[12px] leading-relaxed text-muted-foreground">
            This menu route is wired through OryCMS config and ready for the
            package-backed module implementation.
          </p>
        </div>
      </div>
    </OryCMSDashboard>
  )
}
