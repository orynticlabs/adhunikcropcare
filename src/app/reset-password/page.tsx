import { redirect } from "next/navigation"

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const params = await searchParams
  const token = typeof params.token === "string" ? params.token : ""
  const query = new URLSearchParams({ auth: "reset" })
  if (token) query.set("token", token)
  redirect(`/?${query.toString()}`)
}
