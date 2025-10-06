"use client"

import dynamic from "next/dynamic"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Loader2 } from "lucide-react"

// Dynamically import Google Maps component to prevent hydration issues
const GoogleMaps = dynamic(() => import("./google-maps").then(mod => ({ default: mod.GoogleMaps })), {
  ssr: false,
  loading: () => (
    <Card className="h-96">
      <CardContent className="h-full flex items-center justify-center">
        <div className="text-center space-y-32">
          <MapPin className="w-16 h-16 text-emerald-600 mx-auto" />
          <div>
            <h3 className="text-xl font-semibold mb-2">Loading Google Maps...</h3>
            <p className="text-muted-foreground mb-4">Please wait while we initialize the map</p>
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

interface GoogleMapsWrapperProps {
  businesses: any[]
  categories: any[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  onBusinessSelect?: (business: any) => void
}

export function GoogleMapsWrapper(props: GoogleMapsWrapperProps) {
  return <GoogleMaps {...props} />
}

