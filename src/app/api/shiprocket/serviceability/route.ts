import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { checkServiceability, ShiprocketError } from "@/lib/shiprocket/client"
import { getShiprocketSettings } from "@/lib/shiprocket/settings"

export const runtime = "nodejs"

// Public product-page serviceability check. Lives under /api/shiprocket/ (not
// /api/orycms/) so it bypasses admin auth. Lightweight in-memory cache avoids
// hammering Shiprocket for repeat pincode lookups.
type CacheEntry = { at: number; data: unknown }
const cache = new Map<string, CacheEntry>()
const CACHE_MS = 5 * 60 * 1000

export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams
  const pincode = (params.get("pincode") ?? "").replace(/\D/g, "").slice(0, 6)
  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "Enter a valid 6-digit pincode." } }, { status: 400 })
  }

  const cached = cache.get(pincode)
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return NextResponse.json({ success: true, data: cached.data })
  }

  try {
    const settings = await getShiprocketSettings()
    if (!settings?.enabled || !settings.pickupPincode) {
      return NextResponse.json({ success: true, data: { serviceable: false, reason: "unconfigured", couriers: [] } })
    }

    const weightParam = Number(params.get("weight"))
    const weight = Number.isFinite(weightParam) && weightParam > 0 ? weightParam : Number(settings.packageWeightKg) || 0.5

    const response = await checkServiceability({
      pickupPincode: settings.pickupPincode,
      deliveryPincode: pincode,
      weight,
      cod: true,
    })

    const couriers = response.data?.available_courier_companies ?? []
    const codAvailable = couriers.some((courier) => Number(courier.cod) === 1)
    // Pick the soonest ETD to surface as the headline estimate.
    const sorted = [...couriers].sort((a, b) => Number(a.estimated_delivery_days || 99) - Number(b.estimated_delivery_days || 99))
    const best = sorted[0]

    const data = {
      serviceable: couriers.length > 0,
      pincode,
      codAvailable,
      estimatedDeliveryDays: best?.estimated_delivery_days ?? null,
      estimatedDeliveryDate: best?.etd ?? null,
      couriers: sorted.slice(0, 5).map((courier) => ({
        name: courier.courier_name,
        etd: courier.etd,
        estimatedDeliveryDays: courier.estimated_delivery_days,
        rate: courier.rate,
        cod: Number(courier.cod) === 1,
      })),
    }

    cache.set(pincode, { at: Date.now(), data })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof ShiprocketError) {
      return NextResponse.json({ success: true, data: { serviceable: false, reason: "error", message: error.message, couriers: [] } })
    }
    return NextResponse.json(
      { success: false, error: { code: "SERVICEABILITY_ERROR", message: error instanceof Error ? error.message : "Check failed." } },
      { status: 500 },
    )
  }
}
