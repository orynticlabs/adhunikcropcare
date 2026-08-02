import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const actor = await requireOryCMSUser(request)
    const roleName = actor.roleName || ""
    const isSuper = roleName === "Owner" || roleName === "Super Admin"

    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only Super Admins can access audit logs." } },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")?.trim() || ""
    const action = searchParams.get("action")?.trim() || "all"
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)))
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const offset = (page - 1) * limit

    const whereConditions: string[] = []
    if (action !== "all") {
      whereConditions.push(`action = ${JSON.stringify(action)}::text`)
    }
    if (query) {
      const q = `%${query.toLowerCase()}%`
      whereConditions.push(
        `(lower(COALESCE("adminEmail", '')) LIKE ${JSON.stringify(q)} OR lower(action) LIKE ${JSON.stringify(q)} OR lower(COALESCE(details::text, '')) LIKE ${JSON.stringify(q)})`
      )
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    const countRows = await orycmsPrisma.$queryRawUnsafe<{ count: string }[]>(`
      SELECT COUNT(*)::text AS count FROM orycms_admin_audit_logs ${whereClause}
    `)
    const total = parseInt(countRows[0]?.count || "0", 10)

    const logs = await orycmsPrisma.$queryRawUnsafe<any[]>(`
      SELECT id, "adminId", "adminEmail", "targetUserId", action, "ipAddress", details, "createdAt"
      FROM orycms_admin_audit_logs
      ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    return NextResponse.json({
      success: true,
      data: logs,
      meta: {
        page,
        limit,
        total,
        pageCount: Math.max(1, Math.ceil(total / limit)),
      },
    })
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
        { status: err.status }
      )
    }
    console.error("[Audit Logs API Error]:", err)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to load audit logs." } },
      { status: 500 }
    )
  }
}
