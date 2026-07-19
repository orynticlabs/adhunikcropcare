-- Additive reconciliation for the OryCMS user and inventory code introduced
-- after the original database baseline. Existing rows and tables are preserved.

ALTER TABLE "orycms_users" ADD COLUMN IF NOT EXISTS "username" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "orycms_users_username_active_idx"
ON "orycms_users" (lower("username"))
WHERE "username" IS NOT NULL AND "deletedAt" IS NULL;

CREATE TABLE IF NOT EXISTS "orycms_inventory_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "product_id" UUID,
  "type" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "reason" TEXT,
  "updated_by" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "orycms_inventory_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "orycms_inventory_events_product_id_idx"
ON "orycms_inventory_events"("product_id");

CREATE INDEX IF NOT EXISTS "orycms_inventory_events_created_at_idx"
ON "orycms_inventory_events"("created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orycms_categories_parent_id_fkey'
      AND conrelid = 'orycms_categories'::regclass
  ) THEN
    ALTER TABLE "orycms_categories"
      ADD CONSTRAINT "orycms_categories_parent_id_fkey"
      FOREIGN KEY ("parent_id") REFERENCES "orycms_categories"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;
