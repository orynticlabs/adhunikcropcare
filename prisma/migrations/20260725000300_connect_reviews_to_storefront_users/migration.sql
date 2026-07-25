-- AlterTable
ALTER TABLE "storefront_product_reviews"
  DROP COLUMN IF EXISTS "reviewer_name",
  DROP COLUMN IF EXISTS "reviewer_email",
  ADD COLUMN IF NOT EXISTS "user_id" UUID;

-- Set default verified to true
ALTER TABLE "storefront_product_reviews"
  ALTER COLUMN "verified" SET DEFAULT true;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "storefront_product_reviews_user_id_idx" ON "storefront_product_reviews"("user_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'storefront_product_reviews_user_id_fkey'
  ) THEN
    ALTER TABLE "storefront_product_reviews"
      ADD CONSTRAINT "storefront_product_reviews_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "storefront_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
