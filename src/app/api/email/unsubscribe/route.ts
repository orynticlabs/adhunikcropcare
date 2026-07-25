import { NextResponse } from "next/server"
import { disableOptionalEmails, OPTIONAL_EMAIL_TYPES, validPreferenceToken } from "@/lib/email/mailer"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const userId = url.searchParams.get("user") ?? ""
  const token = url.searchParams.get("token") ?? ""
  if (!userId || !token || !validPreferenceToken(userId, token)) {
    return new NextResponse("This unsubscribe link is invalid.", { status: 400 })
  }
  await disableOptionalEmails(userId, [...OPTIONAL_EMAIL_TYPES])
  return new NextResponse("You have been unsubscribed from cart, offer, and sale emails. Essential account and order emails will continue.", { headers: { "content-type": "text/plain; charset=utf-8" } })
}
