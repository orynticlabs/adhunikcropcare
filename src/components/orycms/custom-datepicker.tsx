"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function OryCMSDatePicker({
  label,
  value,
  onChange,
  required,
  placeholder,
  className,
  triggerClassName,
  showTime = false,
}: {
  label?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  className?: string
  triggerClassName?: string
  showTime?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState<"days" | "month" | "year">("days")
  const containerRef = useRef<HTMLDivElement>(null)

  const [viewDate, setViewDate] = useState(() => {
    const d = value ? new Date(value) : new Date()
    return isNaN(d.getTime()) ? new Date() : d
  })

  const [timeValue, setTimeValue] = useState("00:00")

  useEffect(() => {
    if (open) {
      setPickerMode("days")
    }
  }, [open])

  useEffect(() => {
    if (value) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        setViewDate(d)
        const parts = value.split("T")
        if (parts.length > 1) {
          setTimeValue(parts[1].slice(0, 5))
        } else if (showTime) {
          const hh = String(d.getHours()).padStart(2, "0")
          const mm = String(d.getMinutes()).padStart(2, "0")
          setTimeValue(`${hh}:${mm}`)
        }
      }
    }
  }, [value, showTime])

  const [align, setAlign] = useState<"left" | "right">("left")

  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceRight = window.innerWidth - rect.left
      if (spaceRight < 280) {
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

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = new Date(year, month, 1).getDay()

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1))
  }

  const handleSelectDay = (day: number) => {
    const selectedDate = new Date(year, month, day)
    const yyyy = selectedDate.getFullYear()
    const mm = String(selectedDate.getMonth() + 1).padStart(2, "0")
    const dd = String(selectedDate.getDate()).padStart(2, "0")
    if (showTime) {
      onChange(`${yyyy}-${mm}-${dd}T${timeValue}`)
    } else {
      onChange(`${yyyy}-${mm}-${dd}`)
      setOpen(false)
    }
  }

  const handleTimeChange = (newTime: string) => {
    setTimeValue(newTime)
    if (value) {
      const datePart = value.split("T")[0]
      onChange(`${datePart}T${newTime}`)
    } else {
      const today = new Date()
      const yyyy = today.getFullYear()
      const mm = String(today.getMonth() + 1).padStart(2, "0")
      const dd = String(today.getDate()).padStart(2, "0")
      onChange(`${yyyy}-${mm}-${dd}T${newTime}`)
    }
  }

  const formattedValue = useMemo(() => {
    if (!value) return ""
    const d = new Date(value)
    if (isNaN(d.getTime())) return ""
    const dateStr = d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })
    if (showTime) {
      const parts = value.split("T")
      if (parts.length > 1) {
        return `${dateStr}, ${parts[1].slice(0, 5)}`
      }
      const hh = String(d.getHours()).padStart(2, "0")
      const mm = String(d.getMinutes()).padStart(2, "0")
      return `${dateStr}, ${hh}:${mm}`
    }
    return dateStr
  }, [value, showTime])

  const daysGrid = []
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push(d)
  }

  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  return (
    <div ref={containerRef} className={cn("relative w-full text-left", className)}>
      {label && <span className="mb-1.5 block text-[12px] font-medium text-foreground">{label}</span>}
      
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2.5 rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none transition-colors hover:bg-accent/40 focus:border-border-strong text-foreground select-none cursor-pointer",
          !value && "text-muted-foreground",
          triggerClassName
        )}
      >
        <span>{formattedValue || placeholder || `Select date`}</span>
        <span className="text-muted-foreground">📅</span>
      </button>

      {open && (
        <div className={cn(
          "absolute top-[calc(100%+4px)] z-[80] w-[280px] rounded-xl border border-border bg-popover text-popover-foreground p-3 shadow-xl opacity-100 animate-in fade-in-0 zoom-in-95",
          align === "right" ? "right-0 left-auto" : "left-0"
        )}>
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-border">
            {pickerMode === "days" ? (
              <>
                <button type="button" onClick={handlePrevMonth} className="p-1 rounded hover:bg-muted text-foreground cursor-pointer animate-none">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPickerMode("month")}
                    className="text-[12.5px] font-bold text-foreground hover:bg-muted px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                  >
                    {months[month]}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerMode("year")}
                    className="text-[12.5px] font-bold text-foreground hover:bg-muted px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                  >
                    {year}
                  </button>
                </div>
                <button type="button" onClick={handleNextMonth} className="p-1 rounded hover:bg-muted text-foreground cursor-pointer animate-none">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <div className="text-[12.5px] font-bold text-foreground pl-1">
                  {pickerMode === "month" ? "Select Month" : "Select Year"}
                </div>
                <button
                  type="button"
                  onClick={() => setPickerMode("days")}
                  className="text-[11px] font-semibold text-[#FF5A20] hover:underline cursor-pointer pr-1"
                >
                  Back
                </button>
              </>
            )}
          </div>

          {pickerMode === "days" && (
            <>
              <div className="grid grid-cols-7 text-center gap-y-1 mb-1">
                {weekdays.map((wd) => (
                  <span key={wd} className="text-[10px] font-bold text-muted-foreground uppercase">{wd}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {daysGrid.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} />
                  }

                  const isSelected = (() => {
                    if (!value) return false
                    const d = new Date(value)
                    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
                  })()

                  return (
                    <button
                      key={`day-${day}`}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={cn(
                        "h-7 w-7 rounded-lg text-[12px] flex items-center justify-center transition-colors cursor-pointer",
                        isSelected
                          ? "bg-[#FF5A20] text-white font-bold"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {pickerMode === "month" && (
            <div className="grid grid-cols-3 gap-2 pt-1.5">
              {months.map((m, idx) => {
                const isSelected = idx === month
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setViewDate(new Date(year, idx, 1))
                      setPickerMode("days")
                    }}
                    className={cn(
                      "py-2 rounded-lg text-[12.5px] transition-colors font-medium text-center cursor-pointer",
                      isSelected
                        ? "bg-[#FF5A20] text-white font-bold"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    {m.slice(0, 3)}
                  </button>
                )
              })}
            </div>
          )}

          {pickerMode === "year" && (
            <div className="grid grid-cols-4 gap-2 pt-1.5 max-h-[170px] overflow-y-auto scrollbar-thin">
              {Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - 20 + i).map((y) => {
                const isSelected = y === year
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setViewDate(new Date(y, month, 1))
                      setPickerMode("days")
                    }}
                    className={cn(
                      "py-1.5 rounded-lg text-[12.5px] transition-colors font-medium text-center cursor-pointer",
                      isSelected
                        ? "bg-[#FF5A20] text-white font-bold"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    {y}
                  </button>
                )
              })}
            </div>
          )}

          {showTime && pickerMode === "days" && (
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border">
              <span className="text-[11.5px] font-medium text-muted-foreground">Time:</span>
              <input
                type="time"
                value={timeValue}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="h-7 rounded border border-border bg-surface px-1.5 text-[12px] text-foreground outline-none focus:border-[#FF5A20]"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[11px] font-semibold text-[#FF5A20] hover:underline cursor-pointer"
              >
                Apply
              </button>
            </div>
          )}

          {!required && value && pickerMode === "days" && (
            <div className="mt-2 pt-2 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onChange("")
                  setOpen(false)
                }}
                className="text-[11px] font-medium text-destructive hover:underline cursor-pointer"
              >
                Clear date
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
