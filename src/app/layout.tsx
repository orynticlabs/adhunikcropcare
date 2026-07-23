import type { Metadata } from "next"
import { AppProviders } from "@/components/app-providers"
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
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className="min-h-full">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
