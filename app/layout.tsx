import type React from "react"
import type { Metadata } from "next"
import { Space_Grotesk, DM_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
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
    title: "ServiceConnect - Find Local Service Providers",
    description: "Connect with local barbers, beauty salons, doctors and more. Book appointments easily.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ServiceConnect - Find Local Service Providers",
    description: "Connect with local barbers, beauty salons, doctors and more. Book appointments easily.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${dmSans.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning={true}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
