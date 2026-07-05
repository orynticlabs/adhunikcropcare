"use client"

export default function NewsletterForm() {
  return (
    <form
      className="mt-6 flex max-w-sm gap-2"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="email"
        placeholder="your@email.com"
        className="h-9 w-full rounded-full bg-cream/10 border border-cream/20 text-cream placeholder:text-cream/40 px-4 text-sm outline-none focus:border-cream/40 transition"
      />
      <button
        type="submit"
        className="h-9 px-4 rounded-full bg-[--gold] text-[--bark] text-sm font-medium hover:bg-[--gold]/90 transition shadow"
      >
        Join
      </button>
    </form>
  )
}
