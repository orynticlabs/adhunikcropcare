import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { bulkDeleteOryCMSProducts, listOryCMSProducts, saveOryCMSProduct } from "@/lib/orycms/products"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await listOryCMSProducts() })
  } catch (error) {
    return productError(error, "Failed to load products.")
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json(
      { success: true, data: await saveOryCMSProduct(await request.json()) },
      { status: 201 },
    )
  } catch (error) {
    return productError(error, "Failed to save product.")
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const body = (await request.json()) as { ids?: string[] }

    await bulkDeleteOryCMSProducts(body.ids ?? [])
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return productError(error, "Failed to delete products.")
  }
}

function productError(error: unknown, fallback: string) {
  if (error instanceof Response) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: error.status },
    )
  }

  const message = error instanceof Error ? error.message : fallback
  const validation = message.includes("required") || message.includes("Invalid")

  return NextResponse.json(
    {
      success: false,
      error: { code: validation ? "VALIDATION_ERROR" : "PRODUCT_ERROR", message },
    },
    { status: validation ? 422 : 500 },
  )
}
