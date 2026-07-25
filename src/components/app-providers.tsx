"use client"

import { Suspense } from "react"
import { usePathname } from "next/navigation"
import { AuthModal } from "@/components/auth/auth-modal"
import { CartProvider } from "@/features/cart/cart-context"
import { AuthProvider } from "@/features/auth/auth-context"

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname?.startsWith("/admin")) {
    return <>{children}</>
  }

  return (
    <AuthProvider>
      <CartProvider>
        {children}
        <Suspense fallback={null}><AuthModal /></Suspense>
      </CartProvider>
    </AuthProvider>
  )
}
