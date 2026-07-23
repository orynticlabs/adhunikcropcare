import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { listOryCMSDiscounts, saveOryCMSDiscount } from "@/lib/orycms/discounts"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export const runtime = "nodejs"

function discountError(error: unknown, fallback: string) {
  if (error instanceof Response) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 })
  }
  const message = error instanceof Error ? error.message : fallback
  const isValidation = message.includes("required") || message.includes("Invalid") || message.includes("already exists")
  return NextResponse.json(
    { success: false, error: { code: isValidation ? "VALIDATION_ERROR" : "DISCOUNT_ERROR", message } },
    { status: isValidation ? 422 : 500 },
  )
}

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await listOryCMSDiscounts() })
  } catch (error) {
    return discountError(error, "Failed to load discounts.")
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await saveOryCMSDiscount(await request.json()) }, { status: 201 })
  } catch (error) {
    return discountError(error, "Failed to save discount.")
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const { ids } = await request.json() as { ids: string[] }
    if (!Array.isArray(ids) || ids.length === 0) throw new Error("No IDs provided.")
    for (const id of ids) {
      await orycmsPrisma.$executeRaw`
        UPDATE orycms_discounts SET deleted_at = now(), updated_at = now()
        WHERE id = ${id}::uuid AND deleted_at IS NULL
      `
    }
    return NextResponse.json({ success: true, data: { deleted: ids.length } })
  } catch (error) {
    return discountError(error, "Failed to delete discounts.")
  }
}
