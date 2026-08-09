import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { getOryCMSProduct, saveOryCMSProduct } from "@/lib/orycms/products"

export const runtime = "nodejs"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    const { id } = await params
    const product = await getOryCMSProduct(id)
    if (!product) {
      return NextResponse.json({ success: false, error: { message: "Product not found." } }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : "Failed to load product." },
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    const { id } = await params
    const body = await request.json()

    // Backend immutability enforcement
    const [existing] = await orycmsPrisma.$queryRaw<{ license?: string | null; cir?: string | null; literature?: string | null; msds?: string | null }[]>`
      SELECT license, cir, literature, msds FROM orycms_products WHERE id = ${id}::uuid LIMIT 1
    `
    if (existing) {
      if (existing.license?.trim() && body.license?.trim() !== existing.license.trim()) {
        body.license = existing.license
      }
      if (existing.cir?.trim() && body.cir?.trim() !== existing.cir.trim()) {
        body.cir = existing.cir
      }
      if (existing.literature?.trim() && body.literature?.trim() !== existing.literature.trim()) {
        body.literature = existing.literature
      }
      if (existing.msds?.trim() && body.msds?.trim() !== existing.msds.trim()) {
        body.msds = existing.msds
      }
    }

    // Save using the core save helper flagged as verification update
    const updated = await saveOryCMSProduct(
      {
        ...body,
        isVerificationUpdate: true,
      },
      id
    )

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : "Failed to save verification." },
      },
      { status: 500 }
    )
  }
}
