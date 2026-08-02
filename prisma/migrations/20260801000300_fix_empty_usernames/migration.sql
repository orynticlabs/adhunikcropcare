-- Clean up any empty string usernames in orycms_users to NULL to prevent unique constraint violations on empty strings
UPDATE "orycms_users" SET "username" = NULL WHERE "username" IS NOT NULL AND ("username" = '' OR trim("username") = '');
