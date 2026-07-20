CREATE TABLE IF NOT EXISTS "orycms_certificates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "issuing_authority" TEXT NOT NULL,
  "certificate_number" TEXT,
  "description" TEXT,
  "image" JSONB,
  "document_url" TEXT,
  "issued_on" DATE,
  "expires_on" DATE,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ(6),
  CONSTRAINT "orycms_certificates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "orycms_certificates_status_check" CHECK ("status" IN ('draft', 'published'))
);

CREATE INDEX IF NOT EXISTS "orycms_certificates_status_display_order_idx"
ON "orycms_certificates"("status", "display_order");

CREATE INDEX IF NOT EXISTS "orycms_certificates_deleted_at_idx"
ON "orycms_certificates"("deleted_at");
