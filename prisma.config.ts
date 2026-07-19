import { config as loadEnv } from "dotenv"
import { defineConfig } from "prisma/config"

// Prisma CLI runs before Next.js during builds, so load Next's local env file
// only when deployment environment variables were not already supplied.
if (!process.env["ORYCMS_DATABASE_URL"] && !process.env["DATABASE_URL"]) {
  loadEnv({ path: ".env.local", override: false, quiet: true })
  loadEnv({ path: ".env", override: false, quiet: true })
}

const databaseUrl = process.env["ORYCMS_DATABASE_URL"] ?? process.env["DATABASE_URL"]

if (!databaseUrl) {
  throw new Error("ORYCMS_DATABASE_URL or DATABASE_URL is required for Prisma migrations.")
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
