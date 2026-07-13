import { NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/cms/auth"
import {
  getHeaderMenuView,
  listHeaderMenuItems,
  updateHeaderMenuItem,
} from "@/lib/cms/store"

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession()
  if (!session) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await context.params
    const body = (await request.json()) as {
      label?: string
      href?: string
      enabled?: boolean
    }
    const item = await updateHeaderMenuItem(id, body)
    const [items, view] = await Promise.all([listHeaderMenuItems(), getHeaderMenuView()])

    return NextResponse.json({
      message: "Header menu item updated successfully.",
      item,
      items,
      view,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update header menu item."
    const status = message === "Menu item not found." ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
