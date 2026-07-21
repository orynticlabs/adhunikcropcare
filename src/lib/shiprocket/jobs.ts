import "server-only"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export type ShiprocketJobType =
  | "create_shipment"
  | "sync_tracking"
  | "schedule_pickup"
  | "send_notification"
  | "fetch_documents"

export type ShiprocketJobRow = {
  id: string
  type: ShiprocketJobType
  order_id: string | null
  shipment_id: string | null
  payload: Record<string, unknown>
  status: string
  attempts: number
  max_attempts: number
  run_after: Date | string
  last_error: string | null
  last_error_code: string | null
  dedupe_key: string | null
}

const JOB_SELECT = `
  id, type, order_id, shipment_id, payload, status, attempts, max_attempts, run_after,
  last_error, last_error_code, dedupe_key
`

type EnqueueInput = {
  type: ShiprocketJobType
  orderId?: string | null
  shipmentId?: string | null
  payload?: Record<string, unknown>
  dedupeKey?: string | null
  runAfter?: Date | null
  maxAttempts?: number
}

/**
 * Enqueues a job. When a dedupeKey is supplied, a duplicate enqueue is a no-op
 * (idempotency) — this is how webhooks and bulk actions avoid double-processing.
 * Returns the job id, or null when the insert was deduped away.
 */
export async function enqueueJob(input: EnqueueInput): Promise<string | null> {
  const rows = await orycmsPrisma.$queryRawUnsafe<{ id: string }[]>(
    `INSERT INTO shiprocket_jobs (type, order_id, shipment_id, payload, dedupe_key, run_after, max_attempts)
     VALUES ($1, $2::uuid, $3::uuid, $4::jsonb, $5, COALESCE($6::timestamptz, now()), COALESCE($7, 5))
     ON CONFLICT (dedupe_key) DO NOTHING
     RETURNING id`,
    input.type,
    input.orderId ?? null,
    input.shipmentId ?? null,
    JSON.stringify(input.payload ?? {}),
    input.dedupeKey ?? null,
    input.runAfter ? input.runAfter.toISOString() : null,
    input.maxAttempts ?? null,
  )
  return rows[0]?.id ?? null
}

/**
 * Atomically claims up to `limit` due jobs, marking them running. Uses
 * FOR UPDATE SKIP LOCKED so concurrent runners never grab the same job.
 * Also reclaims jobs stuck in `running` past `staleMinutes` (a crashed runner).
 */
export async function claimDueJobs(limit: number, staleMinutes = 10): Promise<ShiprocketJobRow[]> {
  return orycmsPrisma.$queryRawUnsafe<ShiprocketJobRow[]>(
    `UPDATE shiprocket_jobs SET status = 'running', locked_at = now(), updated_at = now()
     WHERE id IN (
       SELECT id FROM shiprocket_jobs
       WHERE (status = 'pending' AND run_after <= now())
          OR (status = 'running' AND locked_at < now() - ($2 || ' minutes')::interval)
       ORDER BY run_after ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING ${JOB_SELECT}`,
    Math.max(1, Math.min(50, limit)),
    String(Math.max(1, staleMinutes)),
  )
}

export async function markJobSucceeded(id: string): Promise<void> {
  await orycmsPrisma.$executeRawUnsafe(
    `UPDATE shiprocket_jobs SET status = 'succeeded', locked_at = NULL, updated_at = now() WHERE id = $1::uuid`,
    id,
  )
}

/**
 * Records a failed attempt. Reschedules with exponential backoff while attempts
 * remain, otherwise marks the job `dead` (dead-letter) for manual retry.
 */
export async function markJobFailed(job: ShiprocketJobRow, error: unknown): Promise<void> {
  const attempts = job.attempts + 1
  const message = error instanceof Error ? error.message : String(error)
  const code = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code ?? "") : null
  const exhausted = attempts >= job.max_attempts
  const backoffSeconds = Math.min(3600, 30 * 2 ** (attempts - 1))

  await orycmsPrisma.$executeRawUnsafe(
    `UPDATE shiprocket_jobs SET
       status = $2,
       attempts = $3,
       last_error = $4,
       last_error_code = $5,
       locked_at = NULL,
       run_after = CASE WHEN $2 = 'pending' THEN now() + ($6 || ' seconds')::interval ELSE run_after END,
       updated_at = now()
     WHERE id = $1::uuid`,
    job.id,
    exhausted ? "dead" : "pending",
    attempts,
    message.slice(0, 1000),
    code,
    String(backoffSeconds),
  )
}

export async function retryDeadJob(id: string): Promise<void> {
  await orycmsPrisma.$executeRawUnsafe(
    `UPDATE shiprocket_jobs SET status = 'pending', run_after = now(), locked_at = NULL, updated_at = now()
     WHERE id = $1::uuid AND status IN ('dead', 'failed')`,
    id,
  )
}
