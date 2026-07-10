"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Boxes, FileText, ImageIcon, LayoutDashboard, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/content/pages", label: "Pages", icon: FileText },
  { href: "/admin/content/articles", label: "Articles", icon: BarChart3 },
  { href: "/admin/content/products", label: "Products", icon: Boxes },
  { href: "/admin/content/categories", label: "Categories", icon: Boxes },
  { href: "/admin/content/media", label: "Media", icon: ImageIcon },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden min-h-screen border-r border-border/70 bg-[linear-gradient(180deg,#06291d_0%,#041f16_100%)] text-white lg:flex lg:w-72 lg:flex-col">
      <div className="border-b border-white/10 px-6 py-6">
        <div className="text-xs uppercase tracking-[0.35em] text-white/55">CMS</div>
        <h1 className="mt-2 font-display text-2xl leading-tight">Adhunik Admin</h1>
        <p className="mt-2 text-sm text-white/65">
          A single Next.js project for publishing, editing, and operational settings.
        </p>
      </div>

      <nav className="flex-1 px-3 py-5">
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  active
                    ? "bg-white/12 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
                    : "text-white/72 hover:bg-white/8 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 px-6 py-5 text-xs text-white/55">
        <p className="uppercase tracking-[0.28em]">Environment</p>
        <p className="mt-2 leading-5">
          CMS login is controlled by `CMS_ADMIN_EMAIL`, `CMS_ADMIN_PASSWORD`, and
          `CMS_SESSION_SECRET`.
        </p>
      </div>
    </aside>
  )
}

