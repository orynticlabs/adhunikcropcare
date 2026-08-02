-- Convert strict full table unique constraints on orycms_products.slug and orycms_products.sku to partial unique indexes
-- ignoring soft-deleted rows (WHERE deleted_at IS NULL) so active products must have unique slugs/SKUs while allowing slug reuse.

ALTER TABLE "orycms_products" DROP CONSTRAINT IF EXISTS "orycms_products_slug_key";
DROP INDEX IF EXISTS "orycms_products_slug_key";

ALTER TABLE "orycms_products" DROP CONSTRAINT IF EXISTS "orycms_products_sku_key";
DROP INDEX IF EXISTS "orycms_products_sku_key";

CREATE UNIQUE INDEX IF NOT EXISTS "idx_orycms_products_active_slug"
ON "orycms_products" ("slug")
WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_orycms_products_active_sku"
ON "orycms_products" ("sku")
WHERE "deleted_at" IS NULL;
