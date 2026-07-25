import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  includeLocalVariables: true,
  enableLogs: true,
  debug: process.env.SENTRY_DEBUG === "true",
  integrations: [Sentry.consoleLoggingIntegration({ levels: ["log", "info", "warn", "error"] })],
})
