-- CreateTable
CREATE TABLE IF NOT EXISTS "orycms_contact_notification_emails" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "label" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orycms_contact_notification_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "orycms_contact_notification_emails_email_key" ON "orycms_contact_notification_emails"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orycms_contact_notification_emails_enabled_idx" ON "orycms_contact_notification_emails"("enabled");
