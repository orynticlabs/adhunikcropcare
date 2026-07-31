"use client"

import { useEffect, useRef, useState } from "react"
import {
  CheckCircle2, ChevronLeft, ChevronRight, Copy, Loader2,
  Megaphone, Plus, RefreshCw, Search, Tag, Trash2, X, Zap,
} from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { OryCMSSelect } from "@/components/orycms/custom-select"
import { RichTextEditor } from "@/components/orycms/rich-text-editor"
import { playOryCMSToastSound } from "@/lib/orycms/toast-sound"

// ─── types ───────────────────────────────────────────────────────────────────
type DiscountType = "percentage" | "fixed" | "free_shipping" | "bxgy"
type AppliesTo    = "entire_store" | "categories" | "products" | "brands"

type Discount = {
  id: string; name: string; code: string | null; shortText: string | null
  description: string | null; type: DiscountType; value: number
  minOrderAmount: number | null; maxDiscountAmount: number | null
  usageLimit: number | null; perUserLimit: number | null; usageCount: number
  startsAt: string | null; endsAt: string | null
  active: boolean; autoApply: boolean; showInOffers: boolean; showInBar: boolean
  priority: number; bgColor: string | null; textColor: string | null
  buttonColor: string | null; buttonText: string | null; badgeText: string | null
  appliesTo: AppliesTo; targetIds: string[]
  firstOrderOnly: boolean; loggedInOnly: boolean
  newCustomersOnly: boolean; existingCustomersOnly: boolean
  createdAt: string; updatedAt: string
}

type Announcement = {
  id: string; content: string; ctaText: string | null; ctaUrl: string | null
  startsAt: string | null; endsAt: string | null
  active: boolean; priority: number; bgColor: string | null; textColor: string | null
  createdAt: string; updatedAt: string
}

type Toast = { id: string; message: string; type: "success" | "error" }

// ─── helpers ─────────────────────────────────────────────────────────────────
function blankDiscount(): Omit<Discount, "id" | "usageCount" | "createdAt" | "updatedAt"> {
  return {
    name: "", code: "", shortText: "", description: "", type: "percentage", value: 0,
    minOrderAmount: null, maxDiscountAmount: null, usageLimit: null, perUserLimit: null,
    startsAt: null, endsAt: null, active: true, autoApply: false, showInOffers: true,
    showInBar: false, priority: 0, bgColor: null, textColor: null, buttonColor: null,
    buttonText: "Shop Now", badgeText: null, appliesTo: "entire_store", targetIds: [],
    firstOrderOnly: false, loggedInOnly: false, newCustomersOnly: false, existingCustomersOnly: false,
  }
}

function blankAnnouncement(): Omit<Announcement, "id" | "createdAt" | "updatedAt"> {
  return { content: "", ctaText: null, ctaUrl: null, startsAt: null, endsAt: null, active: true, priority: 0, bgColor: null, textColor: null }
}

function discountStatus(d: Discount): "active" | "inactive" | "expired" | "scheduled" {
  const now = new Date()
  if (!d.active) return "inactive"
  if (d.endsAt && new Date(d.endsAt) < now) return "expired"
  if (d.startsAt && new Date(d.startsAt) > now) return "scheduled"
  if (d.usageLimit != null && d.usageCount >= d.usageLimit) return "expired"
  return "active"
}

function toLocalDatetime(iso: string | null | undefined) {
  if (!iso) return ""
  return new Date(iso).toISOString().slice(0, 16)
}
function fromLocalDatetime(v: string) { return v ? new Date(v).toISOString() : null }

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—"
}

// ─── shared ui ───────────────────────────────────────────────────────────────
const INPUT = "h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-border-strong"
const INPUT_TALL = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-border-strong min-h-[80px]"

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[12.5px] font-medium">{label}</span>
      {children}
    </label>
  )
}

function Chk({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (v: boolean) => void; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border border-border accent-foreground"
      />
      <div>
        <p className="text-[13px] font-medium leading-none">{label}</p>
        {description && <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>}
      </div>
    </label>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12.5px] font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <input type="color" value={value ?? "#000000"} onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 cursor-pointer rounded-lg border border-border bg-surface p-0.5" />
        <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}
          placeholder="#000000" className={INPUT} />
        {value && (
          <button type="button" onClick={() => onChange(null)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>
}

function StatusBadge({ status }: { status: "active" | "inactive" | "expired" | "scheduled" }) {
  const map = {
    active:    "bg-success/10 text-success border-success/20",
    inactive:  "bg-muted text-muted-foreground border-border",
    expired:   "bg-destructive/10 text-destructive border-destructive/20",
    scheduled: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  }
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[status]}`}>
      {status}
    </span>
  )
}

function TypeBadge({ type }: { type: DiscountType }) {
  const map: Record<DiscountType, string> = { percentage: "% Off", fixed: "₹ Off", free_shipping: "Free Ship", bxgy: "BXGY" }
  return <span className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{map[type]}</span>
}

function OryToast({ toast }: { toast: Toast | null }) {
  if (!toast) return null
  return (
    <div className="fixed bottom-4 right-4 z-[100] w-[min(360px,calc(100vw-2rem))] rounded-xl border border-border bg-white p-3 text-[12.5px] shadow-pop">
      <div className="flex items-start gap-3">
        {toast.type === "success"
          ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          : <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
        <span className="text-foreground">{toast.message}</span>
      </div>
    </div>
  )
}

// ─── target selector ─────────────────────────────────────────────────────────
function TargetSelector({ appliesTo, targetIds, onChange }: {
  appliesTo: AppliesTo; targetIds: string[]; onChange: (ids: string[]) => void
}) {
  const [options, setOptions] = useState<{ id: string; label: string }[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (appliesTo === "entire_store") return
    setLoading(true)
    const url = appliesTo === "products" ? "/api/orycms/products" : "/api/orycms/categories"
    fetch(url).then((r) => r.json()).then((json) => {
      if (!json.success) return
      if (appliesTo === "products") setOptions((json.data as { slug: string; name: string }[]).map((p) => ({ id: p.slug, label: p.name })))
      else if (appliesTo === "categories") setOptions((json.data as { slug: string; name: string }[]).map((c) => ({ id: c.slug, label: c.name })))
      else setOptions((json.data as { brand: string }[]).filter((p) => p.brand).map((p) => ({ id: p.brand, label: p.brand })))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [appliesTo])

  if (appliesTo === "entire_store") return null

  const label = appliesTo === "products" ? "Products" : appliesTo === "categories" ? "Categories" : "Brands"
  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-2">
      <span className="text-[12.5px] font-medium">Select {label}</span>
      <div className="relative">
        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
          className="h-8 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-[12.5px] outline-none focus:border-border-strong" />
      </div>
      {loading ? <p className="text-[12px] text-muted-foreground">Loading…</p> : (
        <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
          {filtered.length === 0 ? <p className="px-3 py-2 text-[12px] text-muted-foreground">No results</p> : filtered.map((opt) => (
            <label key={opt.id} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-accent">
              <input type="checkbox" checked={targetIds.includes(opt.id)}
                onChange={() => onChange(targetIds.includes(opt.id) ? targetIds.filter((x) => x !== opt.id) : [...targetIds, opt.id])}
                className="h-4 w-4 rounded accent-foreground" />
              <span className="text-[12.5px]">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
      {targetIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {targetIds.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px]">
              {options.find((o) => o.id === id)?.label ?? id}
              <button type="button" onClick={() => onChange(targetIds.filter((x) => x !== id))} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── discount form ────────────────────────────────────────────────────────────
function DiscountForm({ initial, onSave, onCancel, saving }: {
  initial: Partial<Discount>; onSave: (d: Partial<Discount>) => void; onCancel: () => void; saving: boolean
}) {
  const [d, setD] = useState<Partial<Discount>>({ ...blankDiscount(), ...initial })
  const p = (v: Partial<Discount>) => setD((prev) => ({ ...prev, ...v }))
  const isNew = !initial.id
  const valueLabel = d.type === "percentage" ? "Discount %" : d.type === "fixed" ? "Amount (₹)" : d.type === "free_shipping" ? "Value (set 0)" : "Buy Qty"

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h2 className="text-[13px] font-semibold">{isNew ? "New Discount" : "Edit Discount"}</h2>
        <button onClick={onCancel} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-accent"><X className="h-4 w-4" /></button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {/* Usage stats */}
        {!isNew && (
          <div className="rounded-lg border border-border bg-surface-muted p-3 text-[12px]">
            <p className="font-medium">Usage — <span className="text-muted-foreground">{d.usageCount ?? 0} used{d.usageLimit != null ? ` / ${d.usageLimit}` : " (unlimited)"}</span></p>
          </div>
        )}

        {/* Basic */}
        <div className="space-y-3">
          <SectionLabel>Basic Info</SectionLabel>
          <Field label="Offer Title *">
            <input type="text" value={d.name ?? ""} onChange={(e) => p({ name: e.target.value })} placeholder="e.g. Summer Sale 20% Off" className={INPUT} />
          </Field>
          <div className="flex flex-col gap-1">
            <span className="text-[12.5px] font-medium">Coupon Code</span>
            <div className="flex gap-2">
              <input type="text" value={d.code ?? ""} onChange={(e) => p({ code: e.target.value.toUpperCase() })}
                placeholder="Leave blank for auto-apply" className={`${INPUT} flex-1 font-mono uppercase`} />
              <button type="button" onClick={() => p({ code: Math.random().toString(36).slice(2, 10).toUpperCase() })}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium hover:bg-accent">
                <RefreshCw className="h-3.5 w-3.5" /> Generate
              </button>
            </div>
          </div>
          <Field label="Short Offer Text">
            <input type="text" value={d.shortText ?? ""} onChange={(e) => p({ shortText: e.target.value || null })} placeholder="e.g. Get 20% off your order" className={INPUT} />
          </Field>
          <div className="space-y-1.5">
            <span className="text-[12px] font-medium">Discount Type</span>
            <OryCMSSelect
              value={d.type ?? "percentage"}
              onChange={(val) => p({ type: val as DiscountType })}
              options={[
                { label: "Percentage Discount", value: "percentage" },
                { label: "Fixed Amount Discount", value: "fixed" },
                { label: "Free Shipping", value: "free_shipping" },
                { label: "Buy X Get Y (Future)", value: "bxgy" },
              ]}
            />
          </div>
        </div>

        {/* Value */}
        <div className="space-y-3">
          <SectionLabel>Discount Value</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field label={valueLabel}>
              <input type="number" min={0} value={d.value ?? 0} onChange={(e) => p({ value: Number(e.target.value) })} className={INPUT} />
            </Field>
            <Field label="Max Discount (₹)">
              <input type="number" min={0} value={d.maxDiscountAmount ?? ""} onChange={(e) => p({ maxDiscountAmount: e.target.value === "" ? null : Number(e.target.value) })} placeholder="No cap" className={INPUT} />
            </Field>
          </div>
          <Field label="Min Order Amount (₹)">
            <input type="number" min={0} value={d.minOrderAmount ?? ""} onChange={(e) => p({ minOrderAmount: e.target.value === "" ? null : Number(e.target.value) })} placeholder="No minimum" className={INPUT} />
          </Field>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <SectionLabel>Offer Description</SectionLabel>
          <RichTextEditor value={d.description ?? ""} onChange={(v) => p({ description: v })} placeholder="Detailed offer description shown to customers…" />
        </div>

        {/* Limits */}
        <div className="space-y-3">
          <SectionLabel>Usage Limits</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total Limit">
              <input type="number" min={1} value={d.usageLimit ?? ""} onChange={(e) => p({ usageLimit: e.target.value === "" ? null : Number(e.target.value) })} placeholder="Unlimited" className={INPUT} />
            </Field>
            <Field label="Per User Limit">
              <input type="number" min={1} value={d.perUserLimit ?? ""} onChange={(e) => p({ perUserLimit: e.target.value === "" ? null : Number(e.target.value) })} placeholder="Unlimited" className={INPUT} />
            </Field>
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-3">
          <SectionLabel>Schedule</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date & Time">
              <input type="datetime-local" value={toLocalDatetime(d.startsAt)} onChange={(e) => p({ startsAt: fromLocalDatetime(e.target.value) })} className={INPUT} />
            </Field>
            <Field label="End Date & Time">
              <input type="datetime-local" value={toLocalDatetime(d.endsAt)} onChange={(e) => p({ endsAt: fromLocalDatetime(e.target.value) })} className={INPUT} />
            </Field>
          </div>
        </div>

        {/* Display */}
        <div className="space-y-3">
          <SectionLabel>Display Settings</SectionLabel>
          <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
            <Chk label="Active" checked={d.active ?? true} onChange={(v) => p({ active: v })} description="Enable or disable this discount" />
            <Chk label="Auto Apply" checked={d.autoApply ?? false} onChange={(v) => p({ autoApply: v })} description="Apply automatically without a code" />
            <Chk label='Show in "Offers for You"' checked={d.showInOffers ?? true} onChange={(v) => p({ showInOffers: v })} description="Display on product pages" />
            <Chk label="Show in Announcement Bar" checked={d.showInBar ?? false} onChange={(v) => p({ showInBar: v })} description="Show in the site-wide top bar" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <input type="number" min={0} value={d.priority ?? 0} onChange={(e) => p({ priority: Number(e.target.value) })} className={INPUT} />
            </Field>
            <Field label="Badge Text">
              <input type="text" value={d.badgeText ?? ""} onChange={(e) => p({ badgeText: e.target.value || null })} placeholder="NEW, HOT, LIMITED…" className={INPUT} />
            </Field>
          </div>
        </div>

        {/* Style */}
        <div className="space-y-3">
          <SectionLabel>Style</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <ColorRow label="Background Color" value={d.bgColor ?? null} onChange={(v) => p({ bgColor: v })} />
            <ColorRow label="Text Color" value={d.textColor ?? null} onChange={(v) => p({ textColor: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ColorRow label="Button Color" value={d.buttonColor ?? null} onChange={(v) => p({ buttonColor: v })} />
            <Field label="Button Text">
              <input type="text" value={d.buttonText ?? ""} onChange={(e) => p({ buttonText: e.target.value || null })} placeholder="Shop Now" className={INPUT} />
            </Field>
          </div>
        </div>

        {/* Applicability */}
        <div className="space-y-3">
          <SectionLabel>Applicability</SectionLabel>
          <div className="space-y-1.5">
            <span className="text-[12px] font-medium">Applies To</span>
            <OryCMSSelect
              value={d.appliesTo ?? "entire_store"}
              onChange={(val) => p({ appliesTo: val as AppliesTo, targetIds: [] })}
              options={[
                { label: "Entire Store", value: "entire_store" },
                { label: "Selected Categories", value: "categories" },
                { label: "Selected Products", value: "products" },
                { label: "Selected Brands", value: "brands" },
              ]}
            />
          </div>
          <TargetSelector appliesTo={d.appliesTo ?? "entire_store"} targetIds={d.targetIds ?? []} onChange={(ids) => p({ targetIds: ids })} />
          <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
            <SectionLabel>Customer Restrictions</SectionLabel>
            <Chk label="First Order Only" checked={d.firstOrderOnly ?? false} onChange={(v) => p({ firstOrderOnly: v })} />
            <Chk label="Logged-In Users Only" checked={d.loggedInOnly ?? false} onChange={(v) => p({ loggedInOnly: v })} />
            <Chk label="New Customers Only" checked={d.newCustomersOnly ?? false} onChange={(v) => p({ newCustomersOnly: v })} />
            <Chk label="Existing Customers Only" checked={d.existingCustomersOnly ?? false} onChange={(v) => p({ existingCustomersOnly: v })} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-border bg-surface-muted px-5 py-3.5">
        <button onClick={onCancel} className="h-9 rounded-lg border border-border bg-surface px-4 text-[12.5px] font-medium hover:bg-accent">Cancel</button>
        <button onClick={() => onSave(d)} disabled={saving}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-[12.5px] font-medium text-background disabled:opacity-50">
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isNew ? "Create Discount" : "Save Changes"}
        </button>
      </div>
    </div>
  )
}

// ─── announcement form ────────────────────────────────────────────────────────
function AnnouncementForm({ initial, onSave, onCancel, saving }: {
  initial: Partial<Announcement>; onSave: (a: Partial<Announcement>) => void; onCancel: () => void; saving: boolean
}) {
  const [a, setA] = useState<Partial<Announcement>>({ ...blankAnnouncement(), ...initial })
  const p = (v: Partial<Announcement>) => setA((prev) => ({ ...prev, ...v }))
  const isNew = !initial.id

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h2 className="text-[13px] font-semibold">{isNew ? "New Announcement" : "Edit Announcement"}</h2>
        <button onClick={onCancel} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-accent"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <div className="space-y-2">
          <SectionLabel>Content</SectionLabel>
          <RichTextEditor value={a.content ?? ""} onChange={(v) => p({ content: v })} placeholder="Announcement message — supports bold, links, colours…" />
        </div>
        <div className="space-y-3">
          <SectionLabel>Call to Action</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Button Text">
              <input type="text" value={a.ctaText ?? ""} onChange={(e) => p({ ctaText: e.target.value || null })} placeholder="Shop Now" className={INPUT} />
            </Field>
            <Field label="Button URL">
              <input type="text" value={a.ctaUrl ?? ""} onChange={(e) => p({ ctaUrl: e.target.value || null })} placeholder="https://…" className={INPUT} />
            </Field>
          </div>
        </div>
        <div className="space-y-3">
          <SectionLabel>Schedule</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date & Time">
              <input type="datetime-local" value={toLocalDatetime(a.startsAt)} onChange={(e) => p({ startsAt: fromLocalDatetime(e.target.value) })} className={INPUT} />
            </Field>
            <Field label="End Date & Time">
              <input type="datetime-local" value={toLocalDatetime(a.endsAt)} onChange={(e) => p({ endsAt: fromLocalDatetime(e.target.value) })} className={INPUT} />
            </Field>
          </div>
        </div>
        <div className="space-y-3">
          <SectionLabel>Display</SectionLabel>
          <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
            <Chk label="Active" checked={a.active ?? true} onChange={(v) => p({ active: v })} />
          </div>
          <Field label="Priority">
            <input type="number" min={0} value={a.priority ?? 0} onChange={(e) => p({ priority: Number(e.target.value) })} className={INPUT} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <ColorRow label="Background Color" value={a.bgColor ?? null} onChange={(v) => p({ bgColor: v })} />
            <ColorRow label="Text Color" value={a.textColor ?? null} onChange={(v) => p({ textColor: v })} />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-border bg-surface-muted px-5 py-3.5">
        <button onClick={onCancel} className="h-9 rounded-lg border border-border bg-surface px-4 text-[12.5px] font-medium hover:bg-accent">Cancel</button>
        <button onClick={() => onSave(a)} disabled={saving}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-[12.5px] font-medium text-background disabled:opacity-50">
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isNew ? "Create" : "Save Changes"}
        </button>
      </div>
    </div>
  )
}

// ─── discounts tab ────────────────────────────────────────────────────────────
function DiscountsTab({ show }: { show: (msg: string, type: Toast["type"]) => void }) {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<Partial<Discount> | null>(null)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const PAGE = 12

  async function load() {
    setLoading(true)
    try {
      const r = await fetch("/api/orycms/discounts")
      const j = await r.json()
      if (j.success) setDiscounts(j.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const filtered = discounts.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()) || (d.code ?? "").toLowerCase().includes(search.toLowerCase()))
  const pages = Math.ceil(filtered.length / PAGE)
  const paged = filtered.slice(page * PAGE, (page + 1) * PAGE)

  async function handleSave(data: Partial<Discount>) {
    setSaving(true)
    try {
      const isNew = !editing?.id
      const r = await fetch(isNew ? "/api/orycms/discounts" : `/api/orycms/discounts/${editing!.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      })
      const j = await r.json()
      if (!j.success) throw new Error(j.error?.message ?? "Failed to save.")
      show(isNew ? "Discount created." : "Discount saved.", "success")
      setEditing(null)
      await load()
    } catch (e) { show(e instanceof Error ? e.message : "Failed to save.", "error") }
    finally { setSaving(false) }
  }

  async function handleToggle(d: Discount) {
    try {
      const r = await fetch(`/api/orycms/discounts/${d.id}/toggle`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ active: !d.active }) })
      const j = await r.json()
      if (!j.success) throw new Error(j.error?.message)
      show(`Discount ${!d.active ? "activated" : "deactivated"}.`, "success")
      await load()
    } catch (e) { show(e instanceof Error ? e.message : "Failed.", "error") }
  }

  async function handleDuplicate(d: Discount) {
    try {
      const r = await fetch(`/api/orycms/discounts/${d.id}/duplicate`, { method: "POST" })
      const j = await r.json()
      if (!j.success) throw new Error(j.error?.message)
      show("Discount duplicated.", "success")
      await load()
    } catch (e) { show(e instanceof Error ? e.message : "Failed.", "error") }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this discount? This cannot be undone.")) return
    try {
      const r = await fetch(`/api/orycms/discounts/${id}`, { method: "DELETE" })
      const j = await r.json()
      if (!j.success) throw new Error(j.error?.message)
      show("Discount deleted.", "success")
      if (editing?.id === id) setEditing(null)
      await load()
    } catch (e) { show(e instanceof Error ? e.message : "Failed.", "error") }
  }

  async function handleBulkDelete() {
    if (!selected.size || !confirm(`Delete ${selected.size} discount(s)?`)) return
    try {
      const r = await fetch("/api/orycms/discounts", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids: Array.from(selected) }) })
      const j = await r.json()
      if (!j.success) throw new Error(j.error?.message)
      show(`${selected.size} discount(s) deleted.`, "success")
      setSelected(new Set()); setEditing(null)
      await load()
    } catch (e) { show(e instanceof Error ? e.message : "Failed.", "error") }
  }

  const fmtValue = (d: Discount) => d.type === "percentage" ? `${d.value}%` : d.type === "fixed" ? `₹${d.value}` : d.type === "free_shipping" ? "Free Ship" : "BXGY"

  return (
    <div className={`grid h-full ${editing ? "lg:grid-cols-[minmax(0,1fr)_380px]" : ""}`}>
      <div className="flex min-h-0 flex-col">
        <div className="flex items-center gap-3 border-b border-border px-5 py-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} placeholder="Search discounts…"
              className="h-8 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-[12.5px] outline-none focus:border-border-strong" />
          </div>
          {selected.size > 0 && (
            <button onClick={handleBulkDelete}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-destructive/30 px-3 text-[12.5px] font-medium text-destructive hover:bg-destructive/10">
              <Trash2 className="h-3.5 w-3.5" /> Delete ({selected.size})
            </button>
          )}
          <button onClick={() => setEditing(blankDiscount())}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-[12.5px] font-medium text-background">
            <Plus className="h-3.5 w-3.5" /> New Discount
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="grid min-h-64 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : paged.length === 0 ? (
            <div className="grid min-h-64 place-items-center text-center">
              <div><Tag className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-[13px] font-medium">No discounts {search ? "match your search" : "yet"}</p>
                {!search && <p className="mt-1 text-[12px] text-muted-foreground">Create your first discount to get started.</p>}
              </div>
            </div>
          ) : (
            <table className="w-full min-w-[700px] text-[12.5px]">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-left">
                  <th className="w-10 px-4 py-2.5">
                    <input type="checkbox" className="h-4 w-4 rounded accent-foreground"
                      checked={paged.length > 0 && paged.every((d) => selected.has(d.id))}
                      onChange={(e) => {
                        if (e.target.checked) setSelected(new Set([...selected, ...paged.map((d) => d.id)]))
                        else setSelected(new Set([...selected].filter((id) => !paged.some((d) => d.id === id))))
                      }} />
                  </th>
                  {["Code", "Title", "Type", "Value", "Usage", "Status", "Ends", ""].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((d) => (
                  <tr key={d.id} onClick={() => setEditing(d)}
                    className={`cursor-pointer border-b border-border/60 transition-colors hover:bg-accent/50 ${editing?.id === d.id ? "bg-accent" : ""}`}>
                    <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="h-4 w-4 rounded accent-foreground" checked={selected.has(d.id)}
                        onChange={(e) => {
                          const next = new Set(selected)
                          e.target.checked ? next.add(d.id) : next.delete(d.id)
                          setSelected(next)
                        }} />
                    </td>
                    <td className="px-3 py-2.5">
                      {d.code
                        ? <span className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px]">{d.code}</span>
                        : <span className="text-[11px] text-muted-foreground">Auto</span>}
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-2.5 font-medium">{d.name}</td>
                    <td className="px-3 py-2.5"><TypeBadge type={d.type} /></td>
                    <td className="px-3 py-2.5 font-semibold">{fmtValue(d)}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{d.usageCount}{d.usageLimit != null ? `/${d.usageLimit}` : ""}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={discountStatus(d)} /></td>
                    <td className="px-3 py-2.5 text-muted-foreground">{fmtDate(d.endsAt)}</td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5">
                        <button title={d.active ? "Deactivate" : "Activate"} onClick={() => handleToggle(d)}
                          className={`grid h-7 w-7 place-items-center rounded-lg hover:bg-accent ${d.active ? "text-success" : "text-muted-foreground"}`}>
                          <Zap className="h-3.5 w-3.5" />
                        </button>
                        <button title="Duplicate" onClick={() => handleDuplicate(d)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button title="Delete" onClick={() => handleDelete(d.id)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-2.5 text-[12px] text-muted-foreground">
            <span>{filtered.length} discounts</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-accent disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <span>{page + 1} / {pages}</span>
              <button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-accent disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <div className="border-l border-border">
          <DiscountForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} saving={saving} />
        </div>
      )}
    </div>
  )
}

// ─── announcements tab ────────────────────────────────────────────────────────
function AnnouncementsTab({ show }: { show: (msg: string, type: Toast["type"]) => void }) {
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<Announcement> | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const r = await fetch("/api/orycms/announcements")
      const j = await r.json()
      if (j.success) setItems(j.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  async function handleSave(data: Partial<Announcement>) {
    setSaving(true)
    try {
      const isNew = !editing?.id
      const r = await fetch(isNew ? "/api/orycms/announcements" : `/api/orycms/announcements/${editing!.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      })
      const j = await r.json()
      if (!j.success) throw new Error(j.error?.message)
      show(isNew ? "Announcement created." : "Announcement saved.", "success")
      setEditing(null); await load()
    } catch (e) { show(e instanceof Error ? e.message : "Failed.", "error") }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return
    try {
      const r = await fetch(`/api/orycms/announcements/${id}`, { method: "DELETE" })
      const j = await r.json()
      if (!j.success) throw new Error(j.error?.message)
      show("Announcement deleted.", "success")
      if (editing?.id === id) setEditing(null)
      await load()
    } catch (e) { show(e instanceof Error ? e.message : "Failed.", "error") }
  }

  const strip = (html: string) => html.replace(/<[^>]+>/g, "").slice(0, 80)

  return (
    <div className={`grid h-full ${editing ? "lg:grid-cols-[minmax(0,1fr)_380px]" : ""}`}>
      <div className="flex min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-[12.5px] text-muted-foreground">{items.length} announcement{items.length !== 1 ? "s" : ""}</p>
          <button onClick={() => setEditing(blankAnnouncement())}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-[12.5px] font-medium text-background">
            <Plus className="h-3.5 w-3.5" /> New Announcement
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="grid min-h-64 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <div className="grid min-h-64 place-items-center text-center">
              <div><Megaphone className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-[13px] font-medium">No announcements yet</p>
                <p className="mt-1 text-[12px] text-muted-foreground">Create your first announcement for the top bar.</p>
              </div>
            </div>
          ) : (
            <table className="w-full min-w-[520px] text-[12.5px]">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-left">
                  {["Content", "Priority", "Status", "Start", "End", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} onClick={() => setEditing(a)}
                    className={`cursor-pointer border-b border-border/60 transition-colors hover:bg-accent/50 ${editing?.id === a.id ? "bg-accent" : ""}`}>
                    <td className="max-w-[280px] truncate px-4 py-2.5">{strip(a.content) || <em className="text-muted-foreground">Empty</em>}</td>
                    <td className="px-4 py-2.5">{a.priority}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${a.active ? "border-success/20 bg-success/10 text-success" : "border-border bg-muted text-muted-foreground"}`}>
                        {a.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{fmtDate(a.startsAt)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{fmtDate(a.endsAt)}</td>
                    <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleDelete(a.id)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {editing && (
        <div className="border-l border-border">
          <AnnouncementForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} saving={saving} />
        </div>
      )}
    </div>
  )
}

// ─── root ─────────────────────────────────────────────────────────────────────
export function DiscountsAdmin() {
  const [tab, setTab] = useState<"discounts" | "announcements">("discounts")
  const [toast, setToast] = useState<Toast | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(message: string, type: Toast["type"]) {
    if (timerRef.current) clearTimeout(timerRef.current)
    const item: Toast = { id: crypto.randomUUID(), message, type }
    playOryCMSToastSound()
    setToast(item)
    timerRef.current = setTimeout(() => setToast((cur) => cur?.id === item.id ? null : cur), 3500)
  }

  return (
    <section className="flex h-full flex-col">
      {/* Page header */}
      <div className="border-b border-border px-5 pb-0 pt-5">
        <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/discounts", label: "Discounts & Offers" }]} />
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4 pb-0">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Discounts &amp; Offers</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Create coupon codes, manage offers, and configure the announcement bar.</p>
          </div>
          <div className="flex gap-1 pb-0">
            {(["discounts", "announcements"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-t-lg border-b-0 px-4 py-2 text-[12.5px] font-medium transition-colors ${
                  tab === t ? "border border-border bg-surface text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>
                {t === "discounts" ? "Discounts" : "Announcement Bar"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === "discounts" ? <DiscountsTab show={showToast} /> : <AnnouncementsTab show={showToast} />}
      </div>

      <OryToast toast={toast} />
    </section>
  )
}
