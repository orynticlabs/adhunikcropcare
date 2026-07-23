import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const cache = new Map<string, { city: string; state: string }>()

export async function GET(request: NextRequest) {
  const pincode = request.nextUrl.searchParams.get("pincode")?.replace(/\D/g, "").slice(0, 6) ?? ""
  if (!/^\d{6}$/.test(pincode)) return NextResponse.json({ success: false, error: { message: "Enter a valid 6-digit pincode." } }, { status: 400 })
  const cached = cache.get(pincode)
  if (cached) return NextResponse.json({ success: true, data: cached })
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, { next: { revalidate: 86400 } })
    const [result] = await response.json() as { Status?: string; PostOffice?: { District?: string; Block?: string; Name?: string; State?: string }[] }[]
    const office = result?.PostOffice?.[0]
    if (result?.Status !== "Success" || !office?.State) throw new Error()
    const data = { city: office.District || office.Block || office.Name || "", state: office.State }
    cache.set(pincode, data)
    return NextResponse.json({ success: true, data })
  } catch { return NextResponse.json({ success: false, error: { message: "We could not find this pincode." } }, { status: 404 }) }
}
