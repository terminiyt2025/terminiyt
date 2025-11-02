import type React from "react"
import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import { PWARegister } from "@/components/pwa-register"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
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
  manifest: "/manifest.json",
  themeColor: "#0d9488",
  icons: {
    icon: "/fav-icon.png",
    shortcut: "/fav-icon.png",
    apple: "/fav-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TerminiYt",
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

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="sq">
      <body className={`font-sans ${outfit.variable}`} suppressHydrationWarning={true}>
          <PWARegister />
          <Suspense fallback={null}>{children}</Suspense>
          <Toaster />
          <PWAInstallPrompt />
      </body>
    </html>
  )
}
