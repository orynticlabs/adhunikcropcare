import { redirect } from "next/navigation"
import OryCMSSetup from "@/components/orycms/setup-page"
import { isOryCMSSetupComplete } from "@/lib/orycms/setup"

export default async function AdminSetupPage() {
  if (await isOryCMSSetupComplete()) redirect("/admin/login")
  return <OryCMSSetup />
}
