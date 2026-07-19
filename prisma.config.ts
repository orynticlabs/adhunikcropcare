import { config as loadEnv } from "dotenv"
import { defineConfig } from "prisma/config"

// Default Prisma operations use the same pooled connection as the application.
// Migrations use prisma.migrate.config.ts and DIRECT_DATABASE_URL instead.
if (!process.env["ORYCMS_DATABASE_URL"] && !process.env["DATABASE_URL"]) {
  loadEnv({ path: ".env.local", override: false, quiet: true })
  loadEnv({ path: ".env", override: false, quiet: true })
}

const databaseUrl = process.env["ORYCMS_DATABASE_URL"] ?? process.env["DATABASE_URL"]

if (!databaseUrl) {
  throw new Error("ORYCMS_DATABASE_URL or DATABASE_URL is required for Prisma.")
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
})
