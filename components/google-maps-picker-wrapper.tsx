"use client"

import dynamic from "next/dynamic"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Loader2 } from "lucide-react"

// Dynamically import Google Maps Picker component to prevent hydration issues
const GoogleMapsPicker = dynamic(() => import("./google-maps-picker").then(mod => ({ default: mod.GoogleMapsPicker })), {
  ssr: false,
  loading: () => (
    <Card className="h-80">
      <CardContent className="h-full flex items-center justify-center">
        <div className="text-center space-y-10">
          <MapPin className="w-16 h-16 text-emerald-600 mx-auto" />
          <div>
            <h3 className="text-xl font-semibold mb-2">Loading Map Picker...</h3>
            <p className="text-muted-foreground mb-4">Please wait while we initialize the location picker</p>
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

interface GoogleMapsPickerWrapperProps {
  onLocationSelect: (location: {
    address: string
    latitude: number
    longitude: number
  }) => void
  initialAddress?: string
  initialLatitude?: number
  initialLongitude?: number
}

export function GoogleMapsPickerWrapper(props: GoogleMapsPickerWrapperProps) {
  return <GoogleMapsPicker {...props} />
}

