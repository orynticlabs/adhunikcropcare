import "server-only"
import crypto from "crypto"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { upsertPaymentMirror, upsertRefundMirror } from "@/lib/orycms/payments-sync"
import type { RazorpayPaymentEntity, RazorpayRefundEntity } from "@/lib/razorpay/client"

const MIRRORED_EVENTS = new Set([
  "payment.authorized",
  "payment.captured",
  "payment.failed",
  "refund.created",
  "refund.processed",
  "refund.failed",
])

function isValidSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !signature) return false
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

/**
 * Logs a Razorpay webhook to razorpay_webhook_logs and mirrors the payment/refund
 * entity it carries. Independent of the order-side handler so the Payments module's
 * webhook log and mirror stay accurate even if order handling changes. Signature is
 * re-validated here and the result recorded; never throws (best-effort logging).
 */
export async function logAndMirrorWebhook(rawBody: string, signature: string | null): Promise<void> {
  let event: {
    event?: string
    id?: string
    payload?: {
      payment?: { entity?: RazorpayPaymentEntity }
      refund?: { entity?: RazorpayRefundEntity }
    }
  }
  try {
    event = JSON.parse(rawBody)
  } catch {
    await writeLog("unknown", null, false, "failed", "Invalid JSON payload", null)
    return
  }

  const name = event.event ?? "unknown"
  const signatureValid = isValidSignature(rawBody, signature)

  try {
    if (signatureValid && MIRRORED_EVENTS.has(name)) {
      const payment = event.payload?.payment?.entity
      const refund = event.payload?.refund?.entity
      if (payment) await upsertPaymentMirror(payment)
      if (refund) await upsertRefundMirror(refund)
    }
    await writeLog(name, event.id ?? null, signatureValid, signatureValid ? "processed" : "failed", signatureValid ? null : "Invalid webhook signature", event)
  } catch (error) {
    await writeLog(name, event.id ?? null, signatureValid, "failed", error instanceof Error ? error.message : "processing error", event)
  }
}

async function writeLog(event: string, eventId: string | null, signatureValid: boolean, status: string, error: string | null, payload: unknown): Promise<void> {
  try {
    await orycmsPrisma.$executeRaw`
      INSERT INTO razorpay_webhook_logs (event, razorpay_event_id, signature_valid, status, error, payload)
      VALUES (${event}, ${eventId}, ${signatureValid}, ${status}, ${error}, ${JSON.stringify(payload ?? {})}::jsonb)
    `
  } catch {}
}
