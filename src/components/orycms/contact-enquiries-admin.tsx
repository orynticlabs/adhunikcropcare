"use client"

import { useEffect, useMemo, useState } from "react"
import { Mail, MapPin, Phone, Search } from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import type { OryCMSContactEnquiryDTO } from "@/lib/orycms/contact-enquiries"
import { cn } from "@/lib/utils"

export function OryCMSContactEnquiriesAdmin() {
  const [items, setItems] = useState<OryCMSContactEnquiryDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    setHighlightedId(new URLSearchParams(window.location.search).get("highlight"))
    void load()
  }, [])

  useEffect(() => {
    if (!highlightedId || loading) return
    document.getElementById(highlightedId)?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [highlightedId, loading])

  async function load() {
    setLoading(true)
    setError("")
    try {
      const json = await fetch("/api/orycms/contact-enquiries", { cache: "no-store" }).then((response) => response.json())
      if (!json.success) throw new Error(json.error?.message ?? "Failed to load contact enquiries.")
      setItems(Array.isArray(json.data) ? json.data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contact enquiries.")
    } finally {
      setLoading(false)
    }
  }

  async function setStatus(item: OryCMSContactEnquiryDTO, status: string) {
    const json = await fetch(`/api/orycms/contact-enquiries/${item.id}`, {
      body: JSON.stringify({ status }),
      headers: { "content-type": "application/json" },
      method: "PATCH",
    }).then((response) => response.json())
    if (json.success) setItems((current) => current.map((entry) => entry.id === item.id ? json.data : entry))
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return items
    return items.filter((item) => [item.ticketId, item.fullName, item.email, item.mobileNumber, item.topic, item.location, item.message].join(" ").toLowerCase().includes(needle))
  }, [items, query])

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-6 py-6 lg:px-8">
      <div>
        <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/collections", label: "Collections" }, { href: "/admin/collections/contact", label: "Contact" }]} />
        <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">Contact</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
          Review contact enquiries submitted from the Frontstore Contact Us form.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-xs">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-muted px-4 py-3">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search contacts…"
              className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-[13px] outline-none focus:border-border-strong"
            />
          </div>
          <span className="text-[12.5px] text-muted-foreground">{filtered.length} enquiries</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[13px] text-muted-foreground">Loading contact enquiries…</div>
        ) : error ? (
          <div className="p-8 text-center text-[13px] text-destructive">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-muted-foreground">No contact enquiries found.</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((item) => (
              <article key={item.id} id={item.id} className={cn("grid gap-4 p-4 lg:grid-cols-[280px_1fr_160px]", highlightedId === item.id && "bg-success/5 ring-1 ring-inset ring-success/30")}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[10.5px] font-semibold">{item.ticketId}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-medium", item.status === "new" ? "bg-success/10 text-success" : item.status === "closed" ? "bg-muted text-muted-foreground" : "bg-warning/10 text-warning")}>{label(item.status)}</span>
                    <span className="text-[11.5px] text-muted-foreground">{dateTime(item.createdAt)}</span>
                  </div>
                  <h2 className="text-[14px] font-semibold">{item.fullName}</h2>
                  <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {item.email}</p>
                  <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {item.countryCode} {item.mobileNumber}</p>
                  <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {item.location}</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label(item.topic)}</p>
                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-foreground">{item.message}</p>
                </div>
                <div className="flex items-start justify-end gap-2">
                  {(["new", "read", "closed"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => void setStatus(item, status)}
                      disabled={item.status === status}
                      className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[11.5px] font-medium transition-colors hover:bg-accent disabled:opacity-50"
                    >
                      {label(status)}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function dateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}
