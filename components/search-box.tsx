"use client"

import { useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"

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

export default function SearchBox() {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  /* ── Render ──────────────────────────────────────────────── */
  return (
    /*
     * flex-row-reverse: button (first in DOM) → rightmost visually;
     * input wrapper (second in DOM) → grows LEFTWARD from the button.
     * This keeps the icon anchored in place without shifting other actions.
     */
    <div ref={wrapperRef} className="flex flex-row-reverse items-center">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center h-9 w-9 shrink-0
                   bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent
                   text-foreground hover:text-[--leaf] active:text-[--leaf]
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
        style={{
          /* clamp keeps it responsive: 160px on small, up to 280px on lg */
          width:   open ? "clamp(160px, 28vw, 280px)" : "0px",
          opacity: open ? 1 : 0,
          transition:
            "width 320ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease",
          overflow: "hidden",
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
            ref={inputRef}
            type="search"
            autoComplete="off"
            className="w-full h-9 rounded-full border border-border/50 bg-background/80
                       pl-8 pr-3 text-sm text-foreground outline-none
                       placeholder:text-muted-foreground/70
                       transition-[border-color,box-shadow] duration-200"
            onFocus={(e) => {
              e.currentTarget.style.borderColor = ACCENT
              e.currentTarget.style.boxShadow   = `0 0 0 3px ${ACCENT}22`
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = ""
              e.currentTarget.style.boxShadow   = ""
            }}
          />
        </div>
      </div>
    </div>
  )
}
