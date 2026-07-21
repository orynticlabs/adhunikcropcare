-- Shiprocket integration: settings, shipments, shipment events, and order status column.

ALTER TABLE "storefront_orders"
  ADD COLUMN IF NOT EXISTS "shiprocket_status" TEXT;

CREATE TABLE IF NOT EXISTS "orycms_shiprocket_settings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "api_email" TEXT,
  "api_password_encrypted" TEXT,
  "channel_id" TEXT,
  "pickup_location" TEXT,
  "pickup_name" TEXT,
  "pickup_phone" TEXT,
  "pickup_address1" TEXT,
  "pickup_address2" TEXT,
  "pickup_city" TEXT,
  "pickup_state" TEXT,
  "pickup_country" TEXT NOT NULL DEFAULT 'India',
  "pickup_pincode" TEXT,
  "package_length_cm" DECIMAL(10, 2) NOT NULL DEFAULT 10,
  "package_breadth_cm" DECIMAL(10, 2) NOT NULL DEFAULT 10,
  "package_height_cm" DECIMAL(10, 2) NOT NULL DEFAULT 10,
  "package_weight_kg" DECIMAL(10, 3) NOT NULL DEFAULT 0.5,
  "auto_ship_on_confirm" BOOLEAN NOT NULL DEFAULT false,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "orycms_shiprocket_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "storefront_shipments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL,
  "shiprocket_order_id" TEXT,
  "shiprocket_shipment_id" TEXT,
  "awb_code" TEXT,
  "courier_name" TEXT,
  "courier_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'created',
  "status_code" TEXT,
  "tracking_url" TEXT,
  "estimated_delivery_date" TIMESTAMPTZ(6),
  "shipping_charge" DECIMAL(12, 2),
  "pickup_scheduled_date" TIMESTAMPTZ(6),
  "pickup_status" TEXT,
  "label_url" TEXT,
  "manifest_url" TEXT,
  "invoice_url" TEXT,
  "raw_response" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "storefront_shipments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "storefront_shipments_order_id_key" UNIQUE ("order_id")
);

CREATE INDEX IF NOT EXISTS "storefront_shipments_order_id_idx" ON "storefront_shipments"("order_id");
CREATE INDEX IF NOT EXISTS "storefront_shipments_awb_code_idx" ON "storefront_shipments"("awb_code");
CREATE INDEX IF NOT EXISTS "storefront_shipments_shiprocket_shipment_id_idx" ON "storefront_shipments"("shiprocket_shipment_id");

CREATE TABLE IF NOT EXISTS "storefront_shipment_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "shipment_id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "status" TEXT NOT NULL,
  "status_code" TEXT,
  "location" TEXT,
  "activity" TEXT,
  "occurred_at" TIMESTAMPTZ(6) NOT NULL,
  "raw" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "storefront_shipment_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "storefront_shipment_events_dedupe_key" UNIQUE ("shipment_id", "status_code", "occurred_at")
);

CREATE INDEX IF NOT EXISTS "storefront_shipment_events_shipment_id_idx" ON "storefront_shipment_events"("shipment_id");
CREATE INDEX IF NOT EXISTS "storefront_shipment_events_order_id_idx" ON "storefront_shipment_events"("order_id");
