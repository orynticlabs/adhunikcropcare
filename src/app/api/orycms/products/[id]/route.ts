import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { deleteOryCMSProduct, getOryCMSProduct, permanentDeleteOryCMSProduct, saveOryCMSProduct } from "@/lib/orycms/products"

export const runtime = "nodejs"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireOryCMSUser(request)
    const product = await getOryCMSProduct((await params).id)

    if (!product) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Product not found." } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    return productError(error, "Failed to load product.")
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({
      success: true,
      data: await saveOryCMSProduct(await request.json(), (await params).id),
    })
  } catch (error) {
    return productError(error, "Failed to save product.")
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireOryCMSUser(request)
    const { id } = await params
    const isPermanent = request.nextUrl.searchParams.get("permanent") === "true"

    if (isPermanent) {
      await permanentDeleteOryCMSProduct(id)
    } else {
      await deleteOryCMSProduct(id)
    }
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return productError(error, "Failed to delete product.")
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
