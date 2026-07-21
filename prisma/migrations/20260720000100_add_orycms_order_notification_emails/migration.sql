-- Order notification recipients for OryCMS admins.
--
-- Backs the "Order Notification Emails" card on the admin Settings page. Each row
-- is one recipient that receives an order notification when a storefront order is
-- placed. `enabled` lets admins pause a recipient without deleting it; only enabled
-- rows are emailed. Emails are stored lowercased by the application, so a plain
-- unique index on email is sufficient. IF NOT EXISTS keeps this safe to re-run
-- against databases baselined from an existing schema.

CREATE TABLE IF NOT EXISTS "orycms_order_notification_emails" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "email"      TEXT        NOT NULL,
  "label"      TEXT,
  "enabled"    BOOLEAN     NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "orycms_order_notification_emails_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "orycms_order_notification_emails_email_key"
ON "orycms_order_notification_emails"("email");

CREATE INDEX IF NOT EXISTS "orycms_order_notification_emails_enabled_idx"
ON "orycms_order_notification_emails"("enabled");
