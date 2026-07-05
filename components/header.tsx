"use client"

import { useRef, useState } from "react"
import { Search, User, Menu, X, ChevronDown } from "lucide-react"
import Image from "next/image"
import CartIcon from "@/components/cart-icon"
import { useCart } from "@/lib/cart-context"

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Crop Fertilizers", href: "#crop-fertilizers" },
  { label: "Organic Range", href: "#organic-range" },
  { label: "Smart Agriculture", href: "#smart-agriculture" },
  { label: "Marketplace", href: "#marketplace" },
]

const MORE_LINKS = [
  { label: "Our Story", href: "#our-story" },
  { label: "Bio Products", href: "#bio-products" },
  { label: "Soil Care", href: "#soil-care" },
  { label: "Irrigation Solutions", href: "#irrigation-solutions" },
  { label: "Pest Management", href: "#pest-management" },
  { label: "Farmer Services", href: "#farmer-services" },
  { label: "Wholesale", href: "#wholesale" },
  { label: "Certifications", href: "#certifications" },
  { label: "Knowledge Center", href: "#knowledge-center" },
  { label: "Blogs", href: "#blogs" },
  { label: "Contact Us", href: "#contact-us" },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileRef = useRef<HTMLDivElement>(null)
  const { openCart } = useCart()

  return (
    <header className="fixed inset-x-0 top-9 z-50">
      <div className="mx-auto max-w-7xl px-4 py-2">
        <div
          className="flex items-center justify-between rounded-full border border-white/60 bg-white/95 px-3 py-2 shadow-soft backdrop-blur-md transition-colors duration-300 sm:px-5 sm:py-2.5"
        >
          {/* Logo */}
          <a href="#home" className="flex items-center pl-2">
            <Image
              src="https://adhunikcropcare.com/assets/img/logo/logo.png"
              alt="Adhunik Crop Care"
              width={160}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
          </a>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent/60 transition"
              >
                {l.label}
              </a>
            ))}

            {/* More dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent/60 transition">
                More <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              </button>
              <div className="invisible absolute right-0 top-full mt-3 w-56 rounded-2xl border border-border/60 bg-popover p-2 opacity-0 shadow-luxe transition-all group-hover:visible group-hover:opacity-100">
                {MORE_LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="block rounded-xl px-3 py-2 text-sm text-foreground/80 hover:bg-accent/60 hover:text-foreground transition"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button className="hidden sm:inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-accent hover:text-accent-foreground transition">
              <Search className="h-4 w-4" aria-label="Search" />
            </button>
            <button className="hidden sm:inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-accent hover:text-accent-foreground transition">
              <User className="h-4 w-4" aria-label="Account" />
            </button>
            <button
              onClick={openCart}
              className="relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-accent hover:text-accent-foreground transition"
              aria-label="Cart"
            >
              <CartIcon />
            </button>

            {/* Mobile menu toggle */}
            <button
              className="inline-flex lg:hidden items-center justify-center h-9 w-9 rounded-full hover:bg-accent transition"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            ref={mobileRef}
            className="mt-2 rounded-2xl border border-border/60 bg-popover p-3 shadow-luxe glass lg:hidden"
          >
            {[...NAV_LINKS, ...MORE_LINKS].map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/80 hover:bg-accent/60 hover:text-foreground transition"
              >
                {l.label}
              </a>
            ))}
          </div>
        )}
      </div>

    </header>
  )
}
