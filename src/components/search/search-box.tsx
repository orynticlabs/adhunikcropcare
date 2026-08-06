"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, Clock, Package, Search, Tag, Trash2, X } from "lucide-react"
import { matchesSearchQuery } from "@/lib/search"

const TERMS = [
  "Insecticides",
  "Fungicides",
  "Organic Products",
  "Crop Protection Solutions",
  "Plant Growth Promoters",
  "Bio Products",
  "NPK Fertilizers",
  "Soil Conditioners",
  "Weedicides",
]

const TYPE_MS   = 72   // ms per char – typing
const DELETE_MS = 38   // ms per char – deleting
const PAUSE_END = 1900 // pause when word is fully typed
const PAUSE_GAP = 380  // pause before typing next word

const ACCENT = "#689C30"
const RECENT_SEARCHES_KEY = "adhunik_recent_searches_v1"

type SearchItem = {
  label: string
  type: "Product" | "Category"
  keywords: string
  href: string
  category?: string
  price?: string
  img?: string
}

type CmsProduct = {
  category: string
  name: string
  price: number
  salePrice: number | null
  shortDescription: string
  slug: string
  images?: { url: string }[]
}

type CmsCategory = {
  id?: string
  name: string
  slug?: string
}

export default function SearchBox({ initialCategories }: { initialCategories?: CmsCategory[] }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [productItems, setProductItems] = useState<SearchItem[]>([])
  const [categories, setCategories] = useState<string[]>(
    initialCategories ? initialCategories.map((c) => c.name).filter(Boolean) : [],
  )
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedTag, setSelectedTag] = useState("All")
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentInputRef = useRef<HTMLInputElement | null>(null)

  // Track hydration for React Portals & Local Storage
  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setRecentSearches(parsed.slice(0, 5))
      }
    } catch {
      // Ignore localstorage errors
    }
  }, [])

  // Sync categories directly from props without making extra network requests
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories.map((c) => c.name).filter(Boolean))
    }
  }, [initialCategories])

  // Fast 120ms debounce for live responsive in-memory search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query)
    }, 120)
    return () => clearTimeout(handler)
  }, [query])

  const trimmedQuery = debouncedQuery.trim()

  // Fetch dynamic products ONCE on mount
  useEffect(() => {
    fetch("/api/products")
      .then((response) => response.json())
      .then((json) => {
        if (!json.success || !Array.isArray(json.data)) return
        setProductItems(
          json.data.map((product: CmsProduct) => ({
            category: product.category,
            href: `/products/${product.slug}`,
            img: Array.isArray(product.images) && product.images[0]?.url ? product.images[0].url : "/placeholder.svg",
            keywords: [product.category, product.shortDescription, product.name].join(" "),
            label: product.name,
            price: new Intl.NumberFormat("en-IN", {
              currency: "INR",
              maximumFractionDigits: 0,
              style: "currency",
            }).format(product.salePrice ?? product.price),
            type: "Product" as const,
          })),
        )
      })
      .catch(() => undefined)
  }, [])

  // Category tags directly taken from navbar categories (zero extra network calls)
  const categoryTags = useMemo(() => {
    const dynamicCats = (
      categories.length > 0
        ? categories
        : Array.from(new Set(productItems.map((p) => p.category)))
    ).filter((cat): cat is string => Boolean(cat))
    return ["All", ...dynamicCats]
  }, [categories, productItems])

  // Filtered search results for mobile drawer & desktop popup
  const searchResults = useMemo(() => {
    let items = productItems

    if (selectedTag && selectedTag !== "All") {
      items = items.filter(
        (item) =>
          item.category?.toLowerCase().trim() === selectedTag.toLowerCase().trim() ||
          item.keywords.toLowerCase().includes(selectedTag.toLowerCase().trim()),
      )
    }

    if (!trimmedQuery) {
      return items
    }

    return items.filter((item) =>
      matchesSearchQuery(trimmedQuery, [item.label, item.type, item.category, item.keywords]),
    )
  }, [productItems, selectedTag, trimmedQuery])

  // Save recent searches in localStorage
  function saveRecentSearch(searchTerm: string) {
    const term = searchTerm.trim()
    if (!term) return
    const updated = [term, ...recentSearches.filter((s) => s.toLowerCase() !== term.toLowerCase())].slice(0, 5)
    setRecentSearches(updated)
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
    } catch {
      // Ignore storage write error
    }
  }

  function clearRecentSearches() {
    setRecentSearches([])
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    } catch {
      // Ignore storage write error
    }
  }

  /* ── Typewriter for desktop search input ────────────────── */
  useEffect(() => {
    if (!open) return

    const input = inputRef.current
    if (!input) return

    let termIdx = 0
    let charIdx = 0
    let deleting = false

    function tick() {
      if (!inputRef.current) return
      const term = TERMS[termIdx]

      if (!deleting) {
        charIdx++
        const full = charIdx >= term.length
        inputRef.current.placeholder = `Search ${term.slice(0, charIdx)}${full ? "…" : "|"}`
        if (full) {
          deleting = true
          timerRef.current = setTimeout(tick, PAUSE_END)
          return
        }
      } else {
        charIdx--
        inputRef.current.placeholder =
          charIdx > 0 ? `Search ${term.slice(0, charIdx)}|` : "Search…"
        if (charIdx <= 0) {
          deleting = false
          termIdx = (termIdx + 1) % TERMS.length
          timerRef.current = setTimeout(tick, PAUSE_GAP)
          return
        }
      }

      timerRef.current = setTimeout(tick, deleting ? DELETE_MS : TYPE_MS)
    }

    if (inputRef.current) inputRef.current.placeholder = "Search…"
    timerRef.current = setTimeout(tick, 500)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (inputRef.current) inputRef.current.placeholder = ""
    }
  }, [open])

  /* ── Desktop Auto-focus ──────────────────────────────────── */
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 250)
    return () => clearTimeout(t)
  }, [open])

  /* ── Mobile Auto-focus ───────────────────────────────────── */
  useEffect(() => {
    if (!mobileOpen) return
    const t = setTimeout(() => mobileInputRef.current?.focus(), 150)
    return () => clearTimeout(t)
  }, [mobileOpen])

  /* ── Lock body scroll when mobile search drawer is active ── */
  useEffect(() => {
    if (!mobileOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false)
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [mobileOpen])

  /* ── Desktop Click-outside ───────────────────────────────── */
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [open])

  /* ── Escape key for Desktop ──────────────────────────────── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function closeSearch() {
    setOpen(false)
    setQuery("")
  }

  function closeMobileSearch() {
    setMobileOpen(false)
    setQuery("")
    setSelectedTag("All")
  }

  function handleDesktopSubmit() {
    const nextQuery = query.trim()
    if (nextQuery) saveRecentSearch(nextQuery)
    if (!nextQuery) {
      router.push("/products")
    } else {
      router.push(`/products?q=${encodeURIComponent(nextQuery)}`)
    }
    closeSearch()
  }

  return (
    <>
      {/* ── Desktop & Mobile Trigger Icons ───────────────────── */}
      <div ref={wrapperRef} className="relative flex flex-row-reverse items-center">
        {/* Desktop Search Button */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="hidden sm:inline-flex items-center justify-center h-9 w-9 shrink-0
                     bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent
                     text-foreground hover:text-[#689c30] active:text-[#689c30]
                     focus:outline-none transition-colors duration-200 cursor-pointer"
          aria-label={open ? "Close search" : "Open search"}
          aria-expanded={open}
        >
          {open ? (
            <X className="h-[17px] w-[17px]" />
          ) : (
            <Search className="h-[17px] w-[17px]" />
          )}
        </button>

        {/* Mobile Search Icon Button (Triggers full screen Mobile Drawer) */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex sm:hidden items-center justify-center h-9 w-9 shrink-0
                     bg-transparent hover:bg-transparent text-foreground hover:text-[#689c30]
                     focus:outline-none transition-colors duration-200 cursor-pointer"
          aria-label="Open full search drawer"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>

        {/* Desktop Expanding input (Hidden on mobile < sm) */}
        <div
          className={`hidden sm:block absolute right-full top-1/2 z-[60] -translate-y-1/2 transition-[width,opacity] duration-300 ease-out sm:static sm:z-auto sm:translate-y-0 ${
            open
              ? "w-[clamp(160px,28vw,280px)] overflow-visible opacity-100"
              : "w-0 overflow-hidden opacity-0"
          }`}
          style={{
            transition:
              "width 320ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease",
          }}
        >
          <div className="relative mr-1.5">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2
                         h-3.5 w-3.5 text-muted-foreground"
              aria-hidden
            />
            <input
              ref={(node) => {
                inputRef.current = node
                currentInputRef.current = node
              }}
              type="search"
              autoComplete="off"
              value={query}
              className="w-full h-9 rounded-full border border-border/50 bg-background/80
                         pl-8 pr-3 text-sm text-foreground outline-none
                         placeholder:text-muted-foreground/70
                         transition-[border-color,box-shadow] duration-200"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleDesktopSubmit()
                }
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = ACCENT
                e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT}22`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = ""
                e.currentTarget.style.boxShadow = ""
              }}
            />

            {open ? (
              <div
                data-testid="search-suggestions"
                className="absolute right-0 top-[calc(100%+0.55rem)] z-50 w-[min(92vw,23rem)] overflow-hidden rounded-[1.35rem] border border-border/60 bg-background/96 shadow-[0_18px_46px_rgba(3,57,39,0.14)] backdrop-blur-md"
              >
                <div className="border-b border-border/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {trimmedQuery ? "Search results" : "Popular searches"}
                </div>

                {searchResults.length > 0 ? (
                  <div className="py-1.5 max-h-80 overflow-y-auto">
                    {searchResults.slice(0, 8).map((item) => {
                      const Icon = item.type === "Product" ? Package : Tag

                      return (
                        <Link
                          key={`desktop-${item.type}-${item.label}`}
                          href={item.href}
                          onClick={() => {
                            saveRecentSearch(item.label)
                            closeSearch()
                          }}
                          className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-foreground transition hover:bg-[#689c30]/8 hover:text-[#033927]"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#689c30]/10 text-[#689c30]">
                              <Icon className="h-4 w-4" aria-hidden />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{item.label}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {item.type === "Product" ? item.category : "Category"}
                              </span>
                            </span>
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-[#689c30]">
                            {item.price ?? item.type}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-4 text-sm text-muted-foreground">
                    No matching items found.
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleDesktopSubmit}
                  className="flex w-full items-center justify-center border-t border-border/50 px-4 py-3 text-sm font-semibold text-[#033927] transition hover:bg-[#689c30]/8 hover:text-[#689c30]"
                >
                  Search for {trimmedQuery ? `"${trimmedQuery}"` : "all products"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── React Portal: Mobile Full-Screen Search Drawer (Root Body level like CartDrawer) ── */}
      {mounted && mobileOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] sm:hidden flex flex-col">
              {/* Full Screen Backdrop */}
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 opacity-100"
                onClick={closeMobileSearch}
                aria-label="Close search drawer"
              />

              {/* Full Screen Slide-Over Drawer Window */}
              <aside
                className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#f4f7f2_0%,#edf2ee_100%)] shadow-2xl transition-transform duration-300 ease-out"
                role="dialog"
                aria-modal="true"
                aria-label="Search products drawer"
              >
                {/* Header Bar */}
                <div className="border-b border-[#d9e2da] bg-[rgba(244,247,242,0.96)] px-5 py-4 backdrop-blur-md shrink-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[linear-gradient(145deg,#0d5a48,#033927)] text-white shadow-[0_10px_24px_rgba(3,57,39,0.22)]">
                        <Search className="h-5 w-5" aria-hidden />
                      </span>
                      <div>
                        <h2 className="font-sans text-2xl leading-none text-[#203129]">
                          Search Store
                        </h2>
                        <p className="mt-1 text-xs font-medium text-[#66756d]">
                          Explore crop care, fertilizers &amp; remedies
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={closeMobileSearch}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d4ddd6] bg-white text-foreground/80 shadow-[0_8px_20px_rgba(31,42,34,0.08)] transition hover:border-[#689c30]/40 hover:text-[#689c30]"
                      aria-label="Close search drawer"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>

                  {/* Search Input Bar */}
                  <div className="relative mt-4">
                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center h-7 w-7 rounded-xl bg-[#689c30]/10 text-[#689c30]">
                      <Search className="h-4 w-4" aria-hidden />
                    </div>
                    <input
                      ref={mobileInputRef}
                      type="search"
                      autoComplete="off"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault() // Do NOT navigate away on Enter, stay in drawer showing live results
                          if (query.trim()) saveRecentSearch(query.trim())
                        }
                      }}
                      placeholder="Search product name, category, or pest..."
                      className="w-full h-12 rounded-2xl border border-[#cbe0d0] bg-white pl-12 pr-10 text-sm font-medium text-[#203129] shadow-[0_4px_16px_rgba(31,42,34,0.06)] outline-none transition-all focus:border-[#689c30] focus:ring-4 focus:ring-[#689c30]/15 placeholder:text-[#88968d]"
                    />
                    {query ? (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-foreground/70 transition hover:bg-gray-200"
                        aria-label="Clear search input"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>

                  {/* Brand Themed Scrollable Categories Bar (Taken directly from Navbar Categories) */}
                  <div className="mt-3.5 flex items-center gap-2 overflow-x-auto pb-2 category-theme-scrollbar">
                    {categoryTags.map((tag) => {
                      const isActive = selectedTag.toLowerCase().trim() === tag.toLowerCase().trim()
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSelectedTag(tag)}
                          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer select-none border ${
                            isActive
                              ? "bg-[#033927] text-white border-[#033927] shadow-xs"
                              : "bg-white text-[#033927] border-[#d4ddd6] hover:border-[#689c30] hover:bg-[#689c30]/10 hover:text-[#033927]"
                          }`}
                        >
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Drawer Body - Live Scrollable Products List */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {/* E-commerce Recent Searches Section */}
                  {!trimmedQuery && recentSearches.length > 0 ? (
                    <div className="rounded-2xl border border-[#d8e1d9] bg-white/90 p-3.5 shadow-xs">
                      <div className="flex items-center justify-between border-b border-[#e2eae3] pb-2 mb-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#203129]">
                          <Clock className="h-3.5 w-3.5 text-[#689c30]" />
                          <span>Recent Searches</span>
                        </div>
                        <button
                          type="button"
                          onClick={clearRecentSearches}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#66756d] transition hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Clear</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => setQuery(term)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#d2ddd3] bg-[#f4f7f2] px-3 py-1 text-xs font-medium text-[#203129] transition hover:border-[#689c30] hover:bg-[#689c30]/10 hover:text-[#033927]"
                          >
                            <span>{term}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Results Count Header */}
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#66756d]">
                      {trimmedQuery
                        ? `Results for "${trimmedQuery}"`
                        : selectedTag !== "All"
                        ? `${selectedTag} Products`
                        : "All Available Products"}
                    </p>
                    <span className="inline-flex items-center rounded-full bg-[#689c30]/10 px-2.5 py-0.5 text-xs font-bold text-[#689c30]">
                      {searchResults.length} {searchResults.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  {searchResults.length > 0 ? (
                    <div className="space-y-2.5">
                      {searchResults.map((item) => (
                        <Link
                          key={`drawer-item-${item.href}`}
                          href={item.href}
                          onClick={() => {
                            saveRecentSearch(item.label)
                            closeMobileSearch()
                          }}
                          className="group relative flex items-center gap-3.5 rounded-2xl border border-[#d8e1d9] bg-white p-3 shadow-[0_6px_20px_rgba(31,42,34,0.05)] transition-all duration-200 hover:border-[#689c30]/50 hover:shadow-[0_10px_28px_rgba(104,156,48,0.12)] active:scale-[0.99]"
                        >
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f4f7f2] border border-border/40">
                            <Image
                              src={item.img || "/placeholder.svg"}
                              alt={item.label}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              sizes="64px"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="truncate font-sans text-base font-semibold text-[#203129] group-hover:text-[#689c30] transition-colors">
                                {item.label}
                              </h3>
                              <ChevronRight className="h-4 w-4 shrink-0 text-[#88968d] transition-transform group-hover:translate-x-0.5 group-hover:text-[#689c30]" />
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <span className="inline-flex items-center rounded-full border border-[#689c30]/25 bg-[#689c30]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#033927]">
                                {item.category || item.type}
                              </span>
                              <span className="font-sans text-sm font-bold text-[#033927]">
                                {item.price}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#d8e1d9] bg-white/70 p-8 text-center shadow-xs">
                      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#689c30]/10 text-[#689c30]">
                        <Search className="h-6 w-6" aria-hidden />
                      </span>
                      <h3 className="mt-4 font-sans text-lg font-bold text-[#203129]">No products found</h3>
                      <p className="mt-1.5 text-xs text-[#66756d]">
                        No items match &quot;{query}&quot;. Try selecting &quot;All&quot; or resetting filters.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("")
                          setSelectedTag("All")
                        }}
                        className="mt-4 inline-flex h-9 items-center justify-center rounded-full border border-[#033927] bg-[#033927] px-5 text-xs font-semibold text-white transition hover:bg-[#689c30] hover:!text-black"
                      >
                        Reset search filters
                      </button>
                    </div>
                  )}
                </div>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
