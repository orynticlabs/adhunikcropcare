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
  | "shipmentCreated"
  | "shipmentShipped"
  | "shipmentOutForDelivery"
  | "shipmentDelivered"
  | "shipmentCancelled"

type TemplateInput = {
  actionUrl?: string
  adminOrderUrl?: string
  awbCode?: string
  courierName?: string
  customerEmail?: string
  customerName?: string
  estimatedDelivery?: string
  mobileNumber?: string
  orderDate?: string
  orderStatus?: string
  otp?: string
  firstName?: string
  orderNumber?: string
  paymentMethod?: string
  paymentStatus?: string
  productName?: string
  refundStatus?: string
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
  return `<!doctype html><html><body style="margin:0;background:#f3f6f1;font-family:Arial,sans-serif;color:#173c31"><div style="max-width:620px;margin:0 auto;padding:28px 16px"><div style="background:#fff;border:1px solid #dce5d8;border-radius:16px;padding:30px"><h1 style="margin:0 0 20px;font-size:24px">${escapeHtml(title)}</h1>${content}<p style="margin-top:28px">Regards,<br><strong>${brand}</strong></p></div><p style="text-align:center;font-size:12px;color:#66756e;margin:18px 0">Email preferences: <a href="${escapeHtml(unsubscribeUrl)}">unsubscribe from optional emails</a>.</p></div></body></html>`
}

function button(label: string, url?: string) {
  return url ? `<p style="margin:24px 0"><a href="${escapeHtml(url)}" style="background:#033927;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;display:inline-block">${escapeHtml(label)}</a></p>` : ""
}

function detailsTable(rows: [string, unknown][]) {
  const body = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e3ece0;color:#66756e;font-size:13px;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #e3ece0;font-size:13px;font-weight:600">${escapeHtml(value)}</td></tr>`,
    )
    .join("")
  return `<table style="width:100%;border-collapse:collapse;margin:20px 0;border:1px solid #e3ece0;border-radius:12px;overflow:hidden">${body}</table>`
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
  shipmentCreated: (i) => shipmentEmail("Your order is being packed", `<p>Hello ${escapeHtml(i.firstName)},</p><p>Good news — a shipment has been created for your order <strong>${escapeHtml(i.orderNumber)}</strong> and a courier has been assigned.</p>`, i),
  shipmentShipped: (i) => shipmentEmail("Your order has shipped", `<p>Hello ${escapeHtml(i.firstName)},</p><p>Your order <strong>${escapeHtml(i.orderNumber)}</strong> is on its way.</p>`, i),
  shipmentOutForDelivery: (i) => shipmentEmail("Out for delivery today", `<p>Hello ${escapeHtml(i.firstName)},</p><p>Your order <strong>${escapeHtml(i.orderNumber)}</strong> is out for delivery and should reach you today.</p>`, i),
  shipmentDelivered: (i) => shipmentEmail("Your order has been delivered", `<p>Hello ${escapeHtml(i.firstName)},</p><p>Your order <strong>${escapeHtml(i.orderNumber)}</strong> has been delivered. We hope you love it!</p>`, i),
  shipmentCancelled: (i) => shipmentEmail("Your shipment was cancelled", `<p>Hello ${escapeHtml(i.firstName)},</p><p>The shipment for your order <strong>${escapeHtml(i.orderNumber)}</strong> has been cancelled. If this is unexpected, please contact support.</p>`, i),
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
