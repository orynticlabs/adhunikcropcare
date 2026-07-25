ALTER TABLE "storefront_shipments"
  ADD COLUMN IF NOT EXISTS "return_status" TEXT,
  ADD COLUMN IF NOT EXISTS "reverse_pickup_status" TEXT,
  ADD COLUMN IF NOT EXISTS "return_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "return_updated_at" TIMESTAMPTZ(6);
