-- Discount & Offers Management: discounts, discount usages, announcements, and order coupon columns.

CREATE TABLE IF NOT EXISTS "orycms_discounts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "code" TEXT UNIQUE,
  "short_text" TEXT,
  "description" TEXT,
  "type" TEXT NOT NULL DEFAULT 'percentage',
  "value" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "min_order_amount" DECIMAL(12, 2),
  "max_discount_amount" DECIMAL(12, 2),
  "usage_limit" INTEGER,
  "per_user_limit" INTEGER,
  "usage_count" INTEGER NOT NULL DEFAULT 0,
  "starts_at" TIMESTAMPTZ(6),
  "ends_at" TIMESTAMPTZ(6),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "auto_apply" BOOLEAN NOT NULL DEFAULT false,
  "show_in_offers" BOOLEAN NOT NULL DEFAULT true,
  "show_in_bar" BOOLEAN NOT NULL DEFAULT false,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "bg_color" TEXT,
  "text_color" TEXT,
  "button_color" TEXT,
  "button_text" TEXT,
  "badge_text" TEXT,
  "applies_to" TEXT NOT NULL DEFAULT 'entire_store',
  "target_ids" JSONB NOT NULL DEFAULT '[]',
  "first_order_only" BOOLEAN NOT NULL DEFAULT false,
  "logged_in_only" BOOLEAN NOT NULL DEFAULT false,
  "new_customers_only" BOOLEAN NOT NULL DEFAULT false,
  "existing_customers_only" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ(6),
  CONSTRAINT "orycms_discounts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "orycms_discounts_type_check" CHECK ("type" IN ('percentage', 'fixed', 'free_shipping', 'bxgy')),
  CONSTRAINT "orycms_discounts_applies_to_check" CHECK ("applies_to" IN ('entire_store', 'categories', 'products', 'brands'))
);

CREATE INDEX IF NOT EXISTS "orycms_discounts_active_idx" ON "orycms_discounts"("active");
CREATE INDEX IF NOT EXISTS "orycms_discounts_code_idx" ON "orycms_discounts"("code") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "orycms_discounts_deleted_at_idx" ON "orycms_discounts"("deleted_at");
CREATE INDEX IF NOT EXISTS "orycms_discounts_show_in_offers_idx" ON "orycms_discounts"("show_in_offers", "active");
CREATE INDEX IF NOT EXISTS "orycms_discounts_show_in_bar_idx" ON "orycms_discounts"("show_in_bar", "active");

CREATE TABLE IF NOT EXISTS "orycms_discount_usages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "discount_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "amount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "orycms_discount_usages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "orycms_discount_usages_discount_id_idx" ON "orycms_discount_usages"("discount_id");
CREATE INDEX IF NOT EXISTS "orycms_discount_usages_user_id_discount_id_idx" ON "orycms_discount_usages"("user_id", "discount_id");
CREATE INDEX IF NOT EXISTS "orycms_discount_usages_order_id_idx" ON "orycms_discount_usages"("order_id");

CREATE TABLE IF NOT EXISTS "orycms_announcements" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "content" TEXT NOT NULL DEFAULT '',
  "cta_text" TEXT,
  "cta_url" TEXT,
  "starts_at" TIMESTAMPTZ(6),
  "ends_at" TIMESTAMPTZ(6),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "bg_color" TEXT,
  "text_color" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ(6),
  CONSTRAINT "orycms_announcements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "orycms_announcements_active_idx" ON "orycms_announcements"("active", "priority");
CREATE INDEX IF NOT EXISTS "orycms_announcements_deleted_at_idx" ON "orycms_announcements"("deleted_at");

ALTER TABLE "storefront_orders"
  ADD COLUMN IF NOT EXISTS "coupon_code" TEXT,
  ADD COLUMN IF NOT EXISTS "coupon_id" UUID;
