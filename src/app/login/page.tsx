import { redirect } from "next/navigation"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ from?: string | string[] }> }) {
  const params = await searchParams
  const from = typeof params.from === "string" && params.from.startsWith("/") && !params.from.startsWith("//") ? params.from : null
  const query = new URLSearchParams({ auth: "signin" })
  if (from) query.set("from", from)
  redirect(`/?${query.toString()}`)
}
