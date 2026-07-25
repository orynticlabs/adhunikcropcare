import * as Sentry from "@sentry/nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && request.nextUrl.searchParams.get("token") !== process.env.SENTRY_TEST_TOKEN) {
    return NextResponse.json({ success: false, error: { message: "Not found." } }, { status: 404 })
  }

  const now = new Date().toISOString()
  const messageId = Sentry.captureMessage(`Sentry test message ${now}`, "info")
  Sentry.logger.info("Sentry test log", { at: now, source: "api/sentry/test" })
  console.info("Sentry console log test", { at: now, source: "api/sentry/test" })
  const exceptionId = Sentry.captureException(new Error(`Sentry test exception ${now}`))
  await Sentry.flush(2000)

  return NextResponse.json({
    success: true,
    data: {
      exceptionId,
      messageId,
      message: "Sentry test event sent. Check Issues and Logs in Sentry.",
    },
  })
}
