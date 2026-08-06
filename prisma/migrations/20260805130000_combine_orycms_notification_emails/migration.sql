-- CreateTable
CREATE TABLE "orycms_notification_emails" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "label" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orycms_notification_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orycms_notification_emails_email_key" ON "orycms_notification_emails"("email");

-- CreateIndex
CREATE INDEX "orycms_notification_emails_enabled_idx" ON "orycms_notification_emails"("enabled");

-- Copy data from orycms_order_notification_emails and orycms_contact_notification_emails
-- Avoid duplicates on email using ON CONFLICT DO NOTHING
INSERT INTO "orycms_notification_emails" ("id", "email", "label", "enabled", "created_at", "updated_at")
SELECT "id", "email", "label", "enabled", "created_at", "updated_at"
FROM "orycms_order_notification_emails"
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "orycms_notification_emails" ("email", "label", "enabled", "created_at", "updated_at")
SELECT "email", "label", "enabled", "created_at", "updated_at"
FROM "orycms_contact_notification_emails"
ON CONFLICT ("email") DO NOTHING;

-- Drop old tables
DROP TABLE IF EXISTS "orycms_order_notification_emails";
DROP TABLE IF EXISTS "orycms_contact_notification_emails";
