-- Storefront-only email OTP verification used before customer account creation.
-- OTPs expire after five minutes in application code and are stored only as hashes.

CREATE TABLE IF NOT EXISTS "storefront_signup_otps" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "otp_hash" TEXT NOT NULL,
  "verification_token_hash" TEXT,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "verified_at" TIMESTAMPTZ(6),
  "consumed_at" TIMESTAMPTZ(6),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "storefront_signup_otps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "storefront_signup_otps_verification_token_hash_key"
ON "storefront_signup_otps"("verification_token_hash");

CREATE INDEX IF NOT EXISTS "storefront_signup_otps_email_created_at_idx"
ON "storefront_signup_otps"("email", "created_at");

CREATE INDEX IF NOT EXISTS "storefront_signup_otps_expires_at_idx"
ON "storefront_signup_otps"("expires_at");
