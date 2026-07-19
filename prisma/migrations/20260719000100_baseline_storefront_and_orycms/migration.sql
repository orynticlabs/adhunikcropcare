-- Baseline marker for databases that existed before Prisma Migrate was adopted.
--
-- Existing databases record this migration as applied. Empty databases apply it
-- normally. The following reconciliation migration performs all idempotent
-- CREATE TABLE IF NOT EXISTS and ADD COLUMN IF NOT EXISTS operations.
SELECT 1;
