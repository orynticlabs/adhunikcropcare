-- CreateTable
CREATE TABLE IF NOT EXISTS "orycms_verification_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orycms_verification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "orycms_verified_product_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "product_id" UUID NOT NULL,
    "uin" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "pack_size" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "mrp" DECIMAL(12,2) NOT NULL,
    "sale_price" DECIMAL(12,2),
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "mfg_date" DATE NOT NULL,
    "expiry_date" DATE,
    "pack_timing" TEXT NOT NULL,
    "pack_date" DATE NOT NULL,
    "supervisor_name" TEXT NOT NULL,
    "contractor_name" TEXT NOT NULL,
    "verify_description" TEXT,
    "verify_image" JSONB,
    "literature" TEXT,
    "msds" TEXT,
    "license" TEXT,
    "cir" TEXT,
    "epr_number" TEXT,
    "plastic_category" TEXT,
    "leaflet_info" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orycms_verified_product_snapshots_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "orycms_products" 
ADD COLUMN IF NOT EXISTS "verify_description" TEXT,
ADD COLUMN IF NOT EXISTS "verify_image" JSONB,
ADD COLUMN IF NOT EXISTS "mfg_date" DATE,
ADD COLUMN IF NOT EXISTS "expiry_date" DATE,
ADD COLUMN IF NOT EXISTS "pack_timing" TEXT,
ADD COLUMN IF NOT EXISTS "pack_date" DATE,
ADD COLUMN IF NOT EXISTS "supervisor_name" TEXT,
ADD COLUMN IF NOT EXISTS "contractor_name" TEXT,
ADD COLUMN IF NOT EXISTS "literature" TEXT,
ADD COLUMN IF NOT EXISTS "msds" TEXT,
ADD COLUMN IF NOT EXISTS "license" TEXT,
ADD COLUMN IF NOT EXISTS "cir" TEXT,
ADD COLUMN IF NOT EXISTS "epr_number" TEXT,
ADD COLUMN IF NOT EXISTS "plastic_category" TEXT,
ADD COLUMN IF NOT EXISTS "leaflet_info" TEXT,
ADD COLUMN IF NOT EXISTS "uin" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "orycms_verified_product_snapshots_slug_key" ON "orycms_verified_product_snapshots"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orycms_verified_product_snapshots_slug_idx" ON "orycms_verified_product_snapshots"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orycms_verified_product_snapshots_product_id_idx" ON "orycms_verified_product_snapshots"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "orycms_products_uin_key" ON "orycms_products"("uin");
