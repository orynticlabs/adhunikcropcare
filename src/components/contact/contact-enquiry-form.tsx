"use client"

import { useState } from "react"
import { Select } from "@base-ui/react/select"
import {
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  CircleHelp,
  LoaderCircle,
  Send,
} from "lucide-react"
import {
  CONTACT_TOPICS,
  type ContactField,
  type ContactFormErrors,
  type ContactFormValues,
  type ContactTopic,
  validateContactForm,
} from "@/lib/contact-form"

const INITIAL_VALUES: ContactFormValues = {
  email: "",
  fullName: "",
  location: "",
  message: "",
  mobileNumber: "",
  topic: "",
}

const ALL_FIELDS: ContactField[] = ["fullName", "mobileNumber", "email", "topic", "location", "message"]

type SubmissionState =
  | { type: "idle" }
  | { type: "submitting" }
  | { message: string; type: "error" | "success" }

type ContactApiResponse = {
  data?: { message?: string }
  error?: { fields?: ContactFormErrors; message?: string }
  success?: boolean
}

export default function ContactEnquiryForm() {
  const [values, setValues] = useState<ContactFormValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<ContactFormErrors>({})
  const [touched, setTouched] = useState<Partial<Record<ContactField, boolean>>>({})
  const [submission, setSubmission] = useState<SubmissionState>({ type: "idle" })
  const [website, setWebsite] = useState("")

  function updateField<Field extends ContactField>(field: Field, value: ContactFormValues[Field]) {
    const nextValues = { ...values, [field]: value }
    setValues(nextValues)
    if (touched[field] || errors[field]) {
      const nextError = validateContactForm(nextValues).errors[field]
      setErrors((current) => ({ ...current, [field]: nextError }))
    }
    if (submission.type !== "idle") setSubmission({ type: "idle" })
  }

  function validateField(field: ContactField) {
    setTouched((current) => ({ ...current, [field]: true }))
    const fieldError = validateContactForm(values).errors[field]
    setErrors((current) => ({ ...current, [field]: fieldError }))
  }

  function updateTopic(value: ContactTopic | "") {
    const nextValues = { ...values, topic: value }
    setValues(nextValues)
    setTouched((current) => ({ ...current, topic: true }))
    setErrors((current) => ({
      ...current,
      topic: validateContactForm(nextValues).errors.topic,
    }))
    if (submission.type !== "idle") setSubmission({ type: "idle" })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = validateContactForm(values)
    setTouched(Object.fromEntries(ALL_FIELDS.map((field) => [field, true])))
    setErrors(validation.errors)

    if (!validation.valid) {
      setSubmission({ message: "Please correct the highlighted fields before submitting.", type: "error" })
      return
    }

    setSubmission({ type: "submitting" })

    try {
      const csrfResponse = await fetch("/api/auth/csrf", { credentials: "include" })
      const csrfJson = await csrfResponse.json() as { data?: { csrfToken?: string } }
      const csrfToken = csrfJson.data?.csrfToken
      if (!csrfResponse.ok || !csrfToken) throw new Error("Security check failed. Refresh the page and try again.")

      const response = await fetch("/api/contact", {
        body: JSON.stringify({ ...validation.values, website }),
        credentials: "include",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrfToken,
        },
        method: "POST",
      })
      const result = await response.json() as ContactApiResponse

      if (!response.ok || !result.success) {
        if (result.error?.fields) setErrors(result.error.fields)
        throw new Error(result.error?.message || "Unable to submit your enquiry.")
      }

      setValues(INITIAL_VALUES)
      setErrors({})
      setTouched({})
      setWebsite("")
      setSubmission({
        message: result.data?.message || "Thank you. Your enquiry has been received.",
        type: "success",
      })
    } catch (error) {
      setSubmission({
        message: error instanceof Error ? error.message : "Unable to submit your enquiry. Please try again.",
        type: "error",
      })
    }
  }

  return (
    <form
      className="rounded-[2rem] bg-white p-5 shadow-[0_20px_60px_rgba(3,57,39,.08)] sm:rounded-[2.75rem] sm:p-10"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
        <FormField error={errors.fullName} htmlFor="contact-full-name" label="Full name">
          <input
            id="contact-full-name"
            autoComplete="name"
            className={inputClass(Boolean(errors.fullName))}
            maxLength={80}
            name="fullName"
            onBlur={() => validateField("fullName")}
            onChange={(event) => updateField("fullName", event.target.value)}
            placeholder="Your full name"
            value={values.fullName}
            aria-describedby={errors.fullName ? "contact-full-name-error" : undefined}
            aria-invalid={Boolean(errors.fullName)}
          />
        </FormField>

        <FormField error={errors.mobileNumber} htmlFor="contact-mobile" label="Mobile number">
          <div className={phoneContainerClass(Boolean(errors.mobileNumber))}>
            <span className="flex h-full shrink-0 items-center border-r border-[#d5ddd6] bg-[#f3f7ef] px-4 font-semibold text-[#31523f]" aria-label="Country code plus ninety-one">
              +91
            </span>
            <input
              id="contact-mobile"
              autoComplete="tel-national"
              className="min-w-0 flex-1 bg-transparent px-4 text-sm text-[#203129] outline-none placeholder:text-[#8b968e]"
              inputMode="numeric"
              maxLength={10}
              name="mobileNumber"
              onBlur={() => validateField("mobileNumber")}
              onChange={(event) => updateField("mobileNumber", event.target.value.replace(/\D/g, "").slice(0, 10))}
              pattern="[0-9]{10}"
              placeholder="10-digit mobile number"
              value={values.mobileNumber}
              aria-describedby={errors.mobileNumber ? "contact-mobile-error" : undefined}
              aria-invalid={Boolean(errors.mobileNumber)}
            />
          </div>
        </FormField>

        <FormField error={errors.email} htmlFor="contact-email" label="Email address">
          <input
            id="contact-email"
            autoComplete="email"
            className={inputClass(Boolean(errors.email))}
            maxLength={254}
            name="email"
            onBlur={() => validateField("email")}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="you@example.com"
            type="email"
            value={values.email}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            aria-invalid={Boolean(errors.email)}
          />
        </FormField>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#203129]" htmlFor="contact-topic">
            I need help with
          </label>
          <Select.Root
            name="topic"
            onOpenChange={(open, eventDetails) => {
              const selectionClosedMenu = eventDetails.reason === "item-press" || eventDetails.reason === "list-navigation"
              if (!open && !selectionClosedMenu) validateField("topic")
            }}
            onValueChange={(value) => updateTopic((value ?? "") as ContactTopic | "")}
            value={values.topic || null}
          >
            <Select.Trigger
              id="contact-topic"
              className={`flex h-12 w-full items-center justify-between gap-3 rounded-2xl border px-4 text-left text-sm outline-none transition focus:ring-2 ${
                errors.topic
                  ? "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-100"
                  : "border-[#d5ddd6] bg-[#f8faf6] focus:border-[#689c30] focus:ring-[#689c30]/15"
              }`}
              aria-describedby={errors.topic ? "contact-topic-error" : undefined}
              aria-invalid={Boolean(errors.topic)}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#e4ebdd] text-[#4f7e31]">
                  <CircleHelp className="h-4 w-4" aria-hidden />
                </span>
                <Select.Value placeholder={<span className="text-[#87938b]">Choose a support topic</span>}>
                  {(value) => CONTACT_TOPICS.find((topic) => topic.value === value)?.label || "Choose a support topic"}
                </Select.Value>
              </span>
              <Select.Icon className="text-[#587163]">
                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[popup-open]:rotate-180" aria-hidden />
              </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
              <Select.Positioner className="z-[100] outline-none" alignItemWithTrigger={false} sideOffset={8}>
                <Select.Popup className="w-[var(--anchor-width)] min-w-72 origin-[var(--transform-origin)] rounded-2xl border border-[#d5ddd6] bg-white p-1.5 text-[#203129] shadow-[0_18px_55px_rgba(3,57,39,.18)] outline-none transition duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
                  <Select.List className="contact-select-scrollbar max-h-[min(22rem,var(--available-height))] space-y-1 overflow-y-auto p-0.5 pr-1.5 outline-none">
                    {CONTACT_TOPICS.map((topic) => (
                      <Select.Item
                        key={topic.value}
                        className="group flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5 outline-none transition data-[highlighted]:bg-[#edf4e7] data-[selected]:bg-[#e4efda]"
                        value={topic.value}
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f1f5ed] text-[#689c30] group-data-[selected]:bg-[#689c30] group-data-[selected]:text-white">
                          <Check className="hidden h-4 w-4 group-data-[selected]:block" aria-hidden />
                          <CircleHelp className="h-4 w-4 group-data-[selected]:hidden" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <Select.ItemText className="block text-sm font-semibold">{topic.label}</Select.ItemText>
                          <span className="mt-0.5 block text-xs leading-4 text-[#718078]">{topic.description}</span>
                        </span>
                        <Select.ItemIndicator className="text-[#4f7e31]">
                          <Check className="h-4 w-4" aria-hidden />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
          <FieldError error={errors.topic} id="contact-topic-error" />
        </div>

        <FormField className="sm:col-span-2" error={errors.location} htmlFor="contact-location" label="Location">
          <input
            id="contact-location"
            autoComplete="address-level2"
            className={inputClass(Boolean(errors.location))}
            maxLength={120}
            name="location"
            onBlur={() => validateField("location")}
            onChange={(event) => updateField("location", event.target.value)}
            placeholder="Village, district, state"
            value={values.location}
            aria-describedby={errors.location ? "contact-location-error" : undefined}
            aria-invalid={Boolean(errors.location)}
          />
        </FormField>

        <FormField className="sm:col-span-2" error={errors.message} htmlFor="contact-message" label="Your message">
          <div className="relative">
            <textarea
              id="contact-message"
              className={`${inputClass(Boolean(errors.message))} min-h-36 resize-y py-3 pr-16`}
              maxLength={2000}
              name="message"
              onBlur={() => validateField("message")}
              onChange={(event) => updateField("message", event.target.value)}
              placeholder="Tell us about your crop, requirement, or question..."
              value={values.message}
              aria-describedby={errors.message ? "contact-message-error" : "contact-message-count"}
              aria-invalid={Boolean(errors.message)}
            />
            <span id="contact-message-count" className="pointer-events-none absolute bottom-3 right-4 text-[10px] tabular-nums text-[#8b968e]">
              {values.message.length}/2000
            </span>
          </div>
        </FormField>

        <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="contact-website">Website</label>
          <input
            id="contact-website"
            autoComplete="off"
            name="website"
            onChange={(event) => setWebsite(event.target.value)}
            tabIndex={-1}
            value={website}
          />
        </div>
      </div>

      {submission.type === "error" || submission.type === "success" ? (
        <div
          className={`mt-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
            submission.type === "success"
              ? "border-[#b8d79e] bg-[#f0f7ea] text-[#315c27]"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
          role={submission.type === "error" ? "alert" : "status"}
        >
          {submission.type === "success" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />}
          <span>{submission.message}</span>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submission.type === "submitting"}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#033927] px-7 text-sm font-bold text-white shadow-xl transition-all hover:bg-[#689c30] hover:!text-black disabled:cursor-not-allowed disabled:opacity-65 sm:w-auto"
      >
        {submission.type === "submitting" ? (
          <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Sending enquiry...</>
        ) : (
          <>Send enquiry <Send className="h-4 w-4" aria-hidden /></>
        )}
      </button>
      <p className="mt-4 text-xs leading-5 text-[#7b887e]">
        By submitting, you agree that our team may contact you about this enquiry.
      </p>
    </form>
  )
}

function FormField({
  children,
  className = "",
  error,
  htmlFor,
  label,
}: {
  children: React.ReactNode
  className?: string
  error?: string
  htmlFor: string
  label: string
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-[#203129]" htmlFor={htmlFor}>{label}</label>
      {children}
      <FieldError error={error} id={`${htmlFor}-error`} />
    </div>
  )
}

function FieldError({ error, id }: { error?: string; id: string }) {
  return error ? (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600" id={id} role="alert">
      <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden /> {error}
    </p>
  ) : null
}

function inputClass(hasError: boolean) {
  return `h-12 w-full rounded-2xl border bg-white px-4 text-sm text-[#203129] outline-none transition placeholder:text-[#8b968e] focus:ring-2 [color-scheme:light] ${
    hasError
      ? "border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-red-100"
      : "border-[#d5ddd6] focus:border-[#689c30] focus:ring-[#689c30]/15"
  }`
}

function phoneContainerClass(hasError: boolean) {
  return `flex h-12 w-full overflow-hidden rounded-2xl border bg-white outline-none transition focus-within:ring-2 ${
    hasError
      ? "border-red-400 bg-red-50/30 focus-within:border-red-500 focus-within:ring-red-100"
      : "border-[#d5ddd6] focus-within:border-[#689c30] focus-within:ring-[#689c30]/15"
  }`
}
