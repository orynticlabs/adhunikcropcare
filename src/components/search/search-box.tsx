"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Package, Search, Tag, X } from "lucide-react"
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

type SearchItem = {
  label: string
  type: "Product" | "Category"
  keywords: string
  href: string
  category?: string
  price?: string
}

type CmsProduct = {
  category: string
  name: string
  price: number
  salePrice: number | null
  shortDescription: string
  slug: string
}

const CATEGORY_ITEMS: SearchItem[] = [
  { label: "Fertilizers", type: "Category", keywords: "crop nutrition npk", href: "/products?q=Fertilizers" },
  { label: "Organic", type: "Category", keywords: "compost manure natural", href: "/products?q=Organic" },
  { label: "Bio Products", type: "Category", keywords: "biological biofertilizer", href: "/products?q=Bio%20Products" },
  { label: "Soil Care", type: "Category", keywords: "conditioner booster", href: "/products?q=Soil%20Care" },
  { label: "Pest Management", type: "Category", keywords: "pesticide insecticide crop protection", href: "/products?q=Pest%20Management" },
  { label: "Irrigation", type: "Category", keywords: "drip sprinkler water", href: "/products?q=Irrigation" },
]

export default function SearchBox() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [productItems, setProductItems] = useState<SearchItem[]>([])
  const [query, setQuery] = useState("")
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentInputRef = useRef<HTMLInputElement | null>(null)

  const trimmedQuery = query.trim()
  useEffect(() => {
    fetch("/api/products")
      .then((response) => response.json())
      .then((json) => {
        if (!json.success || !Array.isArray(json.data)) return
        setProductItems(
          json.data.map((product: CmsProduct) => ({
            category: product.category,
            href: `/products/${product.slug}`,
            keywords: [product.category, product.shortDescription].join(" "),
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

  const searchResults = useMemo(() => {
    const searchItems = [...productItems, ...CATEGORY_ITEMS]

    if (!trimmedQuery) {
      return productItems.slice(0, 6)
    }

    return searchItems
      .filter((item) =>
        matchesSearchQuery(trimmedQuery, [item.label, item.type, item.category, item.keywords]),
      )
      .sort((a, b) => Number(b.type === "Product") - Number(a.type === "Product"))
      .slice(0, 7)
  }, [productItems, trimmedQuery])

  /* ── Typewriter ──────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return

    const input = inputRef.current
    if (!input) return

    let termIdx  = 0
    let charIdx  = 0
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
          termIdx  = (termIdx + 1) % TERMS.length
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

  /* ── Auto-focus ──────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 330)
    return () => clearTimeout(t)
  }, [open])

  /* ── Click-outside ───────────────────────────────────────── */
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [open])

  /* ── Escape key ──────────────────────────────────────────── */
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

  function submitSearch() {
    const nextQuery = trimmedQuery
    if (!nextQuery) {
      router.push("/products")
      closeSearch()
      return
    }

    router.push(`/products?q=${encodeURIComponent(nextQuery)}`)
    closeSearch()
  }

  /* ── Render ──────────────────────────────────────────────── */
  return (
    /*
     * flex-row-reverse: button (first in DOM) → rightmost visually;
     * input wrapper (second in DOM) → grows LEFTWARD from the button.
     * This keeps the icon anchored in place without shifting other actions.
     */
    <div ref={wrapperRef} className="relative flex flex-row-reverse items-center">
      {/* Toggle button */}
      <button
        onClick={() => {
          if (open) {
            closeSearch()
            return
          }
          setOpen(true)
        }}
        className="inline-flex items-center justify-center h-9 w-9 shrink-0
                   bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent
                   text-foreground hover:text-[#689c30] active:text-[#689c30]
                   focus:outline-none transition-colors duration-200 cursor-pointer"
        aria-label={open ? "Close search" : "Open search"}
        aria-expanded={open}
      >
        {open
          ? <X     className="h-[17px] w-[17px]" />
          : <Search className="h-[17px] w-[17px]" />}
      </button>

      {/* Expanding input — grows leftward because of flex-row-reverse */}
      <div
        className={`absolute right-full top-1/2 z-[60] -translate-y-1/2 transition-[width,opacity] duration-300 ease-out sm:static sm:z-auto sm:translate-y-0 ${
          open
            ? "w-[36vw] overflow-visible opacity-100 sm:w-[clamp(160px,28vw,280px)]"
            : "w-0 overflow-hidden opacity-0"
        }`}
        style={{
          transition:
            "width 320ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease",
        }}
      >
        {/* small right gap so input doesn't touch the toggle button */}
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
                submitSearch()
              }
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = ACCENT
              e.currentTarget.style.boxShadow   = `0 0 0 3px ${ACCENT}22`
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = ""
              e.currentTarget.style.boxShadow   = ""
            }}
          />

          {open ? (
            <div
              data-testid="search-suggestions"
              className="absolute left-1/2 top-[calc(100%+0.5rem)] -translate-x-1/2 z-50 w-[min(calc(100vw-1.5rem),23rem)] overflow-hidden rounded-[1.35rem] border border-border/60 bg-background/96 shadow-[0_18px_46px_rgba(3,57,39,0.14)] backdrop-blur-md sm:left-auto sm:right-0 sm:top-[calc(100%+0.55rem)] sm:translate-x-0 sm:w-[min(92vw,23rem)]"
            >
              <div className="border-b border-border/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {trimmedQuery ? "Search results" : "Popular searches"}
              </div>

              {searchResults.length > 0 ? (
                <div className="py-1.5">
                  {searchResults.map((item) => {
                    const Icon = item.type === "Product" ? Package : Tag

                    return (
                      <Link
                        key={`${item.type}-${item.label}`}
                        href={item.href}
                        onClick={closeSearch}
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
                onClick={submitSearch}
                className="flex w-full items-center justify-center border-t border-border/50 px-4 py-3 text-sm font-semibold text-[#033927] transition hover:bg-[#689c30]/8 hover:text-[#689c30]"
              >
                Search for {trimmedQuery ? `"${trimmedQuery}"` : "all products"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
