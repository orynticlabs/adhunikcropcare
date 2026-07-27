import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { getPickupLocations, ShiprocketError } from "@/lib/shiprocket/client"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const locations = await getPickupLocations()
    return NextResponse.json({
      success: true,
      data: locations
        .filter((location) => String(location.pickup_location ?? "").trim())
        .map((location) => ({
          id: String(location.id),
          pickupLocation: String(location.pickup_location).trim(),
          name: location.name ? String(location.name) : null,
          phone: location.phone ? String(location.phone) : null,
          address1: location.address ? String(location.address) : null,
          address2: location.address_2 ? String(location.address_2) : null,
          city: location.city ? String(location.city) : null,
          state: location.state ? String(location.state) : null,
          country: location.country ? String(location.country) : "India",
          pincode: location.pin_code ? String(location.pin_code).replace(/\D/g, "").slice(0, 6) : null,
        })),
    })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: error.status })
    }
    if (error instanceof ShiprocketError) {
      return NextResponse.json({ success: false, error: { code: "SHIPROCKET_ERROR", message: error.message } }, { status: error.status >= 400 && error.status < 600 ? error.status : 502 })
    }
    return NextResponse.json({ success: false, error: { code: "PICKUP_LOCATIONS_ERROR", message: "Failed to load Shiprocket pickup locations." } }, { status: 500 })
  }
}
