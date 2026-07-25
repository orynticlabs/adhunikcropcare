ALTER TABLE "storefront_orders"
  ADD COLUMN IF NOT EXISTS "packed_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "packed_by_admin_id" UUID,
  ADD COLUMN IF NOT EXISTS "packed_by_admin_email" TEXT;

CREATE INDEX IF NOT EXISTS "storefront_orders_packed_at_idx"
  ON "storefront_orders"("packed_at");
