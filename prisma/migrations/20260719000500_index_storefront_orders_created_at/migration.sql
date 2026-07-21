-- Index storefront_orders on created_at.
--
-- The OryCMS admin dashboard, analytics insights, and order list all filter and
-- sort storefront_orders by created_at (date-range windows + "latest orders").
-- Without this index every one of those reads is a full table scan, which is the
-- main reason the admin data was slow to load. IF NOT EXISTS keeps it safe to
-- re-run against databases that were baselined from an existing schema.

CREATE INDEX IF NOT EXISTS "storefront_orders_created_at_idx"
ON "storefront_orders"("created_at");
