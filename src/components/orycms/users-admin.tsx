"use client"

import { useEffect, useMemo, useState } from "react"
import type React from "react"
import Link from "next/link"
import { ArrowLeft, Edit3, Eye, FileText, Lock, Loader2, Mail, RefreshCw, Search, Trash2, Unlock, Users } from "lucide-react"
import { useOryCMSSession } from "../../../orycms/hooks"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { OryCMSSelect } from "@/components/orycms/custom-select"
import { Skeleton } from "../../../orycms/components/ui/skeleton"
import { cn } from "@/lib/utils"


const PAGE_SIZE = 10
const ROLES = ["Super Admin", "Admin", "Editor", "Manager", "Support", "Custom"] as const
const RESEND_COOLDOWN_MS = 12 * 60 * 60 * 1000 // 12 hours

type AdminRole = "Owner" | typeof ROLES[number]
type AdminStatus = "active" | "inactive" | "locked"
type AdminUser = {
  createdAt: string
  deletedAt: string | null
  email: string
  emailVerified: boolean
  fullName: string
  id: string
  invited: boolean
  lastInvitedAt: string | null
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
  email: "",
  emailVerified: false,
  fullName: "",
  mobileNumber: "",
  profilePhoto: "",
  role: "Admin" as AdminRole,
  sendInvitation: true,
  status: "inactive" as AdminStatus,
  justification: "",
}

export function OryCMSUsersList() {
  const { roleName, user: currentUser } = useOryCMSSession()
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [editing, setEditing] = useState<AdminUser | "new" | null>(null)
  const [verifyUser, setVerifyUser] = useState<AdminUser | null>(null)
  const [lockUser, setLockUser] = useState<AdminUser | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
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

  async function handleResendInvitation(admin: AdminUser) {
    setSendingInviteId(admin.id)
    try {
      const res = await fetch(`/api/orycms/users/${encodeURIComponent(admin.id)}/resend-invite`, { method: "POST" })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? "Failed to send invitation.")
      toast(`Invitation email sent to ${admin.email}.`, "success")
      await loadUsers(false)
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to send invitation.", "error")
    } finally {
      setSendingInviteId(null)
    }
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
            Manage OryCMS admin users, passwordless invitations, account freezing, and permissions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-border bg-surface px-3 py-2 text-[12.5px] text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span> of {users.length} users
          </div>
          <button type="button" onClick={() => void loadUsers(true)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3.5 text-[12.5px] font-medium text-foreground transition-colors hover:!bg-foreground hover:!text-white cursor-pointer select-none">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
          </button>
          {isSuper ? (
            <>
              <Link href="/admin/audit-logs" className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3.5 text-[12.5px] font-medium text-foreground transition-colors hover:!bg-foreground hover:!text-white cursor-pointer select-none">
                <FileText className="h-3.5 w-3.5" /> Audit Logs
              </Link>
              <button type="button" onClick={() => setEditing("new")} className="h-9 rounded-lg bg-foreground px-4 text-[12.5px] font-semibold text-background transition-colors hover:!bg-[#FF5A20] hover:!text-white cursor-pointer select-none">
                Create User
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-xs">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-muted px-4 py-3">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email, or mobile…" className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-[13px] outline-none focus:border-border-strong" />
          </div>
          <OryCMSSelect
            value={roleFilter}
            onChange={(val) => setRoleFilter(val)}
            options={[{ label: "All roles", value: "all" }, { label: "Owner", value: "Owner" }, ...ROLES.map((r) => ({ label: r, value: r }))]}
            className="w-auto"
          />
          <OryCMSSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { label: "All status", value: "all" },
              { label: "Active", value: "active" },
              { label: "Inactive / Invited", value: "inactive" },
              { label: "Locked / Frozen", value: "locked" },
            ]}
            className="w-auto"
          />
          <OryCMSSelect
            value={sortBy}
            onChange={(val) => setSortBy(val as SortBy)}
            options={[
              { label: "Newest first", value: "created-desc" },
              { label: "Oldest first", value: "created-asc" },
              { label: "Name A–Z", value: "name-asc" },
              { label: "Last login", value: "last-login-desc" },
            ]}
            className="w-auto"
          />
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
                  <input checked={allPageSelected} onChange={() => setSelected((current) => allPageSelected ? current.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...current, ...pageIds])))} disabled={!isSuper} type="checkbox" className="h-4 w-4 accent-[#FF5A20] disabled:opacity-40 cursor-pointer" />
                </th>
                <th className="px-4 py-3 font-medium">Profile</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Account Status</th>
                <th className="px-4 py-3 font-medium">Email Verified</th>
                <th className="px-4 py-3 font-medium">Last Login</th>
                <th className="px-4 py-3 font-medium">Created Date</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={10} className="px-4 py-3">
                      <Skeleton className="h-6 w-full rounded-md" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-destructive">{error}</td></tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-14 text-center">
                    <Users className="mx-auto h-10 w-10 text-muted-foreground/30" strokeWidth={1} />
                    <p className="mt-3 font-medium">No admin users found.</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">Create a user to send an invitation.</p>
                  </td>
                </tr>
              ) : paged.map((admin) => {
                const cooldown = checkCooldown(admin.lastInvitedAt)
                const isSendingThis = sendingInviteId === admin.id
                return (
                  <tr key={admin.id} className="transition-colors hover:!bg-surface-muted/60">
                    <td className="px-4 py-3">
                      <input checked={selected.includes(admin.id)} onChange={() => setSelected((current) => current.includes(admin.id) ? current.filter((id) => id !== admin.id) : [...current, admin.id])} disabled={!isSuper} type="checkbox" className="h-4 w-4 accent-[#FF5A20] disabled:opacity-40 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3"><Avatar user={admin} /></td>
                    <td className="px-4 py-3 font-medium">{admin.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{admin.email}</td>
                    <td className="px-4 py-3"><RoleBadge role={admin.role} /></td>
                    <td className="px-4 py-3"><StatusBadge user={admin} /></td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="cursor-pointer select-none"
                        disabled={!isSuper || admin.emailVerified || admin.invited}
                        onClick={() => setVerifyUser(admin)}
                        title={admin.invited ? "Manual verification disabled until user sets password" : admin.emailVerified ? "Email verified via setup token" : isSuper ? "Click to manually verify with justification" : "Unverified"}
                      >
                        <VerifyBadge verified={admin.emailVerified} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{admin.lastLoginAt ? dateTime(admin.lastLoginAt) : "Never"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{dateTime(admin.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <IconLink href={`/admin/users/${admin.id}`} label="View"><Eye className="h-3.5 w-3.5" /></IconLink>
                        {isSuper ? <IconButton variant="edit" label="Edit" onClick={() => setEditing(admin)}><Edit3 className="h-3.5 w-3.5" /></IconButton> : null}

                        {/* Send / Resend Invitation Button with Spinning Loader Progress */}
                        {isSuper && admin.status !== "active" && admin.status !== "locked" ? (
                          <IconButton
                            variant="mail"
                            disabled={!cooldown.canResend || isSendingThis}
                            label={isSendingThis ? "Sending invitation email…" : !cooldown.canResend ? `Resend available in ${cooldown.hoursLeft}h` : admin.lastInvitedAt ? "Resend Invitation Email" : "Send Invitation Email"}
                            onClick={() => void handleResendInvitation(admin)}
                          >
                            {isSendingThis ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Mail className={cn("h-3.5 w-3.5", !cooldown.canResend && "opacity-40")} />
                            )}
                          </IconButton>
                        ) : null}

                        {/* Super Admin Lock / Freeze Toggle Button */}
                        {isSuper && admin.id !== currentUser?.id ? (
                          <IconButton
                            variant="lock"
                            label={admin.status === "locked" ? "Unlock Admin Account" : "Lock / Freeze Admin Account"}
                            onClick={() => setLockUser(admin)}
                          >
                            {admin.status === "locked" ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                          </IconButton>
                        ) : null}

                        {isSuper ? <IconButton variant="delete" disabled={admin.id === currentUser?.id} label="Delete" onClick={() => setConfirm({ action: "delete", ids: [admin.id] })}><Trash2 className="h-3.5 w-3.5" /></IconButton> : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[12px] text-muted-foreground">
          <span>Page {page} of {pageCount}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="h-8 rounded-lg border border-border px-3 font-medium disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer select-none hover:!bg-foreground hover:!text-white transition-colors">Previous</button>
            <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={page === pageCount} className="h-8 rounded-lg border border-border px-3 font-medium disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer select-none hover:!bg-foreground hover:!text-white transition-colors">Next</button>
          </div>
        </div>
      </div>

      {editing ? <UserModal user={editing} onClose={() => setEditing(null)} onSaved={(msg) => { toast(msg, "success"); setEditing(null); void loadUsers(false) }} onToast={toast} /> : null}
      {verifyUser ? <ManualVerifyModal user={verifyUser} onClose={() => setVerifyUser(null)} onSaved={() => { toast(`Email for ${verifyUser.fullName} verified manually.`, "success"); setVerifyUser(null); void loadUsers(false) }} onToast={toast} /> : null}
      {lockUser ? <LockModal user={lockUser} onClose={() => setLockUser(null)} onSaved={(msg) => { toast(msg, "success"); setLockUser(null); void loadUsers(false) }} onToast={toast} /> : null}
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
        <Link href="/admin/users" className="mt-4 inline-flex items-center gap-2 text-[12.5px] font-medium text-muted-foreground hover:!text-[#FF5A20] cursor-pointer select-none">
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
            <div className="flex flex-wrap gap-2"><RoleBadge role={user.role} /><StatusBadge user={user} /></div>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Profile">
              <Info label="Full Name" value={user.fullName} />
              <Info label="Email" value={user.email} />
              <Info label="Mobile Number" value={user.mobileNumber || "—"} />
              <Info label="Email Verified" value={user.emailVerified ? "Verified" : "Unverified"} />
            </Panel>
            <Panel title="Access & Invitation">
              <Info label="Role" value={user.role} />
              <Info label="Account Status" value={user.status} />
              <Info label="Last Invitation Sent" value={user.lastInvitedAt ? dateTime(user.lastInvitedAt) : "Not Sent Yet"} />
              <Info label="Last Login" value={user.lastLoginAt ? dateTime(user.lastLoginAt) : "Never"} />
              <Info label="Created Date" value={dateTime(user.createdAt)} />
            </Panel>
          </div>
        </>
      )}
    </section>
  )
}

function UserModal({ onClose, onSaved, onToast, user }: { onClose: () => void; onSaved: (msg: string) => void; onToast: (message: string, tone: Toast["tone"]) => void; user: AdminUser | "new" }) {
  const creating = user === "new"
  const isPending = !creating && user.invited
  const [form, setForm] = useState(creating ? emptyForm : { ...emptyForm, ...user, justification: "" })
  const [saving, setSaving] = useState(false)

  const isStatusChanged = !creating && form.status !== user.status

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (isStatusChanged && (!form.justification.trim() || form.justification.trim().length < 5)) {
      onToast("Justification reason (at least 5 characters) is required when changing account status.", "error")
      return
    }
    setSaving(true)
    try {
      const response = await fetch(creating ? "/api/orycms/users" : `/api/orycms/users/${user.id}`, {
        body: JSON.stringify(form),
        headers: { "Content-Type": "application/json" },
        method: creating ? "POST" : "PATCH",
      })
      const json = await response.json()
      if (!response.ok || !json.success) throw new Error(json.error?.message ?? "Failed to save user.")
      
      const successMsg = creating
        ? form.sendInvitation
          ? `Invitation sent to ${form.email}. Status: Invitation Sent.`
          : `Admin user created. Use 'Send Invitation' when ready.`
        : "Admin user updated."
      onSaved(successMsg)
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Failed to save user.", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={creating ? "Create Admin User" : "Edit Admin User"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field required label="Full Name" value={form.fullName} onChange={(fullName) => setForm((value) => ({ ...value, fullName }))} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field required label="Email" type="email" value={form.email} onChange={(email) => setForm((value) => ({ ...value, email }))} />
          <Field label="Mobile Number" value={form.mobileNumber} onChange={(mobileNumber) => setForm((value) => ({ ...value, mobileNumber }))} />
        </div>
        <Field label="Profile Photo URL" value={form.profilePhoto ?? ""} onChange={(profilePhoto) => setForm((value) => ({ ...value, profilePhoto }))} />
        
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Role" value={form.role} onChange={(role) => setForm((value) => ({ ...value, role: role as AdminRole }))}>
            {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
          </Select>
          {!creating ? (
            <div>
              <Select label="Status" value={form.status} onChange={(status) => setForm((value) => ({ ...value, status: status as AdminStatus }))}>
                {!isPending ? <option value="active">Active</option> : null}
                <option value="inactive">Inactive</option>
                <option value="locked">Locked / Frozen</option>
              </Select>
              {isPending ? (
                <p className="mt-1 text-[11px] text-amber-700 font-medium leading-tight">
                  Status is locked to Inactive until user sets their password via invitation link.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {isStatusChanged ? (
          <label className="block text-[12.5px] font-semibold text-foreground space-y-1">
            Status Change Justification Reason <span className="text-destructive">*</span>
            <textarea
              required
              rows={2}
              value={form.justification}
              onChange={(e) => setForm((value) => ({ ...value, justification: e.target.value }))}
              placeholder="State the reason for changing this admin account status…"
              className="w-full rounded-lg border border-border bg-surface p-3 text-[13px] outline-none focus:border-border-strong"
            />
          </label>
        ) : null}

        {creating ? (
          <div className="rounded-xl bg-orange-50/80 p-3.5 border border-orange-200 space-y-2">
            <label className="flex items-center gap-2.5 text-[13px] font-semibold text-orange-950 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.sendInvitation}
                onChange={(e) => setForm((value) => ({ ...value, sendInvitation: e.target.checked }))}
                className="h-4.5 w-4.5 accent-[#FF5A20] rounded cursor-pointer"
              />
              Send invitation email automatically
            </label>
            <p className="text-[11.5px] text-orange-900/80 leading-relaxed pl-7">
              Password will be set by the invited user via a 24-hour one-time link. The creating admin does not set or view the user&apos;s password.
            </p>
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-border px-4 text-[12.5px] font-medium cursor-pointer select-none hover:!bg-foreground hover:!text-white transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="h-9 rounded-lg bg-foreground px-4 text-[12.5px] font-semibold text-background hover:!bg-[#FF5A20] hover:!text-white transition-colors disabled:opacity-60 cursor-pointer select-none flex items-center gap-2">{saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : creating ? "Create & Invite Admin" : "Save User"}</button>
        </div>
      </form>
    </Modal>
  )
}

function LockModal({ onClose, onSaved, onToast, user }: { onClose: () => void; onSaved: (msg: string) => void; onToast: (message: string, tone: Toast["tone"]) => void; user: AdminUser }) {
  const [justification, setJustification] = useState("")
  const [saving, setSaving] = useState(false)
  const isLocking = user.status !== "locked"
  const actionText = isLocking ? "Lock / Freeze" : "Unlock"

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!justification.trim() || justification.trim().length < 5) {
      onToast("Justification reason (at least 5 characters) is required to lock or unlock an account.", "error")
      return
    }
    setSaving(true)
    try {
      const response = await fetch(`/api/orycms/users/${user.id}/toggle-lock`, {
        body: JSON.stringify({ justification }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const json = await response.json()
      if (!response.ok || !json.success) throw new Error(json.error?.message ?? `Failed to ${actionText.toLowerCase()} account.`)
      onSaved(`Account ${isLocking ? "locked & sessions revoked" : "unlocked"}.`)
    } catch (err) {
      onToast(err instanceof Error ? err.message : `Failed to ${actionText.toLowerCase()} user.`, "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`${actionText} Admin Account · ${user.fullName}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          {isLocking
            ? "Freezing an admin account revokes all active session tokens immediately and blocks login access until unlocked."
            : "Unlocking an admin account restores login access for this administrator."}
        </p>
        <label className="block text-[12.5px] font-semibold text-foreground space-y-1">
          Justification Reason <span className="text-destructive">*</span>
          <textarea
            required
            rows={3}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder={`State the reason to ${actionText.toLowerCase()} this admin account…`}
            className="w-full rounded-lg border border-border bg-surface p-3 text-[13px] outline-none focus:border-border-strong"
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-border px-4 text-[12.5px] font-medium cursor-pointer select-none hover:!bg-foreground hover:!text-white transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className={cn("h-9 rounded-lg px-4 text-[12.5px] font-semibold text-white transition-colors disabled:opacity-60 cursor-pointer select-none flex items-center gap-2", isLocking ? "bg-destructive hover:!bg-destructive/90" : "bg-foreground hover:!bg-[#FF5A20] hover:!text-white")}>{saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Working…</> : `${actionText} Account`}</button>
        </div>
      </form>
    </Modal>
  )
}

function ManualVerifyModal({ onClose, onSaved, onToast, user }: { onClose: () => void; onSaved: () => void; onToast: (message: string, tone: Toast["tone"]) => void; user: AdminUser }) {
  const [justification, setJustification] = useState("")
  const [saving, setSaving] = useState(false)
  const isPending = user.invited

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (isPending) {
      onToast("Manual verification is disabled until the user completes password setup via invitation link.", "error")
      return
    }
    if (!justification.trim() || justification.trim().length < 5) {
      onToast("Justification reason must be at least 5 characters long.", "error")
      return
    }
    setSaving(true)
    try {
      const response = await fetch(`/api/orycms/users/${user.id}/verify-email`, {
        body: JSON.stringify({ justification }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const json = await response.json()
      if (!response.ok || !json.success) throw new Error(json.error?.message ?? "Failed to manually verify email.")
      onSaved()
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Failed to verify email.", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Manual Email Verification · ${user.fullName}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {isPending ? (
          <div className="rounded-xl bg-amber-50 p-3.5 border border-amber-200 text-[12.5px] text-amber-900 font-medium leading-relaxed">
            Manual email verification is disabled for pending setup accounts. The invited user must set their password via the invitation link to verify their email.
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Manually marking an admin email as verified bypasses the standard invitation link flow. This privileged action is restricted to Super Admins and requires an audited justification reason.
          </p>
        )}
        {!isPending ? (
          <label className="block text-[12.5px] font-semibold text-foreground">
            Justification Reason <span className="text-destructive">*</span>
            <textarea
              required
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="State the exceptional reason for manual verification…"
              className="mt-1 w-full rounded-lg border border-border bg-surface p-3 text-[13px] outline-none focus:border-border-strong"
            />
          </label>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-border px-4 text-[12.5px] font-medium cursor-pointer select-none hover:!bg-foreground hover:!text-white transition-colors">Cancel</button>
          {!isPending ? (
            <button type="submit" disabled={saving} className="h-9 rounded-lg bg-foreground px-4 text-[12.5px] font-semibold text-background hover:!bg-[#FF5A20] hover:!text-white transition-colors disabled:opacity-60 cursor-pointer select-none flex items-center gap-2">{saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying…</> : "Mark Email as Verified"}</button>
          ) : null}
        </div>
      </form>
    </Modal>
  )
}

function ConfirmModal({ action, count, onClose, onConfirm, saving }: { action: NonNullable<ConfirmState>["action"]; count: number; onClose: () => void; onConfirm: () => void; saving: boolean }) {
  return (
    <Modal title={`${label(action)} user${count > 1 ? "s" : ""}?`} onClose={onClose}>
      <p className="text-[13px] leading-6 text-muted-foreground">
        This will {action} {count} OryCMS admin user{count > 1 ? "s" : ""}. Inactive or locked users cannot access the admin panel.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="h-9 rounded-lg border border-border px-4 text-[12.5px] font-medium cursor-pointer select-none hover:!bg-foreground hover:!text-white transition-colors">Cancel</button>
        <button type="button" disabled={saving} onClick={onConfirm} className={cn("h-9 rounded-lg px-4 text-[12.5px] font-semibold text-white disabled:opacity-60 cursor-pointer select-none flex items-center gap-2", action === "delete" ? "bg-destructive hover:!bg-destructive/90" : "bg-foreground hover:!bg-[#FF5A20] hover:!text-white")}>{saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Working…</> : "Confirm"}</button>
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
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-[18px] text-muted-foreground transition-colors hover:!bg-surface-muted hover:!text-foreground cursor-pointer select-none">×</button>
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
  return <span className="rounded-full bg-foreground/10 px-2.5 py-1 text-[12px] font-semibold text-foreground">{role}</span>
}

function StatusBadge({ user }: { user: AdminUser }) {
  if (user.status === "locked") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[12px] font-semibold text-red-700">Locked / Frozen</span>
  }
  if (user.status === "active") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[12px] font-semibold text-emerald-700">Active</span>
  }
  if (user.invited) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-[#FF5A20]/10 px-2.5 py-1 text-[12px] font-semibold text-[#FF5A20] border border-[#FF5A20]/30">Invitation Sent</span>
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-medium text-slate-600">Pending Setup</span>
}

function VerifyBadge({ verified }: { verified: boolean }) {
  return <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-semibold", verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>{verified ? "Verified" : "Unverified"}</span>
}

function IconButton({ children, disabled, label, onClick, variant }: { children: React.ReactNode; disabled?: boolean; label: string; onClick: () => void; variant?: "edit" | "mail" | "lock" | "delete" }) {
  const variantClasses = variant === "edit"
    ? "hover:!bg-destructive hover:!text-white hover:border-destructive"
    : variant === "mail"
    ? "hover:!bg-destructive hover:!text-white hover:border-destructive"
    : variant === "lock"
    ? "hover:!bg-destructive hover:!text-white hover:border-destructive"
    : variant === "delete"
    ? "text-destructive hover:!bg-destructive hover:!text-white hover:border-destructive"
    : "hover:!bg-foreground hover:!text-white hover:border-foreground"

  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn("inline-grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface transition-colors disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer select-none", variantClasses)}
    >
      {children}
    </button>
  )
}

function IconLink({ children, href, label }: { children: React.ReactNode; href: string; label: string }) {
  return <Link title={label} href={href} className="inline-grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface transition-colors hover:!border-foreground hover:!bg-foreground hover:!text-white cursor-pointer select-none">{children}</Link>
}

function BulkButton({ children, danger, onClick }: { children: React.ReactNode; danger?: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("h-8 rounded-lg border border-border px-3 font-medium hover:!bg-foreground hover:!text-white cursor-pointer select-none transition-colors", danger && "text-destructive hover:!bg-destructive hover:!text-white")}>{children}</button>
}

function Field({ label, onChange, required, type = "text", value }: { label: string; onChange: (value: string) => void; required?: boolean; type?: string; value: string }) {
  return <label className="block text-[12.5px] font-medium">{label}{required ? " *" : ""}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none" /></label>
}

function Select({ children, label, onChange, value }: { children: React.ReactNode; label: string; onChange: (value: string) => void; value: string }) {
  const options = (Array.isArray(children) ? children : [children]).flatMap((child) => {
    if (child && typeof child === "object" && "props" in child) {
      const val = child.props.value !== undefined ? child.props.value : String(child.props.children || "")
      const labelStr = String(child.props.children || val)
      return [{ label: labelStr, value: String(val) }]
    }
    return []
  })
  return <OryCMSSelect label={label} value={value} onChange={onChange} options={options} />
}

function Panel({ children, title }: { children: React.ReactNode; title?: string }) {
  return <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">{title ? <h2 className="mb-4 text-[14px] font-semibold">{title}</h2> : null}<div className="text-[13px]">{children}</div></div>
}

function Info({ label: key, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 py-1.5 text-[13px]"><span className="text-muted-foreground">{key}</span><span className="text-right font-medium">{value}</span></div>
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return <div className="fixed bottom-4 right-4 z-[100] space-y-2">{toasts.map((toast) => <div key={toast.id} className={cn("rounded-xl border bg-white px-4 py-3 text-[13px] shadow-lg", toast.tone === "success" ? "border-emerald-300 text-emerald-800" : "border-red-300 text-red-800")}>{toast.message}</div>)}</div>
}

function checkCooldown(lastInvitedAt: string | null) {
  if (!lastInvitedAt) return { canResend: true, hoursLeft: 0 }
  const elapsed = Date.now() - new Date(lastInvitedAt).getTime()
  if (elapsed >= RESEND_COOLDOWN_MS) return { canResend: true, hoursLeft: 0 }
  const hoursLeft = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / (60 * 60 * 1000))
  return { canResend: false, hoursLeft }
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
