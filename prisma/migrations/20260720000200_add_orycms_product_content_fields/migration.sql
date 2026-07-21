-- Long-form product content fields for the storefront product page.
--
-- These back the "Product Description" and the three collapsible accordions on
-- the storefront product view (Product Specifications, How to Use, Shipping &
-- Returns). Each is optional free text/HTML edited from the OryCMS product form;
-- when empty the storefront falls back to sensible defaults. IF NOT EXISTS keeps
-- this safe to re-run against databases baselined from an existing schema.

ALTER TABLE "orycms_products"
  ADD COLUMN IF NOT EXISTS "specifications"   TEXT,
  ADD COLUMN IF NOT EXISTS "how_to_use"       TEXT,
  ADD COLUMN IF NOT EXISTS "shipping_returns" TEXT;
