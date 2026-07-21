-- Payments module: Razorpay payment/refund/settlement mirror, webhook logs, and payment audit log.

CREATE TABLE IF NOT EXISTS "razorpay_payments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "razorpay_payment_id" TEXT NOT NULL,
  "razorpay_order_id" TEXT,
  "order_id" UUID,
  "order_number" TEXT,
  "customer_name" TEXT,
  "amount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  "amount_refunded" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" TEXT NOT NULL,
  "method" TEXT,
  "captured" BOOLEAN NOT NULL DEFAULT false,
  "email" TEXT,
  "contact" TEXT,
  "fee" DECIMAL(14, 2),
  "tax" DECIMAL(14, 2),
  "refund_status" TEXT,
  "international" BOOLEAN NOT NULL DEFAULT false,
  "notes" JSONB,
  "raw" JSONB,
  "created_at_rzp" TIMESTAMPTZ(6),
  "synced_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "razorpay_payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "razorpay_payments_razorpay_payment_id_key" UNIQUE ("razorpay_payment_id")
);

CREATE INDEX IF NOT EXISTS "razorpay_payments_order_id_idx" ON "razorpay_payments"("order_id");
CREATE INDEX IF NOT EXISTS "razorpay_payments_status_idx" ON "razorpay_payments"("status");
CREATE INDEX IF NOT EXISTS "razorpay_payments_method_idx" ON "razorpay_payments"("method");
CREATE INDEX IF NOT EXISTS "razorpay_payments_created_at_rzp_idx" ON "razorpay_payments"("created_at_rzp");

CREATE TABLE IF NOT EXISTS "razorpay_refunds" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "razorpay_refund_id" TEXT NOT NULL,
  "razorpay_payment_id" TEXT NOT NULL,
  "order_id" UUID,
  "amount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" TEXT NOT NULL,
  "speed_processed" TEXT,
  "reason" TEXT,
  "receipt" TEXT,
  "notes" JSONB,
  "raw" JSONB,
  "created_at_rzp" TIMESTAMPTZ(6),
  "synced_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "razorpay_refunds_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "razorpay_refunds_razorpay_refund_id_key" UNIQUE ("razorpay_refund_id")
);

CREATE INDEX IF NOT EXISTS "razorpay_refunds_payment_id_idx" ON "razorpay_refunds"("razorpay_payment_id");
CREATE INDEX IF NOT EXISTS "razorpay_refunds_status_idx" ON "razorpay_refunds"("status");

CREATE TABLE IF NOT EXISTS "razorpay_settlements" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "razorpay_settlement_id" TEXT NOT NULL,
  "amount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  "fees" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  "tax" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL,
  "settled" BOOLEAN NOT NULL DEFAULT false,
  "utr" TEXT,
  "raw" JSONB,
  "created_at_rzp" TIMESTAMPTZ(6),
  "synced_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "razorpay_settlements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "razorpay_settlements_razorpay_settlement_id_key" UNIQUE ("razorpay_settlement_id")
);

CREATE INDEX IF NOT EXISTS "razorpay_settlements_status_idx" ON "razorpay_settlements"("status");
CREATE INDEX IF NOT EXISTS "razorpay_settlements_created_at_rzp_idx" ON "razorpay_settlements"("created_at_rzp");

CREATE TABLE IF NOT EXISTS "razorpay_webhook_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "event" TEXT NOT NULL,
  "razorpay_event_id" TEXT,
  "signature_valid" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'received',
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT,
  "payload" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "razorpay_webhook_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "razorpay_webhook_logs_event_idx" ON "razorpay_webhook_logs"("event");
CREATE INDEX IF NOT EXISTS "razorpay_webhook_logs_created_at_idx" ON "razorpay_webhook_logs"("created_at");

CREATE TABLE IF NOT EXISTS "orycms_payment_audit_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "admin_id" UUID,
  "admin_email" TEXT,
  "action" TEXT NOT NULL,
  "payment_id" TEXT,
  "refund_id" TEXT,
  "detail" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "orycms_payment_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "orycms_payment_audit_logs_payment_id_idx" ON "orycms_payment_audit_logs"("payment_id");
CREATE INDEX IF NOT EXISTS "orycms_payment_audit_logs_created_at_idx" ON "orycms_payment_audit_logs"("created_at");
