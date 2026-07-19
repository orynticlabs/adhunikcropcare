import type { Metadata } from "next"
import { AuthModal } from "@/components/auth/auth-modal"
import { CartProvider } from "@/features/cart/cart-context"
import { AuthProvider } from "@/features/auth/auth-context"
import "./globals.css"

export const metadata: Metadata = {
  title: "Adhunik Crop Care — Premium Eco Agriculture Solutions",
  description:
    "Premium organic fertilizers, bio products, soil care, irrigation, smart agriculture and farmer services from Adhunik Crop Care.",

  icons: {
    icon: "/fevicon.png",
    shortcut: "/fevicon.png",
    apple: "/fevicon.png",
  },

  openGraph: {
    title: "Adhunik Crop Care — Premium Eco Agriculture Solutions",
    description:
      "Premium organic fertilizers, bio products, soil care, irrigation, smart agriculture and farmer services from Adhunik Crop Care.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className="h-full antialiased [--font-fraunces:Georgia,serif] [--font-geist-mono:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace] [--font-inter:Inter,ui-sans-serif,system-ui,sans-serif]"
    >
      <body className="min-h-full">
        <AuthProvider>
          <CartProvider>
            {children}
            <AuthModal />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
