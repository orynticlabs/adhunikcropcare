import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ORYCMS_SESSION_COOKIE } from "@/lib/orycms/config"

export default async function AdminPage() {
  const cookieStore = await cookies()
  redirect(cookieStore.has(ORYCMS_SESSION_COOKIE) ? "/admin/dashboard" : "/admin/login")
}

