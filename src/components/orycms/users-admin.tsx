"use client"

import { useEffect, useMemo, useState } from "react"
import type React from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Edit3, Eye, KeyRound, Search, Trash2, UserRound, Users } from "lucide-react"
import { useOryCMSSession } from "../../../orycms/hooks"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10
const ROLES = ["Super Admin", "Admin", "Editor", "Manager", "Support", "Custom"] as const

type AdminRole = "Owner" | typeof ROLES[number]
type AdminStatus = "active" | "inactive"
type AdminUser = {
  createdAt: string
  deletedAt: string | null
  email: string
  emailVerified: boolean
  fullName: string
  id: string
  lastLoginAt: string | null
  mobileNumber: string
  profilePhoto: string | null
  role: AdminRole
  status: AdminStatus
  updatedAt: string
}
type SortBy = "created-desc" | "created-asc" | "name-asc" | "last-login-desc"
type ConfirmState = { action: "activate" | "deactivate" | "delete"; ids: string[] } | null
type Toast = { id: number; message: string; tone: "success" | "error" }

const emptyForm = {
  confirmPassword: "",
  email: "",
  emailVerified: false,
  fullName: "",
  mobileNumber: "",
  password: "",
  profilePhoto: "",
  role: "Admin" as AdminRole,
  status: "active" as AdminStatus,
}

export function OryCMSUsersList() {
  const { roleName, user: currentUser } = useOryCMSSession()
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [editing, setEditing] = useState<AdminUser | "new" | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [resetUser, setResetUser] = useState<AdminUser | null>(null)
  const [roleFilter, setRoleFilter] = useState("all")
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortBy>("created-desc")
  const [statusFilter, setStatusFilter] = useState("all")
  const [toasts, setToasts] = useState<Toast[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const isSuper = roleName === "Owner" || roleName === "Super Admin"

  async function loadUsers(showLoader: boolean) {
    if (showLoader) setLoading(true)
    setError("")
    try {
      const json = await fetch("/api/orycms/users", { cache: "no-store" }).then((response) => response.json())
      if (!json.success) throw new Error(json.error?.message ?? "Failed to load users.")
      setUsers(Array.isArray(json.data) ? json.data : [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load users."
      setError(message)
      toast(message, "error")
    } finally {
      if (showLoader) setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers(true)
    const interval = window.setInterval(() => void loadUsers(false), 15000)
    return () => window.clearInterval(interval)
  }, [])

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    return users
      .filter((admin) => {
        const matchesSearch = !search || [admin.fullName, admin.email, admin.mobileNumber].join(" ").toLowerCase().includes(search)
        const matchesRole = roleFilter === "all" || admin.role === roleFilter
        const matchesStatus = statusFilter === "all" || admin.status === statusFilter
        return matchesSearch && matchesRole && matchesStatus
      })
      .sort((a, b) => {
        if (sortBy === "created-asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        if (sortBy === "name-asc") return a.fullName.localeCompare(b.fullName)
        if (sortBy === "last-login-desc") return new Date(b.lastLoginAt ?? 0).getTime() - new Date(a.lastLoginAt ?? 0).getTime()
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [query, roleFilter, sortBy, statusFilter, users])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const pageIds = paged.map((admin) => admin.id)
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id))

  useEffect(() => {
    setPage(1)
  }, [query, roleFilter, sortBy, statusFilter])

  function toast(message: string, tone: Toast["tone"]) {
    const id = Date.now()
    setToasts((items) => [...items, { id, message, tone }])
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3500)
  }

  async function runBulk(action: NonNullable<ConfirmState>["action"], ids: string[]) {
    setSaving(true)
    try {
      const response = await fetch("/api/orycms/users", {
        body: JSON.stringify({ action, ids }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const json = await response.json()
      if (!response.ok || !json.success) throw new Error(json.error?.message ?? "Failed to update users.")
      toast("Admin users updated.", "success")
      setConfirm(null)
      setSelected([])
      await loadUsers(false)
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update users.", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-6 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/users", label: "Users" }]} />
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">Users</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
            Manage OryCMS admin users, roles, verification, and dashboard access.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-border bg-surface px-3 py-2 text-[12.5px] text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span> of {users.length} users
          </div>
          {isSuper ? (
            <button type="button" onClick={() => setEditing("new")} className="h-9 rounded-lg bg-foreground px-4 text-[12.5px] font-semibold text-background transition-colors hover:bg-[var(--orycms-color-primary)] hover:text-white">
              Create User
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-xs">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-muted px-4 py-3">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email, or mobile…" className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-[13px] outline-none focus:border-border-strong" />
          </div>
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-9 rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none">
            <option value="all">All roles</option>
            <option value="Owner">Owner</option>
            {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none">
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)} className="h-9 rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none">
            <option value="created-desc">Newest first</option>
            <option value="created-asc">Oldest first</option>
            <option value="name-asc">Name A–Z</option>
            <option value="last-login-desc">Last login</option>
          </select>
        </div>

        {selected.length > 0 && isSuper ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 text-[12.5px]">
            <span className="font-medium">{selected.length} selected</span>
            <div className="flex flex-wrap gap-2">
              <BulkButton onClick={() => setConfirm({ action: "activate", ids: selected })}>Activate</BulkButton>
              <BulkButton onClick={() => setConfirm({ action: "deactivate", ids: selected })}>Deactivate</BulkButton>
              <BulkButton danger onClick={() => setConfirm({ action: "delete", ids: selected })}>Delete</BulkButton>
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-[13px]">
            <thead className="border-b border-border bg-surface-muted text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">
                  <input checked={allPageSelected} onChange={() => setSelected((current) => allPageSelected ? current.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...current, ...pageIds])))} disabled={!isSuper} type="checkbox" className="h-4 w-4 accent-[var(--orycms-color-primary)] disabled:opacity-40" />
                </th>
                <th className="px-4 py-3 font-medium">Profile</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Email Verified</th>
                <th className="px-4 py-3 font-medium">Last Login</th>
                <th className="px-4 py-3 font-medium">Created Date</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">Loading admin users…</td></tr>
              ) : error ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-destructive">{error}</td></tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-14 text-center">
                    <Users className="mx-auto h-10 w-10 text-muted-foreground/30" strokeWidth={1} />
                    <p className="mt-3 font-medium">No admin users found.</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">Create a user to grant OryCMS access.</p>
                  </td>
                </tr>
              ) : paged.map((admin) => (
                <tr key={admin.id} className="transition-colors hover:bg-surface-muted/60">
                  <td className="px-4 py-3">
                    <input checked={selected.includes(admin.id)} onChange={() => setSelected((current) => current.includes(admin.id) ? current.filter((id) => id !== admin.id) : [...current, admin.id])} disabled={!isSuper} type="checkbox" className="h-4 w-4 accent-[var(--orycms-color-primary)] disabled:opacity-40" />
                  </td>
                  <td className="px-4 py-3"><Avatar user={admin} /></td>
                  <td className="px-4 py-3 font-medium">{admin.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{admin.email}</td>
                  <td className="px-4 py-3"><RoleBadge role={admin.role} /></td>
                  <td className="px-4 py-3"><StatusBadge status={admin.status} /></td>
                  <td className="px-4 py-3"><VerifyBadge verified={admin.emailVerified} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{admin.lastLoginAt ? dateTime(admin.lastLoginAt) : "Never"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{dateTime(admin.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <IconLink href={`/admin/users/${admin.id}`} label="View"><Eye className="h-3.5 w-3.5" /></IconLink>
                      {isSuper ? <IconButton label="Edit" onClick={() => setEditing(admin)}><Edit3 className="h-3.5 w-3.5" /></IconButton> : null}
                      {isSuper ? <IconButton label={admin.status === "active" ? "Deactivate" : "Activate"} onClick={() => setConfirm({ action: admin.status === "active" ? "deactivate" : "activate", ids: [admin.id] })}><CheckCircle2 className="h-3.5 w-3.5" /></IconButton> : null}
                      {isSuper ? <IconButton label="Reset Password" onClick={() => setResetUser(admin)}><KeyRound className="h-3.5 w-3.5" /></IconButton> : null}
                      {isSuper ? <IconButton danger disabled={admin.id === currentUser?.id} label="Delete" onClick={() => setConfirm({ action: "delete", ids: [admin.id] })}><Trash2 className="h-3.5 w-3.5" /></IconButton> : null}
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

      {editing ? <UserModal user={editing} onClose={() => setEditing(null)} onSaved={() => { toast(editing === "new" ? "Admin user created." : "Admin user saved.", "success"); setEditing(null); void loadUsers(false) }} onToast={toast} /> : null}
      {resetUser ? <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} onSaved={() => { toast("Password reset. Existing sessions revoked.", "success"); setResetUser(null) }} onToast={toast} /> : null}
      {confirm ? <ConfirmModal action={confirm.action} count={confirm.ids.length} saving={saving} onClose={() => setConfirm(null)} onConfirm={() => void runBulk(confirm.action, confirm.ids)} /> : null}
      <ToastStack toasts={toasts} />
    </section>
  )
}

export function OryCMSUserDetails({ id }: { id: string }) {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<AdminUser | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/orycms/users/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (response) => {
        const json = await response.json()
        if (!response.ok || !json.success) throw new Error(json.error?.message ?? "User not found.")
        setUser(json.data)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "User not found."))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-6 py-6 lg:px-8">
      <div>
        <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/users", label: "Users" }, { href: `/admin/users/${id}`, label: user?.fullName ?? id }]} />
        <Link href="/admin/users" className="mt-4 inline-flex items-center gap-2 text-[12.5px] font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to users
        </Link>
      </div>

      {loading ? (
        <Panel>Loading user details…</Panel>
      ) : error || !user ? (
        <Panel><span className="text-destructive">{error || "User not found."}</span></Panel>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5 shadow-xs">
            <div className="flex items-center gap-4">
              <Avatar user={user} large />
              <div>
                <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Admin User</p>
                <h1 className="mt-1 text-[26px] font-semibold tracking-tight">{user.fullName}</h1>
                <p className="mt-1 text-[13px] text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2"><RoleBadge role={user.role} /><StatusBadge status={user.status} /></div>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Profile">
              <Info label="Full Name" value={user.fullName} />
              <Info label="Email" value={user.email} />
              <Info label="Mobile Number" value={user.mobileNumber || "—"} />
              <Info label="Email Verified" value={user.emailVerified ? "Verified" : "Unverified"} />
            </Panel>
            <Panel title="Access">
              <Info label="Role" value={user.role} />
              <Info label="Status" value={label(user.status)} />
              <Info label="Last Login" value={user.lastLoginAt ? dateTime(user.lastLoginAt) : "Never"} />
              <Info label="Created Date" value={dateTime(user.createdAt)} />
            </Panel>
          </div>
        </>
      )}
    </section>
  )
}

function UserModal({ onClose, onSaved, onToast, user }: { onClose: () => void; onSaved: () => void; onToast: (message: string, tone: Toast["tone"]) => void; user: AdminUser | "new" }) {
  const creating = user === "new"
  const [form, setForm] = useState(creating ? emptyForm : { ...emptyForm, ...user, password: "", confirmPassword: "" })
  const [saving, setSaving] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const response = await fetch(creating ? "/api/orycms/users" : `/api/orycms/users/${user.id}`, {
        body: JSON.stringify(form),
        headers: { "Content-Type": "application/json" },
        method: creating ? "POST" : "PATCH",
      })
      const json = await response.json()
      if (!response.ok || !json.success) throw new Error(json.error?.message ?? "Failed to save user.")
      onSaved()
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Failed to save user.", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={creating ? "Create User" : "Edit User"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field required label="Full Name" value={form.fullName} onChange={(fullName) => setForm((value) => ({ ...value, fullName }))} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field required label="Email" type="email" value={form.email} onChange={(email) => setForm((value) => ({ ...value, email }))} />
          <Field label="Mobile Number" value={form.mobileNumber} onChange={(mobileNumber) => setForm((value) => ({ ...value, mobileNumber }))} />
        </div>
        <Field label="Profile Photo URL" value={form.profilePhoto ?? ""} onChange={(profilePhoto) => setForm((value) => ({ ...value, profilePhoto }))} />
        {creating ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field required label="Password" type="password" value={form.password} onChange={(password) => setForm((value) => ({ ...value, password }))} />
            <Field required label="Confirm Password" type="password" value={form.confirmPassword} onChange={(confirmPassword) => setForm((value) => ({ ...value, confirmPassword }))} />
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-3">
          <Select label="Role" value={form.role} onChange={(role) => setForm((value) => ({ ...value, role: role as AdminRole }))}>
            {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={(status) => setForm((value) => ({ ...value, status: status as AdminStatus }))}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <label className="flex items-center gap-2 pt-6 text-[12.5px] font-medium">
            <input checked={form.emailVerified} onChange={(event) => setForm((value) => ({ ...value, emailVerified: event.target.checked }))} type="checkbox" className="h-4 w-4 accent-[var(--orycms-color-primary)]" />
            Email Verified
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-border px-4 text-[12.5px] font-medium">Cancel</button>
          <button type="submit" disabled={saving} className="h-9 rounded-lg bg-foreground px-4 text-[12.5px] font-medium text-background disabled:opacity-60">{saving ? "Saving…" : creating ? "Create User" : "Save User"}</button>
        </div>
      </form>
    </Modal>
  )
}

function ResetPasswordModal({ onClose, onSaved, onToast, user }: { onClose: () => void; onSaved: () => void; onToast: (message: string, tone: Toast["tone"]) => void; user: AdminUser }) {
  const [confirmPassword, setConfirmPassword] = useState("")
  const [password, setPassword] = useState("")
  const [saving, setSaving] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const response = await fetch(`/api/orycms/users/${user.id}`, {
        body: JSON.stringify({ action: "reset-password", password, confirmPassword }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const json = await response.json()
      if (!response.ok || !json.success) throw new Error(json.error?.message ?? "Failed to reset password.")
      onSaved()
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Failed to reset password.", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Reset Password · ${user.fullName}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field required label="Password" type="password" value={password} onChange={setPassword} />
          <Field required label="Confirm Password" type="password" value={confirmPassword} onChange={setConfirmPassword} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-border px-4 text-[12.5px] font-medium">Cancel</button>
          <button type="submit" disabled={saving} className="h-9 rounded-lg bg-foreground px-4 text-[12.5px] font-medium text-background disabled:opacity-60">{saving ? "Saving…" : "Reset Password"}</button>
        </div>
      </form>
    </Modal>
  )
}

function ConfirmModal({ action, count, onClose, onConfirm, saving }: { action: NonNullable<ConfirmState>["action"]; count: number; onClose: () => void; onConfirm: () => void; saving: boolean }) {
  return (
    <Modal title={`${label(action)} user${count > 1 ? "s" : ""}?`} onClose={onClose}>
      <p className="text-[13px] leading-6 text-muted-foreground">
        This will {action} {count} OryCMS admin user{count > 1 ? "s" : ""}. Inactive users cannot access the admin.
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
      <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-white text-foreground shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:mx-auto">
        <div className="flex items-center justify-between gap-4 border-b border-border bg-white px-5 py-4">
          <h2 className="text-[16px] font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-[18px] text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground">×</button>
        </div>
        <div className="max-h-[calc(90vh-65px)] overflow-y-auto bg-white p-5">
          {children}
        </div>
      </div>
    </div>
  )
}

function Avatar({ large, user }: { large?: boolean; user: Pick<AdminUser, "email" | "fullName" | "profilePhoto"> }) {
  return <div className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-surface-muted font-semibold", large ? "h-16 w-16 text-[18px]" : "h-10 w-10 text-[12px]")}>{user.profilePhoto ? <img src={user.profilePhoto} alt="" className="h-full w-full object-cover" /> : initials(user)}</div>
}

function RoleBadge({ role }: { role: AdminRole }) {
  return <span className="rounded-full bg-[var(--orycms-color-primary)]/10 px-2.5 py-1 text-[12px] font-medium text-[var(--orycms-color-primary)]">{role}</span>
}

function StatusBadge({ status }: { status: AdminStatus }) {
  return <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-medium", status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>{label(status)}</span>
}

function VerifyBadge({ verified }: { verified: boolean }) {
  return <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-medium", verified ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>{verified ? "Verified" : "Unverified"}</span>
}

function IconButton({ children, danger, disabled, label, onClick }: { children: React.ReactNode; danger?: boolean; disabled?: boolean; label: string; onClick: () => void }) {
  return <button type="button" title={label} disabled={disabled} onClick={onClick} className={cn("inline-grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface transition-colors hover:border-border-strong hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40", danger && "text-destructive")}>{children}</button>
}

function IconLink({ children, href, label }: { children: React.ReactNode; href: string; label: string }) {
  return <Link title={label} href={href} className="inline-grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface transition-colors hover:border-border-strong hover:bg-accent">{children}</Link>
}

function BulkButton({ children, danger, onClick }: { children: React.ReactNode; danger?: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("h-8 rounded-lg border border-border px-3 font-medium hover:bg-accent", danger && "text-destructive")}>{children}</button>
}

function Field({ label, onChange, required, type = "text", value }: { label: string; onChange: (value: string) => void; required?: boolean; type?: string; value: string }) {
  return <label className="block text-[12.5px] font-medium">{label}{required ? " *" : ""}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none" /></label>
}

function Select({ children, label, onChange, value }: { children: React.ReactNode; label: string; onChange: (value: string) => void; value: string }) {
  return <label className="block text-[12.5px] font-medium">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none">{children}</select></label>
}

function Panel({ children, title }: { children: React.ReactNode; title?: string }) {
  return <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">{title ? <h2 className="mb-4 text-[14px] font-semibold">{title}</h2> : null}<div className="text-[13px]">{children}</div></div>
}

function Info({ label: key, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 py-1.5 text-[13px]"><span className="text-muted-foreground">{key}</span><span className="text-right">{value}</span></div>
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return <div className="fixed bottom-4 right-4 z-[100] space-y-2">{toasts.map((toast) => <div key={toast.id} className={cn("rounded-xl border bg-white px-4 py-3 text-[13px] shadow-lg", toast.tone === "success" ? "border-success/30 text-success" : "border-destructive/30 text-destructive")}>{toast.message}</div>)}</div>
}

function initials(user: Pick<AdminUser, "email" | "fullName">) {
  return (user.fullName || user.email).split(/\s|@/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "AD"
}

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function dateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}
