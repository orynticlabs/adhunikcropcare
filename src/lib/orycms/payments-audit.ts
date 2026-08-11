import "server-only"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export type PaymentAuditAction =
  | "payment.sync"
  | "settlement.sync"
  | "refund.create"
  | "refund.retry"
  | "refund.sync"
  | "export"

/** Records an admin payment/refund action for the audit trail. Best-effort — never throws. */
export async function recordPaymentAudit(input: {
  admin?: { id?: string | null; email?: string | null } | null
  action: PaymentAuditAction
  paymentId?: string | null
  refundId?: string | null
  detail?: unknown
}): Promise<void> {
  try {
    await orycmsPrisma.$executeRaw`
      INSERT INTO orycms_payment_audit_logs (admin_id, admin_email, action, payment_id, refund_id, detail)
      VALUES (
        ${input.admin?.id ?? null}::uuid,
        ${input.admin?.email ?? null},
        ${input.action},
        ${input.paymentId ?? null},
        ${input.refundId ?? null},
        ${JSON.stringify(input.detail ?? {})}::jsonb
      )
    `
  } catch {}
}

export type PaymentAuditRow = {
  id: string
  admin_email: string | null
  action: string
  payment_id: string | null
  refund_id: string | null
  detail: unknown
  created_at: Date | string
}

export async function listPaymentAudit(paymentId: string, limit = 50): Promise<PaymentAuditRow[]> {
  return orycmsPrisma.$queryRawUnsafe<PaymentAuditRow[]>(
    `SELECT id, admin_email, action, payment_id, refund_id, detail, created_at
     FROM orycms_payment_audit_logs
     WHERE payment_id = $1 OR refund_id IN (SELECT razorpay_refund_id FROM razorpay_refunds WHERE razorpay_payment_id = $1)
     ORDER BY created_at DESC LIMIT ${Math.max(1, Math.min(200, limit))}`,
    paymentId,
  )
}
