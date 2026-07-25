"use client"

import { useEffect, useMemo, useState } from "react"
import type React from "react"
import Link from "next/link"
import { ArrowLeft, Ban, CheckCircle2, Edit3, Eye, Search, Trash2, Users } from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { cn, formatCurrency } from "@/lib/utils"

const PAGE_SIZE = 10

type CustomerStatus = "active" | "inactive" | "blocked"
type Customer = {
  avatar: string | null
  defaultAddress: Record<string, unknown> | null
  email: string
  emailVerified: boolean
  firstName: string
  id: string
  joinedAt: string
  lastLoginAt: string | null
  lastName: string
  name: string
  phone: string
  status: CustomerStatus
  totalOrders: number
  totalSpent: number
  updatedAt: string
}
type CustomerDetails = Customer & {
  activity: { at?: string | null; label?: string }[]
  orders: { id: string; number: string; status: string; payment_status: string; payment_method: string; total: number | string; created_at: string }[]
  payments: { amount?: number | string; created_at?: string; event?: string; provider?: string; status?: string }[]
}
type SortBy = "created-desc" | "created-asc" | "spent-desc" | "orders-desc" | "name-asc"
type ConfirmState = { action: "activate" | "deactivate" | "block" | "unblock" | "delete"; ids: string[] } | null

export function OryCMSCustomersList() {
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [editing, setEditing] = useState<Customer | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [registrationFilter, setRegistrationFilter] = useState("all")
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortBy>("created-desc")
  const [statusFilter, setStatusFilter] = useState("all")
  const [verifiedFilter, setVerifiedFilter] = useState("all")

  useEffect(() => {
    void loadCustomers(true)
    const interval = window.setInterval(() => void loadCustomers(false), 15000)
    return () => window.clearInterval(interval)
  }, [])

  async function loadCustomers(showLoader: boolean) {
    if (showLoader) setLoading(true)
    setError("")
    try {
      const json = await fetch("/api/orycms/customers", { cache: "no-store" }).then((response) => response.json())
      if (!json.success) throw new Error(json.error?.message ?? "Failed to load customers.")
      setCustomers(Array.isArray(json.data) ? json.data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers.")
    } finally {
      if (showLoader) setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    return customers
      .filter((customer) => {
        const matchesSearch = !search || [customer.name, customer.email, customer.phone].join(" ").toLowerCase().includes(search)
        const matchesStatus = statusFilter === "all" || customer.status === statusFilter
        const matchesVerified = verifiedFilter === "all" || (verifiedFilter === "verified" ? customer.emailVerified : !customer.emailVerified)
        const matchesDate = registrationFilter === "all" || inDateRange(customer.joinedAt, registrationFilter)
        return matchesSearch && matchesStatus && matchesVerified && matchesDate
      })
      .sort((a, b) => {
        if (sortBy === "created-asc") return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
        if (sortBy === "spent-desc") return Number(b.totalSpent) - Number(a.totalSpent)
        if (sortBy === "orders-desc") return Number(b.totalOrders) - Number(a.totalOrders)
        if (sortBy === "name-asc") return a.name.localeCompare(b.name)
        return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
      })
  }, [customers, query, registrationFilter, sortBy, statusFilter, verifiedFilter])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const pageIds = paged.map((customer) => customer.id)
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id))

  useEffect(() => {
    setPage(1)
  }, [query, registrationFilter, sortBy, statusFilter, verifiedFilter])

  async function runAction(action: NonNullable<ConfirmState>["action"], ids: string[]) {
    if (ids.length === 0) return
    setSaving(true)
    try {
      const response = await fetch("/api/orycms/customers", {
        body: JSON.stringify({ action, ids }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const json = await response.json()
      if (!response.ok || !json.success) throw new Error(json.error?.message ?? "Failed to update customers.")
      setSelected([])
      setConfirm(null)
      await loadCustomers(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update customers.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-6 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/customers", label: "Customers" }]} />
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">Customers</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
            Manage real storefront customers, login access, order spend, and account status.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface px-3 py-2 text-[12.5px] text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span> of {customers.length} customers
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-xs">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-muted px-4 py-3">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email, or mobile…" className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-[13px] outline-none focus:border-border-strong" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none">
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>
          <select value={verifiedFilter} onChange={(event) => setVerifiedFilter(event.target.value)} className="h-9 rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none">
            <option value="all">All email</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
          <select value={registrationFilter} onChange={(event) => setRegistrationFilter(event.target.value)} className="h-9 rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none">
            <option value="all">All dates</option>
            <option value="today">Registered today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)} className="h-9 rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none">
            <option value="created-desc">Newest first</option>
            <option value="created-asc">Oldest first</option>
            <option value="spent-desc">Total spent high</option>
            <option value="orders-desc">Orders high</option>
            <option value="name-asc">Name A–Z</option>
          </select>
        </div>

        {selected.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 text-[12.5px]">
            <span className="font-medium">{selected.length} selected</span>
            <div className="flex flex-wrap gap-2">
              <BulkButton onClick={() => setConfirm({ action: "activate", ids: selected })}>Activate</BulkButton>
              <BulkButton onClick={() => setConfirm({ action: "deactivate", ids: selected })}>Deactivate</BulkButton>
              <BulkButton onClick={() => setConfirm({ action: "block", ids: selected })}>Block</BulkButton>
              <BulkButton danger onClick={() => setConfirm({ action: "delete", ids: selected })}>Delete</BulkButton>
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-[13px]">
            <thead className="border-b border-border bg-surface-muted text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">
                  <input checked={allPageSelected} onChange={() => setSelected((current) => allPageSelected ? current.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...current, ...pageIds])))} type="checkbox" className="h-4 w-4 accent-[var(--orycms-color-primary)]" />
                </th>
                <th className="px-4 py-3 font-medium">Profile Photo</th>
                <th className="px-4 py-3 font-medium">Customer Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Mobile Number</th>
                <th className="px-4 py-3 font-medium">Total Orders</th>
                <th className="px-4 py-3 font-medium">Total Spent</th>
                <th className="px-4 py-3 font-medium">Account Status</th>
                <th className="px-4 py-3 font-medium">Email Verification</th>
                <th className="px-4 py-3 font-medium">Registration Date</th>
                <th className="px-4 py-3 font-medium">Last Login</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={12} className="px-4 py-10 text-center text-muted-foreground">Loading customers…</td></tr>
              ) : error ? (
                <tr><td colSpan={12} className="px-4 py-10 text-center text-destructive">{error}</td></tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-14 text-center">
                    <Users className="mx-auto h-10 w-10 text-muted-foreground/30" strokeWidth={1} />
                    <p className="mt-3 font-medium">No customers found.</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">Frontend registrations will appear here automatically.</p>
                  </td>
                </tr>
              ) : paged.map((customer) => (
                <tr key={customer.id} className="transition-colors hover:bg-surface-muted/60">
                  <td className="px-4 py-3">
                    <input checked={selected.includes(customer.id)} onChange={() => setSelected((current) => current.includes(customer.id) ? current.filter((id) => id !== customer.id) : [...current, customer.id])} type="checkbox" className="h-4 w-4 accent-[var(--orycms-color-primary)]" />
                  </td>
                  <td className="px-4 py-3"><Avatar customer={customer} /></td>
                  <td className="px-4 py-3 font-medium">{customer.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{customer.email}</td>
                  <td className="px-4 py-3">{customer.phone || "—"}</td>
                  <td className="px-4 py-3 font-semibold">{customer.totalOrders}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(Number(customer.totalSpent))}</td>
                  <td className="px-4 py-3"><StatusBadge value={customer.status} /></td>
                  <td className="px-4 py-3"><VerifyBadge verified={customer.emailVerified} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{dateTime(customer.joinedAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{customer.lastLoginAt ? dateTime(customer.lastLoginAt) : "Never"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <IconLink href={`/admin/customers/${customer.id}`} label="View"><Eye className="h-3.5 w-3.5" /></IconLink>
                      <IconButton label="Edit" onClick={() => setEditing(customer)}><Edit3 className="h-3.5 w-3.5" /></IconButton>
                      <IconButton label={customer.status === "active" ? "Deactivate" : "Activate"} onClick={() => setConfirm({ action: customer.status === "active" ? "deactivate" : "activate", ids: [customer.id] })}>{customer.status === "active" ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}</IconButton>
                      <IconButton label={customer.status === "blocked" ? "Unblock" : "Block"} onClick={() => setConfirm({ action: customer.status === "blocked" ? "unblock" : "block", ids: [customer.id] })}><Ban className="h-3.5 w-3.5" /></IconButton>
                      <IconButton danger label="Delete" onClick={() => setConfirm({ action: "delete", ids: [customer.id] })}><Trash2 className="h-3.5 w-3.5" /></IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[12px] text-muted-foreground">
          <span>Page {page} of {pageCount}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="h-8 rounded-lg border border-border px-3 font-medium disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
            <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={page === pageCount} className="h-8 rounded-lg border border-border px-3 font-medium disabled:cursor-not-allowed disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {editing ? <EditCustomerModal customer={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void loadCustomers(false) }} /> : null}
      {confirm ? <ConfirmModal action={confirm.action} count={confirm.ids.length} saving={saving} onClose={() => setConfirm(null)} onConfirm={() => void runAction(confirm.action, confirm.ids)} /> : null}
    </section>
  )
}

export function OryCMSCustomerDetails({ id }: { id: string }) {
  const [customer, setCustomer] = useState<CustomerDetails | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/orycms/customers/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (response) => {
        const json = await response.json()
        if (!response.ok || !json.success) throw new Error(json.error?.message ?? "Customer not found.")
        setCustomer(json.data)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Customer not found."))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-6 py-6 lg:px-8">
      <div>
        <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/customers", label: "Customers" }, { href: `/admin/customers/${id}`, label: customer?.name ?? id }]} />
        <Link href="/admin/customers" className="mt-4 inline-flex items-center gap-2 text-[12.5px] font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to customers
        </Link>
      </div>

      {loading ? (
        <Panel>Loading customer details…</Panel>
      ) : error || !customer ? (
        <Panel><span className="text-destructive">{error || "Customer not found."}</span></Panel>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5 shadow-xs">
            <div className="flex items-center gap-4">
              <Avatar customer={customer} large />
              <div>
                <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Customer Details</p>
                <h1 className="mt-1 text-[26px] font-semibold tracking-tight">{customer.name}</h1>
                <p className="mt-1 text-[13px] text-muted-foreground">{customer.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2"><StatusBadge value={customer.status} /><VerifyBadge verified={customer.emailVerified} /></div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
            <div className="space-y-5">
              <Panel title="Personal Information">
                <Info label="Name" value={customer.name} />
                <Info label="Email" value={customer.email} />
                <Info label="Mobile Number" value={customer.phone || "—"} />
                <Info label="Registration Date" value={dateTime(customer.joinedAt)} />
                <Info label="Last Login" value={customer.lastLoginAt ? dateTime(customer.lastLoginAt) : "Never"} />
              </Panel>
              <Panel title="Saved Addresses">
                {customer.defaultAddress ? <p className="leading-6">{formatAddress(customer.defaultAddress)}</p> : <EmptyLine>No saved address.</EmptyLine>}
              </Panel>
              <Panel title="Order History">
                {customer.orders.length ? (
                  <div className="divide-y divide-border">
                    {customer.orders.map((order) => (
                      <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between gap-4 py-3 hover:text-[var(--orycms-color-primary)]">
                        <span className="font-medium">{order.number}</span>
                        <span className="text-muted-foreground">{label(order.status)} · {formatCurrency(Number(order.total))}</span>
                      </Link>
                    ))}
                  </div>
                ) : <EmptyLine>No orders yet.</EmptyLine>}
              </Panel>
            </div>
            <div className="space-y-5">
              <Panel title="Payment Summary">
                <Info strong label="Total Orders" value={String(customer.totalOrders)} />
                <Info strong label="Total Spent" value={formatCurrency(Number(customer.totalSpent))} />
                <Info label="Recent Transactions" value={String(customer.payments.length)} />
              </Panel>
              <Panel title="Recent Activity">
                {customer.activity.length ? (
                  <div className="space-y-3">
                    {customer.activity.map((item, index) => (
                      <div key={`${item.label}-${index}`} className="rounded-lg border border-border bg-surface-muted px-3 py-2">
                        <p className="font-medium">{item.label}</p>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">{item.at ? dateTime(item.at) : "—"}</p>
                      </div>
                    ))}
                  </div>
                ) : <EmptyLine>No recent activity.</EmptyLine>}
              </Panel>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

function EditCustomerModal({ customer, onClose, onSaved }: { customer: Customer; onClose: () => void; onSaved: () => void }) {
  const [firstName, setFirstName] = useState(customer.firstName)
  const [lastName, setLastName] = useState(customer.lastName)
  const [phone, setPhone] = useState(customer.phone)
  const [status, setStatus] = useState<CustomerStatus>(customer.status)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      const response = await fetch(`/api/orycms/customers/${customer.id}`, {
        body: JSON.stringify({ firstName, lastName, phone, status }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const json = await response.json()
      if (!response.ok || !json.success) throw new Error(json.error?.message ?? "Failed to save customer.")
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save customer.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Edit Customer" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error ? <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{error}</p> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="First Name" value={firstName} onChange={setFirstName} />
          <Field label="Last Name" value={lastName} onChange={setLastName} />
        </div>
        <Field label="Mobile Number" value={phone} onChange={setPhone} />
        <label className="block text-[12.5px] font-medium">
          Account Status
          <select value={status} onChange={(event) => setStatus(event.target.value as CustomerStatus)} className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-border px-4 text-[12.5px] font-medium">Cancel</button>
          <button type="submit" disabled={saving} className="h-9 rounded-lg bg-foreground px-4 text-[12.5px] font-medium text-background disabled:opacity-60">{saving ? "Saving…" : "Save Customer"}</button>
        </div>
      </form>
    </Modal>
  )
}

function ConfirmModal({ action, count, onClose, onConfirm, saving }: { action: NonNullable<ConfirmState>["action"]; count: number; onClose: () => void; onConfirm: () => void; saving: boolean }) {
  return (
    <Modal title={`${label(action)} customer${count > 1 ? "s" : ""}?`} onClose={onClose}>
      <p className="text-[13px] leading-6 text-muted-foreground">
        This will {action} {count} customer account{count > 1 ? "s" : ""}. Inactive or blocked customers cannot login to the frontend store.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="h-9 rounded-lg border border-border px-4 text-[12.5px] font-medium">Cancel</button>
        <button type="button" disabled={saving} onClick={onConfirm} className={cn("h-9 rounded-lg px-4 text-[12.5px] font-medium text-white disabled:opacity-60", action === "delete" ? "bg-destructive" : "bg-foreground")}>{saving ? "Working…" : "Confirm"}</button>
      </div>
    </Modal>
  )
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-background/85 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-white text-foreground shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between gap-4 border-b border-border bg-white px-5 py-4">
          <h2 className="text-[16px] font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-[18px] text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground">×</button>
        </div>
        <div className="bg-white p-5">
          {children}
        </div>
      </div>
    </div>
  )
}

function Avatar({ customer, large }: { customer: Pick<Customer, "avatar" | "email" | "name">; large?: boolean }) {
  return (
    <div className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-surface-muted font-semibold", large ? "h-16 w-16 text-[18px]" : "h-10 w-10 text-[12px]")}>
      {customer.avatar ? <img src={customer.avatar} alt="" className="h-full w-full object-cover" /> : initials(customer)}
    </div>
  )
}

function StatusBadge({ value }: { value: CustomerStatus }) {
  return <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-medium", value === "active" && "bg-success/10 text-success", value === "inactive" && "bg-muted text-muted-foreground", value === "blocked" && "bg-destructive/10 text-destructive")}>{label(value)}</span>
}

function VerifyBadge({ verified }: { verified: boolean }) {
  return <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-medium", verified ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>{verified ? "Verified" : "Unverified"}</span>
}

function IconButton({ children, danger, label, onClick }: { children: React.ReactNode; danger?: boolean; label: string; onClick: () => void }) {
  return <button type="button" title={label} onClick={onClick} className={cn("inline-grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface transition-colors hover:border-border-strong hover:bg-accent", danger && "text-destructive")}>{children}</button>
}

function IconLink({ children, href, label }: { children: React.ReactNode; href: string; label: string }) {
  return <Link title={label} href={href} className="inline-grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface transition-colors hover:border-border-strong hover:bg-accent">{children}</Link>
}

function BulkButton({ children, danger, onClick }: { children: React.ReactNode; danger?: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("h-8 rounded-lg border border-border px-3 font-medium hover:bg-accent", danger && "text-destructive")}>{children}</button>
}

function Field({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return <label className="block text-[12.5px] font-medium">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none" /></label>
}

function Panel({ children, title }: { children: React.ReactNode; title?: string }) {
  return <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">{title ? <h2 className="mb-4 text-[14px] font-semibold">{title}</h2> : null}<div className="text-[13px]">{children}</div></div>
}

function Info({ label: key, strong, value }: { label: string; strong?: boolean; value: string }) {
  return <div className="flex items-start justify-between gap-4 py-1.5 text-[13px]"><span className="text-muted-foreground">{key}</span><span className={cn("text-right", strong && "font-semibold text-foreground")}>{value}</span></div>
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] text-muted-foreground">{children}</p>
}

function inDateRange(value: string, range: string) {
  const age = Date.now() - new Date(value).getTime()
  if (range === "today") return age < 24 * 60 * 60 * 1000
  if (range === "week") return age < 7 * 24 * 60 * 60 * 1000
  if (range === "month") return age < 30 * 24 * 60 * 60 * 1000
  return true
}

function initials(customer: Pick<Customer, "email" | "name">) {
  return (customer.name || customer.email).split(/\s|@/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "CU"
}

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function dateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}

function formatAddress(address?: Record<string, unknown> | null) {
  if (!address) return "—"
  return [address.address1, address.address2, address.city, address.state, address.pincode].map((value) => typeof value === "string" ? value.trim() : "").filter(Boolean).join(", ") || "—"
}
