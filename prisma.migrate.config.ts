import { config as loadEnv } from "dotenv"
import { defineConfig } from "prisma/config"

if (!process.env["DIRECT_DATABASE_URL"]) {
  loadEnv({ path: ".env.local", override: false, quiet: true })
  loadEnv({ path: ".env", override: false, quiet: true })
}

const directDatabaseUrl = process.env["DIRECT_DATABASE_URL"]

if (!directDatabaseUrl) {
  throw new Error("DIRECT_DATABASE_URL is required for Prisma migrations.")
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directDatabaseUrl,
  },
})
