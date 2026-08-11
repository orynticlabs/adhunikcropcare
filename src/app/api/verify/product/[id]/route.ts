import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { getOryCMSVerificationSettings } from "@/lib/orycms/verification-settings"

export const runtime = "nodejs"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: slug } = await params
    if (!slug) {
      return NextResponse.json({ success: false, error: { message: "Slug is required." } }, { status: 422 })
    }

    const [snapshot] = await orycmsPrisma.$queryRaw<Record<string, unknown>[]>`
      SELECT * FROM orycms_verified_product_snapshots
      WHERE slug = ${slug}
      LIMIT 1
    `

    if (!snapshot) {
      return NextResponse.json({ success: false, error: { message: "Product not found or not verified." } }, { status: 404 })
    }

    const settings = await getOryCMSVerificationSettings()

    return NextResponse.json({
      success: true,
      data: {
        snapshot: {
          slug: snapshot.slug,
          productId: snapshot.product_id,
          uin: snapshot.uin,
          productName: snapshot.product_name,
          brand: snapshot.brand,
          packSize: snapshot.pack_size,
          sku: snapshot.sku,
          batchNumber: snapshot.batch_number,
          mrp: Number(snapshot.mrp),
          usp: snapshot.usp ? Number(snapshot.usp) : null,
          stockQuantity: Number(snapshot.stock_quantity),
          mfgDate: snapshot.mfg_date,
          expiryDate: snapshot.expiry_date,
          packTiming: snapshot.pack_timing,
          packDate: snapshot.pack_date,
          supervisorName: snapshot.supervisor_name,
          contractorName: snapshot.contractor_name,
          verifyDescription: snapshot.verify_description,
          verifyImage: snapshot.verify_image,
          literature: snapshot.literature,
          msds: snapshot.msds,
          license: snapshot.license,
          cir: snapshot.cir,
          eprNumber: snapshot.epr_number,
          plasticCategory: snapshot.plastic_category,
          leafletInfo: snapshot.leaflet_info,
          createdAt: snapshot.created_at,
        },
        settings,
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load verification details."
    return NextResponse.json({ success: false, error: { message } }, { status: 500 })
  }
}
