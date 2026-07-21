import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { listPaymentsForExport } from "@/lib/orycms/payments"
import { recordPaymentAudit } from "@/lib/orycms/payments-audit"
import { toCsv, toPdf, toXlsx } from "@/lib/orycms/payments-export"
import { paymentsError } from "@/lib/orycms/payments-http"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const user = await requireOryCMSUser(request)
    const p = new URL(request.url).searchParams
    const format = (p.get("format") ?? "csv").toLowerCase()
    const rows = await listPaymentsForExport({
      search: p.get("search"),
      status: p.get("status"),
      refundStatus: p.get("refundStatus"),
      method: p.get("method"),
      from: p.get("from"),
      to: p.get("to"),
    })
    await recordPaymentAudit({ admin: user, action: "export", detail: { format, count: rows.length } })

    const stamp = new Date().toISOString().slice(0, 10)
    if (format === "xlsx") {
      const buffer = await toXlsx(rows)
      return new Response(new Uint8Array(buffer), {
        headers: {
          "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "content-disposition": `attachment; filename="payments-${stamp}.xlsx"`,
        },
      })
    }
    if (format === "pdf") {
      const buffer = toPdf(rows)
      return new Response(new Uint8Array(buffer), {
        headers: {
          "content-type": "application/pdf",
          "content-disposition": `attachment; filename="payments-${stamp}.pdf"`,
        },
      })
    }
    return new Response(toCsv(rows), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="payments-${stamp}.csv"`,
      },
    })
  } catch (error) {
    return paymentsError(error, "Failed to export payments.")
  }
}
