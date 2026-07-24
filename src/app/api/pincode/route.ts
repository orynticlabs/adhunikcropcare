import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"

const cache = new Map<string, { city: string; state: string }>()

export async function GET(request: NextRequest) {
  const { allowed } = await checkRateLimit("pincode-lookup", 30, 60_000)
  if (!allowed) {
    return NextResponse.json({ success: false, error: { message: "Too many requests. Please wait." } }, { status: 429 })
  }

  const pincode = request.nextUrl.searchParams.get("pincode")?.replace(/\D/g, "").slice(0, 6) ?? ""
  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ success: false, error: { message: "Enter a valid 6-digit pincode." } }, { status: 400 })
  }

  const cached = cache.get(pincode)
  if (cached) {
    return NextResponse.json(
      { success: true, data: cached },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } }
    )
  }

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, { next: { revalidate: 86400 } })
    const [result] = (await response.json()) as {
      Status?: string
      PostOffice?: { District?: string; Block?: string; Name?: string; State?: string }[]
    }[]
    const office = result?.PostOffice?.[0]
    if (result?.Status !== "Success" || !office?.State) throw new Error()

    const data = { city: office.District || office.Block || office.Name || "", state: office.State }
    cache.set(pincode, data)

    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } }
    )
  } catch {
    return NextResponse.json({ success: false, error: { message: "We could not find this pincode." } }, { status: 404 })
  }
}
