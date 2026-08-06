import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { validateContactForm } from "@/lib/contact-form"
import { sendContactAdminNotifications, sendContactUserConfirmationEmail } from "@/lib/email/mailer"

const TOPIC_LABELS: Record<string, string> = {
  general_enquiry: "General Enquiry",
  product_guidance: "Product Guidance",
  bulk_dealership: "Bulk & Dealership Inquiry",
  technical_support: "Technical Agronomist Support",
}
import { generateContactTicketId } from "@/lib/orycms/contact-enquiries"
import { getEnabledNotificationRecipients } from "@/lib/orycms/notification-emails"
import { createOryCMSNotification } from "@/lib/orycms/notifications"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { rateLimit, requestKey, requireCsrf } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    await rateLimit(await requestKey("contact"), 5, 10 * 60_000)
    await requireCsrf()

    const contentType = request.headers.get("content-type") ?? ""
    if (!contentType.includes("application/json")) {
      return errorResponse("Submit the form using a valid request.", 415, "INVALID_CONTENT_TYPE")
    }

    const body = await request.json()
    if (typeof body?.website === "string" && body.website.trim()) {
      return NextResponse.json({ success: true, data: { message: "Your enquiry has been received." } }, { status: 201 })
    }

    const validation = validateContactForm(body)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            fields: validation.errors,
            message: "Please correct the highlighted fields.",
          },
        },
        { status: 422 },
      )
    }

    const ticketId = await generateContactTicketId()
    const [enquiry] = await orycmsPrisma.$queryRaw<{ id: string; ticket_id: string }[]>`
      INSERT INTO storefront_contact_enquiries (ticket_id, full_name, country_code, mobile_number, email, topic, location, message)
      VALUES (${ticketId}, ${validation.values.fullName}, '+91', ${validation.values.mobileNumber}, ${validation.values.email}, ${validation.values.topic}, ${validation.values.location}, ${validation.values.message})
      RETURNING id, ticket_id
    `

    const topicLabel = TOPIC_LABELS[validation.values.topic] ?? validation.values.topic.replace(/_/g, " ")
    const contactData = {
      email: validation.values.email,
      fullName: validation.values.fullName,
      location: validation.values.location,
      message: validation.values.message,
      mobileNumber: validation.values.mobileNumber,
      ticketId: enquiry.ticket_id,
      topic: validation.values.topic,
      topicLabel,
    }

    // 1. Send User Confirmation Email
    void sendContactUserConfirmationEmail(contactData).catch((err) =>
      console.error("[Email Error] Failed to send contact user confirmation:", err),
    )

    // 2. Send Admin Notification Email to configured recipients
    void getEnabledNotificationRecipients()
      .then((recipients) => sendContactAdminNotifications(recipients, contactData))
      .catch((err) => console.error("[Email Error] Failed to send contact admin notifications:", err))

    await createOryCMSNotification({
      type: "customer",
      title: `New Contact Enquiry ${enquiry.ticket_id}`,
      message: `${validation.values.fullName} submitted a ${topicLabel} enquiry.`,
      entityId: enquiry.id,
      entityType: "contact",
      targetUrl: `/admin/collections/contact?highlight=${enquiry.id}`,
    }).catch((error) => console.error("OryCMS notification failed", error))

    return NextResponse.json(
      {
        success: true,
        data: {
          id: enquiry.id,
          ticketId: enquiry.ticket_id,
          message: "Thank you. Your enquiry has been received and our team will contact you soon.",
        },
      },
      { status: 201 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit your enquiry."
    if (message.includes("Too many attempts")) return errorResponse(message, 429, "RATE_LIMITED")
    if (message.includes("Security check failed")) return errorResponse(message, 403, "CSRF_FAILED")
    return errorResponse("Unable to submit your enquiry right now. Please try again shortly.", 500, "CONTACT_ERROR")
  }
}

function errorResponse(message: string, status: number, code: string) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}
