import { orycmsPrisma } from "@/lib/orycms/prisma"
import { ensureStorefrontAuthSchema } from "@/lib/storefront-auth"

export type CustomerStatus = "active" | "inactive" | "blocked"

export type OryCMSCustomerDTO = {
  avatar: string | null
  defaultAddress: unknown
  deletedAt: string | null
  email: string
  emailVerified: boolean
  firstName: string
  id: string
  joinedAt: string
  lastLoginAt: string | null
  lastName: string
  name: string
  phone: string
  status: CustomerStatus
  totalOrders: number
  totalSpent: number
  updatedAt: string
}

type CustomerRow = {
  avatar: string | null
  created_at: Date | string
  default_address: unknown
  deleted_at: Date | string | null
  email: string
  email_verified_at: Date | string | null
  first_name: string
  id: string
  last_login_at: Date | string | null
  last_name: string
  phone: string | null
  status: string
  total_orders: bigint | number | string
  total_spent: number | string
  updated_at: Date | string
}

const CUSTOMER_SELECT = `
  u.id, u.first_name, u.last_name, u.email, u.phone, u.avatar, u.default_address,
  u.email_verified_at, u.status, u.last_login_at, u.deleted_at, u.created_at, u.updated_at,
  COUNT(o.id) AS total_orders,
  COALESCE(SUM(CASE WHEN o.payment_status IN ('paid', 'pending') THEN o.total ELSE 0 END), 0) AS total_spent
`

export async function listOryCMSCustomers() {
  await ensureCustomerColumns()
  const rows = await orycmsPrisma.$queryRawUnsafe<CustomerRow[]>(`
    SELECT ${CUSTOMER_SELECT}
    FROM storefront_users u
    LEFT JOIN storefront_orders o ON o.user_id = u.id
    WHERE u.deleted_at IS NULL
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `)
  return rows.map(toCustomerDTO)
}

export async function getOryCMSCustomer(id: string) {
  await ensureCustomerColumns()
  const [customer] = await orycmsPrisma.$queryRawUnsafe<CustomerRow[]>(`
    SELECT ${CUSTOMER_SELECT}
    FROM storefront_users u
    LEFT JOIN storefront_orders o ON o.user_id = u.id
    WHERE u.id = $1::uuid AND u.deleted_at IS NULL
    GROUP BY u.id
    LIMIT 1
  `, id)
  if (!customer) return null

  const orders = await orycmsPrisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT id, number, status, payment_status, payment_method, items, total, created_at
     FROM storefront_orders WHERE user_id = $1::uuid ORDER BY created_at DESC`,
    id,
  )
  const payments = await orycmsPrisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT event, status, amount, provider, created_at
     FROM storefront_payment_transactions WHERE user_id = $1::uuid ORDER BY created_at DESC LIMIT 20`,
    id,
  )

  return { ...toCustomerDTO(customer), orders, payments, activity: recentActivity(customer, orders, payments) }
}

export async function updateOryCMSCustomer(id: string, input: { firstName?: string; lastName?: string; phone?: string; status?: CustomerStatus }) {
  await ensureCustomerColumns()
  const status = normalizeStatus(input.status)
  const [updated] = await orycmsPrisma.$queryRaw<CustomerRow[]>`
    UPDATE storefront_users
    SET first_name = COALESCE(${clean(input.firstName)}, first_name),
        last_name = COALESCE(${clean(input.lastName)}, last_name),
        phone = COALESCE(${clean(input.phone)}, phone),
        status = COALESCE(${status}, status),
        updated_at = now()
    WHERE id = ${id}::uuid AND deleted_at IS NULL
    RETURNING id, first_name, last_name, email, phone, avatar, default_address, email_verified_at,
      status, last_login_at, deleted_at, created_at, updated_at, 0 AS total_orders, 0 AS total_spent
  `
  if (!updated) throw new Error("Customer not found.")
  if (status && status !== "active") await revokeCustomerSessions(id)
  return getOryCMSCustomer(id)
}

export async function softDeleteOryCMSCustomer(id: string) {
  await ensureCustomerColumns()
  await orycmsPrisma.$executeRaw`
    UPDATE storefront_users SET deleted_at = now(), status = 'inactive', updated_at = now()
    WHERE id = ${id}::uuid
  `
  await revokeCustomerSessions(id)
}

export async function bulkUpdateOryCMSCustomers(ids: string[], action: "activate" | "deactivate" | "block" | "unblock" | "delete") {
  await Promise.all(ids.filter(Boolean).map((id) => {
    if (action === "delete") return softDeleteOryCMSCustomer(id)
    if (action === "activate" || action === "unblock") return updateOryCMSCustomer(id, { status: "active" })
    if (action === "block") return updateOryCMSCustomer(id, { status: "blocked" })
    return updateOryCMSCustomer(id, { status: "inactive" })
  }))
}

async function ensureCustomerColumns() {
  await ensureStorefrontAuthSchema()
}

async function revokeCustomerSessions(id: string) {
  await orycmsPrisma.$executeRaw`DELETE FROM storefront_refresh_tokens WHERE user_id = ${id}::uuid`
}

function toCustomerDTO(row: CustomerRow): OryCMSCustomerDTO {
  const firstName = row.first_name ?? ""
  const lastName = row.last_name ?? ""
  return {
    avatar: row.avatar,
    defaultAddress: row.default_address,
    deletedAt: iso(row.deleted_at),
    email: row.email,
    emailVerified: Boolean(row.email_verified_at),
    firstName,
    id: row.id,
    joinedAt: iso(row.created_at) ?? new Date().toISOString(),
    lastLoginAt: iso(row.last_login_at),
    lastName,
    name: [firstName, lastName].filter(Boolean).join(" ") || row.email,
    phone: row.phone ?? "",
    status: normalizeStatus(row.status) ?? "active",
    totalOrders: Number(row.total_orders ?? 0),
    totalSpent: Number(row.total_spent ?? 0),
    updatedAt: iso(row.updated_at) ?? new Date().toISOString(),
  }
}

function recentActivity(customer: CustomerRow, orders: Record<string, unknown>[], payments: Record<string, unknown>[]) {
  return [
    { at: iso(customer.created_at), label: "Customer registered" },
    customer.last_login_at ? { at: iso(customer.last_login_at), label: "Last storefront login" } : null,
    ...orders.slice(0, 5).map((order) => ({ at: iso(order.created_at), label: `Order ${order.number ?? ""} placed` })),
    ...payments.slice(0, 5).map((payment) => ({ at: iso(payment.created_at), label: `Payment ${payment.status ?? ""}` })),
  ].filter(Boolean)
}

function normalizeStatus(value: unknown): CustomerStatus | null {
  return value === "inactive" || value === "blocked" || value === "active" ? value : null
}

function clean(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function iso(value: unknown) {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : String(value)
}
