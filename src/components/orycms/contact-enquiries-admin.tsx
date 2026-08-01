"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Filter,
  Inbox,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  User,
  X,
} from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import type { OryCMSContactEnquiryDTO } from "@/lib/orycms/contact-enquiries"
import { cn } from "@/lib/utils"

type FilterStatus = "all" | "new" | "read" | "closed"

export function OryCMSContactEnquiriesAdmin() {
  const [items, setItems] = useState<OryCMSContactEnquiryDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all")
  const [selectedEnquiry, setSelectedEnquiry] = useState<OryCMSContactEnquiryDTO | null>(null)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  useEffect(() => {
    setHighlightedId(new URLSearchParams(window.location.search).get("highlight"))
    void load()
  }, [])

  useEffect(() => {
    if (!highlightedId || loading) return
    const el = document.getElementById(highlightedId)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [highlightedId, loading])

  async function load() {
    setLoading(true)
    setError("")
    try {
      const json = await fetch("/api/orycms/contact-enquiries", { cache: "no-store" }).then((response) => response.json())
      if (!json.success) throw new Error(json.error?.message ?? "Failed to load contact enquiries.")
      const data = Array.isArray(json.data) ? json.data : []
      setItems(data)
      if (highlightedId) {
        const found = data.find((item: OryCMSContactEnquiryDTO) => item.id === highlightedId)
        if (found) setSelectedEnquiry(found)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contact enquiries.")
    } finally {
      setLoading(false)
    }
  }

  async function setStatus(item: OryCMSContactEnquiryDTO, status: string) {
    try {
      const json = await fetch(`/api/orycms/contact-enquiries/${item.id}`, {
        body: JSON.stringify({ status }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }).then((response) => response.json())
      if (json.success && json.data) {
        setItems((current) => current.map((entry) => (entry.id === item.id ? json.data : entry)))
        if (selectedEnquiry?.id === item.id) {
          setSelectedEnquiry(json.data)
        }
      }
    } catch (err) {
      console.error("Status update error", err)
    }
  }

  const counts = useMemo(() => {
    const total = items.length
    const countNew = items.filter((i) => i.status === "new").length
    const countRead = items.filter((i) => i.status === "read").length
    const countClosed = items.filter((i) => i.status === "closed").length
    return { countClosed, countNew, countRead, total }
  }, [items])

  const filtered = useMemo(() => {
    let list = items
    if (statusFilter !== "all") {
      list = list.filter((item) => item.status === statusFilter)
    }
    const needle = query.trim().toLowerCase()
    if (!needle) return list
    return list.filter((item) =>
      [item.ticketId, item.fullName, item.email, item.mobileNumber, item.topic, item.location, item.message]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    )
  }, [items, statusFilter, query])

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopySuccess(label)
    setTimeout(() => setCopySuccess(null), 2500)
  }

  return (
    <section className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 lg:px-8">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <OryCMSBreadcrumbs
            items={[
              { href: "/admin", label: "Overview" },
              { href: "/admin/collections", label: "Collections" },
              { href: "/admin/collections/contact", label: "Contact" },
            ]}
          />
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-foreground">
            Contact Enquiries
          </h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
            Manage customer support enquiries, agronomist guidance requests, and dealership leads.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:bg-surface-muted cursor-pointer select-none"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          onClick={() => setStatusFilter("all")}
          className={cn(
            "flex items-center justify-between rounded-xl border p-4 shadow-xs transition-all cursor-pointer select-none",
            statusFilter === "all"
              ? "border-[#033927] bg-[#edf3e9] text-[#033927] ring-1 ring-[#033927]"
              : "border-border bg-surface hover:border-border-strong",
          )}
        >
          <div>
            <div className="text-[12px] font-medium text-muted-foreground">Total Enquiries</div>
            <div className="mt-1 text-[22px] font-bold text-foreground">{counts.total}</div>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-muted text-foreground">
            <Inbox className="h-5 w-5" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("new")}
          className={cn(
            "flex items-center justify-between rounded-xl border p-4 shadow-xs transition-all cursor-pointer select-none",
            statusFilter === "new"
              ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600"
              : "border-border bg-surface hover:border-emerald-300",
          )}
        >
          <div>
            <div className="text-[12px] font-medium text-emerald-700">New / Unread</div>
            <div className="mt-1 text-[22px] font-bold text-emerald-800">{counts.countNew}</div>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-100 text-emerald-800">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("read")}
          className={cn(
            "flex items-center justify-between rounded-xl border p-4 shadow-xs transition-all cursor-pointer select-none",
            statusFilter === "read"
              ? "border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-600"
              : "border-border bg-surface hover:border-amber-300",
          )}
        >
          <div>
            <div className="text-[12px] font-medium text-amber-700">In Review (Read)</div>
            <div className="mt-1 text-[22px] font-bold text-amber-800">{counts.countRead}</div>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-amber-800">
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("closed")}
          className={cn(
            "flex items-center justify-between rounded-xl border p-4 shadow-xs transition-all cursor-pointer select-none",
            statusFilter === "closed"
              ? "border-slate-600 bg-slate-100 text-slate-950 ring-1 ring-slate-600"
              : "border-border bg-surface hover:border-slate-300",
          )}
        >
          <div>
            <div className="text-[12px] font-medium text-slate-600">Resolved & Closed</div>
            <div className="mt-1 text-[22px] font-bold text-slate-800">{counts.countClosed}</div>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-200 text-slate-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Enquiries Panel */}
      <div className="rounded-xl border border-border bg-surface shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-muted/60 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 min-w-[280px] flex-1">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search ticket ID, name, email, mobile, location, message…"
                className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-[13px] outline-none focus:border-border-strong transition-colors"
              />
            </div>
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-[11.5px] font-medium text-muted-foreground hover:bg-surface-muted cursor-pointer"
              >
                Clear search
              </button>
            ) : null}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-1">
            {(["all", "new", "read", "closed"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "rounded-md px-3 py-1 text-[12px] font-semibold capitalize transition-colors cursor-pointer select-none",
                  statusFilter === st
                    ? "bg-[#033927] text-white shadow-xs"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                )}
              >
                {st === "all" ? `All (${counts.total})` : `${st} (${counts[st === "new" ? "countNew" : st === "read" ? "countRead" : "countClosed"]})`}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-12 text-center text-[13px] text-muted-foreground">
            <div className="inline-flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-[#033927]" />
              Loading contact enquiries…
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-[13px] text-destructive">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[13px] text-muted-foreground">
            No contact enquiries match your selected filters.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Desktop / Laptop Table Header (visible on lg+) */}
            <div className="hidden lg:grid grid-cols-[140px_220px_160px_1fr_130px_130px_160px] items-center gap-4 bg-surface-muted/40 px-5 py-2.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
              <div>Ticket ID</div>
              <div>Customer Info</div>
              <div>Topic</div>
              <div>Message Summary</div>
              <div>Submitted Date</div>
              <div className="text-center">Status</div>
              <div className="text-right">Update Status</div>
            </div>

            {/* Enquiries Items */}
            {filtered.map((item) => {
              const isSelected = selectedEnquiry?.id === item.id
              const isHighlighted = highlightedId === item.id

              return (
                <article
                  key={item.id}
                  id={item.id}
                  onClick={() => setSelectedEnquiry(item)}
                  className={cn(
                    "grid gap-4 p-4 lg:px-5 lg:py-4 transition-colors cursor-pointer select-none",
                    "lg:grid-cols-[140px_220px_160px_1fr_130px_130px_160px] lg:items-center",
                    isHighlighted && "bg-emerald-50/70 ring-1 ring-inset ring-emerald-400",
                    isSelected ? "bg-[#edf3e9]/60" : "hover:bg-surface-muted/50",
                  )}
                >
                  {/* Ticket ID */}
                  <div>
                    <span className="inline-flex items-center rounded-md border border-[#689c30]/30 bg-[#edf3e9] px-2.5 py-1 font-mono text-[11.5px] font-bold text-[#033927]">
                      {item.ticketId}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-[13.5px] font-semibold text-foreground truncate">{item.fullName}</div>
                    <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground truncate">
                      <Mail className="h-3 w-3 shrink-0 text-[#033927]" />
                      <span className="truncate">{item.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground truncate">
                      <Phone className="h-3 w-3 shrink-0 text-[#033927]" />
                      <span>{item.countryCode} {item.mobileNumber}</span>
                    </div>
                  </div>

                  {/* Topic */}
                  <div>
                    <span className="inline-block rounded-full bg-surface-muted border border-border px-2.5 py-1 text-[11.5px] font-medium text-foreground capitalize">
                      {label(item.topic)}
                    </span>
                    {item.location ? (
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Message Summary */}
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
                      {item.message}
                    </p>
                  </div>

                  {/* Submitted Date */}
                  <div className="text-[11.5px] text-muted-foreground">
                    <div className="font-medium text-foreground">{formatDateOnly(item.createdAt)}</div>
                    <div className="text-[10.5px]">{formatTimeOnly(item.createdAt)}</div>
                  </div>

                  {/* Status Badge */}
                  <div className="text-center">
                    <StatusBadge status={item.status} />
                  </div>

                  {/* Action Buttons */}
                  <div
                    className="flex items-center justify-end gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(["new", "read", "closed"] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => void setStatus(item, st)}
                        disabled={item.status === st}
                        className={cn(
                          "rounded-lg px-2 py-1 text-[11px] font-semibold capitalize transition-all cursor-pointer select-none border",
                          item.status === st
                            ? "bg-[#033927] text-white border-[#033927] shadow-2xs"
                            : "bg-surface text-foreground border-border hover:bg-[#689c30] hover:!text-black hover:border-[#689c30] disabled:opacity-40",
                        )}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail Modal / Drawer */}
      {selectedEnquiry ? (
        <div
          onClick={() => setSelectedEnquiry(null)}
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-md p-4 lg:p-6 animate-in fade-in duration-200"
        >
          <div
            className="w-full max-w-xl rounded-2xl border-2 border-border bg-white text-[#033927] p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-[#689c30]/40 bg-[#edf3e9] px-2.5 py-1 font-mono text-[12px] font-bold text-[#033927]">
                    #{selectedEnquiry.ticketId}
                  </span>
                  <StatusBadge status={selectedEnquiry.status} />
                </div>
                <h2 className="mt-2 text-[20px] font-bold tracking-tight text-[#033927]">
                  {selectedEnquiry.fullName}
                </h2>
                <div className="text-[12px] text-muted-foreground mt-0.5">
                  Submitted on {dateTime(selectedEnquiry.createdAt)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="grid h-8 w-8 place-items-center rounded-full border border-border bg-white text-[#033927] hover:bg-[#033927] hover:text-white cursor-pointer select-none transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Copy Notice */}
            {copySuccess ? (
              <div className="rounded-lg bg-emerald-50 border border-emerald-300 p-2.5 text-center text-[12.5px] font-bold text-emerald-900">
                Copied {copySuccess} to clipboard!
              </div>
            ) : null}

            {/* Contact Details Grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#d7e0da] bg-[#edf3e9]/50 p-3.5 space-y-1">
                <div className="text-[11px] font-semibold text-[#033927]/70 flex items-center justify-between">
                  <span>Mobile Number</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(`${selectedEnquiry.countryCode} ${selectedEnquiry.mobileNumber}`, "Mobile Number")}
                    className="text-[#033927] hover:text-[#689c30] font-bold cursor-pointer inline-flex items-center gap-1 text-[10.5px]"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
                <div className="text-[13.5px] font-bold text-[#033927] flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-[#033927]" />
                  <a href={`tel:${selectedEnquiry.mobileNumber}`} className="hover:underline">
                    {selectedEnquiry.countryCode} {selectedEnquiry.mobileNumber}
                  </a>
                </div>
              </div>

              <div className="rounded-xl border border-[#d7e0da] bg-[#edf3e9]/50 p-3.5 space-y-1">
                <div className="text-[11px] font-semibold text-[#033927]/70 flex items-center justify-between">
                  <span>Email Address</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedEnquiry.email, "Email Address")}
                    className="text-[#033927] hover:text-[#689c30] font-bold cursor-pointer inline-flex items-center gap-1 text-[10.5px]"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
                <div className="text-[13.5px] font-bold text-[#033927] flex items-center gap-2 min-w-0">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-[#033927]" />
                  <a href={`mailto:${selectedEnquiry.email}`} className="hover:underline truncate">
                    {selectedEnquiry.email}
                  </a>
                </div>
              </div>

              <div className="rounded-xl border border-[#d7e0da] bg-[#edf3e9]/50 p-3.5 space-y-1">
                <div className="text-[11px] font-semibold text-[#033927]/70">Topic</div>
                <div className="text-[13px] font-bold text-[#033927] capitalize">
                  {label(selectedEnquiry.topic)}
                </div>
              </div>

              <div className="rounded-xl border border-[#d7e0da] bg-[#edf3e9]/50 p-3.5 space-y-1">
                <div className="text-[11px] font-semibold text-[#033927]/70">Location</div>
                <div className="text-[13px] font-bold text-[#033927] flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#033927]" />
                  {selectedEnquiry.location || "Not specified"}
                </div>
              </div>
            </div>

            {/* Submitted Message */}
            <div className="space-y-2">
              <div className="text-[12px] font-bold uppercase tracking-wider text-[#033927]">
                Submitted Message
              </div>
              <div className="rounded-xl border-2 border-[#d7e0da] bg-[#edf3e9]/30 p-4 text-[14px] font-medium leading-relaxed text-[#033927] whitespace-pre-wrap">
                {selectedEnquiry.message}
              </div>
            </div>

            {/* Status Selector Footer */}
            <div className="border-t border-border pt-4 flex items-center justify-between gap-4">
              <div className="text-[12px] font-semibold text-muted-foreground">
                Update Status:
              </div>
              <div className="flex items-center gap-2">
                {(["new", "read", "closed"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => void setStatus(selectedEnquiry, st)}
                    disabled={selectedEnquiry.status === st}
                    className={cn(
                      "rounded-lg px-3.5 py-1.5 text-[12px] font-bold capitalize transition-all cursor-pointer select-none border",
                      selectedEnquiry.status === st
                        ? "bg-[#033927] text-white border-[#033927] shadow-xs"
                        : "bg-surface text-foreground border-border hover:bg-[#689c30] hover:!text-black hover:border-[#689c30] disabled:opacity-40",
                    )}
                  >
                    Set {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === "new") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
        New
      </span>
    )
  }
  if (status === "read") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
        In Review
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
      Closed
    </span>
  )
}

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function dateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}

function formatDateOnly(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

function formatTimeOnly(value: string) {
  return new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
}
