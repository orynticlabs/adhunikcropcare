import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { listPayments } from "@/lib/orycms/payments"
import { paymentsError } from "@/lib/orycms/payments-http"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)
    const p = new URL(request.url).searchParams
    const data = await listPayments({
      search: p.get("search"),
      status: p.get("status"),
      refundStatus: p.get("refundStatus"),
      method: p.get("method"),
      from: p.get("from"),
      to: p.get("to"),
      page: Number(p.get("page") ?? "1") || 1,
      pageSize: Number(p.get("pageSize") ?? "20") || 20,
    })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return paymentsError(error, "Failed to load payments.")
  }
}
