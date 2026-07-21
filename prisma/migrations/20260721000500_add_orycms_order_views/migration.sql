-- Per-admin "orders last viewed" marker powering the unread-orders sidebar badge.

CREATE TABLE IF NOT EXISTS "orycms_order_views" (
  "user_id" UUID NOT NULL,
  "last_viewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "orycms_order_views_pkey" PRIMARY KEY ("user_id")
);
