import { NextResponse } from "next/server"
import { jsonError, requireCsrf, requireUser } from "@/lib/storefront-auth"
import { emailBaseUrl, sendEmail } from "@/lib/email/mailer"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    await requireCsrf()
    const user = await requireUser()
    const body = await request.json() as { productName?: string; type?: string }
    const template = body.type === "wishlist" ? "wishlistUpdate" : body.type === "cart" ? "cartUpdate" : null
    if (!template || !body.productName?.trim()) return jsonError("Invalid email event.", 422, "INVALID_EMAIL_EVENT")
    await sendEmail({
      actionUrl: template === "cartUpdate" ? `${emailBaseUrl()}/checkout` : `${emailBaseUrl()}/account`,
      firstName: user.firstName,
      productName: body.productName.trim(),
      template,
      to: user.email,
      unsubscribeUrl: "",
      userId: user.id,
    })
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    // Product actions must succeed even when the visitor is signed out or mail is unavailable.
    return jsonError(error instanceof Error ? error.message : "Email notification failed.", 400, "EMAIL_EVENT_FAILED")
  }
}
