"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, AlertTriangle, CheckCircle2, Database, RefreshCw, Search, Server, Table2, XCircle } from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { OryCMSSelect } from "@/components/orycms/custom-select"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

type Health = "Healthy" | "Warning" | "Critical"
type DatabaseHealth = {
  connected: boolean
  database: { databaseName: string; host: string; provider: string; type: string; uptime: string; version: string }
  health: Health
  lastSuccessfulConnection: string | null
  logs: DatabaseLog[]
  metrics: {
    activeConnections: number
    connectionPoolUsage: number
    connectionStatus: "Connected" | "Disconnected"
    databaseSize: string
    responseTimeMs: number
    totalRecords: number
    totalTables: number
  }
  recentIssues: DatabaseLog[]
  syncedAt: string
  tables: DatabaseTable[]
}
type DatabaseTable = { lastUpdated: string | null; size: string; status: "Healthy" | "Warning"; tableName: string; totalRows: number }
type DatabaseLog = { message: string; severity: "info" | "warning" | "error"; source: string; timestamp: string }

export function OryCMSDatabaseDashboard() {
  const [data, setData] = useState<DatabaseHealth | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [logFilter, setLogFilter] = useState("all")
  const [logPage, setLogPage] = useState(1)
  const [query, setQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [tablePage, setTablePage] = useState(1)
  const [tableStatus, setTableStatus] = useState("all")

  useEffect(() => {
    void loadHealth(true)
    const interval = window.setInterval(() => void loadHealth(false), 15000)
    return () => window.clearInterval(interval)
  }, [])

  async function loadHealth(showLoader: boolean) {
    if (showLoader) setLoading(true)
    setRefreshing(true)
    setError("")
    try {
      const json = await fetch("/api/orycms/database/health", { cache: "no-store" }).then((response) => response.json())
      if (!json.success) throw new Error(json.error?.message ?? "Failed to load database health.")
      setData(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load database health.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const tableMatches = useMemo(() => {
    const search = query.trim().toLowerCase()
    return (data?.tables ?? []).filter((table) => {
      const matchesSearch = !search || table.tableName.toLowerCase().includes(search)
      const matchesStatus = tableStatus === "all" || table.status === tableStatus
      return matchesSearch && matchesStatus
    })
  }, [data?.tables, query, tableStatus])

  const logs = useMemo(() => {
    const search = query.trim().toLowerCase()
    return (data?.logs ?? []).filter((log) => {
      const matchesSearch = !search || [log.message, log.source, log.severity].join(" ").toLowerCase().includes(search)
      const matchesSource = logFilter === "all" || log.source === logFilter || log.severity === logFilter
      return matchesSearch && matchesSource
    })
  }, [data?.logs, logFilter, query])

  const tablePageCount = Math.max(1, Math.ceil(tableMatches.length / PAGE_SIZE))
  const logPageCount = Math.max(1, Math.ceil(logs.length / PAGE_SIZE))
  const pagedTables = tableMatches.slice((tablePage - 1) * PAGE_SIZE, tablePage * PAGE_SIZE)
  const pagedLogs = logs.slice((logPage - 1) * PAGE_SIZE, logPage * PAGE_SIZE)

  useEffect(() => {
    setTablePage(1)
    setLogPage(1)
  }, [logFilter, query, tableStatus])

  const health = data?.health ?? "Critical"

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-6 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/database", label: "Database" }]} />
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">Database</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
            Monitor the active OryCMS database connection, table health, query signals, and provider-managed logs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-lg border border-border bg-surface px-3 py-2 text-[12.5px] text-muted-foreground">
            Last sync: <span className="font-medium text-foreground">{data?.syncedAt ? dateTime(data.syncedAt) : "—"}</span>
          </span>
          <button type="button" onClick={() => void loadHealth(false)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:bg-accent">
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">{error}</div> : null}
      {data?.recentIssues.length ? <HealthNotice issues={data.recentIssues} /> : null}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Database Health</p>
              <h2 className={cn("mt-2 text-3xl font-semibold tracking-tight", healthColor(health))}>{health}</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">{data?.database.type ?? "Database"} · {data?.database.provider ?? "Unknown provider"}</p>
            </div>
            <StatusIcon health={health} />
          </div>
          <div className="mt-5 grid gap-3 text-[13px]">
            <Info label="Connection" value={data?.metrics.connectionStatus ?? "Disconnected"} />
            <Info label="Host" value={data?.database.host ?? "—"} />
            <Info label="Database" value={data?.database.databaseName ?? "—"} />
            <Info label="Version" value={shortVersion(data?.database.version)} />
            <Info label="Uptime" value={data?.database.uptime ?? "—"} />
            <Info label="Last successful connection" value={data?.lastSuccessfulConnection ? dateTime(data.lastSuccessfulConnection) : "—"} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Activity} label="Active Connections" value={String(data?.metrics.activeConnections ?? "—")} />
          <Metric icon={Server} label="Pool Usage" value={`${data?.metrics.connectionPoolUsage ?? 0}%`} />
          <Metric icon={RefreshCw} label="Response Time" value={`${data?.metrics.responseTimeMs ?? 0}ms`} />
          <Metric icon={Database} label="Database Size" value={data?.metrics.databaseSize ?? "—"} />
          <Metric icon={Table2} label="Total Tables" value={String(data?.metrics.totalTables ?? "—")} />
          <Metric icon={Database} label="Total Records" value={compactNumber(data?.metrics.totalRecords ?? 0)} />
          <Metric icon={CheckCircle2} label="Live Indicator" value={data?.connected ? "Connected" : "Disconnected"} tone={data?.connected ? "success" : "error"} />
          <Metric icon={AlertTriangle} label="Warnings" value={String(data?.recentIssues.length ?? 0)} tone={data?.recentIssues.length ? "warning" : "success"} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-xs">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-muted px-4 py-3">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tables or logs…" className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-[13px] outline-none focus:border-border-strong" />
          </div>
          <OryCMSSelect
            value={tableStatus}
            onChange={(val) => setTableStatus(val)}
            options={[
              { label: "All table status", value: "all" },
              { label: "Healthy", value: "Healthy" },
              { label: "Warning", value: "Warning" },
            ]}
            className="w-auto"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead className="border-b border-border bg-surface-muted text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Table Name</th>
                <th className="px-4 py-3 font-medium">Total Rows</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Last Updated</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Loading database tables…</td></tr>
              ) : pagedTables.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No tables found.</td></tr>
              ) : pagedTables.map((table) => (
                <tr key={table.tableName} className="transition-colors hover:bg-surface-muted/60">
                  <td className="px-4 py-3 font-medium">{table.tableName}</td>
                  <td className="px-4 py-3">{compactNumber(table.totalRows)}</td>
                  <td className="px-4 py-3">{table.size}</td>
                  <td className="px-4 py-3 text-muted-foreground">{table.lastUpdated ? dateTime(table.lastUpdated) : "Provider estimated"}</td>
                  <td className="px-4 py-3"><Badge value={table.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={tablePage} pageCount={tablePageCount} setPage={setTablePage} />
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-muted px-4 py-3">
          <div>
            <h2 className="text-[14px] font-semibold">Database Logs</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Connection logs, query signals, errors, slow queries, failed queries, migrations, and backup notes.</p>
          </div>
          <OryCMSSelect
            value={logFilter}
            onChange={(val) => setLogFilter(val)}
            options={[
              { label: "All logs", value: "all" },
              { label: "Connection Logs", value: "connection" },
              { label: "Query Logs", value: "query" },
              { label: "Error Logs", value: "error" },
              { label: "Slow Queries", value: "slow-query" },
              { label: "Failed Queries", value: "failed-query" },
              { label: "Migrations", value: "migration" },
              { label: "Backup Logs", value: "backup" },
              { label: "Warnings", value: "warning" },
            ]}
            className="w-auto"
          />
        </div>
        <div className="divide-y divide-border">
          {pagedLogs.length === 0 ? (
            <div className="px-4 py-10 text-center text-[13px] text-muted-foreground">No logs match the current filter.</div>
          ) : pagedLogs.map((log, index) => (
            <div key={`${log.timestamp}-${index}`} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 text-[13px]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge value={sourceLabel(log.source)} tone={log.severity} />
                  <span className={cn("font-medium", log.severity === "error" && "text-destructive", log.severity === "warning" && "text-warning")}>{log.message}</span>
                </div>
                <p className="mt-1 text-[12px] text-muted-foreground">{dateTime(log.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
        <Pager page={logPage} pageCount={logPageCount} setPage={setLogPage} />
      </div>
    </section>
  )
}

function HealthNotice({ issues }: { issues: DatabaseLog[] }) {
  return (
    <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-[13px] text-foreground">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
        <div>
          <p className="font-semibold">Database health notification</p>
          <p className="mt-1 text-muted-foreground">{issues[0]?.message ?? "Database needs attention."}</p>
        </div>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, tone = "default", value }: { icon: React.ElementType; label: string; tone?: "default" | "success" | "warning" | "error"; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] text-muted-foreground">{label}</span>
        <Icon className={cn("h-4 w-4", tone === "success" && "text-success", tone === "warning" && "text-warning", tone === "error" && "text-destructive")} />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value}</span></div>
}

function Badge({ tone, value }: { tone?: "info" | "warning" | "error"; value: string }) {
  return <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-medium", value === "Healthy" || tone === "info" ? "bg-success/10 text-success" : "", value === "Warning" || tone === "warning" ? "bg-warning/10 text-warning" : "", tone === "error" ? "bg-destructive/10 text-destructive" : "")}>{value}</span>
}

function StatusIcon({ health }: { health: Health }) {
  if (health === "Healthy") return <CheckCircle2 className="h-8 w-8 text-success" />
  if (health === "Warning") return <AlertTriangle className="h-8 w-8 text-warning" />
  return <XCircle className="h-8 w-8 text-destructive" />
}

function Pager({ page, pageCount, setPage }: { page: number; pageCount: number; setPage: (page: number | ((page: number) => number)) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[12px] text-muted-foreground">
      <span>Page {page} of {pageCount}</span>
      <div className="flex gap-2">
        <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="h-8 rounded-lg border border-border px-3 font-medium disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
        <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={page === pageCount} className="h-8 rounded-lg border border-border px-3 font-medium disabled:cursor-not-allowed disabled:opacity-50">Next</button>
      </div>
    </div>
  )
}

function healthColor(health: Health) {
  if (health === "Healthy") return "text-success"
  if (health === "Warning") return "text-warning"
  return "text-destructive"
}

function sourceLabel(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function shortVersion(value?: string) {
  if (!value) return "—"
  return value.split(" on ")[0] ?? value
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en-IN", { notation: value > 9999 ? "compact" : "standard" }).format(value)
}

function dateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}
