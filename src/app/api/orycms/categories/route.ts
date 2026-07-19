import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { bulkDeleteOryCMSCategories, listOryCMSCategories, saveOryCMSCategory } from "@/lib/orycms/categories"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const activeOnly = request.nextUrl.searchParams.get("status") === "active"

    return NextResponse.json({ success: true, data: await listOryCMSCategories({ activeOnly }) })
  } catch (error) {
    return categoryError(error, "Failed to load categories.")
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json(
      { success: true, data: await saveOryCMSCategory(await request.json()) },
      { status: 201 },
    )
  } catch (error) {
    return categoryError(error, "Failed to save category.")
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const body = (await request.json()) as { ids?: string[] }

    await bulkDeleteOryCMSCategories(body.ids ?? [])
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return categoryError(error, "Failed to delete categories.")
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
