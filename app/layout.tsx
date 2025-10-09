import type React from "react"
import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
})

export const metadata: Metadata = {
  title: "TerminiYt.com",
  description: "Rezervo shërbimet tuaja lokale në Kosovë",
  generator: "v0.app",
  icons: {
    icon: "/fav-icon.png",
    shortcut: "/fav-icon.png",
    apple: "/fav-icon.png",
  },
  openGraph: {
    title: "TerminiYt.com",
    description: "Rezervo shërbimet tuaja lokale në Kosovë",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "TerminiYt.com",
    description: "Rezervo shërbimet tuaja lokale në Kosovë",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${outfit.variable}`} suppressHydrationWarning={true}>
        <Suspense fallback={null}>{children}</Suspense>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
