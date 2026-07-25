import { orycmsPrisma } from "@/lib/orycms/prisma"
import { ensureStorefrontAuthSchema } from "@/lib/storefront-auth"

export type OryCMSCodRuleDTO = {
  minOrdersRequired: number
  updatedAt: string
}

type CodRuleRow = {
  id: string
  min_orders_required: number
  updated_at: Date
}

export async function ensureOryCMSCodRulesSchema() {
  try {
    await orycmsPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "orycms_cod_rules" (
        "id" TEXT NOT NULL DEFAULT 'default',
        "min_orders_required" INTEGER NOT NULL DEFAULT 0,
        "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "orycms_cod_rules_pkey" PRIMARY KEY ("id")
      );
    `
    await orycmsPrisma.$executeRaw`
      INSERT INTO "orycms_cod_rules" ("id", "min_orders_required")
      VALUES ('default', 0)
      ON CONFLICT ("id") DO NOTHING;
    `
  } catch {
    // Table or initial row exists or permission error
  }
}

export async function getOryCMSCodRule(): Promise<OryCMSCodRuleDTO> {
  await ensureOryCMSCodRulesSchema()
  try {
    const [row] = await orycmsPrisma.$queryRaw<CodRuleRow[]>`
      SELECT * FROM "orycms_cod_rules" WHERE "id" = 'default' LIMIT 1
    `
    if (!row) return { minOrdersRequired: 0, updatedAt: new Date().toISOString() }
    return {
      minOrdersRequired: Math.max(0, Number(row.min_orders_required) || 0),
      updatedAt: new Date(row.updated_at).toISOString(),
    }
  } catch {
    return { minOrdersRequired: 0, updatedAt: new Date().toISOString() }
  }
}

export async function saveOryCMSCodRule(minOrdersRequired: number): Promise<OryCMSCodRuleDTO> {
  await ensureOryCMSCodRulesSchema()
  const value = Math.max(0, Math.floor(Number(minOrdersRequired) || 0))

  const [row] = await orycmsPrisma.$queryRaw<CodRuleRow[]>`
    INSERT INTO "orycms_cod_rules" ("id", "min_orders_required", "updated_at")
    VALUES ('default', ${value}, now())
    ON CONFLICT ("id") DO UPDATE
    SET "min_orders_required" = ${value}, "updated_at" = now()
    RETURNING *
  `

  if (!row) throw new Error("Unable to save COD rule.")
  return {
    minOrdersRequired: Number(row.min_orders_required),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function getCustomerCompletedOrderCount(userId: string): Promise<number> {
  await ensureStorefrontAuthSchema()
  try {
    const [row] = await orycmsPrisma.$queryRaw<{ cnt: bigint }[]>`
      SELECT COUNT(*) AS cnt FROM storefront_orders
      WHERE user_id = ${userId}::uuid
        AND (payment_status = 'paid' OR status IN ('delivered', 'completed', 'processing', 'shipped'))
        AND status != 'cancelled'
    `
    return Number(row?.cnt ?? 0)
  } catch {
    return 0
  }
}
