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
}

export type CouponValidationError = {
  valid: false
  message: string
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

  const [row] = await orycmsPrisma.$queryRaw<DiscountRow[]>`
    SELECT * FROM orycms_discounts
    WHERE code = ${upperCode} AND deleted_at IS NULL LIMIT 1
  `
  if (!row) return { valid: false, message: "Invalid coupon code." }

  const discount = toDTO(row)

  if (!discount.active) return { valid: false, message: "This coupon is no longer active." }

  const now = new Date()
  if (discount.startsAt && new Date(discount.startsAt) > now) {
    return { valid: false, message: "This coupon is not yet active." }
  }
  if (discount.endsAt && new Date(discount.endsAt) < now) {
    return { valid: false, message: "This coupon has expired." }
  }

  if (discount.usageLimit != null && discount.usageCount >= discount.usageLimit) {
    return { valid: false, message: "This coupon's usage limit has been reached." }
  }

  if (discount.perUserLimit != null) {
    const [usage] = await orycmsPrisma.$queryRaw<{ cnt: bigint }[]>`
      SELECT COUNT(*) AS cnt FROM orycms_discount_usages
      WHERE discount_id = ${discount.id}::uuid AND user_id = ${context.userId}::uuid
    `
    if (Number(usage?.cnt ?? 0) >= discount.perUserLimit) {
      return { valid: false, message: "You have already used this coupon the maximum number of times." }
    }
  }

  if (discount.minOrderAmount != null && context.subtotal < discount.minOrderAmount) {
    return {
      valid: false,
      message: `Minimum order amount of ₹${discount.minOrderAmount.toFixed(0)} required for this coupon.`,
    }
  }

  if (discount.firstOrderOnly && (context.orderCount ?? 0) !== 0) {
    return { valid: false, message: "This coupon is valid for first orders only." }
  }
  if (discount.newCustomersOnly && (context.orderCount ?? 0) > 0) {
    return { valid: false, message: "This coupon is for new customers only." }
  }
  if (discount.existingCustomersOnly && (context.orderCount ?? 0) === 0) {
    return { valid: false, message: "This coupon is for existing customers only." }
  }

  if (discount.appliesTo !== "entire_store" && discount.targetIds.length > 0) {
    const targets = discount.targetIds
    if (discount.appliesTo === "products") {
      const slugs = context.productSlugs ?? []
      if (!slugs.some((s) => targets.includes(s))) {
        return { valid: false, message: "This coupon is not applicable to the items in your cart." }
      }
    } else if (discount.appliesTo === "categories") {
      const cat = context.categorySlug ?? ""
      if (!targets.includes(cat)) {
        return { valid: false, message: "This coupon is not applicable to the items in your cart." }
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

  return {
    valid: true,
    discountId: discount.id,
    discountAmount,
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
