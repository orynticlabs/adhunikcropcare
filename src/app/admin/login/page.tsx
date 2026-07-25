import { redirect } from "next/navigation"
import OryCMSLogin from "@/components/orycms/login-page"
import { isOryCMSSetupComplete } from "@/lib/orycms/setup"

export default async function AdminLoginPage() {
  if (!(await isOryCMSSetupComplete())) redirect("/admin/setup")
  return <OryCMSLogin />
}
