-- AlterTable
ALTER TABLE "orycms_users" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "orycms_users" ADD COLUMN IF NOT EXISTS "invited" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orycms_users" ADD COLUMN IF NOT EXISTS "lastInvitedAt" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE IF NOT EXISTS "orycms_invitation_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "invitedByAdminId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orycms_invitation_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "orycms_admin_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "adminId" UUID,
    "adminEmail" TEXT,
    "targetUserId" UUID,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orycms_admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "orycms_invitation_tokens_tokenHash_key" ON "orycms_invitation_tokens"("tokenHash");
CREATE INDEX IF NOT EXISTS "orycms_invitation_tokens_user_id_idx" ON "orycms_invitation_tokens"("userId");
CREATE INDEX IF NOT EXISTS "orycms_invitation_tokens_expires_at_idx" ON "orycms_invitation_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orycms_admin_audit_logs_admin_id_idx" ON "orycms_admin_audit_logs"("adminId");
CREATE INDEX IF NOT EXISTS "orycms_admin_audit_logs_target_user_id_idx" ON "orycms_admin_audit_logs"("targetUserId");
CREATE INDEX IF NOT EXISTS "orycms_admin_audit_logs_created_at_idx" ON "orycms_admin_audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "orycms_invitation_tokens" ADD CONSTRAINT "orycms_invitation_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "orycms_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
