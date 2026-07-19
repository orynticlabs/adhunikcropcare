import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { deleteOryCMSCategory, getOryCMSCategory, saveOryCMSCategory } from "@/lib/orycms/categories"

export const runtime = "nodejs"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireOryCMSUser(request)
    const category = await getOryCMSCategory((await params).id)

    if (!category) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Category not found." } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    return categoryError(error, "Failed to load category.")
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
      data: await saveOryCMSCategory(await request.json(), (await params).id),
    })
  } catch (error) {
    return categoryError(error, "Failed to save category.")
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireOryCMSUser(request)
    await deleteOryCMSCategory((await params).id)
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return categoryError(error, "Failed to delete category.")
  }
}

function categoryError(error: unknown, fallback: string) {
  if (error instanceof Response) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: error.status },
    )
  }

  const message = error instanceof Error ? error.message : fallback
  const validation = message.includes("required") || message.includes("Invalid") || message.includes("already exist")

  return NextResponse.json(
    {
      success: false,
      error: { code: validation ? "VALIDATION_ERROR" : "CATEGORY_ERROR", message },
    },
    { status: validation ? 422 : 500 },
  )
}
