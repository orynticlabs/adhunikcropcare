"use client"

import { useEffect, useState } from "react"
import { Heart } from "lucide-react"
import { useAuth } from "@/features/auth/auth-context"

export function WishlistHeartButton({ slug }: { slug: string }) {
  const { loadingUser, openAuthModal, user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) { setSaved(false); return }
    fetch("/api/auth/wishlist", { credentials: "include" }).then((r) => r.json()).then((json) => setSaved(Boolean(json.data?.some((item: { slug: string }) => item.slug === slug)))).catch(() => undefined)
  }, [slug, user])

  async function toggle() {
    if (loadingUser || saving) return
    if (!user) { openAuthModal("signin"); return }
    setSaving(true)
    try {
      const csrf = await fetch("/api/auth/csrf", { credentials: "include" }).then((r) => r.json())
      const response = await fetch("/api/auth/wishlist", { method: saved ? "DELETE" : "POST", credentials: "include", headers: { "content-type": "application/json", "x-csrf-token": csrf.data?.csrfToken }, body: JSON.stringify({ slug }) })
      if (!response.ok) throw new Error()
      setSaved((value) => !value)
    } finally { setSaving(false) }
  }

  return <button type="button" onClick={toggle} aria-label={saved ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={saved} className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-[#d7e0da] bg-white/95 text-[#173c31] shadow-sm transition hover:scale-105 disabled:opacity-60" disabled={loadingUser || saving}><Heart className={`h-4.5 w-4.5 ${saved ? "fill-[#d75050] text-[#d75050]" : "text-[#173c31]"}`} /></button>
}
