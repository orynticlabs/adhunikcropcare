import Link from "next/link"

export type OryCMSBreadcrumbItem = {
  href: string
  label: string
}

export function OryCMSBreadcrumbs({ items }: { items: OryCMSBreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
      {items.map((item, index) => (
        <span key={`${item.href}-${item.label}`} className="inline-flex items-center gap-1.5">
          {index > 0 ? <span className="text-muted-foreground/50">/</span> : null}
          <Link
            href={item.href}
            aria-current={index === items.length - 1 ? "page" : undefined}
            className="rounded-sm transition-colors hover:text-chart-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {item.label}
          </Link>
        </span>
      ))}
    </nav>
  )
}
