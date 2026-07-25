ALTER TABLE "storefront_orders"
  ADD COLUMN IF NOT EXISTS "confirmed_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "confirmed_by_admin_id" UUID,
  ADD COLUMN IF NOT EXISTS "confirmed_by_admin_email" TEXT;

CREATE INDEX IF NOT EXISTS "storefront_orders_confirmed_at_idx"
  ON "storefront_orders"("confirmed_at");
