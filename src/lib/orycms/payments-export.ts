import "server-only"
import ExcelJS from "exceljs"

type ExportRow = {
  order_number: string | null
  razorpay_payment_id: string
  razorpay_order_id: string | null
  customer_name: string | null
  email: string | null
  amount: number
  method: string | null
  status: string
  captured: boolean
  refund_status: string | null
  amount_refunded: number
  created_at_rzp: string | null
}

const COLUMNS: { header: string; key: keyof ExportRow }[] = [
  { header: "Order Number", key: "order_number" },
  { header: "Payment ID", key: "razorpay_payment_id" },
  { header: "Order ID", key: "razorpay_order_id" },
  { header: "Customer", key: "customer_name" },
  { header: "Email", key: "email" },
  { header: "Amount", key: "amount" },
  { header: "Method", key: "method" },
  { header: "Status", key: "status" },
  { header: "Captured", key: "captured" },
  { header: "Refund Status", key: "refund_status" },
  { header: "Refunded", key: "amount_refunded" },
  { header: "Created", key: "created_at_rzp" },
]

function cell(row: ExportRow, key: keyof ExportRow): string {
  const value = row[key]
  if (value == null) return ""
  if (typeof value === "boolean") return value ? "Yes" : "No"
  return String(value)
}

export function toCsv(rows: ExportRow[]): string {
  const escape = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)
  const header = COLUMNS.map((c) => c.header).join(",")
  const body = rows.map((row) => COLUMNS.map((c) => escape(cell(row, c.key))).join(",")).join("\n")
  return `${header}\n${body}`
}

export async function toXlsx(rows: ExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Payments")
  sheet.columns = COLUMNS.map((c) => ({ header: c.header, key: c.key, width: 18 }))
  sheet.getRow(1).font = { bold: true }
  for (const row of rows) {
    sheet.addRow(COLUMNS.reduce<Record<string, string>>((acc, c) => ({ ...acc, [c.key]: cell(row, c.key) }), {}))
  }
  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}

/** Minimal single-page PDF table report (no external PDF dependency). */
export function toPdf(rows: ExportRow[]): Buffer {
  const lines: string[] = [
    "Adhunik Crop Care — Payments Export",
    `Generated: ${new Date().toISOString().slice(0, 19).replace("T", " ")}`,
    `Total records: ${rows.length}`,
    "",
  ]
  for (const row of rows.slice(0, 40)) {
    lines.push(`${row.razorpay_payment_id}  ${row.order_number ?? "-"}  INR ${row.amount.toFixed(2)}  ${row.status}${row.captured ? "/captured" : ""}`)
  }
  if (rows.length > 40) lines.push(`… and ${rows.length - 40} more (use CSV/XLSX for the full set)`)
  return makeSimplePdf(lines)
}

function makeSimplePdf(lines: string[]): Buffer {
  const text = lines.map((line, index) => `BT /F1 10 Tf 40 ${800 - index * 18} Td (${escapePdf(line)}) Tj ET`).join("\n")
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${text.length} >> stream\n${text}\nendstream endobj`,
  ]
  const body = `%PDF-1.4\n${objects.join("\n")}\n`
  let offset = "%PDF-1.4\n".length
  const xref = objects.map((object) => {
    const current = offset
    offset += object.length + 1
    return current
  })
  const table = `xref\n0 6\n0000000000 65535 f \n${xref.map((n) => `${String(n).padStart(10, "0")} 00000 n `).join("\n")}\n`
  return Buffer.from(`${body}${table}trailer << /Size 6 /Root 1 0 R >>\nstartxref\n${body.length}\n%%EOF`)
}

function escapePdf(value: string): string {
  return value.replace(/[()\\]/g, "\\$&")
}
