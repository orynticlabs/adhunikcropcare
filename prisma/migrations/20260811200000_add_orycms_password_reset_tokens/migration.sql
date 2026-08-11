-- CreateTable
CREATE TABLE IF NOT EXISTS "orycms_password_reset_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orycms_password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "orycms_password_reset_tokens_tokenHash_key" ON "orycms_password_reset_tokens"("tokenHash");
CREATE INDEX IF NOT EXISTS "orycms_password_reset_tokens_user_id_idx" ON "orycms_password_reset_tokens"("userId");
CREATE INDEX IF NOT EXISTS "orycms_password_reset_tokens_expires_at_idx" ON "orycms_password_reset_tokens"("expiresAt");

-- AddForeignKey
ALTER TABLE "orycms_password_reset_tokens" ADD CONSTRAINT "orycms_password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "orycms_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
