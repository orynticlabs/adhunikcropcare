import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { syncPaymentsFromRazorpay, syncSettlements } from "@/lib/orycms/payments-sync"
import { recordPaymentAudit } from "@/lib/orycms/payments-audit"
import { paymentsError } from "@/lib/orycms/payments-http"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const user = await requireOryCMSUser(request)
    const payments = await syncPaymentsFromRazorpay({ pages: 3 })
    const settlements = await syncSettlements().catch(() => ({ settlements: 0 }))
    await recordPaymentAudit({ admin: user, action: "payment.sync", detail: { ...payments, ...settlements } })
    return NextResponse.json({ success: true, data: { ...payments, ...settlements } })
  } catch (error) {
    return paymentsError(error, "Failed to sync payments.")
  }
}
