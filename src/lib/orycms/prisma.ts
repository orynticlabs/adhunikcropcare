import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as { orycmsPrisma?: PrismaClient }
const databaseUrl = process.env.ORYCMS_DATABASE_URL ?? process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("ORYCMS_DATABASE_URL or DATABASE_URL is required for Prisma.")
}

export const orycmsPrisma =
  globalForPrisma.orycmsPrisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.orycmsPrisma = orycmsPrisma
}
