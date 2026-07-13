import { NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/cms/auth"
import {
  getHeaderMenuView,
  listHeaderMenuItems,
  reorderHeaderMenuItems,
} from "@/lib/cms/store"

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function PATCH(request: Request) {
  const session = await requireAdminSession()
  if (!session) {
    return unauthorizedResponse()
  }

  try {
    const body = (await request.json()) as {
      itemIds?: string[]
    }

    if (!Array.isArray(body.itemIds)) {
      return NextResponse.json({ error: "`itemIds` must be an array." }, { status: 400 })
    }

    const items = await reorderHeaderMenuItems(body.itemIds)
    const view = await getHeaderMenuView()

    return NextResponse.json({
      message: "Header menu reordered successfully.",
      items,
      view,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reorder header menu."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function GET() {
  const session = await requireAdminSession()
  if (!session) {
    return unauthorizedResponse()
  }

  const [items, view] = await Promise.all([listHeaderMenuItems(), getHeaderMenuView()])

  return NextResponse.json({
    items,
    view,
  })
}
