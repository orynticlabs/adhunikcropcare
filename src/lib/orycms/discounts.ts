import { orycmsPrisma } from "@/lib/orycms/prisma"
import { sanitizeRichText } from "@/lib/orycms/sanitize-html"

export type DiscountType = "percentage" | "fixed" | "free_shipping" | "bxgy"
export type AppliesTo = "entire_store" | "categories" | "products" | "brands"

export type DiscountInput = {
  name: string
  code: string | null
  shortText: string | null
  description: string | null
  type: DiscountType
  value: number
  minOrderAmount: number | null
  maxDiscountAmount: number | null
  usageLimit: number | null
  perUserLimit: number | null
  startsAt: string | null
  endsAt: string | null
  active: boolean
  autoApply: boolean
  showInOffers: boolean
  showInBar: boolean
  priority: number
  bgColor: string | null
  textColor: string | null
  buttonColor: string | null
  buttonText: string | null
  badgeText: string | null
  appliesTo: AppliesTo
  targetIds: string[]
  firstOrderOnly: boolean
  loggedInOnly: boolean
  newCustomersOnly: boolean
  existingCustomersOnly: boolean
}

export type DiscountDTO = DiscountInput & {
  id: string
  usageCount: number
  createdAt: string
  updatedAt: string
}

type DiscountRow = {
  id: string
  name: string
  code: string | null
  short_text: string | null
  description: string | null
  type: string
  value: string | number
  min_order_amount: string | number | null
  max_discount_amount: string | number | null
  usage_limit: number | null
  per_user_limit: number | null
  usage_count: number
  starts_at: Date | string | null
  ends_at: Date | string | null
  active: boolean
  auto_apply: boolean
  show_in_offers: boolean
  show_in_bar: boolean
  priority: number
  bg_color: string | null
  text_color: string | null
  button_color: string | null
  button_text: string | null
  badge_text: string | null
  applies_to: string
  target_ids: unknown
  first_order_only: boolean
  logged_in_only: boolean
  new_customers_only: boolean
  existing_customers_only: boolean
  created_at: Date | string
  updated_at: Date | string
}

function toDTO(row: DiscountRow): DiscountDTO {
  const targetIds = Array.isArray(row.target_ids) ? (row.target_ids as string[]) : []
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    shortText: row.short_text,
    description: row.description,
    type: row.type as DiscountType,
    value: Number(row.value),
    minOrderAmount: row.min_order_amount != null ? Number(row.min_order_amount) : null,
    maxDiscountAmount: row.max_discount_amount != null ? Number(row.max_discount_amount) : null,
    usageLimit: row.usage_limit,
    perUserLimit: row.per_user_limit,
    usageCount: row.usage_count,
    startsAt: row.starts_at ? new Date(row.starts_at).toISOString() : null,
    endsAt: row.ends_at ? new Date(row.ends_at).toISOString() : null,
    active: row.active,
    autoApply: row.auto_apply,
    showInOffers: row.show_in_offers,
    showInBar: row.show_in_bar,
    priority: row.priority,
    bgColor: row.bg_color,
    textColor: row.text_color,
    buttonColor: row.button_color,
    buttonText: row.button_text,
    badgeText: row.badge_text,
    appliesTo: row.applies_to as AppliesTo,
    targetIds,
    firstOrderOnly: row.first_order_only,
    loggedInOnly: row.logged_in_only,
    newCustomersOnly: row.new_customers_only,
    existingCustomersOnly: row.existing_customers_only,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function listOryCMSDiscounts(): Promise<DiscountDTO[]> {
  const rows = await orycmsPrisma.$queryRaw<DiscountRow[]>`
    SELECT * FROM orycms_discounts
    WHERE deleted_at IS NULL
    ORDER BY priority DESC, created_at DESC
  `
  return rows.map(toDTO)
}

export async function getOryCMSDiscount(id: string): Promise<DiscountDTO | null> {
  const [row] = await orycmsPrisma.$queryRaw<DiscountRow[]>`
    SELECT * FROM orycms_discounts
    WHERE id = ${id}::uuid AND deleted_at IS NULL
    LIMIT 1
  `
  return row ? toDTO(row) : null
}

function validateInput(input: DiscountInput) {
  const name = input.name.trim()
  if (!name) throw new Error("Offer title is required.")
  const code = input.code?.trim().toUpperCase() || null
  const VALID_TYPES: DiscountType[] = ["percentage", "fixed", "free_shipping", "bxgy"]
  if (!VALID_TYPES.includes(input.type)) throw new Error("Invalid discount type.")
  const value = Number(input.value)
  if (!Number.isFinite(value) || value < 0) throw new Error("Discount value must be a non-negative number.")
  if (input.type === "percentage" && value > 100) throw new Error("Percentage discount cannot exceed 100%.")
  const VALID_APPLIES: AppliesTo[] = ["entire_store", "categories", "products", "brands"]
  if (!VALID_APPLIES.includes(input.appliesTo)) throw new Error("Invalid applicability setting.")
  const description = sanitizeRichText(input.description)
  const shortText = input.shortText?.trim() || null
  return {
    ...input,
    name,
    code,
    shortText,
    description,
    value,
    minOrderAmount: input.minOrderAmount != null ? Number(input.minOrderAmount) : null,
    maxDiscountAmount: input.maxDiscountAmount != null ? Number(input.maxDiscountAmount) : null,
    usageLimit: input.usageLimit != null ? Number(input.usageLimit) : null,
    perUserLimit: input.perUserLimit != null ? Number(input.perUserLimit) : null,
    priority: Number(input.priority) || 0,
    targetIds: Array.isArray(input.targetIds) ? input.targetIds.filter(Boolean) : [],
  }
}

export async function saveOryCMSDiscount(input: DiscountInput, id?: string): Promise<DiscountDTO> {
  const p = validateInput(input)

  if (p.code) {
    const existing = id
      ? await orycmsPrisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM orycms_discounts WHERE code = ${p.code} AND deleted_at IS NULL AND id <> ${id}::uuid LIMIT 1
        `
      : await orycmsPrisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM orycms_discounts WHERE code = ${p.code} AND deleted_at IS NULL LIMIT 1
        `
    if (existing.length > 0) throw new Error("A discount with this coupon code already exists.")
  }

  const targetIdsJson = JSON.stringify(p.targetIds)
  const startsAt = p.startsAt ? new Date(p.startsAt) : null
  const endsAt = p.endsAt ? new Date(p.endsAt) : null

  if (id) {
    const [row] = await orycmsPrisma.$queryRaw<DiscountRow[]>`
      UPDATE orycms_discounts SET
        name = ${p.name},
        code = ${p.code},
        short_text = ${p.shortText},
        description = ${p.description},
        type = ${p.type},
        value = ${p.value},
        min_order_amount = ${p.minOrderAmount},
        max_discount_amount = ${p.maxDiscountAmount},
        usage_limit = ${p.usageLimit},
        per_user_limit = ${p.perUserLimit},
        starts_at = ${startsAt},
        ends_at = ${endsAt},
        active = ${p.active},
        auto_apply = ${p.autoApply},
        show_in_offers = ${p.showInOffers},
        show_in_bar = ${p.showInBar},
        priority = ${p.priority},
        bg_color = ${p.bgColor},
        text_color = ${p.textColor},
        button_color = ${p.buttonColor},
        button_text = ${p.buttonText},
        badge_text = ${p.badgeText},
        applies_to = ${p.appliesTo},
        target_ids = ${targetIdsJson}::jsonb,
        first_order_only = ${p.firstOrderOnly},
        logged_in_only = ${p.loggedInOnly},
        new_customers_only = ${p.newCustomersOnly},
        existing_customers_only = ${p.existingCustomersOnly},
        updated_at = now()
      WHERE id = ${id}::uuid AND deleted_at IS NULL
      RETURNING *
    `
    if (!row) throw new Error("Discount not found.")
    return toDTO(row)
  }

  const [row] = await orycmsPrisma.$queryRaw<DiscountRow[]>`
    INSERT INTO orycms_discounts (
      name, code, short_text, description, type, value, min_order_amount, max_discount_amount,
      usage_limit, per_user_limit, starts_at, ends_at, active, auto_apply,
      show_in_offers, show_in_bar, priority, bg_color, text_color, button_color, button_text, badge_text,
      applies_to, target_ids, first_order_only, logged_in_only, new_customers_only, existing_customers_only
    ) VALUES (
      ${p.name}, ${p.code}, ${p.shortText}, ${p.description}, ${p.type}, ${p.value},
      ${p.minOrderAmount}, ${p.maxDiscountAmount}, ${p.usageLimit}, ${p.perUserLimit},
      ${startsAt}, ${endsAt}, ${p.active}, ${p.autoApply},
      ${p.showInOffers}, ${p.showInBar}, ${p.priority}, ${p.bgColor}, ${p.textColor},
      ${p.buttonColor}, ${p.buttonText}, ${p.badgeText},
      ${p.appliesTo}, ${targetIdsJson}::jsonb,
      ${p.firstOrderOnly}, ${p.loggedInOnly}, ${p.newCustomersOnly}, ${p.existingCustomersOnly}
    )
    RETURNING *
  `
  return toDTO(row)
}

export async function deleteOryCMSDiscount(id: string): Promise<void> {
  await orycmsPrisma.$executeRaw`
    UPDATE orycms_discounts
    SET deleted_at = now(), updated_at = now()
    WHERE id = ${id}::uuid AND deleted_at IS NULL
  `
}

export async function duplicateOryCMSDiscount(id: string): Promise<DiscountDTO> {
  const source = await getOryCMSDiscount(id)
  if (!source) throw new Error("Discount not found.")
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  const newCode = source.code ? `${source.code}-${suffix}` : null
  return saveOryCMSDiscount({
    ...source,
    name: `${source.name} (Copy)`,
    code: newCode,
    active: false,
  })
}

export async function toggleOryCMSDiscount(id: string, active: boolean): Promise<DiscountDTO> {
  const [row] = await orycmsPrisma.$queryRaw<DiscountRow[]>`
    UPDATE orycms_discounts
    SET active = ${active}, updated_at = now()
    WHERE id = ${id}::uuid AND deleted_at IS NULL
    RETURNING *
  `
  if (!row) throw new Error("Discount not found.")
  return toDTO(row)
}

export type CouponValidationResult = {
  valid: true
  discountId: string
  discountAmount: number
  type: DiscountType
  name: string
  shortText: string | null
  code: string
  isAutoApplied?: boolean
}

export type CouponValidationError = {
  valid: false
  message: string
}

async function getCartProductMetadata(productSlugs: string[]) {
  if (productSlugs.length === 0) return { productSlugs: [], categoryNames: [], brandNames: [] }
  const rows = await orycmsPrisma.$queryRaw<{ id: string; slug: string; category: string; brand: string | null }[]>`
    SELECT id, slug, category, brand FROM orycms_products
    WHERE (slug = ANY(${productSlugs}) OR id::text = ANY(${productSlugs})) AND deleted_at IS NULL
  `
  const slugs = new Set<string>()
  const categories = new Set<string>()
  const brands = new Set<string>()
  for (const r of rows) {
    if (r.slug) slugs.add(r.slug)
    if (r.id) slugs.add(r.id)
    if (r.category) categories.add(r.category)
    if (r.brand) brands.add(r.brand)
  }
  return {
    productSlugs: Array.from(slugs),
    categoryNames: Array.from(categories),
    brandNames: Array.from(brands),
  }
}

export async function checkDiscountConditions(
  discount: DiscountDTO,
  context: {
    userId: string
    subtotal: number
    shippingTotal?: number
    productSlugs?: string[]
    orderCount?: number
  },
): Promise<{ eligible: true; discountAmount: number } | { eligible: false; message: string }> {
  if (!discount.active) {
    return { eligible: false, message: "This discount is no longer active." }
  }

  const now = new Date()
  if (discount.startsAt && new Date(discount.startsAt) > now) {
    return { eligible: false, message: "This discount is not yet active." }
  }
  if (discount.endsAt && new Date(discount.endsAt) < now) {
    return { eligible: false, message: "This discount has expired." }
  }

  if (discount.usageLimit != null && discount.usageCount >= discount.usageLimit) {
    return { eligible: false, message: "This discount usage limit has been reached." }
  }

  if (discount.perUserLimit != null && context.userId) {
    const [usage] = await orycmsPrisma.$queryRaw<{ cnt: bigint }[]>`
      SELECT COUNT(*) AS cnt FROM orycms_discount_usages
      WHERE discount_id = ${discount.id}::uuid AND user_id = ${context.userId}::uuid
    `
    if (Number(usage?.cnt ?? 0) >= discount.perUserLimit) {
      return { eligible: false, message: "You have already used this discount the maximum allowed times." }
    }
  }

  if (discount.minOrderAmount != null && context.subtotal < discount.minOrderAmount) {
    return {
      eligible: false,
      message: `Minimum order amount of ₹${discount.minOrderAmount.toFixed(0)} required for this discount.`,
    }
  }

  const orderCount = context.orderCount ?? 0
  if (discount.firstOrderOnly && orderCount !== 0) {
    return { eligible: false, message: "This discount is valid for first orders only." }
  }
  if (discount.newCustomersOnly && orderCount > 0) {
    return { eligible: false, message: "This discount is for new customers only." }
  }
  if (discount.existingCustomersOnly && orderCount === 0) {
    return { eligible: false, message: "This discount is for existing customers only." }
  }
  if (discount.loggedInOnly && !context.userId) {
    return { eligible: false, message: "You must be logged in to use this discount." }
  }

  if (discount.appliesTo !== "entire_store" && discount.targetIds.length > 0) {
    const targets = discount.targetIds
    const productSlugs = context.productSlugs ?? []
    const meta = await getCartProductMetadata(productSlugs)

    if (discount.appliesTo === "products") {
      const matches = productSlugs.some((s) => targets.includes(s)) || meta.productSlugs.some((s) => targets.includes(s))
      if (!matches) {
        return { eligible: false, message: "This discount is not applicable to the items in your cart." }
      }
    } else if (discount.appliesTo === "categories") {
      const matches = meta.categoryNames.some((c) => targets.includes(c))
      if (!matches) {
        return { eligible: false, message: "This discount is not applicable to the items in your cart." }
      }
    } else if (discount.appliesTo === "brands") {
      const matches = meta.brandNames.some((b) => targets.includes(b))
      if (!matches) {
        return { eligible: false, message: "This discount is not applicable to the items in your cart." }
      }
    }
  }

  let discountAmount = 0
  if (discount.type === "percentage") {
    discountAmount = Math.round((discount.value / 100) * context.subtotal)
    if (discount.maxDiscountAmount != null) discountAmount = Math.min(discountAmount, discount.maxDiscountAmount)
  } else if (discount.type === "fixed") {
    discountAmount = Math.min(discount.value, context.subtotal)
    if (discount.maxDiscountAmount != null) discountAmount = Math.min(discountAmount, discount.maxDiscountAmount)
  } else if (discount.type === "free_shipping") {
    discountAmount = context.shippingTotal ?? 0
  }

  discountAmount = Math.max(0, Math.round(discountAmount))

  if (discountAmount <= 0 && discount.type !== "free_shipping") {
    return { eligible: false, message: "Discount amount evaluates to ₹0 for your current cart." }
  }

  return { eligible: true, discountAmount }
}

export async function evaluateAutoApplyDiscount(context: {
  userId: string
  subtotal: number
  shippingTotal?: number
  productSlugs?: string[]
  orderCount?: number
}): Promise<CouponValidationResult | null> {
  const rows = await orycmsPrisma.$queryRaw<DiscountRow[]>`
    SELECT * FROM orycms_discounts
    WHERE auto_apply = true AND active = true AND deleted_at IS NULL
    ORDER BY priority DESC, created_at DESC
  `
  if (rows.length === 0) return null

  const candidates: { discount: DiscountDTO; amount: number }[] = []

  for (const row of rows) {
    const discount = toDTO(row)
    const check = await checkDiscountConditions(discount, context)
    if (check.eligible) {
      candidates.push({ discount, amount: check.discountAmount })
    }
  }

  if (candidates.length === 0) return null

  candidates.sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount
    return b.discount.priority - a.discount.priority
  })

  const best = candidates[0]

  return {
    valid: true,
    discountId: best.discount.id,
    discountAmount: best.amount,
    type: best.discount.type,
    name: best.discount.name,
    shortText: best.discount.shortText,
    code: best.discount.code ?? "AUTO_APPLIED",
    isAutoApplied: true,
  }
}

export async function validateCouponCode(
  code: string,
  context: {
    userId: string
    subtotal: number
    shippingTotal?: number
    productSlugs?: string[]
    categorySlug?: string
    orderCount?: number
  },
): Promise<CouponValidationResult | CouponValidationError> {
  const upperCode = code.trim().toUpperCase()
  if (!upperCode) return { valid: false, message: "Please enter a coupon code." }

  const rows = await orycmsPrisma.$queryRaw<DiscountRow[]>`
    SELECT * FROM orycms_discounts
    WHERE (code = ${upperCode} OR id::text = ${code}) AND deleted_at IS NULL LIMIT 1
  `
  if (rows.length === 0) return { valid: false, message: "Invalid coupon code." }

  const discount = toDTO(rows[0])
  const check = await checkDiscountConditions(discount, context)

  if (!check.eligible) {
    return { valid: false, message: check.message }
  }

  return {
    valid: true,
    discountId: discount.id,
    discountAmount: check.discountAmount,
    type: discount.type,
    name: discount.name,
    shortText: discount.shortText,
    code: discount.code ?? upperCode,
  }
}

export async function recordDiscountUsage(
  discountId: string,
  userId: string,
  orderId: string,
  amount: number,
): Promise<void> {
  await orycmsPrisma.$executeRaw`
    INSERT INTO orycms_discount_usages (discount_id, user_id, order_id, amount)
    VALUES (${discountId}::uuid, ${userId}::uuid, ${orderId}::uuid, ${amount})
  `
  await orycmsPrisma.$executeRaw`
    UPDATE orycms_discounts SET usage_count = usage_count + 1, updated_at = now()
    WHERE id = ${discountId}::uuid
  `
}

export async function getActiveOffersForProduct(productSlug: string, categorySlug?: string): Promise<DiscountDTO[]> {
  const now = new Date()
  const rows = await orycmsPrisma.$queryRaw<DiscountRow[]>`
    SELECT * FROM orycms_discounts
    WHERE deleted_at IS NULL
      AND active = true
      AND show_in_offers = true
      AND (starts_at IS NULL OR starts_at <= ${now})
      AND (ends_at IS NULL OR ends_at >= ${now})
      AND (usage_limit IS NULL OR usage_count < usage_limit)
    ORDER BY priority DESC, created_at DESC
  `
  const all = rows.map(toDTO)
  return all.filter((d) => {
    if (d.appliesTo === "entire_store") return true
    if (d.appliesTo === "products" && d.targetIds.includes(productSlug)) return true
    if (d.appliesTo === "categories" && categorySlug && d.targetIds.includes(categorySlug)) return true
    return false
  })
}

export type AvailableCouponDTO = {
  id: string
  name: string
  code: string
  shortText: string | null
  description: string | null
  type: DiscountType
  value: number
  minOrderAmount: number | null
  maxDiscountAmount: number | null
  badgeText: string | null
  autoApply: boolean
  eligible: boolean
  discountAmount: number
  ineligibilityReason: string | null
}

export async function listAvailableCoupons(context: {
  userId: string
  subtotal: number
  shippingTotal?: number
  productSlugs?: string[]
  orderCount?: number
}): Promise<AvailableCouponDTO[]> {
  const rows = await orycmsPrisma.$queryRaw<DiscountRow[]>`
    SELECT * FROM orycms_discounts
    WHERE active = true AND deleted_at IS NULL
    ORDER BY priority DESC, created_at DESC
  `

  const results: AvailableCouponDTO[] = []

  for (const row of rows) {
    const discount = toDTO(row)
    const code = discount.code || (discount.autoApply ? "AUTO_APPLIED" : null)
    if (!code) continue

    const check = await checkDiscountConditions(discount, context)

    results.push({
      id: discount.id,
      name: discount.name,
      code,
      shortText: discount.shortText,
      description: discount.description,
      type: discount.type,
      value: discount.value,
      minOrderAmount: discount.minOrderAmount,
      maxDiscountAmount: discount.maxDiscountAmount,
      badgeText: discount.badgeText,
      autoApply: discount.autoApply,
      eligible: check.eligible,
      discountAmount: check.eligible ? check.discountAmount : 0,
      ineligibilityReason: check.eligible ? null : check.message,
    })
  }

  results.sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1
    return b.discountAmount - a.discountAmount
  })

  return results
}
