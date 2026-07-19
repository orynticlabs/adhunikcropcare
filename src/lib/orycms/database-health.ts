import { ORYCMS_DATABASE_URL } from "@/lib/orycms/config"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export type DatabaseHealthDTO = {
  connected: boolean
  database: {
    databaseName: string
    host: string
    provider: string
    type: string
    uptime: string
    version: string
  }
  health: "Healthy" | "Warning" | "Critical"
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
  tables: DatabaseTableHealth[]
}

export type DatabaseLog = {
  message: string
  severity: "info" | "warning" | "error"
  source: "connection" | "query" | "error" | "slow-query" | "failed-query" | "migration" | "backup"
  timestamp: string
}

export type DatabaseTableHealth = {
  lastUpdated: string | null
  size: string
  status: "Healthy" | "Warning"
  tableName: string
  totalRows: number
}

type OverviewRow = {
  active_connections: bigint | number | string
  database_name: string
  database_size: string
  host: string | null
  max_connections: string
  postmaster_started_at: Date | string | null
  version: string
}

type CountRow = { total_records: bigint | number | string; total_tables: bigint | number | string }

type TableRow = {
  last_updated: Date | string | null
  size: string
  table_name: string
  total_rows: bigint | number | string
}

type MigrationRow = {
  finished_at: Date | string | null
  migration_name: string
  started_at: Date | string | null
}

type ActivityRow = {
  age_ms: number | string | null
  query: string | null
  state: string | null
  wait_event: string | null
}

export async function getOryCMSDatabaseHealth(): Promise<DatabaseHealthDTO> {
  const started = performance.now()
  const syncedAt = new Date().toISOString()
  const info = parseDatabaseUrl()

  try {
    const [overview] = await orycmsPrisma.$queryRaw<OverviewRow[]>`
      SELECT current_database() AS database_name,
             inet_server_addr()::text AS host,
             version() AS version,
             pg_size_pretty(pg_database_size(current_database())) AS database_size,
             pg_postmaster_start_time() AS postmaster_started_at,
             current_setting('max_connections') AS max_connections,
             (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) AS active_connections
    `
    const [counts] = await orycmsPrisma.$queryRaw<CountRow[]>`
      SELECT count(*) AS total_tables,
             COALESCE(sum(s.n_live_tup), 0) AS total_records
      FROM pg_stat_user_tables s
    `
    const tables = await orycmsPrisma.$queryRaw<TableRow[]>`
      SELECT relname AS table_name,
             n_live_tup AS total_rows,
             pg_size_pretty(pg_total_relation_size(relid)) AS size,
             GREATEST(last_vacuum, last_autovacuum, last_analyze, last_autoanalyze) AS last_updated
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(relid) DESC, relname ASC
    `
    const activity = await orycmsPrisma.$queryRaw<ActivityRow[]>`
      SELECT state,
             wait_event,
             query,
             EXTRACT(MILLISECOND FROM now() - query_start) AS age_ms
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND pid <> pg_backend_pid()
        AND query IS NOT NULL
      ORDER BY query_start DESC
      LIMIT 8
    `
    const migrations = await loadMigrations()
    const responseTimeMs = Math.round(performance.now() - started)
    const activeConnections = Number(overview.active_connections ?? 0)
    const maxConnections = Number(overview.max_connections ?? 0) || 1
    const poolUsage = Math.round((activeConnections / maxConnections) * 100)
    const tableCount = Number(counts.total_tables ?? tables.length)
    const totalRecords = Number(counts.total_records ?? 0)
    const health = responseTimeMs > 1500 || poolUsage > 85 ? "Warning" : "Healthy"
    const logs = buildLogs({ activity, health, migrations, poolUsage, responseTimeMs, syncedAt })

    return {
      connected: true,
      database: {
        databaseName: overview.database_name || info.databaseName,
        host: overview.host || info.host,
        provider: info.provider,
        type: info.type,
        uptime: formatDuration(overview.postmaster_started_at),
        version: overview.version,
      },
      health,
      lastSuccessfulConnection: syncedAt,
      logs,
      metrics: {
        activeConnections,
        connectionPoolUsage: poolUsage,
        connectionStatus: "Connected",
        databaseSize: overview.database_size,
        responseTimeMs,
        totalRecords,
        totalTables: tableCount,
      },
      recentIssues: logs.filter((log) => log.severity !== "info"),
      syncedAt,
      tables: tables.map((table) => ({
        lastUpdated: iso(table.last_updated),
        size: table.size,
        status: Number(table.total_rows ?? 0) >= 0 ? "Healthy" : "Warning",
        tableName: table.table_name,
        totalRows: Number(table.total_rows ?? 0),
      })),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database connection failed."
    const issue: DatabaseLog = { message, severity: "error", source: "connection", timestamp: syncedAt }
    return {
      connected: false,
      database: { databaseName: info.databaseName, host: info.host, provider: info.provider, type: info.type, uptime: "—", version: "Unavailable" },
      health: "Critical",
      lastSuccessfulConnection: null,
      logs: [issue],
      metrics: {
        activeConnections: 0,
        connectionPoolUsage: 0,
        connectionStatus: "Disconnected",
        databaseSize: "—",
        responseTimeMs: Math.round(performance.now() - started),
        totalRecords: 0,
        totalTables: 0,
      },
      recentIssues: [issue],
      syncedAt,
      tables: [],
    }
  }
}

async function loadMigrations() {
  try {
    return await orycmsPrisma.$queryRaw<MigrationRow[]>`
      SELECT migration_name, started_at, finished_at
      FROM _prisma_migrations
      ORDER BY started_at DESC
      LIMIT 8
    `
  } catch {
    return []
  }
}

function buildLogs(input: {
  activity: ActivityRow[]
  health: "Healthy" | "Warning" | "Critical"
  migrations: MigrationRow[]
  poolUsage: number
  responseTimeMs: number
  syncedAt: string
}): DatabaseLog[] {
  const logs: DatabaseLog[] = [
    { message: "Database connection check completed.", severity: input.health === "Healthy" ? "info" : "warning", source: "connection", timestamp: input.syncedAt },
    { message: `Response time ${input.responseTimeMs}ms.`, severity: input.responseTimeMs > 1500 ? "warning" : "info", source: "query", timestamp: input.syncedAt },
    { message: `Connection pool usage ${input.poolUsage}%.`, severity: input.poolUsage > 85 ? "warning" : "info", source: "connection", timestamp: input.syncedAt },
    { message: "Server-side PostgreSQL error logs are provider-managed and not exposed through this connection.", severity: "info", source: "error", timestamp: input.syncedAt },
    { message: "Backup logs are provider-managed. Check Neon backups/restore dashboard for physical backup events.", severity: "info", source: "backup", timestamp: input.syncedAt },
  ]

  input.activity.forEach((item) => {
    const age = Math.round(Number(item.age_ms ?? 0))
    if (age > 1000) {
      logs.push({ message: `${age}ms ${cleanQuery(item.query)}`, severity: "warning", source: "slow-query", timestamp: input.syncedAt })
    } else if (item.state) {
      logs.push({ message: `${item.state}${item.wait_event ? ` · ${item.wait_event}` : ""}`, severity: "info", source: "query", timestamp: input.syncedAt })
    }
  })

  input.migrations.forEach((migration) => {
    logs.push({
      message: migration.finished_at ? `Migration completed: ${migration.migration_name}` : `Migration pending/running: ${migration.migration_name}`,
      severity: migration.finished_at ? "info" : "warning",
      source: "migration",
      timestamp: iso(migration.finished_at ?? migration.started_at) ?? input.syncedAt,
    })
  })

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

function parseDatabaseUrl() {
  const raw = ORYCMS_DATABASE_URL ?? process.env.DATABASE_URL ?? ""
  try {
    const url = new URL(raw)
    const protocol = url.protocol.replace(":", "")
    return {
      databaseName: url.pathname.replace("/", "") || "—",
      host: url.hostname || "—",
      provider: raw.includes("neon.tech") ? "Neon" : protocol || "Unknown",
      type: protocol.startsWith("postgres") ? "PostgreSQL" : protocol.startsWith("mysql") ? "MySQL" : protocol.startsWith("mongodb") ? "MongoDB" : protocol || "Unknown",
    }
  } catch {
    return { databaseName: "—", host: "—", provider: "Unknown", type: "Unknown" }
  }
}

function formatDuration(value: unknown) {
  const date = value instanceof Date ? value : value ? new Date(String(value)) : null
  if (!date || Number.isNaN(date.getTime())) return "—"
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return [days ? `${days}d` : "", hours ? `${hours}h` : "", `${minutes}m`].filter(Boolean).join(" ")
}

function cleanQuery(query: string | null) {
  if (!query) return "query running"
  return query.replace(/\s+/g, " ").trim().slice(0, 140)
}

function iso(value: unknown) {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : String(value)
}
