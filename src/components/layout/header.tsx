"use client"

import { useEffect, useState } from "react"
import { User, Menu, X, ChevronDown, ShoppingBag, Leaf } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import CartIcon from "@/features/cart/components/cart-icon"
import SearchBox from "@/components/search/search-box"
import { useCart } from "@/features/cart/cart-context"
import { useAuth } from "@/features/auth/auth-context"

const MAIN_LINKS = [
  { label: "Products",         href: "/products"         },
  { label: "Crop Fertilizers", href: "/crop-fertilizers" },
  { label: "Organic Range",    href: "/organic-range"    },
  { label: "Marketplace",      href: "#marketplace"      },
]

const NAV_LINKS = [
  { label: "Home", href: "/" },
  ...MAIN_LINKS.slice(0, 4),
]

const MORE_LINKS = [
  { label: "About Us",            href: "/about"               },
  ...MAIN_LINKS.slice(4),
  { label: "Bio Products",        href: "/bio-products"        },
  { label: "Soil Care",           href: "/soil-care"           },
  { label: "Irrigation Solutions",href: "/irrigation-solutions"},
  { label: "Pest Management",     href: "#pest-management"     },
  { label: "Farmer Services",     href: "#farmer-services"     },
  { label: "Wholesale",           href: "#wholesale"           },
  { label: "Certifications",      href: "/certifications"      },
  { label: "Knowledge Center",    href: "#knowledge-center"    },
  { label: "Blogs",               href: "/blog"                },
  { label: "Contact Us",          href: "/contact"             },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { openCart } = useCart()
  const { openAuthModal, user } = useAuth()

  /* lock body scroll while drawer is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  function closeMenu() { setMobileOpen(false) }

  return (
    <>
      {/* ── Sticky top bar ─────────────────────────────────── */}
      <header className="fixed inset-x-0 top-9 z-50">
        <div className="mx-auto max-w-7xl px-3 py-2 sm:px-4">
          <div className="navbar-glass flex items-center justify-between rounded-full border px-3 py-2 shadow-soft transition-colors duration-300 sm:px-5 sm:py-2.5">

            {/* Logo */}
            <Link href="/" className="flex items-center pl-1 sm:pl-2 shrink-0">
              <Image
                src="https://adhunikcropcare.com/assets/img/logo/logo.png"
                alt="Adhunik Crop Care"
                width={160}
                height={48}
                className="h-8 w-auto object-contain sm:h-10"
                priority
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground transition"
                >
                  {l.label}
                </a>
              ))}

              {/* More dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground transition">
                  More <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                </button>
                <div className="invisible absolute right-0 top-full mt-3 w-56 rounded-2xl border border-border/60 bg-popover p-2 opacity-0 shadow-luxe transition-all group-hover:visible group-hover:opacity-100 z-10">
                  {MORE_LINKS.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      className="block rounded-xl px-3 py-2 text-sm text-foreground/80 hover:text-[--leaf] transition"
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
            </nav>

            {/* Action icons */}
            <div className="flex items-center gap-0.5">
              <SearchBox />

              {user ? (
                <Link
                  href="/account"
                  className="hidden h-9 w-9 items-center justify-center rounded-full transition hover:text-[--leaf] sm:inline-flex"
                  aria-label="Account"
                  title={`${user.firstName} ${user.lastName}`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[--leaf]/15 text-xs font-bold text-[--leaf]">
                    {user.firstName[0]}{user.lastName[0]}
                  </span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("signin")}
                  className="hidden h-9 w-9 items-center justify-center rounded-full transition hover:text-[--leaf] sm:inline-flex"
                  aria-label="Sign in"
                  title="Sign in"
                >
                  <User className="h-4 w-4" aria-hidden />
                </button>
              )}

              <button
                onClick={openCart}
                className="relative inline-flex items-center justify-center h-9 w-9 rounded-full transition hover:text-[--leaf]"
                aria-label="Cart"
              >
                <CartIcon />
              </button>

              {/* Hamburger — mobile only */}
              <button
                className="inline-flex lg:hidden items-center justify-center h-9 w-9 rounded-full transition hover:text-[--leaf]"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileOpen}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Full-screen mobile menu drawer ─────────────────── */}
      <div
        className={`fixed inset-0 z-[80] transition ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Backdrop */}
        <button
          type="button"
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? "opacity-100" : "opacity-0"}`}
          onClick={closeMenu}
          tabIndex={mobileOpen ? 0 : -1}
          aria-label="Close menu"
        />

        {/* Sliding panel — full width on mobile, fixed 320 px on sm+ */}
        <div
          className={`absolute inset-y-0 left-0 flex w-full flex-col bg-background shadow-2xl transition-transform duration-300 ease-out sm:w-[320px] ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          {/* Panel header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
            <Link href="/" onClick={closeMenu}>
              <Image
                src="https://adhunikcropcare.com/assets/img/logo/logo.png"
                alt="Adhunik Crop Care"
                width={130}
                height={40}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <button
              type="button"
              onClick={closeMenu}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/70 transition hover:bg-accent hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable nav */}
          <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Mobile navigation">
            {/* Primary links */}
            <div className="space-y-0.5">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={closeMenu}
                  className="flex items-center rounded-xl px-4 py-3 text-[15px] font-medium text-foreground/80 transition hover:bg-[--leaf]/10 hover:text-[--leaf]"
                >
                  {l.label}
                </a>
              ))}
            </div>

            {/* More section */}
            <div className="mt-6 mb-2 px-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                More
              </p>
            </div>
            <div className="space-y-0.5">
              {MORE_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={closeMenu}
                  className="flex items-center rounded-xl px-4 py-2.5 text-sm text-foreground/70 transition hover:bg-[--leaf]/10 hover:text-[--leaf]"
                >
                  {l.label}
                </a>
              ))}
            </div>

            {/* ISO badge */}
            <div className="mt-6 mx-2 flex items-center gap-2 rounded-xl border border-border/50 bg-accent/10 px-4 py-3">
              <Leaf className="h-4 w-4 shrink-0 text-[--leaf]" aria-hidden />
              <p className="text-xs text-muted-foreground">ISO 9001 Certified Company</p>
            </div>
          </nav>

          {/* Footer CTAs */}
          <div className="shrink-0 space-y-2 border-t border-border px-5 py-4">
            <button
              type="button"
              onClick={() => { openCart(); closeMenu() }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[--leaf] h-11 text-sm font-semibold text-white transition hover:bg-[--moss]"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden />
              View Cart
            </button>
            {user ? (
              <Link
                href="/account"
                onClick={closeMenu}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-border text-sm font-medium text-foreground/70 transition hover:border-[--leaf] hover:text-[--leaf]"
              >
                <User className="h-4 w-4" aria-hidden />
                My Account
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  openAuthModal("signin")
                }}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-border text-sm font-medium text-foreground/70 transition hover:border-[--leaf] hover:text-[--leaf]"
              >
                <User className="h-4 w-4" aria-hidden />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
