CREATE TABLE IF NOT EXISTS "orycms_notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "entity_id" TEXT,
  "entity_type" TEXT,
  "target_url" TEXT NOT NULL,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "orycms_notifications_dedupe_key"
  ON "orycms_notifications"("type", "entity_type", "entity_id", "title");

CREATE INDEX IF NOT EXISTS "orycms_notifications_is_read_created_at_idx"
  ON "orycms_notifications"("is_read", "created_at");
