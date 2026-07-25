import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ORYCMS_SESSION_COOKIE } from "@/lib/orycms/config"
import { isOryCMSSetupComplete } from "@/lib/orycms/setup"

export default async function AdminPage() {
  if (!(await isOryCMSSetupComplete())) redirect("/admin/setup")
  const cookieStore = await cookies()
  redirect(cookieStore.has(ORYCMS_SESSION_COOKIE) ? "/admin/dashboard" : "/admin/login")
}
