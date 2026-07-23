"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { useAuth } from "@/features/auth/auth-context"
import { useWishlist } from "@/features/wishlist/wishlist-context"

export function WishlistHeartButton({ slug }: { slug: string }) {
  const { loadingUser, openAuthModal, user } = useAuth()
  const [saving, setSaving] = useState(false)
  const { savedSlugs, toggle: toggleWishlist } = useWishlist()
  const saved = savedSlugs.has(slug)

  async function toggle() {
    if (loadingUser || saving) return
    if (!user) { openAuthModal("signin"); return }
    setSaving(true)
    try {
      await toggleWishlist(slug)
    } finally { setSaving(false) }
  }

  return <button type="button" onClick={toggle} aria-label={saved ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={saved} className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-[#d7e0da] bg-white/95 text-[#173c31] shadow-sm transition hover:scale-105 disabled:opacity-60" disabled={loadingUser || saving}><Heart className={`h-4.5 w-4.5 ${saved ? "fill-[#d75050] text-[#d75050]" : "text-[#173c31]"}`} /></button>
}
