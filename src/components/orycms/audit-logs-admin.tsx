"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Clock, Eye, FileText, Filter, RefreshCw, Search, ShieldCheck, User } from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { OryCMSSelect } from "@/components/orycms/custom-select"
import { Skeleton } from "../../../orycms/components/ui/skeleton"
import { cn } from "@/lib/utils"


type AuditLogItem = {
  action: string
  adminEmail: string | null
  adminId: string | null
  createdAt: string
  details: Record<string, unknown> | null
  id: string
  ipAddress: string | null
  targetUserId: string | null
}

const ACTION_OPTIONS = [
  { label: "All Actions", value: "all" },
  { label: "Admin Invited", value: "admin_invited" },
  { label: "Password Setup Completed", value: "password_setup_completed" },
  { label: "Status Changed", value: "status_changed" },
  { label: "Admin Locked", value: "admin_locked" },
  { label: "Admin Unlocked", value: "admin_unlocked" },
  { label: "Manual Email Verified", value: "manual_email_verified" },
  { label: "Admin Deleted", value: "admin_deleted" },
  { label: "Created Without Invite", value: "admin_created_without_invitation" },
]

export function OryCMSAuditLogsList({ isModal, onClose }: { isModal?: boolean; onClose?: () => void } = {}) {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0, pageCount: 1 })

  async function loadLogs(showLoader: boolean) {
    if (showLoader) setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set("query", query.trim())
      if (actionFilter !== "all") params.set("action", actionFilter)
      params.set("page", String(page))
      params.set("limit", "50")

      const res = await fetch(`/api/orycms/audit-logs?${params.toString()}`, { cache: "no-store" })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? "Failed to load audit logs.")
      setLogs(Array.isArray(json.data) ? json.data : [])
      if (json.meta) setMeta(json.meta)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs.")
    } finally {
      if (showLoader) setLoading(false)
    }
  }

  useEffect(() => {
    void loadLogs(true)
  }, [page, actionFilter])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    void loadLogs(true)
  }

  const innerContent = (
    <div className="rounded-xl border border-border bg-surface shadow-xs">
      {/* Controls Bar */}
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-muted px-4 py-3">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by actor email, action, target user, or justification…"
            className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-[13px] outline-none focus:border-border-strong"
          />
        </div>
        <OryCMSSelect
          value={actionFilter}
          onChange={(val) => { setActionFilter(val); setPage(1) }}
          options={ACTION_OPTIONS}
          className="w-auto"
        />
        <button type="submit" className="h-9 rounded-lg bg-foreground px-4 text-[12.5px] font-semibold text-background hover:!bg-[#FF5A20] hover:!text-white transition-colors cursor-pointer select-none">
          Search
        </button>
      </form>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left text-[13px]">
          <thead className="border-b border-border bg-surface-muted text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">Action Event</th>
              <th className="px-4 py-3 font-medium">Admin Actor</th>
              <th className="px-4 py-3 font-medium">Target Account</th>
              <th className="px-4 py-3 font-medium">Justification / Reason</th>
              <th className="px-4 py-3 text-right font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="px-4 py-3">
                    <Skeleton className="h-6 w-full rounded-md" />
                  </td>
                </tr>
              ))
            ) : error ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-destructive">{error}</td></tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground/30" strokeWidth={1} />
                  <p className="mt-3 font-medium text-foreground">No audit logs found.</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">Activity logs will appear here when admin actions occur.</p>
                </td>
              </tr>
            ) : logs.map((log) => {
              const details = log.details as Record<string, unknown> | null
              const deletedUser = details?.deletedUser as Record<string, unknown> | undefined
              const targetUser = details?.targetUser as Record<string, unknown> | undefined
              const targetEmail = typeof details?.targetEmail === "string" ? details.targetEmail : typeof deletedUser?.email === "string" ? deletedUser.email : typeof targetUser?.email === "string" ? targetUser.email : "—"
              const justification = typeof details?.justification === "string" ? details.justification : typeof details?.reason === "string" ? details.reason : "—"
              return (
                <tr key={log.id} className="transition-colors hover:!bg-surface-muted/60">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    <div className="font-medium text-foreground">{dateTime(log.createdAt)}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {log.adminEmail || "System"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {targetEmail}
                  </td>
                  <td className="px-4 py-3 text-foreground max-w-xs truncate">
                    <span title={justification}>{justification}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="inline-grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface transition-colors hover:!bg-foreground hover:!text-white cursor-pointer select-none"
                      title="View Full JSON Details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[12px] text-muted-foreground">
        <span>Page {page} of {meta.pageCount} ({meta.total} total records)</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((v) => Math.max(1, v - 1))}
            disabled={page === 1}
            className="h-8 rounded-lg border border-border px-3 font-medium disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer select-none hover:!bg-foreground hover:!text-white transition-colors"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((v) => Math.min(meta.pageCount, v + 1))}
            disabled={page === meta.pageCount}
            className="h-8 rounded-lg border border-border px-3 font-medium disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer select-none hover:!bg-foreground hover:!text-white transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )

  const jsonDetailsModal = selectedLog ? (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background/85 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="mx-4 max-h-[90vh] w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-white text-foreground shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-border bg-white px-5 py-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Audit Log Details</span>
            <h2 className="text-[16px] font-semibold mt-0.5">{label(selectedLog.action)}</h2>
          </div>
          <button type="button" onClick={() => setSelectedLog(null)} className="grid h-8 w-8 place-items-center rounded-lg text-[18px] text-muted-foreground transition-colors hover:!bg-surface-muted hover:!text-foreground cursor-pointer select-none">×</button>
        </div>
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto bg-white p-5 space-y-4 text-[13px]">
          <div className="grid gap-3 sm:grid-cols-2 bg-surface-muted/50 p-3.5 rounded-xl border border-border">
            <div><span className="text-muted-foreground block text-[11px] font-semibold">Admin Actor</span><span className="font-medium text-foreground">{selectedLog.adminEmail || "System"}</span></div>
            <div><span className="text-muted-foreground block text-[11px] font-semibold">Timestamp</span><span className="font-medium text-foreground">{dateTime(selectedLog.createdAt)}</span></div>
            <div><span className="text-muted-foreground block text-[11px] font-semibold">IP Address</span><span className="font-mono text-foreground text-[12px]">{selectedLog.ipAddress || "Internal"}</span></div>
            <div><span className="text-muted-foreground block text-[11px] font-semibold">Log ID</span><span className="font-mono text-foreground text-[11px] truncate block">{selectedLog.id}</span></div>
          </div>

          <div>
            <span className="text-[12px] font-semibold text-foreground block mb-2">Structured Metadata Payload (JSON)</span>
            <pre className="rounded-xl border border-border bg-slate-950 p-4 font-mono text-[12px] leading-relaxed text-emerald-400 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(selectedLog.details || {}, null, 2)}
            </pre>
          </div>

          <div className="flex justify-end pt-2">
            <button type="button" onClick={() => setSelectedLog(null)} className="h-9 rounded-lg bg-foreground px-4 text-[12.5px] font-semibold text-background hover:!bg-[#FF5A20] hover:!text-white transition-colors cursor-pointer select-none">
              Close Payload
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[90] grid place-items-center bg-background/85 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
        <div className="mx-4 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-white text-foreground shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:mx-auto">
          <div className="flex items-center justify-between gap-4 border-b border-border bg-white px-5 py-4">
            <div>
              <h2 className="text-[16px] font-semibold">Audit Logs</h2>
              <p className="text-[11.5px] text-muted-foreground">Complete security and activity audit trail for OryCMS administration.</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => void loadLogs(true)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[12px] font-medium text-foreground hover:!bg-foreground hover:!text-white cursor-pointer select-none">
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
              </button>
              <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-[18px] text-muted-foreground transition-colors hover:!bg-surface-muted hover:!text-foreground cursor-pointer select-none">×</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-white p-5">
            {innerContent}
          </div>
        </div>
        {jsonDetailsModal}
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-6 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/audit-logs", label: "Audit Logs" }]} />
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">Audit Logs</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
            Complete security and activity audit trail for OryCMS administration, invitations, status changes, and freezes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/users" className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-[12.5px] font-medium text-foreground hover:!bg-foreground hover:!text-white transition-colors cursor-pointer select-none">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Users
          </Link>
          <button type="button" onClick={() => void loadLogs(true)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-[12.5px] font-semibold text-background hover:!bg-[#FF5A20] hover:!text-white transition-colors cursor-pointer select-none">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
          </button>
        </div>
      </div>

      {innerContent}
      {jsonDetailsModal}
    </section>
  )
}

function ActionBadge({ action }: { action: string }) {
  if (action.includes("locked")) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11.5px] font-semibold text-red-700">Admin Locked</span>
  }
  if (action.includes("unlocked")) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11.5px] font-semibold text-emerald-700">Admin Unlocked</span>
  }
  if (action.includes("invited")) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-[#FF5A20]/10 px-2.5 py-1 text-[11.5px] font-semibold text-[#FF5A20] border border-[#FF5A20]/30">Invitation Sent</span>
  }
  if (action.includes("completed")) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11.5px] font-semibold text-emerald-700">Password Setup Done</span>
  }
  if (action.includes("deleted")) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11.5px] font-semibold text-rose-700">Admin Soft Deleted</span>
  }
  if (action.includes("status")) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11.5px] font-semibold text-amber-800">Status Changed</span>
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-medium text-slate-700">{label(action)}</span>
}

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function dateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}
