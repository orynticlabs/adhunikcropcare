import type { Metadata } from "next"
import { Fraunces, Inter } from "next/font/google"
import { Geist_Mono } from "next/font/google"
import { CartProvider } from "@/lib/cart-context"
import "./globals.css"

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK"],
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

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
      className={`${fraunces.variable} ${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  )
}
