"use client"

import { useEffect, useState } from "react"
import type React from "react"
import {
  Bell,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Globe,
  Loader2,
  Lock,
  Mail,
  MailPlus,
  Pencil,
  Plus,
  Save,
  Shield,
  Smartphone,
  Store,
  Trash2,
  Users,
  X,
} from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { playOryCMSToastSound } from "@/lib/orycms/toast-sound"
import { cn, formatCurrency } from "@/lib/utils"

type Toast = { id: number; message: string; tone: "success" | "error" }

type NotificationEmail = {
  createdAt: string
  email: string
  enabled: boolean
  id: string
  label: string | null
}

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim())
}

export function OryCMSSettingsPage() {
  // Presentational workspace settings (parity with the OryCMS reference design).
  const [profileName, setProfileName] = useState("Tushar Gupta")
  const [companyName, setCompanyName] = useState("OryCMS")
  const [companyEmail, setCompanyEmail] = useState("ops@orynticlabs.com")
  const [supportEmail, setSupportEmail] = useState("support@orynticlabs.com")
  const [domain, setDomain] = useState("admin.orycms.in")
  const [address, setAddress] = useState("OrynticLabs Private Limited, Bengaluru, Karnataka, India")
  const [orderPrefix, setOrderPrefix] = useState("ORY")
  const [lowStockThreshold, setLowStockThreshold] = useState("8")
  const [twoFactor, setTwoFactor] = useState(true)
  const [auditLog, setAuditLog] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [pushAlerts, setPushAlerts] = useState(false)
  const [marketingDigest, setMarketingDigest] = useState(true)
  const [returnApproval, setReturnApproval] = useState(true)
  const [internationalOrders, setInternationalOrders] = useState(false)

  const [toasts, setToasts] = useState<Toast[]>([])

  function toast(message: string, tone: Toast["tone"]) {
    const id = Date.now()
    playOryCMSToastSound()
    setToasts((items) => [...items, { id, message, tone }])
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3500)
  }

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-6 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/settings", label: "Settings" }]} />
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">Settings</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
            Configure store identity, operational defaults, notifications, security, and billing for OryCMS.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:border-border-strong hover:bg-accent"
          >
            Discard changes
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-[12.5px] font-medium text-background transition-opacity hover:opacity-90"
          >
            <Save className="h-3.5 w-3.5" />
            Save changes
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.8fr_1fr]">
        <div className="space-y-5">
          <Card>
            <SectionHeader
              icon={Building2}
              title="Organization profile"
              description="Core identity and public contact points used across invoices, notifications, and storefront templates."
            />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Workspace name" value={companyName} onChange={setCompanyName} />
              <Field label="Admin owner" value={profileName} onChange={setProfileName} />
              <Field label="Operations email" value={companyEmail} onChange={setCompanyEmail} />
              <Field label="Support email" value={supportEmail} onChange={setSupportEmail} />
              <Field label="Admin domain" value={domain} onChange={setDomain} className="md:col-span-2" />
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-[11.5px] font-medium text-muted-foreground">Registered address</span>
                <textarea
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-border-strong"
                />
              </label>
            </div>
          </Card>

          <Card>
            <SectionHeader
              icon={Store}
              title="Store defaults"
              description="Operational preferences that shape how orders, pricing, and catalog workflows behave."
            />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Order prefix" value={orderPrefix} onChange={setOrderPrefix} />
              <Field label="Low stock threshold" value={lowStockThreshold} onChange={setLowStockThreshold} />
            </div>
            <div className="mt-5 rounded-lg border border-border bg-surface-muted/40 p-4">
              <div className="text-[12px] font-medium">Pricing preview</div>
              <div className="mt-1 text-[11.5px] text-muted-foreground">
                Dashboard totals, catalog summaries, and order values now render in rupees, for example {formatCurrency(74392.1)}.
              </div>
            </div>
          </Card>

          <OrderNotificationEmailsCard onToast={toast} />

          <Card>
            <SectionHeader
              icon={Bell}
              title="Notifications"
              description="Control which operational events should interrupt the team and where those alerts are delivered."
            />
            <div className="mt-5">
              <SettingRow
                title="Email alerts"
                description="Send fulfillment issues, payment review alerts, and stock exceptions to operations inboxes."
                control={<Toggle checked={emailAlerts} onChange={setEmailAlerts} />}
              />
              <SettingRow
                title="Push alerts"
                description="Deliver urgent dispatch and fraud-review updates to mobile devices for the active team."
                control={<Toggle checked={pushAlerts} onChange={setPushAlerts} />}
              />
              <SettingRow
                title="Weekly marketing digest"
                description="Share campaign summary, conversion shifts, and revenue highlights every Monday morning."
                control={<Toggle checked={marketingDigest} onChange={setMarketingDigest} />}
              />
            </div>
          </Card>

          <Card>
            <SectionHeader
              icon={Shield}
              title="Security and approvals"
              description="Protect account access and enforce controls for sensitive operations."
            />
            <div className="mt-5">
              <SettingRow
                title="Two-factor authentication"
                description="Require a second factor for all admin logins."
                control={<Toggle checked={twoFactor} onChange={setTwoFactor} />}
              />
              <SettingRow
                title="Audit log retention"
                description="Retain user action history for 180 days across settings, orders, and catalog changes."
                control={<Toggle checked={auditLog} onChange={setAuditLog} />}
              />
              <SettingRow
                title="Return approval workflow"
                description="Require supervisor sign-off before refund release on returns above threshold."
                control={<Toggle checked={returnApproval} onChange={setReturnApproval} />}
              />
              <SettingRow
                title="International orders"
                description="Allow order intake from international shipping zones and customs-enabled carriers."
                control={<Toggle checked={internationalOrders} onChange={setInternationalOrders} />}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <SectionHeader
              icon={CreditCard}
              title="Plan and billing"
              description="Commercial settings for the current workspace."
            />
            <div className="mt-5 space-y-4">
              <div className="rounded-lg border border-border bg-surface-muted/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[12.5px] font-medium">Growth plan</div>
                    <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                      Monthly billing with advanced analytics and role controls
                    </div>
                  </div>
                  <span className="rounded-full bg-success/10 px-2 py-1 text-[11px] font-medium text-success">Active</span>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-[22px] font-semibold">{formatCurrency(2499)}</div>
                    <div className="text-[11.5px] text-muted-foreground">per month</div>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:border-border-strong hover:bg-accent"
                  >
                    Manage plan
                  </button>
                </div>
              </div>
              <div className="space-y-3 text-[12px]">
                {[
                  "Next invoice on 01 Aug 2026",
                  "Billing contact: finance@orynticlabs.com",
                  "Auto-charge via corporate Visa ending in 4821",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-success" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeader
              icon={Users}
              title="Team access"
              description="Users currently holding privileged workspace roles."
            />
            <div className="mt-5 space-y-3">
              {[
                { name: "Tushar Gupta", role: "Owner", meta: "Full access to billing, security, and catalog operations", icon: Mail },
                { name: "Ritika Sharma", role: "Operations Admin", meta: "Orders, warehouse flows, dispatch, and refunds", icon: Globe },
                { name: "Aditya Mehra", role: "Security Reviewer", meta: "Fraud review queue and audit approvals", icon: Smartphone },
              ].map((member) => {
                const Icon = member.icon
                return (
                  <div key={member.name} className="rounded-lg border border-border bg-surface-muted/40 p-3">
                    <div className="flex items-start gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-foreground text-background">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[12.5px] font-medium">{member.name}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] text-muted-foreground">{member.role}</span>
                        </div>
                        <div className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{member.meta}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <button
                type="button"
                className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:border-border-strong hover:bg-accent"
              >
                Invite teammate
              </button>
            </div>
          </Card>

          <Card className="border-destructive/30">
            <SectionHeader
              icon={Lock}
              title="Danger zone"
              description="High-impact actions with irreversible consequences."
            />
            <div className="mt-5 space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <div>
                <div className="text-[12.5px] font-medium">Freeze storefront intake</div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                  Temporarily stop new order creation while still allowing staff access.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:border-border-strong hover:bg-accent"
                >
                  Export workspace data
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-lg border border-destructive/30 bg-destructive/10 px-3 text-[12.5px] font-medium text-destructive"
                >
                  Disable intake
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ToastStack toasts={toasts} />
    </section>
  )
}

function OrderNotificationEmailsCard({ onToast }: { onToast: (message: string, tone: Toast["tone"]) => void }) {
  const [items, setItems] = useState<NotificationEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [newLabel, setNewLabel] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editEmail, setEditEmail] = useState("")
  const [editLabel, setEditLabel] = useState("")

  useEffect(() => {
    let active = true
    fetch("/api/orycms/settings/order-notification-emails", { cache: "no-store" })
      .then((response) => response.json())
      .then((json) => {
        if (!active) return
        if (!json.success) throw new Error(json.error?.message ?? "Failed to load recipients.")
        setItems(Array.isArray(json.data) ? json.data : [])
      })
      .catch((error) => {
        if (active) onToast(error instanceof Error ? error.message : "Failed to load recipients.", "error")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function addEmail(event: React.FormEvent) {
    event.preventDefault()
    const email = newEmail.trim().toLowerCase()
    if (!isValidEmail(email)) {
      onToast("Enter a valid email address.", "error")
      return
    }
    setAdding(true)
    try {
      const json = await fetch("/api/orycms/settings/order-notification-emails", {
        body: JSON.stringify({ email, label: newLabel }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }).then((response) => response.json())
      if (!json.success) throw new Error(json.error?.message ?? "Failed to add recipient.")
      setItems((current) => [...current, json.data])
      setNewEmail("")
      setNewLabel("")
      onToast("Recipient added.", "success")
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Failed to add recipient.", "error")
    } finally {
      setAdding(false)
    }
  }

  async function patch(id: string, body: { email?: string; enabled?: boolean; label?: string | null }, successMessage: string) {
    setBusyId(id)
    try {
      const json = await fetch(`/api/orycms/settings/order-notification-emails/${id}`, {
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }).then((response) => response.json())
      if (!json.success) throw new Error(json.error?.message ?? "Failed to update recipient.")
      setItems((current) => current.map((item) => (item.id === id ? json.data : item)))
      onToast(successMessage, "success")
      return true
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Failed to update recipient.", "error")
      return false
    } finally {
      setBusyId(null)
    }
  }

  async function toggleEnabled(item: NotificationEmail) {
    await patch(item.id, { enabled: !item.enabled }, item.enabled ? "Recipient disabled." : "Recipient enabled.")
  }

  function startEdit(item: NotificationEmail) {
    setEditingId(item.id)
    setEditEmail(item.email)
    setEditLabel(item.label ?? "")
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault()
    if (!editingId) return
    const email = editEmail.trim().toLowerCase()
    if (!isValidEmail(email)) {
      onToast("Enter a valid email address.", "error")
      return
    }
    const ok = await patch(editingId, { email, label: editLabel }, "Recipient updated.")
    if (ok) setEditingId(null)
  }

  async function remove(id: string) {
    setBusyId(id)
    try {
      const json = await fetch(`/api/orycms/settings/order-notification-emails/${id}`, { method: "DELETE" }).then((response) => response.json())
      if (!json.success) throw new Error(json.error?.message ?? "Failed to delete recipient.")
      setItems((current) => current.filter((item) => item.id !== id))
      onToast("Recipient removed.", "success")
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Failed to delete recipient.", "error")
    } finally {
      setBusyId(null)
    }
  }

  const enabledCount = items.filter((item) => item.enabled).length

  return (
    <Card>
      <SectionHeader
        icon={MailPlus}
        title="Order notification emails"
        description="Send a detailed notification to these addresses whenever a new order is placed. Disabled or empty lists receive nothing."
      />

      <form onSubmit={addEmail} className="mt-5 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface-muted/40 p-4">
        <label className="min-w-[200px] flex-1 space-y-1.5">
          <span className="text-[11.5px] font-medium text-muted-foreground">Email address</span>
          <input
            type="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            placeholder="warehouse@yourdomain.com"
            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-border-strong"
          />
        </label>
        <label className="min-w-[160px] flex-1 space-y-1.5">
          <span className="text-[11.5px] font-medium text-muted-foreground">Label (optional)</span>
          <input
            type="text"
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            placeholder="Warehouse team"
            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-border-strong"
          />
        </label>
        <button
          type="submit"
          disabled={adding}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-[12.5px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Add email
        </button>
      </form>

      <div className="mt-4">
        {loading ? (
          <div className="grid min-h-[96px] place-items-center text-[12.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading recipients…
            </span>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface-muted/30 px-4 py-6 text-center text-[12.5px] text-muted-foreground">
            No recipients yet. No order notification emails are sent until you add an address above.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-[11.5px] text-muted-foreground">
              {enabledCount} of {items.length} recipient{items.length === 1 ? "" : "s"} enabled.
            </div>
            {items.map((item) =>
              editingId === item.id ? (
                <form
                  key={item.id}
                  onSubmit={saveEdit}
                  className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-3"
                >
                  <label className="min-w-[200px] flex-1 space-y-1.5">
                    <span className="text-[11px] font-medium text-muted-foreground">Email address</span>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(event) => setEditEmail(event.target.value)}
                      className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-border-strong"
                    />
                  </label>
                  <label className="min-w-[160px] flex-1 space-y-1.5">
                    <span className="text-[11px] font-medium text-muted-foreground">Label (optional)</span>
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(event) => setEditLabel(event.target.value)}
                      className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-border-strong"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busyId === item.id}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 text-[12px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {busyId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[12px] font-medium transition-colors hover:border-border-strong hover:bg-accent"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </form>
              ) : (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12.5px] font-medium">{item.email}</span>
                      {item.label ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] text-muted-foreground">{item.label}</span>
                      ) : null}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                          item.enabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {item.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Toggle checked={item.enabled} disabled={busyId === item.id} onChange={() => void toggleEnabled(item)} />
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface transition-colors hover:border-border-strong hover:bg-accent"
                      aria-label="Edit recipient"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(item.id)}
                      disabled={busyId === item.id}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-60"
                      aria-label="Delete recipient"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-xl border border-border bg-surface p-5 shadow-xs", className)}>{children}</div>
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-muted text-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-[13.5px] font-semibold">{title}</div>
        <div className="mt-0.5 text-[11.5px] text-muted-foreground">{description}</div>
      </div>
    </div>
  )
}

function SettingRow({
  title,
  description,
  control,
}: {
  title: string
  description: string
  control: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-4 first:pt-0 last:border-0 last:pb-0">
      <div className="max-w-[620px]">
        <div className="text-[12.5px] font-medium">{title}</div>
        <div className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">{description}</div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <label className={cn("space-y-1.5", className)}>
      <span className="text-[11.5px] font-medium text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-border-strong"
      />
    </label>
  )
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-60",
        checked ? "bg-foreground" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  )
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-center gap-2 rounded-xl border bg-surface px-4 py-3 text-[13px] shadow-lg",
            toast.tone === "success" ? "border-success/30 text-success" : "border-destructive/30 text-destructive",
          )}
        >
          {toast.tone === "success" ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {toast.message}
        </div>
      ))}
    </div>
  )
}
