-- Make orycms_products.sku nullable so blank SKUs store as NULL, allowing multiple products without SKUs under unique partial index.
ALTER TABLE "orycms_products" ALTER COLUMN "sku" DROP NOT NULL;

-- Convert existing empty string SKUs ('') to NULL so they don't violate idx_orycms_products_active_sku
UPDATE "orycms_products" SET "sku" = NULL WHERE "sku" = '';
