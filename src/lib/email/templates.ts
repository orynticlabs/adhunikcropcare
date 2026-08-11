export type EmailTemplateName =
  | "accountVerification"
  | "emailVerified"
  | "passwordReset"
  | "orderPlaced"
  | "orderCancelled"
  | "refundUpdate"
  | "cartUpdate"
  | "offerAnnouncement"
  | "saleAnnouncement"
  | "adminOrderNotification"
  | "adminLowStockNotification"
  | "contactUserConfirmation"
  | "contactAdminNotification"
  | "shipmentCreated"
  | "shipmentShipped"
  | "shipmentOutForDelivery"
  | "shipmentDelivered"
  | "shipmentCancelled"
  | "adminInvitation"
  | "adminPasswordReset"
  | "adminPasswordResetSuccess"

type TemplateInput = {
  actionUrl?: string
  adminContactUrl?: string
  adminOrderUrl?: string
  adminProductUrl?: string
  awbCode?: string
  courierName?: string
  customerEmail?: string
  customerName?: string
  email?: string
  estimatedDelivery?: string
  fullName?: string
  invitedBy?: string
  location?: string
  message?: string
  mobileNumber?: string
  orderDate?: string
  orderStatus?: string
  otp?: string
  firstName?: string
  orderNumber?: string
  paymentMethod?: string
  paymentStatus?: string
  productName?: string
  setupUrl?: string
  resetUrl?: string
  stockQuantity?: number
  refundStatus?: string
  ticketId?: string
  topic?: string
  topicLabel?: string
  total?: number
  trackingUrl?: string
  unsubscribeUrl: string
}

const brand = "Adhunik Crop Care"

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]!)
}

function layout(title: string, content: string, unsubscribeUrl: string) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <style>
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; max-width: 100% !important; height: auto !important; }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 12px 8px !important; }
      .email-card { padding: 18px 14px !important; border-radius: 12px !important; }
      .table-cell-label { width: 40% !important; font-size: 11.5px !important; }
      .table-cell-value { width: 60% !important; font-size: 12px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f3f6f1;font-family:Arial,Helvetica,sans-serif;color:#173c31;-webkit-font-smoothing:antialiased;width:100% !important">
  <div class="email-wrapper" style="max-width:600px;margin:0 auto;padding:24px 12px;box-sizing:border-box">
    <div class="email-card" style="background:#ffffff;border:1px solid #dce5d8;border-radius:16px;padding:28px 24px;box-shadow:0 2px 8px rgba(0,0,0,0.03)">
      <div style="border-bottom:2px solid #033927;padding-bottom:12px;margin-bottom:20px">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#033927;letter-spacing:-0.3px">${escapeHtml(title)}</h1>
      </div>
      ${content}
      <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e3ece0;font-size:13px;color:#495850">
        Regards,<br><strong style="color:#033927">${brand} Team</strong>
      </div>
    </div>
    <p style="text-align:center;font-size:11.5px;color:#66756e;margin:16px 0 0;line-height:1.5">
      Official notification sent by Adhunik Crop Care. <br>
      <a href="${escapeHtml(unsubscribeUrl)}" style="color:#689c30;text-decoration:underline">Manage preferences / unsubscribe</a>.
    </p>
  </div>
</body>
</html>`
}

function button(label: string, url?: string) {
  return url ? `<p style="margin:24px 0;text-align:center"><a href="${escapeHtml(url)}" style="background:#033927;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;display:inline-block;font-weight:bold;font-size:13.5px;box-shadow:0 2px 4px rgba(0,0,0,0.1)">${escapeHtml(label)}</a></p>` : ""
}

function detailsTable(rows: [string, unknown][]) {
  const body = rows
    .map(
      ([label, value]) =>
        `<tr>
          <td class="table-cell-label" style="padding:10px 12px;border-bottom:1px solid #e3ece0;color:#5a6861;font-size:12.5px;font-weight:600;width:38%;vertical-align:top;word-break:break-word;overflow-wrap:anywhere">${escapeHtml(label)}</td>
          <td class="table-cell-value" style="padding:10px 12px;border-bottom:1px solid #e3ece0;color:#173c31;font-size:13px;font-weight:700;width:62%;vertical-align:top;word-break:break-word;overflow-wrap:anywhere">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("")
  return `<table style="width:100%;max-width:100%;table-layout:fixed;border-collapse:collapse;margin:18px 0;border:1px solid #e3ece0;border-radius:10px;overflow:hidden;background:#fcfdfe">${body}</table>`
}

function formatInr(total: unknown) {
  return `INR ${Number(total ?? 0).toFixed(2)}`
}

export const emailTemplates: Record<EmailTemplateName, (input: TemplateInput) => { html: string; subject: string; text: string }> = {
  accountVerification: (i) => ({ subject: `Your ${brand} verification OTP`, text: `Your email verification OTP is ${i.otp}. It expires in 5 minutes.`, html: layout("Verify your email", `<p>Use this one-time password to verify your email and finish creating your account:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0">${escapeHtml(i.otp)}</p><p>This OTP expires in 5 minutes. Do not share it with anyone.</p>`, i.unsubscribeUrl) }),
  emailVerified: (i) => ({ subject: "Your email is confirmed", text: "Your Adhunik Crop Care email was confirmed successfully.", html: layout("Email confirmed", `<p>Hello ${escapeHtml(i.firstName)},</p><p>Your email address has been confirmed successfully.</p>`, i.unsubscribeUrl) }),
  passwordReset: (i) => ({ subject: "Reset your password", text: `Reset your password: ${i.actionUrl}`, html: layout("Reset your password", `<p>Hello ${escapeHtml(i.firstName)},</p><p>Use the secure link below to choose a new password. It expires in one hour.</p>${button("Reset password", i.actionUrl)}<p>If you did not request this, you can ignore this email.</p>`, i.unsubscribeUrl) }),
  orderPlaced: (i) => ({ subject: `Order ${i.orderNumber} confirmed`, text: `Your order ${i.orderNumber} is confirmed. Total: INR ${Number(i.total ?? 0).toFixed(2)}`, html: layout("Order confirmed", `<p>Hello ${escapeHtml(i.firstName)},</p><p>Your order <strong>${escapeHtml(i.orderNumber)}</strong> has been placed.</p><p>Total: <strong>INR ${Number(i.total ?? 0).toFixed(2)}</strong></p>`, i.unsubscribeUrl) }),
  orderCancelled: (i) => ({ subject: `Order ${i.orderNumber} cancelled`, text: `Order ${i.orderNumber} has been cancelled.`, html: layout("Order cancelled", `<p>Hello ${escapeHtml(i.firstName)},</p><p>Your order <strong>${escapeHtml(i.orderNumber)}</strong> has been cancelled.</p>`, i.unsubscribeUrl) }),
  refundUpdate: (i) => ({ subject: `Refund update for ${i.orderNumber}`, text: `Refund status for ${i.orderNumber}: ${i.refundStatus}`, html: layout("Refund update", `<p>Hello ${escapeHtml(i.firstName)},</p><p>The refund status for <strong>${escapeHtml(i.orderNumber)}</strong> is now <strong>${escapeHtml(i.refundStatus)}</strong>.</p>`, i.unsubscribeUrl) }),
  cartUpdate: (i) => ({ subject: "Product added to your cart", text: `${i.productName} was added to your cart.`, html: layout("Added to your cart", `<p>Hello ${escapeHtml(i.firstName)},</p><p><strong>${escapeHtml(i.productName)}</strong> was added to your cart.</p>${button("View cart", i.actionUrl)}`, i.unsubscribeUrl) }),
  offerAnnouncement: (i) => ({ subject: "A new offer is coming", text: "A new Adhunik Crop Care offer is available.", html: layout("Special offer", `<p>Hello ${escapeHtml(i.firstName)},</p><p>A new offer is available for you.</p>${button("Explore offers", i.actionUrl)}`, i.unsubscribeUrl) }),
  saleAnnouncement: (i) => ({ subject: "Adhunik Crop Care sale announcement", text: "A new sale is coming.", html: layout("Sale announcement", `<p>Hello ${escapeHtml(i.firstName)},</p><p>Our latest sale is coming soon.</p>${button("Explore products", i.actionUrl)}`, i.unsubscribeUrl) }),
  adminOrderNotification: (i) => ({
    subject: `New order ${i.orderNumber} · ${formatInr(i.total)}`,
    text: [
      `A new order has been placed on ${brand}.`,
      `Order Number: ${i.orderNumber ?? "-"}`,
      `Customer Name: ${i.customerName ?? "-"}`,
      `Customer Email: ${i.customerEmail ?? "-"}`,
      `Mobile Number: ${i.mobileNumber ?? "-"}`,
      `Total Amount: ${formatInr(i.total)}`,
      `Payment Method: ${i.paymentMethod ?? "-"}`,
      `Payment Status: ${i.paymentStatus ?? "-"}`,
      `Order Status: ${i.orderStatus ?? "-"}`,
      `Order Date & Time: ${i.orderDate ?? "-"}`,
      i.adminOrderUrl ? `Admin Order Details: ${i.adminOrderUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    html: layout(
      "New order received",
      `<p>A new order has been placed on ${brand}.</p>${detailsTable([
        ["Order Number", i.orderNumber ?? "-"],
        ["Customer Name", i.customerName ?? "-"],
        ["Customer Email", i.customerEmail ?? "-"],
        ["Mobile Number", i.mobileNumber ?? "-"],
        ["Total Amount", formatInr(i.total)],
        ["Payment Method", i.paymentMethod ?? "-"],
        ["Payment Status", i.paymentStatus ?? "-"],
        ["Order Status", i.orderStatus ?? "-"],
        ["Order Date & Time", i.orderDate ?? "-"],
      ])}${button("View admin order details", i.adminOrderUrl)}`,
      i.unsubscribeUrl,
    ),
  }),
  adminLowStockNotification: (i) => ({
    subject: `Low stock alert · ${i.productName ?? "Product"}`,
    text: [
      `Low stock alert on ${brand}.`,
      `Product: ${i.productName ?? "-"}`,
      `Stock quantity: ${i.stockQuantity ?? "-"}`,
      i.adminProductUrl ? `Admin Product Details: ${i.adminProductUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    html: layout(
      "Low stock alert",
      `<p>An item is at or below the low-stock threshold.</p>${detailsTable([
        ["Product", i.productName ?? "-"],
        ["Stock quantity", i.stockQuantity ?? "-"],
      ])}${button("View product", i.adminProductUrl)}`,
      i.unsubscribeUrl,
    ),
  }),
  contactUserConfirmation: (i) => ({
    subject: `Enquiry Received - ${brand} [Ticket #${i.ticketId}]`,
    text: [
      `Hello ${i.fullName ?? "Valued Customer"},`,
      `Thank you for filling the details. Our team will reach out to you in the next 24 hours during working days.`,
      ``,
      `Reference Ticket ID: ${i.ticketId ?? "-"}`,
      `Topic: ${i.topicLabel ?? "-"}`,
      `Full Name: ${i.fullName ?? "-"}`,
      `Mobile Number: ${i.mobileNumber ?? "-"}`,
      `Location: ${i.location ?? "-"}`,
      `Submitted Message: ${i.message ?? "-"}`,
    ].join("\n"),
    html: layout(
      "Enquiry Received",
      `<p>Hello <strong>${escapeHtml(i.fullName)}</strong>,</p>
      <p style="font-size:15px;line-height:1.6;color:#033927;background:#eff4e9;padding:14px 18px;border-radius:12px;border:1px solid #dce5d8;font-weight:600">
        Thank you for filling the details. Our team will reach out to you in the next 24 hours during working days.
      </p>
      <p style="margin-top:20px;font-size:14px;color:#66756e">Here is a summary of your submitted enquiry:</p>
      ${detailsTable([
        ["Ticket Reference No.", `#${i.ticketId}`],
        ["Full Name", i.fullName ?? "-"],
        ["Topic", i.topicLabel ?? "-"],
        ["Mobile Number", i.mobileNumber ?? "-"],
        ["Email Address", i.email ?? "-"],
        ["Location", i.location ?? "-"],
        ["Submitted Message", i.message ?? "-"],
      ])}`,
      i.unsubscribeUrl,
    ),
  }),
  contactAdminNotification: (i) => ({
    subject: `New Contact Form Submission - #${i.ticketId} [${i.topicLabel ?? "General"}]`,
    text: [
      `Someone has filled the contact page form.`,
      ``,
      `Ticket ID: ${i.ticketId ?? "-"}`,
      `Full Name: ${i.fullName ?? "-"}`,
      `Mobile Number: ${i.mobileNumber ?? "-"}`,
      `Email Address: ${i.email ?? "-"}`,
      `Topic: ${i.topicLabel ?? "-"}`,
      `Location: ${i.location ?? "-"}`,
      `Message: ${i.message ?? "-"}`,
      ``,
      i.adminContactUrl ? `Log in to OryCMS Dashboard: ${i.adminContactUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    html: layout(
      "New Contact Form Submission",
      `<p style="font-size:16px;font-weight:700;color:#033927;margin-bottom:16px">Someone has filled the contact page form.</p>
      <p style="color:#66756e;font-size:14px">Form submission details are listed below:</p>
      ${detailsTable([
        ["Ticket Reference No.", `#${i.ticketId}`],
        ["Full Name", i.fullName ?? "-"],
        ["Mobile Number", i.mobileNumber ?? "-"],
        ["Email Address", i.email ?? "-"],
        ["Topic", i.topicLabel ?? "-"],
        ["Location", i.location ?? "-"],
        ["Submitted Message", i.message ?? "-"],
      ])}
      <p style="margin-top:24px;font-size:13.5px;color:#66756e">Please log in to OryCMS Admin Dashboard to manage and update enquiry status.</p>
      ${button("Log in to OryCMS Dashboard", i.adminContactUrl)}`,
      i.unsubscribeUrl,
    ),
  }),
  shipmentCreated: (i) => shipmentEmail("Your order is being packed", `<p>Hello ${escapeHtml(i.firstName)},</p><p>Good news — a shipment has been created for your order <strong>${escapeHtml(i.orderNumber)}</strong> and a courier has been assigned.</p>`, i),
  shipmentShipped: (i) => shipmentEmail("Your order has shipped", `<p>Hello ${escapeHtml(i.firstName)},</p><p>Your order <strong>${escapeHtml(i.orderNumber)}</strong> is on its way.</p>`, i),
  shipmentOutForDelivery: (i) => shipmentEmail("Out for delivery today", `<p>Hello ${escapeHtml(i.firstName)},</p><p>Your order <strong>${escapeHtml(i.orderNumber)}</strong> is out for delivery and should reach you today.</p>`, i),
  shipmentDelivered: (i) => shipmentEmail("Your order has been delivered", `<p>Hello ${escapeHtml(i.firstName)},</p><p>Your order <strong>${escapeHtml(i.orderNumber)}</strong> has been delivered. We hope you love it!</p>`, i),
  shipmentCancelled: (i) => shipmentEmail("Your shipment was cancelled", `<p>Hello ${escapeHtml(i.firstName)},</p><p>The shipment for your order <strong>${escapeHtml(i.orderNumber)}</strong> has been cancelled. If this is unexpected, please contact support.</p>`, i),
  adminInvitation: (i) => ({
    subject: `Invitation to join ${brand} Admin`,
    text: [
      `Hello ${i.fullName ?? "Admin"},`,
      `You have been invited to join the ${brand} OryCMS Admin Dashboard${i.invitedBy ? ` by ${i.invitedBy}` : ""}.`,
      `Please set up your password using the link below (expires in 24 hours):`,
      i.setupUrl ?? "",
    ].join("\n"),
    html: layout(
      "Admin Invitation",
      `<p>Hello <strong>${escapeHtml(i.fullName ?? "Admin")}</strong>,</p>
      <p style="font-size:14.5px;line-height:1.6;color:#033927;background:#eff4e9;padding:14px 18px;border-radius:12px;border:1px solid #dce5d8">
        You have been invited to join the <strong>${brand}</strong> OryCMS Admin Panel${i.invitedBy ? ` by <strong>${escapeHtml(i.invitedBy)}</strong>` : ""}.
      </p>
      <p style="margin-top:20px;font-size:13.5px;color:#495850">
        Please click the button below to create your password and activate your admin account. This one-time setup link is valid for <strong>24 hours</strong>.
      </p>
      ${button("Set Your Password", i.setupUrl)}
      <p style="font-size:12px;color:#66756e;margin-top:20px">
        For security, the creating administrator does not set or know your password. Password setup must occur directly through this link.
      </p>`,
      i.unsubscribeUrl,
    ),
  }),
  adminPasswordReset: (i) => ({
    subject: `Reset Your OryCMS Admin Password - ${brand}`,
    text: [
      `Hello ${i.fullName ?? "Admin"},`,
      `We received a request to reset your ${brand} OryCMS Admin Dashboard password.`,
      `Click the link below to set a new password (link expires in 15 minutes):`,
      i.resetUrl ?? "",
      ``,
      `If you did not request this password reset, please ignore this email. Your password will remain unchanged.`,
    ].join("\n"),
    html: layout(
      "OryCMS Password Reset",
      `<p>Hello <strong>${escapeHtml(i.fullName ?? "Admin")}</strong>,</p>
      <p style="font-size:14.5px;line-height:1.6;color:#033927;background:#eff4e9;padding:14px 18px;border-radius:12px;border:1px solid #dce5d8">
        We received a request to reset your password for the <strong>${brand}</strong> OryCMS Admin Dashboard.
      </p>
      <p style="margin-top:20px;font-size:13.5px;color:#495850">
        Please click the button below to change your password. This secure link is valid for <strong>15 minutes</strong> and can only be used once.
      </p>
      ${button("Reset Password", i.resetUrl)}
      <p style="font-size:12px;color:#66756e;margin-top:20px">
        If you did not initiate this request, you can safely ignore this email. Your admin password will remain unchanged.
      </p>`,
      i.unsubscribeUrl,
    ),
  }),
  adminPasswordResetSuccess: (i) => ({
    subject: `Password Reset Successful - ${brand} Admin`,
    text: [
      `Hello ${i.fullName ?? "Admin"},`,
      `Your password for the ${brand} OryCMS Admin Dashboard was successfully updated.`,
      ``,
      `All active sessions have been automatically signed out for your security.`,
      i.resetUrl ? `Log in to OryCMS Dashboard: ${i.resetUrl}` : "",
      ``,
      `If you did not make this change, please contact your workspace administrator immediately.`,
    ]
      .filter(Boolean)
      .join("\n"),
    html: layout(
      "Password Reset Successful",
      `<p>Hello <strong>${escapeHtml(i.fullName ?? "Admin")}</strong>,</p>
      <p style="font-size:14.5px;line-height:1.6;color:#033927;background:#eff4e9;padding:14px 18px;border-radius:12px;border:1px solid #dce5d8">
        Your administrator password for the <strong>${brand}</strong> OryCMS Admin Dashboard was successfully changed.
      </p>
      <p style="margin-top:16px;font-size:13.5px;color:#495850">
        For your security, all existing active login sessions for your account have been signed out automatically. You can now sign in using your new password.
      </p>
      ${button("Sign In to OryCMS Dashboard", i.resetUrl)}
      <p style="font-size:12px;color:#c2410c;background:#fff7ed;padding:12px 14px;border-radius:8px;border:1px solid #ffedd5;margin-top:20px;font-weight:500">
        ⚠️ <strong>Security Notice:</strong> If you did not authorize this password reset, please contact your workspace owner or administrator immediately to secure your account.
      </p>`,
      i.unsubscribeUrl,
    ),
  }),
}

/** Shared builder for the five shipment lifecycle emails (AWB/courier/tracking rows). */
function shipmentEmail(title: string, intro: string, i: TemplateInput) {
  const rows: [string, unknown][] = [["Order Number", i.orderNumber ?? "-"]]
  if (i.awbCode) rows.push(["AWB Number", i.awbCode])
  if (i.courierName) rows.push(["Courier", i.courierName])
  if (i.estimatedDelivery) rows.push(["Estimated Delivery", i.estimatedDelivery])
  const subjectMap: Record<string, string> = {
    "Your order is being packed": `Shipment created for order ${i.orderNumber}`,
    "Your order has shipped": `Order ${i.orderNumber} shipped`,
    "Out for delivery today": `Order ${i.orderNumber} is out for delivery`,
    "Your order has been delivered": `Order ${i.orderNumber} delivered`,
    "Your shipment was cancelled": `Order ${i.orderNumber} shipment cancelled`,
  }
  return {
    subject: subjectMap[title] ?? `Update for order ${i.orderNumber}`,
    text: `${title}. Order ${i.orderNumber}.${i.awbCode ? ` AWB ${i.awbCode} (${i.courierName ?? "courier"}).` : ""}${i.trackingUrl ? ` Track: ${i.trackingUrl}` : ""}`,
    html: layout(title, `${intro}${detailsTable(rows)}${i.trackingUrl ? button("Track your order", i.trackingUrl) : ""}`, i.unsubscribeUrl),
  }
}
