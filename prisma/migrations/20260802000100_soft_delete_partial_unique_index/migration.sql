-- Convert strict full table unique constraint on orycms_users.email to a partial unique index
-- ignoring soft-deleted rows (WHERE "deletedAt" IS NULL) so soft-deleted users can be re-created with the same email.

ALTER TABLE "orycms_users" DROP CONSTRAINT IF EXISTS "orycms_users_email_key";
DROP INDEX IF EXISTS "orycms_users_email_key";

CREATE UNIQUE INDEX IF NOT EXISTS "orycms_users_email_active_idx"
ON "orycms_users" (lower("email"))
WHERE "deletedAt" IS NULL;
