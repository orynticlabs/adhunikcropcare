import type { NextRequest } from "next/server"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import QRCode from "qrcode"

export const runtime = "nodejs"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: slug } = await params
    if (!slug) {
      return new Response("Slug is required.", { status: 422 })
    }

    // Validate that the verification slug exists
    const [snapshot] = await orycmsPrisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM orycms_verified_product_snapshots
      WHERE slug = ${slug}
      LIMIT 1
    `
    if (!snapshot) {
      return new Response("Verification snapshot not found.", { status: 404 })
    }

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"
    const verificationUrl = `${serverUrl}/verify/product/${slug}`

    // Generate PNG QR code as binary buffer
    const qrBuffer = await QRCode.toBuffer(verificationUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      type: "png",
      width: 512,
    })

    return new Response(new Uint8Array(qrBuffer), {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="qr-${slug}.png"`,
        "Content-Type": "image/png",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate QR code."
    return new Response(message, { status: 500 })
  }
}
