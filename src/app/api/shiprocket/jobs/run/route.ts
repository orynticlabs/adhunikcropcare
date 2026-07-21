import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import crypto from "crypto"
import { runDueJobs } from "@/lib/shiprocket/job-runner"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * Processes the Shiprocket job queue. Driven by an external scheduler (Vercel Cron
 * or cron-job.org). Authenticated by SHIPROCKET_CRON_TOKEN via Authorization: Bearer
 * or x-api-key. Vercel Cron sends its own Authorization header, so we also accept
 * CRON_SECRET when present.
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid cron token." } }, { status: 401 })
  }
  return run(request)
}

// Vercel Cron issues GET requests, so support both verbs.
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid cron token." } }, { status: 401 })
  }
  return run(request)
}

async function run(request: NextRequest) {
  const limitParam = Number(new URL(request.url).searchParams.get("limit") ?? "10")
  const limit = Number.isFinite(limitParam) ? limitParam : 10
  try {
    const summary = await runDueJobs(limit)
    return NextResponse.json({ success: true, data: summary })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "JOB_RUN_ERROR", message: error instanceof Error ? error.message : "Job run failed." } },
      { status: 500 },
    )
  }
}

function isAuthorized(request: NextRequest): boolean {
  const token = process.env.SHIPROCKET_CRON_TOKEN
  const cronSecret = process.env.CRON_SECRET
  const auth = request.headers.get("authorization") ?? ""
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  const apiKey = request.headers.get("x-api-key") ?? ""

  const candidates = [bearer, apiKey].filter(Boolean)
  const secrets = [token, cronSecret].filter((value): value is string => Boolean(value))
  if (secrets.length === 0) return false
  return candidates.some((candidate) => secrets.some((secret) => safeEqual(candidate, secret)))
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)
}
