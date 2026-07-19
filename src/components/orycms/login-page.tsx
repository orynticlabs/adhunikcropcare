"use client"

import { OryCMSLoginPage } from "@ory-cms/next"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { OryCMSSessionProvider, useOryCMSSession } from "../../../orycms/hooks"

export default function OryCMSLogin() {
  return (
    <OryCMSSessionProvider>
      <LoginRedirectGate />
    </OryCMSSessionProvider>
  )
}

function LoginRedirectGate() {
  const router = useRouter()
  const { loaded, user } = useOryCMSSession()

  useEffect(() => {
    if (loaded && user) router.replace("/admin")
  }, [loaded, router, user])

  if (loaded && user) return null

  return <OryCMSLoginPage />
}
