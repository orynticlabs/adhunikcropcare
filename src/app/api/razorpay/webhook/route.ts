import { NextResponse } from "next/server"
import { handleRazorpayWebhook } from "@/lib/storefront-orders"
import { logAndMirrorWebhook } from "@/lib/orycms/payments-webhook"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-razorpay-signature")

  // Always log + mirror the event for the Payments module (records signature validity,
  // status, and errors, and upserts the payment/refund mirror). Never throws.
  await logAndMirrorWebhook(rawBody, signature)

  try {
    await handleRazorpayWebhook(rawBody, signature)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
