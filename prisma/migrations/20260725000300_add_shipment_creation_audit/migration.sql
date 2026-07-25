ALTER TABLE "storefront_shipments"
  ADD COLUMN IF NOT EXISTS "tracking_number" TEXT,
  ADD COLUMN IF NOT EXISTS "shipment_created_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "shipment_created_by_admin_id" UUID;

CREATE INDEX IF NOT EXISTS "storefront_shipments_shipment_created_at_idx"
  ON "storefront_shipments"("shipment_created_at");
