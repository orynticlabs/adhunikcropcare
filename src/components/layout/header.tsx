"use client"

import { useEffect, useRef, useState } from "react"
import { LogOut, Package, User, Menu, X, ChevronDown, ShoppingBag, Leaf } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import CartIcon from "@/features/cart/components/cart-icon"
import SearchBox from "@/components/search/search-box"
import { DefaultMemojiAvatar } from "@/components/auth/default-memoji-avatar"
import { useCart } from "@/features/cart/cart-context"
import { useAuth } from "@/features/auth/auth-context"

const FIXED_NAV_LINKS = [
  { label: "Home", href: "/" },
]

const MAX_VISIBLE_NAV_LINKS = 5

type StorefrontCategory = {
  id: string
  name: string
  slug: string
}

export default function Header({ initialCategories }: { initialCategories?: StorefrontCategory[] }) {
  const accountRef = useRef<HTMLDivElement | null>(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const [categories, setCategories] = useState<StorefrontCategory[]>(initialCategories ?? [])
  const [mobileOpen, setMobileOpen] = useState(false)
  const { openCart } = useCart()
  const { logout, openAuthModal, user } = useAuth()

  /* lock body scroll while drawer is open */
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories)
      return
    }
    fetch("/api/categories")
      .then((response) => response.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) setCategories(json.data)
      })
      .catch(() => undefined)
  }, [initialCategories])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountOpen(false)
    }

    window.addEventListener("pointerdown", handlePointerDown)
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  function closeMenu() { setMobileOpen(false) }

  const categoryLinks = categories.map((category) => ({
    href: `/products?category=${encodeURIComponent(category.name)}`,
    label: category.name,
  }))
  const allNavbarLinks = [...FIXED_NAV_LINKS, ...categoryLinks]
  const hasOverflowLinks = allNavbarLinks.length > MAX_VISIBLE_NAV_LINKS
  const directLinkLimit = hasOverflowLinks ? MAX_VISIBLE_NAV_LINKS - 1 : MAX_VISIBLE_NAV_LINKS
  const navbarLinks = allNavbarLinks.slice(0, directLinkLimit)
  const overflowCategoryLinks = allNavbarLinks.slice(directLinkLimit)

  return (
    <>
      {/* ── Sticky top bar ─────────────────────────────────── */}
      <header className="fixed inset-x-0 top-9 z-50">
        <div className="mx-auto max-w-7xl px-3 py-2 sm:px-4">
          <div className="navbar-glass relative flex items-center justify-between rounded-full border px-3 py-2 shadow-soft transition-colors duration-300 sm:px-5 sm:py-2.5">

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
              {navbarLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/80 transition hover:text-[#689c30]"
                >
                  {l.label}
                </Link>
              ))}

              {/* More dropdown */}
              {overflowCategoryLinks.length > 0 ? <div className="relative group">
                <button className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/80 transition hover:text-[#689c30]">
                  More <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                </button>
                <div className="invisible absolute right-0 top-full mt-3 w-56 rounded-2xl border border-border/60 bg-popover p-2 opacity-0 shadow-luxe transition-all group-hover:visible group-hover:opacity-100 z-10">
                  {overflowCategoryLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="block rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide text-foreground/80 hover:text-[#689c30] transition"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div> : null}
            </nav>

            {/* Action icons */}
            <div className="flex items-center gap-0.5">
              <SearchBox initialCategories={categories} />

              {user ? (
                <div ref={accountRef} className="relative hidden sm:block">
                  <button
                    type="button"
                    onClick={() => setAccountOpen((value) => !value)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:text-[#689c30]"
                    aria-expanded={accountOpen}
                    aria-haspopup="menu"
                    aria-label="Account menu"
                    title={`${user.firstName} ${user.lastName}`}
                  >
                    <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#689c30]/15 text-xs font-bold text-[#689c30]">
                      <DefaultMemojiAvatar seed={`${user.id}:${user.email}`} className="h-full w-full object-cover" />
                    </span>
                  </button>
                  <div
                    className={`absolute right-0 top-full z-30 mt-3 w-56 rounded-2xl border border-border/60 bg-card p-2 shadow-luxe transition-all duration-150 ${
                      accountOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
                    }`}
                    role="menu"
                  >
                    <div className="border-b border-border/50 px-3 py-2">
                      <p className="truncate text-sm font-semibold">{user.firstName} {user.lastName}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    {[
                      { href: "/account", label: "My Account", Icon: User },
                      { href: "/account?tab=orders", label: "Order History", Icon: Package },
                    ].map(({ href, label, Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setAccountOpen(false)}
                        className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground/75 transition hover:bg-[#689c30]/10 hover:text-[#689c30]"
                        role="menuitem"
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false)
                        void logout()
                      }}
                      className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-destructive transition hover:bg-destructive/10"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("signin")}
                  className="hidden h-9 w-9 items-center justify-center rounded-full transition hover:text-[#689c30] sm:inline-flex"
                  aria-label="Sign in"
                  title="Sign in"
                >
                  <User className="h-4 w-4" aria-hidden />
                </button>
              )}

              <button
                onClick={openCart}
                className="relative inline-flex items-center justify-center h-9 w-9 rounded-full transition hover:text-[#689c30]"
                aria-label="Cart"
              >
                <CartIcon />
              </button>

              {/* Hamburger — mobile only */}
              <button
                className="inline-flex lg:hidden items-center justify-center h-9 w-9 rounded-full transition hover:text-[#689c30]"
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-black transition-colors hover:border-[#689c30] hover:bg-[#689c30]/10 hover:text-[#689c30]"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable nav */}
          <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Mobile navigation">
            {/* Primary links */}
            <div className="space-y-0.5">
              {navbarLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={closeMenu}
                  className="flex items-center rounded-xl px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-foreground/80 transition hover:bg-[#689c30]/10 hover:text-[#689c30]"
                >
                  {l.label}
                </Link>
              ))}
            </div>

            {overflowCategoryLinks.length > 0 ? <>
              <div className="mt-6 mb-2 px-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  More
                </p>
              </div>
              <div className="space-y-0.5">
              {overflowCategoryLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={closeMenu}
                  className="flex items-center rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-foreground/70 transition hover:bg-[#689c30]/10 hover:text-[#689c30]"
                >
                  {l.label}
                </Link>
              ))}
              </div>
            </> : null}

            {/* ISO badge */}
            <div className="mt-6 mx-2 flex items-center gap-2 rounded-xl border border-border/50 bg-accent/10 px-4 py-3">
              <Leaf className="h-4 w-4 shrink-0 text-[#689c30]" aria-hidden />
              <p className="text-xs text-muted-foreground">ISO 9001 Certified Company</p>
            </div>
          </nav>

          {/* Footer CTAs */}
          <div className="shrink-0 space-y-2 border-t border-border px-5 py-4">
            <button
              type="button"
              onClick={() => { openCart(); closeMenu() }}
              className="group flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#033927] text-sm font-semibold text-white transition-colors hover:bg-[#689c30] hover:!text-black"
            >
              <ShoppingBag className="h-4 w-4 text-white transition-colors group-hover:!text-black" aria-hidden />
              View Cart
            </button>
            {user ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/account"
                  onClick={closeMenu}
                  className="flex h-10 items-center justify-center gap-2 rounded-full border border-border text-sm font-medium text-foreground/70 transition hover:border-[#689c30] hover:text-[#689c30]"
                >
                  <User className="h-4 w-4" aria-hidden />
                  My Account
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu()
                    void logout()
                  }}
                  className="flex h-10 items-center justify-center gap-2 rounded-full border border-border text-sm font-medium text-foreground/70 transition hover:border-destructive/40 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Logout
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  openAuthModal("signin")
                }}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-border text-sm font-medium text-foreground/70 transition hover:border-[#689c30] hover:text-[#689c30]"
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
