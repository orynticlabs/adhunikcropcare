import type { Metadata } from "next"
import { AppProviders } from "@/components/app-providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "Adhunik Crop Care — Pesticides & Bio Fertilizers India",
  description:
    "Adhunik Crop Care is a trusted manufacturer of pesticides, insecticides, fungicides, herbicides & bio fertilizers for sustainable farming in India.",

  keywords: [
    "pesticides manufacturer in India",
    "insecticides manufacturers in India",
    "herbicides manufacturer India",
    "fungicides manufacturer India",
    "biopesticides India",
    "bio fertilizer company India",
    "Adhunik Crop Care",
    "crop protection chemicals",
  ],

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/fevicon.png",
    shortcut: "/fevicon.png",
    apple: "/fevicon.png",
  },

  openGraph: {
    title: "Adhunik Crop Care — Pesticides & Bio Fertilizers India",
    description:
      "Adhunik Crop Care is a trusted manufacturer of pesticides, insecticides, fungicides, herbicides & bio fertilizers for sustainable farming in India.",
    type: "website",
    siteName: "Adhunik Crop Care",
    locale: "en_IN",
  },

  twitter: {
    card: "summary_large_image",
    title: "Adhunik Crop Care — Pesticides & Bio Fertilizers India",
    description:
      "Adhunik Crop Care is a trusted manufacturer of pesticides, insecticides, fungicides, herbicides & bio fertilizers for sustainable farming in India.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className="h-full antialiased [--font-fraunces:'Fraunces',Georgia,serif] [--font-geist-mono:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace] [--font-inter:'Inter',ui-sans-serif,system-ui,sans-serif]"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,600;1,9..144,700&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
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
