const orycmsConfig = {
  api: {
    basePath: "/api/orycms",
  },
  database: {
    provider: "neon",
    orm: "prisma",
    url: process.env.ORYCMS_DATABASE_URL ?? process.env.DATABASE_URL,
  },
  auth: {
    provider: "next-auth",
    sessionCookieName: "orycms_session",
  },
  plugins: {
    enabled: true,
    entries: [],
  },
  hooks: {
    enabled: true,
  },
  admin: {
    enabled: true,
    basePath: "/admin",
  },
  storage: {
    provider: "local",
  },
} as const

export default orycmsConfig
