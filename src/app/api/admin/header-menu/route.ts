import { NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/cms/auth"
import {
  createHeaderMenuItem,
  getHeaderMenuView,
  listHeaderMenuItems,
} from "@/lib/cms/store"

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    rules: {
      homeItemId: "home",
      homeItemImmutable: true,
      maxTopLevelItems: 6,
      maxDirectLinks: 5,
      reservedMoreLabel: "More",
    },
  })
}

export async function POST(request: Request) {
  const session = await requireAdminSession()
  if (!session) {
    return unauthorizedResponse()
  }

  try {
    const body = (await request.json()) as {
      label?: string
      href?: string
      enabled?: boolean
    }
    const item = await createHeaderMenuItem(body)
    const [items, view] = await Promise.all([listHeaderMenuItems(), getHeaderMenuView()])

    return NextResponse.json(
      {
        message: "Header menu item created successfully.",
        item,
        items,
        view,
      },
      { status: 201 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create header menu item."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
