-- Storefront contact requests submitted from the public Contact Us page.

CREATE TABLE IF NOT EXISTS "storefront_contact_enquiries" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "full_name" TEXT NOT NULL,
  "country_code" TEXT NOT NULL DEFAULT '+91',
  "mobile_number" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'new',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "storefront_contact_enquiries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "storefront_contact_enquiries_mobile_number_check" CHECK ("mobile_number" ~ '^[0-9]{10}$'),
  CONSTRAINT "storefront_contact_enquiries_country_code_check" CHECK ("country_code" = '+91')
);

CREATE INDEX IF NOT EXISTS "storefront_contact_enquiries_status_created_at_idx"
ON "storefront_contact_enquiries"("status", "created_at");

CREATE INDEX IF NOT EXISTS "storefront_contact_enquiries_email_idx"
ON "storefront_contact_enquiries"("email");
