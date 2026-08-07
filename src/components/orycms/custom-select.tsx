"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export type SelectOption = {
  label: string
  value: string
}

export function OryCMSSelect({
  value,
  onChange,
  options,
  placeholder = "Select option",
  searchable = false,
  className,
  label,
  ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  options: (string | SelectOption)[]
  placeholder?: string
  searchable?: boolean
  className?: string
  label?: string
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const [align, setAlign] = useState<"left" | "right">("left")

  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceRight = window.innerWidth - rect.left
      if (spaceRight < 300) {
        setAlign("right")
      } else {
        setAlign("left")
      }
    }
  }, [open])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const normalizedOptions = useMemo<SelectOption[]>(() => {
    return options.map((opt) =>
      typeof opt === "string" ? { label: opt, value: opt } : opt
    )
  }, [options])

  const allOptions = useMemo(() => {
    if (value && !normalizedOptions.some((opt) => opt.value === value)) {
      return [{ label: value, value }, ...normalizedOptions]
    }
    return normalizedOptions
  }, [normalizedOptions, value])

  const selectedOption = allOptions.find((opt) => opt.value === value)

  const filteredOptions = useMemo(() => {
    if (!searchable || !search.trim()) return allOptions
    const q = search.toLowerCase().trim()
    return allOptions.filter((opt) => opt.label.toLowerCase().includes(q))
  }, [allOptions, search, searchable])

  return (
    <div ref={containerRef} className={cn("relative text-left", className)}>
      {label ? <span className="mb-1.5 block text-[12px] font-medium text-foreground">{label}</span> : null}
      <button
        type="button"
        aria-label={ariaLabel || label || placeholder}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((prev) => !prev)
          setSearch("")
        }}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2.5 rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none transition-colors hover:bg-accent/40 focus:border-border-strong text-foreground select-none cursor-pointer",
          !value && "text-muted-foreground"
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : value || placeholder}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className={cn(
          "absolute top-[calc(100%+4px)] z-50 min-w-full w-max max-w-xs rounded-xl border border-border bg-popover text-popover-foreground p-1.5 shadow-xl opacity-100 animate-in fade-in-0 zoom-in-95",
          align === "right" ? "right-0 left-auto" : "left-0"
        )}>
          {searchable ? (
            <div className="relative mb-1.5">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="h-8 w-full rounded-md border border-border bg-muted/50 pl-8 pr-2 text-[12px] text-foreground outline-none focus:border-border-strong"
                autoFocus
              />
            </div>
          ) : null}

          <div className="max-h-56 overflow-y-auto space-y-0.5 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-muted-foreground text-center">No options found</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onChange(opt.value)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-[12.5px] transition-colors text-left whitespace-nowrap",
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <span>{opt.label}</span>
                    {isSelected ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export type MultiSelectOption = {
  label: string
  value: string
  image?: string
}

export function OryCMSMultiSelect({
  values,
  onChange,
  options,
  placeholder = "Select options",
  searchable = false,
  className,
  label,
  ariaLabel,
}: {
  values: string[]
  onChange: (values: string[]) => void
  options: (string | MultiSelectOption)[]
  placeholder?: string
  searchable?: boolean
  className?: string
  label?: string
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const [align, setAlign] = useState<"left" | "right">("left")

  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceRight = window.innerWidth - rect.left
      if (spaceRight < 340) {
        setAlign("right")
      } else {
        setAlign("left")
      }
    }
  }, [open])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const normalizedOptions = useMemo<MultiSelectOption[]>(() => {
    return options.map((opt) =>
      typeof opt === "string" ? { label: opt, value: opt } : opt
    )
  }, [options])

  const filteredOptions = useMemo(() => {
    if (!searchable || !search.trim()) return normalizedOptions
    const q = search.toLowerCase().trim()
    return normalizedOptions.filter((opt) => opt.label.toLowerCase().includes(q))
  }, [normalizedOptions, search, searchable])

  const selectedCount = values.length
  const triggerLabel = useMemo(() => {
    if (selectedCount === 0) return placeholder
    if (selectedCount === 1) {
      const match = normalizedOptions.find((opt) => opt.value === values[0])
      return match ? match.label : "1 image selected"
    }
    return `${selectedCount} images selected`
  }, [normalizedOptions, placeholder, selectedCount, values])

  const toggleValue = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val))
    } else {
      onChange([...values, val])
    }
  }

  return (
    <div ref={containerRef} className={cn("relative text-left", className)}>
      {label ? <span className="mb-1.5 block text-[12px] font-medium text-foreground">{label}</span> : null}
      <button
        type="button"
        aria-label={ariaLabel || label || placeholder}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((prev) => !prev)
          setSearch("")
        }}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2.5 rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none transition-colors hover:bg-accent/40 focus:border-border-strong text-foreground select-none cursor-pointer",
          selectedCount === 0 && "text-muted-foreground"
        )}
      >
        <span className="truncate flex items-center gap-1.5 font-medium">
          {selectedCount > 0 && (
            <span className="inline-flex h-5 items-center justify-center rounded-full bg-[#689c30] px-1.5 text-[10.5px] font-bold text-white shrink-0">
              {selectedCount}
            </span>
          )}
          <span>{triggerLabel}</span>
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className={cn(
          "absolute top-[calc(100%+4px)] z-50 min-w-[240px] w-full max-w-sm rounded-xl border border-border bg-popover text-popover-foreground p-1.5 shadow-xl opacity-100 animate-in fade-in-0 zoom-in-95",
          align === "right" ? "right-0 left-auto" : "left-0"
        )}>
          {searchable ? (
            <div className="relative mb-1.5">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search images..."
                className="h-8 w-full rounded-md border border-border bg-muted/50 pl-8 pr-2 text-[12px] text-foreground outline-none focus:border-border-strong"
                autoFocus
              />
            </div>
          ) : null}

          {selectedCount > 0 ? (
            <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-border text-[11px] text-muted-foreground">
              <span>{selectedCount} selected</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="font-medium text-destructive hover:underline cursor-pointer"
              >
                Clear all
              </button>
            </div>
          ) : null}

          <div className="max-h-56 overflow-y-auto space-y-0.5 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-muted-foreground text-center">No images available</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = values.includes(opt.value)
                return (
                  <div
                    key={opt.value}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleValue(opt.value)
                    }}
                    className={cn(
                      "flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors cursor-pointer select-none",
                      isSelected
                        ? "bg-[#689c30]/15 text-[#033927] font-medium"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="h-4 w-4 rounded border-border text-[#689c30] focus:ring-[#689c30] cursor-pointer"
                      />
                      {opt.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={opt.image}
                          alt={opt.label}
                          className="h-7 w-7 rounded border border-border object-contain bg-white p-0.5 shrink-0"
                        />
                      ) : null}
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {isSelected ? <Check className="h-3.5 w-3.5 shrink-0 text-[#689c30]" /> : null}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
