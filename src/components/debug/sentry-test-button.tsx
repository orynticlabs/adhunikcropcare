"use client"

export default function SentryTestButton() {
  return (
    <button
      className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
      onClick={() => {
        throw new Error("Sentry test error — delete this button when verified")
      }}
    >
      Throw test error → Sentry
    </button>
  )
}
