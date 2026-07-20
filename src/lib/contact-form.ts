export const CONTACT_TOPICS = [
  { value: "crop_guidance", label: "Crop guidance", description: "Crop stage, field condition, or application advice" },
  { value: "product_information", label: "Product information", description: "Product selection, dosage, or availability" },
  { value: "order_support", label: "Order support", description: "Existing order, delivery, or account assistance" },
  { value: "dealership_distribution", label: "Dealership or distribution", description: "Dealer and distribution opportunities" },
  { value: "wholesale_enquiry", label: "Wholesale enquiry", description: "Bulk, institutional, or commercial requirements" },
  { value: "other", label: "Other", description: "Anything else our team can help with" },
] as const

export type ContactTopic = (typeof CONTACT_TOPICS)[number]["value"]
export type ContactField = "email" | "fullName" | "location" | "message" | "mobileNumber" | "topic"

export type ContactFormValues = {
  email: string
  fullName: string
  location: string
  message: string
  mobileNumber: string
  topic: ContactTopic | ""
}

export type ContactFormErrors = Partial<Record<ContactField, string>>

export function validateContactForm(input: unknown) {
  const values = normalizeContactForm(input)
  const errors: ContactFormErrors = {}

  if (values.fullName.length < 2) errors.fullName = "Enter your full name."
  else if (values.fullName.length > 80) errors.fullName = "Name must be 80 characters or fewer."
  else if (!/^[\p{L}\p{M} .'-]+$/u.test(values.fullName)) errors.fullName = "Name contains unsupported characters."

  if (!/^\d{10}$/.test(values.mobileNumber)) errors.mobileNumber = "Enter a valid 10-digit mobile number."

  if (!values.email) errors.email = "Enter your email address."
  else if (values.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "Enter a valid email address."

  if (!CONTACT_TOPICS.some((topic) => topic.value === values.topic)) errors.topic = "Select what you need help with."

  if (values.location.length < 2) errors.location = "Enter your village, district, or city."
  else if (values.location.length > 120) errors.location = "Location must be 120 characters or fewer."

  if (values.message.length < 10) errors.message = "Please add at least 10 characters so we can understand your enquiry."
  else if (values.message.length > 2000) errors.message = "Message must be 2,000 characters or fewer."

  return { errors, values, valid: Object.keys(errors).length === 0 }
}

function normalizeContactForm(input: unknown): ContactFormValues {
  const record = input && typeof input === "object" && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {}

  return {
    email: text(record.email).toLowerCase(),
    fullName: text(record.fullName).replace(/\s+/g, " "),
    location: text(record.location).replace(/\s+/g, " "),
    message: text(record.message),
    mobileNumber: text(record.mobileNumber),
    topic: text(record.topic) as ContactTopic | "",
  }
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}
