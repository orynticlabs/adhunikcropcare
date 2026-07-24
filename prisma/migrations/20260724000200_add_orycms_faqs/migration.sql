-- CreateTable
CREATE TABLE IF NOT EXISTS "orycms_faqs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'published',
    "category" TEXT DEFAULT 'General',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "orycms_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "orycms_faqs_status_display_order_idx" ON "orycms_faqs"("status", "display_order");
CREATE INDEX IF NOT EXISTS "orycms_faqs_deleted_at_idx" ON "orycms_faqs"("deleted_at");
