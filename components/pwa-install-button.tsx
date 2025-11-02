"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowButton(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Check if app is already installed (alternative check)
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowButton(false)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback: show instructions for manual installation
      alert('Për të instaluar aplikacionin:\n\nChrome/Edge: Klikoni ikonën e instalimit në shiritin e adresës\nSafari (iOS): Klikoni "Shpërnda" dhe pastaj "Shto në Ekranin Home"\nFirefox: Klikoni menunë dhe zgjidhni "Instalo"')
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
      setIsInstalled(true)
      setShowButton(false)
    } else {
      console.log('User dismissed the install prompt')
    }

    setDeferredPrompt(null)
  }

  // Don't show if already installed or not available
  if (isInstalled || !showButton) {
    return null
  }

  return (
    <Button 
      onClick={handleInstallClick}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Download className="w-4 h-4" />
      <span className="hidden md:inline">Instalo App</span>
    </Button>
  )
}

