import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import ExcelJS from "exceljs"
import QRCode from "qrcode"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { Prisma } from "@prisma/client"

export const runtime = "nodejs"

type SnapshotRow = {
  id: string
  slug: string
  product_id: string
  uin: string
  product_name: string
  brand: string
  pack_size: string
  sku: string
  batch_number: string
  mrp: Prisma.Decimal | number | string
  usp: Prisma.Decimal | number | string | null
  stock_quantity: number
  mfg_date: Date | null
  expiry_date: Date | null
  pack_timing: string | null
  pack_date: Date | null
  supervisor_name: string | null
  contractor_name: string | null
  verify_description: string | null
  verify_image: unknown
  literature: string | null
  msds: string | null
  license: string | null
  cir: string | null
  epr_number: string | null
  plastic_category: string | null
  leafletInfo: string | null
  created_at: Date
}

function parseFilterDates(
  filterType: string,
  dateStr?: string | null,
  monthStr?: string | null,
  yearStr?: string | null,
  startDateStr?: string | null,
  endDateStr?: string | null
): { startDate?: Date; endDate?: Date; label: string } {
  const now = new Date()

  if (filterType === "date") {
    const targetDate = dateStr ? new Date(dateStr) : now
    if (isNaN(targetDate.getTime())) {
      return { label: "Invalid_Date" }
    }
    const start = new Date(targetDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(targetDate)
    end.setHours(23, 59, 59, 999)
    const formatted = start.toISOString().slice(0, 10)
    return { startDate: start, endDate: end, label: `Date_${formatted}` }
  }

  if (filterType === "range" || filterType === "custom") {
    const start = startDateStr ? new Date(startDateStr) : undefined
    if (start && !isNaN(start.getTime())) start.setHours(0, 0, 0, 0)
    const end = endDateStr ? new Date(endDateStr) : undefined
    if (end && !isNaN(end.getTime())) end.setHours(23, 59, 59, 999)

    if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const sComp = new Date(start)
      sComp.setHours(0, 0, 0, 0)
      const eComp = new Date(end)
      eComp.setHours(0, 0, 0, 0)
      if (eComp.getTime() <= sComp.getTime()) {
        throw new Error("End date must be greater than Start date.")
      }
    }

    const sStr = start && !isNaN(start.getTime()) ? start.toISOString().slice(0, 10) : "Start"
    const eStr = end && !isNaN(end.getTime()) ? end.toISOString().slice(0, 10) : "End"
    return { startDate: start, endDate: end, label: `Range_${sStr}_to_${eStr}` }
  }

  if (filterType === "month") {
    let y = now.getFullYear()
    let m = now.getMonth()

    if (monthStr) {
      if (monthStr.includes("-")) {
        const [yearParsed, monthParsed] = monthStr.split("-")
        const yp = parseInt(yearParsed, 10)
        const mp = parseInt(monthParsed, 10)
        if (!isNaN(yp) && !isNaN(mp) && mp >= 1 && mp <= 12) {
          y = yp
          m = mp - 1
        }
      } else {
        const mp = parseInt(monthStr, 10)
        if (!isNaN(mp) && mp >= 1 && mp <= 12) m = mp - 1
      }
    }
    if (yearStr) {
      const yp = parseInt(yearStr, 10)
      if (!isNaN(yp)) y = yp
    }

    const start = new Date(y, m, 1, 0, 0, 0, 0)
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999)
    const monthFormatted = `${y}-${String(m + 1).padStart(2, "0")}`
    return { startDate: start, endDate: end, label: `Month_${monthFormatted}` }
  }

  if (filterType === "year") {
    let y = now.getFullYear()
    if (yearStr) {
      const yp = parseInt(yearStr, 10)
      if (!isNaN(yp)) y = yp
    } else if (dateStr && dateStr.length === 4) {
      const yp = parseInt(dateStr, 10)
      if (!isNaN(yp)) y = yp
    }

    const start = new Date(y, 0, 1, 0, 0, 0, 0)
    const end = new Date(y, 11, 31, 23, 59, 59, 999)
    return { startDate: start, endDate: end, label: `Year_${y}` }
  }

  return { label: "All" }
}

function formatDateOnly(d: Date | string | null): string {
  if (!d) return "N/A"
  const date = d instanceof Date ? d : new Date(d)
  if (isNaN(date.getTime())) return "N/A"
  return date.toISOString().slice(0, 10)
}

function formatTimestamp(d: Date | string | null): string {
  if (!d) return "N/A"
  const date = d instanceof Date ? d : new Date(d)
  if (isNaN(date.getTime())) return "N/A"
  const pad = (n: number) => String(n).padStart(2, "0")
  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const min = pad(date.getMinutes())
  const ss = pad(date.getSeconds())
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`
}

function extractImageUrl(verifyImage: unknown): string {
  if (!verifyImage) return ""
  if (typeof verifyImage === "string") return verifyImage
  if (typeof verifyImage === "object" && verifyImage !== null) {
    const obj = verifyImage as Record<string, unknown>
    if (typeof obj.url === "string") return obj.url
    if (typeof obj.secure_url === "string") return obj.secure_url
  }
  return ""
}

export async function GET(request: NextRequest) {
  try {
    await requireOryCMSUser(request)

    const { searchParams } = request.nextUrl
    const filterType = searchParams.get("filterType") || searchParams.get("type") || "all"
    const dateStr = searchParams.get("date")
    const monthStr = searchParams.get("month")
    const yearStr = searchParams.get("year")
    const startDateStr = searchParams.get("startDate")
    const endDateStr = searchParams.get("endDate")
    const countOnly = searchParams.get("countOnly") === "true"

    const { startDate, endDate, label } = parseFilterDates(
      filterType,
      dateStr,
      monthStr,
      yearStr,
      startDateStr,
      endDateStr
    )

    let whereClause = Prisma.sql`WHERE 1=1`
    if (startDate && endDate) {
      whereClause = Prisma.sql`WHERE created_at >= ${startDate} AND created_at <= ${endDate}`
    } else if (startDate) {
      whereClause = Prisma.sql`WHERE created_at >= ${startDate}`
    } else if (endDate) {
      whereClause = Prisma.sql`WHERE created_at <= ${endDate}`
    }

    if (countOnly) {
      const [result] = await orycmsPrisma.$queryRaw<Array<{ count: bigint | number }>>`
        SELECT COUNT(*) as count FROM orycms_verified_product_snapshots ${whereClause}
      `
      const count = result ? Number(result.count) : 0
      return NextResponse.json({ success: true, count, filterLabel: label })
    }

    const snapshots = await orycmsPrisma.$queryRaw<SnapshotRow[]>`
      SELECT * FROM orycms_verified_product_snapshots
      ${whereClause}
      ORDER BY created_at DESC
    `

    const host = request.headers.get("host") || "adhunikcropcare.com"
    const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https"
    const baseUrl = `${protocol}://${host}`

    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Adhunik Crop Care - OryCMS Admin"
    workbook.lastModifiedBy = "OryCMS System"
    workbook.created = new Date()

    const worksheet = workbook.addWorksheet("Verified Product Snapshots", {
      views: [{ state: "frozen", ySplit: 1 }],
      properties: { defaultRowHeight: 22 },
    })

    worksheet.columns = [
      { header: "S.No.", key: "sno", width: 8 },
      { header: "Verification Code", key: "slug", width: 28 },
      { header: "Public Verification Link", key: "verifyUrl", width: 48 },
      { header: "UIN Code", key: "uin", width: 20 },
      { header: "Product Name", key: "productName", width: 30 },
      { header: "Brand", key: "brand", width: 20 },
      { header: "Pack Size", key: "packSize", width: 16 },
      { header: "SKU", key: "sku", width: 20 },
      { header: "Batch Number", key: "batchNumber", width: 20 },
      { header: "MRP (₹)", key: "mrp", width: 16 },
      { header: "USP (Unit Sale Price ₹)", key: "usp", width: 24 },
      { header: "Stock Quantity", key: "stockQuantity", width: 16 },
      { header: "MFG Date", key: "mfgDate", width: 15 },
      { header: "Expiry Date", key: "expiryDate", width: 15 },
      { header: "Pack Date", key: "packDate", width: 15 },
      { header: "Pack Time Slot", key: "packTiming", width: 18 },
      { header: "Supervisor Name", key: "supervisorName", width: 24 },
      { header: "Contractor Name", key: "contractorName", width: 24 },
      { header: "Verification Description", key: "verifyDescription", width: 40 },
      { header: "Verification Image URL", key: "verifyImageUrl", width: 45 },
      { header: "License No.", key: "license", width: 22 },
      { header: "CIR No.", key: "cir", width: 22 },
      { header: "Literature Details", key: "literature", width: 30 },
      { header: "MSDS Details", key: "msds", width: 30 },
      { header: "EPR Number", key: "eprNumber", width: 22 },
      { header: "Plastic Category", key: "plasticCategory", width: 22 },
      { header: "Leaflet Info", key: "leafletInfo", width: 30 },
      { header: "CreatedAt Timestamp", key: "createdAt", width: 22 },
      { header: "LastModifiedDate Timestamp", key: "lastModifiedDate", width: 24 },
      { header: "Scannable QR Code Image", key: "qrCode", width: 18 },
    ]

    const headerRow = worksheet.getRow(1)
    headerRow.height = 28
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF033927" },
      }
      cell.font = {
        name: "Segoe UI",
        size: 11,
        bold: true,
        color: { argb: "FFFFFFFF" },
      }
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
      cell.border = {
        top: { style: "thin", color: { argb: "FF02281B" } },
        bottom: { style: "medium", color: { argb: "FF02281B" } },
        left: { style: "thin", color: { argb: "FF02281B" } },
        right: { style: "thin", color: { argb: "FF02281B" } },
      }
    })

    for (let idx = 0; idx < snapshots.length; idx++) {
      const snap = snapshots[idx]
      const verifyUrl = `${baseUrl}/verify/product/${snap.slug}`
      const imgUrl = extractImageUrl(snap.verify_image)
      const mrpNum = Number(snap.mrp || 0)
      const uspNum = snap.usp !== null && snap.usp !== undefined ? Number(snap.usp) : null
      const createdTs = formatTimestamp(snap.created_at)

      const row = worksheet.addRow({
        sno: idx + 1,
        slug: snap.slug,
        verifyUrl: { text: verifyUrl, hyperlink: verifyUrl, tooltip: "Open Verification Link" },
        uin: snap.uin || "N/A",
        productName: snap.product_name || "N/A",
        brand: snap.brand || "N/A",
        packSize: snap.pack_size || "N/A",
        sku: snap.sku || "N/A",
        batchNumber: snap.batch_number || "N/A",
        mrp: mrpNum,
        usp: uspNum !== null ? uspNum : "N/A",
        stockQuantity: Number(snap.stock_quantity || 0),
        mfgDate: formatDateOnly(snap.mfg_date),
        expiryDate: formatDateOnly(snap.expiry_date),
        packDate: formatDateOnly(snap.pack_date),
        packTiming: snap.pack_timing || "N/A",
        supervisorName: snap.supervisor_name || "N/A",
        contractorName: snap.contractor_name || "N/A",
        verifyDescription: snap.verify_description ? snap.verify_description.replace(/<[^>]*>?/gm, "").trim() : "N/A",
        verifyImageUrl: imgUrl ? { text: imgUrl, hyperlink: imgUrl, tooltip: "Open Image URL" } : "N/A",
        license: snap.license || "N/A",
        cir: snap.cir || "N/A",
        literature: snap.literature || "N/A",
        msds: snap.msds || "N/A",
        eprNumber: snap.epr_number || "N/A",
        plasticCategory: snap.plastic_category || "N/A",
        leafletInfo: snap.leafletInfo ? snap.leafletInfo.replace(/<[^>]*>?/gm, "").trim() : "N/A",
        createdAt: createdTs,
        lastModifiedDate: createdTs,
        qrCode: "",
      })

      row.height = 62

      const isEven = idx % 2 === 0
      const bgColor = isEven ? "FFFFFFFF" : "FFEDF3E9"

      row.eachCell((cell, colNumber) => {
        cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF1E293B" } }
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: bgColor },
        }
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        }

        if (colNumber === 1 || colNumber === 30) {
          cell.alignment = { vertical: "middle", horizontal: "center" }
        } else if (colNumber === 10 || colNumber === 11) {
          if (typeof cell.value === "number") {
            cell.numFmt = "₹#,##0.00"
            cell.alignment = { vertical: "middle", horizontal: "right" }
          } else {
            cell.alignment = { vertical: "middle", horizontal: "center" }
          }
        } else if (colNumber === 12) {
          cell.numFmt = "#,##0"
          cell.alignment = { vertical: "middle", horizontal: "right" }
        } else if (colNumber === 3 || colNumber === 20) {
          cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF0284C7" }, underline: true }
          cell.alignment = { vertical: "middle", horizontal: "left" }
        } else if (colNumber === 13 || colNumber === 14 || colNumber === 15 || colNumber === 28 || colNumber === 29) {
          cell.alignment = { vertical: "middle", horizontal: "center" }
        } else {
          cell.alignment = { vertical: "middle", horizontal: "left" }
        }
      })

      // Generate & Embed Scannable QR Code PNG Image in the last column
      try {
        const qrBuffer = await QRCode.toBuffer(verifyUrl, {
          type: "png",
          width: 90,
          margin: 1,
          errorCorrectionLevel: "M",
        })
        const imageId = workbook.addImage({
          base64: qrBuffer.toString("base64"),
          extension: "png",
        })
        worksheet.addImage(imageId, {
          tl: { col: 29, row: idx + 1 },
          ext: { width: 70, height: 70 },
        })
      } catch {
        // Fallback silently if QR generation fails
      }
    }

    worksheet.columns.forEach((column, colIdx) => {
      if (colIdx === 29) {
        column.width = 18
        return
      }
      let maxLen = 12
      if (column.header) maxLen = Math.max(maxLen, String(column.header).length)
      if (column.eachCell) {
        column.eachCell({ includeEmpty: false }, (cell) => {
          let str = ""
          if (typeof cell.value === "object" && cell.value !== null && "text" in cell.value) {
            str = String((cell.value as { text: string }).text)
          } else if (cell.value !== undefined && cell.value !== null) {
            str = String(cell.value)
          }
          if (str.length > maxLen) maxLen = Math.min(60, str.length)
        })
      }
      column.width = maxLen + 3
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `Verified_Product_Links_${label}.xlsx`

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    })
  } catch (error) {
    console.error("Error generating verified product Excel export:", error)
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : "Failed to export verified product links." },
      },
      { status: 500 }
    )
  }
}
