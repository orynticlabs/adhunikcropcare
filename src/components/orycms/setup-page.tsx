"use client"

import { OryCMSSetupPage } from "@ory-cms/next"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { OryCMSSessionProvider, useOryCMSSession } from "../../../orycms/hooks"

export default function OryCMSSetup() {
  return (
    <OryCMSSessionProvider>
      <SetupRedirectGate />
    </OryCMSSessionProvider>
  )
}

function SetupRedirectGate() {
  const router = useRouter()
  const { loaded, user } = useOryCMSSession()

  useEffect(() => {
    if (loaded && user) router.replace("/admin")
  }, [loaded, router, user])

  if (loaded && user) return null

  return <OryCMSSetupPage />
}
