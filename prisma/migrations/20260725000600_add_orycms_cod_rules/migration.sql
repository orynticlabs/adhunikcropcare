-- CreateTable: orycms_cod_rules
CREATE TABLE IF NOT EXISTS "orycms_cod_rules" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "min_orders_required" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orycms_cod_rules_pkey" PRIMARY KEY ("id")
);

-- Insert initial default record
INSERT INTO "orycms_cod_rules" ("id", "min_orders_required")
VALUES ('default', 0)
ON CONFLICT ("id") DO NOTHING;
