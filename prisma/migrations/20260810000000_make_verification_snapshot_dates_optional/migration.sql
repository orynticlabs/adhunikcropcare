-- AlterTable
ALTER TABLE "orycms_verified_product_snapshots" ALTER COLUMN "mfg_date" DROP NOT NULL;
ALTER TABLE "orycms_verified_product_snapshots" ALTER COLUMN "pack_date" DROP NOT NULL;
ALTER TABLE "orycms_verified_product_snapshots" ALTER COLUMN "pack_timing" DROP NOT NULL;
ALTER TABLE "orycms_verified_product_snapshots" ALTER COLUMN "supervisor_name" DROP NOT NULL;
ALTER TABLE "orycms_verified_product_snapshots" ALTER COLUMN "contractor_name" DROP NOT NULL;
