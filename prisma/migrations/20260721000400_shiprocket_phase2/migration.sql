-- Shiprocket Phase 2: job queue, API/activity logs, notification settings, shipment error + pickup fields.

ALTER TABLE "storefront_shipments"
  ADD COLUMN IF NOT EXISTS "pickup_token" TEXT,
  ADD COLUMN IF NOT EXISTS "retry_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "last_error_code" TEXT,
  ADD COLUMN IF NOT EXISTS "last_error_message" TEXT,
  ADD COLUMN IF NOT EXISTS "last_retry_at" TIMESTAMPTZ(6);

CREATE TABLE IF NOT EXISTS "shiprocket_jobs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "type" TEXT NOT NULL,
  "order_id" UUID,
  "shipment_id" UUID,
  "payload" JSONB NOT NULL DEFAULT '{}',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "max_attempts" INTEGER NOT NULL DEFAULT 5,
  "run_after" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "locked_at" TIMESTAMPTZ(6),
  "last_error" TEXT,
  "last_error_code" TEXT,
  "dedupe_key" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shiprocket_jobs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "shiprocket_jobs_dedupe_key_key" UNIQUE ("dedupe_key")
);

CREATE INDEX IF NOT EXISTS "shiprocket_jobs_status_run_after_idx" ON "shiprocket_jobs"("status", "run_after");

CREATE TABLE IF NOT EXISTS "shiprocket_api_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" UUID,
  "shipment_id" UUID,
  "direction" TEXT NOT NULL DEFAULT 'request',
  "endpoint" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "status_code" INTEGER,
  "ok" BOOLEAN NOT NULL DEFAULT false,
  "error_code" TEXT,
  "error_message" TEXT,
  "request_summary" JSONB,
  "response_summary" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shiprocket_api_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "shiprocket_api_logs_shipment_id_created_at_idx" ON "shiprocket_api_logs"("shipment_id", "created_at");
CREATE INDEX IF NOT EXISTS "shiprocket_api_logs_order_id_created_at_idx" ON "shiprocket_api_logs"("order_id", "created_at");

CREATE TABLE IF NOT EXISTS "orycms_shiprocket_notification_settings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "shipment_created" BOOLEAN NOT NULL DEFAULT true,
  "shipped" BOOLEAN NOT NULL DEFAULT true,
  "out_for_delivery" BOOLEAN NOT NULL DEFAULT true,
  "delivered" BOOLEAN NOT NULL DEFAULT true,
  "cancelled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "orycms_shiprocket_notification_settings_pkey" PRIMARY KEY ("id")
);
