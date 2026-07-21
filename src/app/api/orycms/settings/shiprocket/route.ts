import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { getShiprocketSettings, toPublicSettings, upsertShiprocketSettings, type ShiprocketSettingsInput } from "@/lib/shiprocket/settings"
import { resetShiprocketToken } from "@/lib/shiprocket/client"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const settings = await getShiprocketSettings()
    return NextResponse.json({ success: true, data: toPublicSettings(settings) })
  } catch (error) {
    return settingsError(error, "Failed to load Shiprocket settings.")
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const input = parseInput(body)
    const settings = await upsertShiprocketSettings(input)
    // Credentials may have changed — drop any cached auth token so the next call re-logs in.
    resetShiprocketToken()
    return NextResponse.json({ success: true, data: toPublicSettings(settings) })
  } catch (error) {
    return settingsError(error, "Failed to save Shiprocket settings.")
  }
}

function parseInput(body: Record<string, unknown>): ShiprocketSettingsInput {
  const str = (value: unknown) => (typeof value === "string" ? value : undefined)
  const num = (value: unknown) => {
    if (value === undefined || value === null || value === "") return undefined
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  const bool = (value: unknown) => (typeof value === "boolean" ? value : undefined)

  return {
    apiEmail: str(body.apiEmail),
    // Only present when the admin actually typed a new password; blank leaves it unchanged.
    apiPassword: str(body.apiPassword) && String(body.apiPassword).trim().length > 0 ? String(body.apiPassword) : undefined,
    channelId: str(body.channelId),
    pickupLocation: str(body.pickupLocation),
    pickupName: str(body.pickupName),
    pickupPhone: str(body.pickupPhone),
    pickupAddress1: str(body.pickupAddress1),
    pickupAddress2: str(body.pickupAddress2),
    pickupCity: str(body.pickupCity),
    pickupState: str(body.pickupState),
    pickupCountry: str(body.pickupCountry),
    pickupPincode: str(body.pickupPincode),
    packageLengthCm: num(body.packageLengthCm),
    packageBreadthCm: num(body.packageBreadthCm),
    packageHeightCm: num(body.packageHeightCm),
    packageWeightKg: num(body.packageWeightKg),
    autoShipOnConfirm: bool(body.autoShipOnConfirm),
    enabled: bool(body.enabled),
  }
}

function settingsError(error: unknown, fallback: string) {
  if (error instanceof Response) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: error.status },
    )
  }
  return NextResponse.json(
    { success: false, error: { code: "SHIPROCKET_SETTINGS_ERROR", message: error instanceof Error ? error.message : fallback } },
    { status: 500 },
  )
}
