import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Crop Protection Products & Chemicals | Adhunik Crop Care",
  description:
    "Explore our full range of pesticides, insecticides, herbicides, fungicides, bio-pesticides & plant nutrition formulations crafted for Indian farms.",
  keywords: [
    "crop protection products India",
    "agricultural pesticides list",
    "buy insecticides India",
    "herbicides Glyphosate 41 SL",
    "fungicides Mancozeb India",
    "bio fertilizers Bio DAP",
  ],
  openGraph: {
    title: "Crop Protection Products & Chemicals | Adhunik Crop Care",
    description:
      "Explore our full range of pesticides, insecticides, herbicides, fungicides, bio-pesticides & plant nutrition formulations crafted for Indian farms.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crop Protection Products & Chemicals | Adhunik Crop Care",
    description:
      "Explore our full range of pesticides, insecticides, herbicides, fungicides, bio-pesticides & plant nutrition formulations crafted for Indian farms.",
  },
}

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
