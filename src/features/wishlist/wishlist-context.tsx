"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useAuth } from "@/features/auth/auth-context"

type WishlistContextValue = { savedSlugs: Set<string>; toggle: (slug: string) => Promise<void>; loading: boolean }
const WishlistContext = createContext<WishlistContextValue>({ savedSlugs: new Set(), toggle: async () => {}, loading: false })

let cachedCsrfTokenPromise: Promise<string> | null = null

async function getCsrfToken(): Promise<string> {
  if (!cachedCsrfTokenPromise) {
    cachedCsrfTokenPromise = fetch("/api/auth/csrf", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => json.data?.csrfToken ?? "")
      .catch(() => {
        cachedCsrfTokenPromise = null
        return ""
      })
  }
  return cachedCsrfTokenPromise
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [savedSlugs, setSavedSlugs] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setSavedSlugs(new Set())
      setLoading(false)
      return
    }

    const storageKey = `wishlist_slugs_${user.id}`
    try {
      const cached = localStorage.getItem(storageKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed)) {
          setSavedSlugs(new Set(parsed))
        }
      }
    } catch {
      // ignore storage errors
    }

    setLoading(true)
    fetch("/api/auth/wishlist", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json.data)) {
          const slugs = json.data.map((item: { slug: string }) => item.slug)
          setSavedSlugs(new Set(slugs))
          try {
            localStorage.setItem(storageKey, JSON.stringify(slugs))
          } catch {
            // ignore storage errors
          }
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [user])

  const toggle = useCallback(async (slug: string) => {
    if (!user) return
    const storageKey = `wishlist_slugs_${user.id}`
    const wasSaved = savedSlugs.has(slug)
    
    setSavedSlugs((current) => {
      const next = new Set(current)
      if (wasSaved) next.delete(slug)
      else next.add(slug)
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(next)))
      } catch {
        // ignore
      }
      return next
    })

    try {
      const csrfToken = await getCsrfToken()
      const response = await fetch("/api/auth/wishlist", {
        method: wasSaved ? "DELETE" : "POST",
        credentials: "include",
        headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({ slug }),
      })
      if (!response.ok) {
        if (response.status === 403) cachedCsrfTokenPromise = null
        throw new Error()
      }
    } catch {
      // Revert on error
      setSavedSlugs((current) => {
        const next = new Set(current)
        if (wasSaved) next.add(slug)
        else next.delete(slug)
        try {
          localStorage.setItem(storageKey, JSON.stringify(Array.from(next)))
        } catch {
          // ignore
        }
        return next
      })
    }
  }, [savedSlugs, user])

  return <WishlistContext.Provider value={{ savedSlugs, toggle, loading }}>{children}</WishlistContext.Provider>
}

export function useWishlist() { return useContext(WishlistContext) }

