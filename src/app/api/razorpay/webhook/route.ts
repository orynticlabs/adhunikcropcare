import { NextResponse } from "next/server"
import { handleRazorpayWebhook } from "@/lib/storefront-orders"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    await handleRazorpayWebhook(rawBody, request.headers.get("x-razorpay-signature"))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
