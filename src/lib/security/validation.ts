import sanitizeHtml from "sanitize-html"

/** Generic string sanitization to prevent XSS / HTML injection in user inputs */
export function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return ""
  return sanitizeHtml(input.trim(), {
    allowedTags: [], // Strip all HTML tags
    allowedAttributes: {},
  })
}

/** Sanitize rich text inputs (allowing safe basic HTML tags like b, i, p, ul, li) */
export function sanitizeRichText(input: unknown): string {
  if (typeof input !== "string") return ""
  return sanitizeHtml(input.trim(), {
    allowedTags: ["b", "i", "em", "strong", "a", "p", "ul", "ol", "li", "br", "span", "h1", "h2", "h3"],
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
  })
}

/** Email validation regex */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

/** Phone validation regex (10-15 digits with optional +) */
export const PHONE_REGEX = /^\+?[0-9]{10,15}$/

/** Indian 6-digit Pincode regex */
export const PINCODE_REGEX = /^\d{6}$/

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim())
}

export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone.trim().replace(/[\s-]/g, ""))
}

export function isValidPincode(pincode: string): boolean {
  return PINCODE_REGEX.test(pincode.trim())
}
