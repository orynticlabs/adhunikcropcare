import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"

/* ── In-process cache (survives across requests in the same worker) ── */
const MAX_CACHE_SIZE = 5_000
const cache = new Map<string, { city: string; state: string }>()

function cacheSet(pincode: string, data: { city: string; state: string }) {
  if (cache.size >= MAX_CACHE_SIZE) {
    // Evict the oldest entry
    const firstKey = cache.keys().next().value
    if (firstKey !== undefined) cache.delete(firstKey)
  }
  cache.set(pincode, data)
}

/* ── Fetch helpers ─────────────────────────────────────────────────── */
const CDN_HEADERS = {
  "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000",
}

/** Fetch with a hard timeout so slow APIs never block us. */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal, next: { revalidate: 604800 } })
  } finally {
    clearTimeout(timer)
  }
}

/** Primary source: api.postalpincode.in */
async function fromPostalPincode(pincode: string): Promise<{ city: string; state: string } | null> {
  try {
    const response = await fetchWithTimeout(`https://api.postalpincode.in/pincode/${pincode}`, 4_000)
    const [result] = (await response.json()) as {
      Status?: string
      PostOffice?: { District?: string; Block?: string; Name?: string; State?: string }[]
    }[]
    const office = result?.PostOffice?.[0]
    if (result?.Status !== "Success" || !office?.State) return null
    return {
      city: office.District || office.Block || office.Name || "",
      state: office.State,
    }
  } catch {
    return null
  }
}

/** Fallback source: Postalpincode alternative (pincode.in) */
async function fromPincodeIn(pincode: string): Promise<{ city: string; state: string } | null> {
  try {
    const response = await fetchWithTimeout(
      `https://pincode.p.rapidapi.com/?pincode=${pincode}`,
      4_000
    )
    if (!response.ok) return null
    const json = (await response.json()) as { districtName?: string; stateName?: string }[]
    const record = Array.isArray(json) ? json[0] : (json as { districtName?: string; stateName?: string })
    if (!record?.stateName) return null
    return {
      city: record.districtName || "",
      state: record.stateName,
    }
  } catch {
    return null
  }
}

/** Second fallback: India Post official data (via open government API) */
async function fromIndiaPostOfficial(pincode: string): Promise<{ city: string; state: string } | null> {
  try {
    const response = await fetchWithTimeout(
      `https://api.postalpincode.in/pincode/${pincode}`,
      5_000
    )
    if (!response.ok) return null
    const [result] = (await response.json()) as {
      Status?: string
      PostOffice?: { District?: string; Division?: string; Region?: string; Block?: string; Name?: string; State?: string }[]
    }[]
    // Try every post office record, not just the first
    const offices = result?.PostOffice ?? []
    for (const office of offices) {
      if (office.State) {
        return {
          city: office.District || office.Division || office.Region || office.Block || office.Name || "",
          state: office.State,
        }
      }
    }
    return null
  } catch {
    return null
  }
}

/* ── Route handler ─────────────────────────────────────────────────── */
export async function GET(request: NextRequest) {
  const { allowed } = await checkRateLimit("pincode-lookup", 60, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: { message: "Too many requests. Please wait a moment." } },
      { status: 429 }
    )
  }

  const pincode = request.nextUrl.searchParams.get("pincode")?.replace(/\D/g, "").slice(0, 6) ?? ""
  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json(
      { success: false, error: { message: "Enter a valid 6-digit pincode." } },
      { status: 400 }
    )
  }

  /* Serve from in-process cache instantly */
  const cached = cache.get(pincode)
  if (cached) {
    return NextResponse.json({ success: true, data: cached }, { headers: CDN_HEADERS })
  }

  /* Race primary and secondary sources; use the first successful result */
  const data = await Promise.any([
    fromPostalPincode(pincode),
    fromIndiaPostOfficial(pincode),
  ]).then((result) => result ?? null).catch(() => null)

  if (!data || !data.state) {
    /* Last-resort serial attempt at the fallback if the race gave nothing */
    const fallback = await fromPincodeIn(pincode)
    if (fallback?.state) {
      cacheSet(pincode, fallback)
      return NextResponse.json({ success: true, data: fallback }, { headers: CDN_HEADERS })
    }
    return NextResponse.json(
      { success: false, error: { message: "We could not find this pincode. Please check and try again." } },
      { status: 404 }
    )
  }

  cacheSet(pincode, data)
  return NextResponse.json({ success: true, data }, { headers: CDN_HEADERS })
}
