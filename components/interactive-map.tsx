"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Loader2, AlertCircle } from "lucide-react"
import { useLocation } from "@/hooks/use-location"
import type { Business } from "@/lib/database"

interface InteractiveMapProps {
  businesses: Business[]
  onBusinessSelect?: (business: Business) => void
}

export function InteractiveMap({ businesses, onBusinessSelect }: InteractiveMapProps) {
  const { latitude, longitude, error, loading, getCurrentLocation, calculateDistance } = useLocation()
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)

  // Calculate distances for all businesses when location is available
  const businessesWithDistance = businesses
    .map((business) => {
      const distance =
        business.latitude && business.longitude ? calculateDistance(business.latitude, business.longitude) : null

      return {
        ...business,
        calculatedDistance: distance,
      }
    })
    .sort((a, b) => {
      // Sort by distance if available, otherwise by name
      if (a.calculatedDistance && b.calculatedDistance) {
        return a.calculatedDistance - b.calculatedDistance
      }
      return a.name.localeCompare(b.name)
    })

  const handleBusinessClick = (business: Business) => {
    setSelectedBusiness(business)
    onBusinessSelect?.(business)
  }

  if (!latitude || !longitude) {
    return (
      <Card className="h-96">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <MapPin className="w-16 h-16 text-emerald-600 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Interactive Map</h3>
              <p className="text-muted-foreground mb-4">Enable location services to see nearby providers on the map</p>
              {error && (
                <div className="flex items-center justify-center gap-2 text-red-600 mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              <Button onClick={getCurrentLocation} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 mr-2" />
                    Enable Location
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <Card className="h-96 relative overflow-hidden">
        <CardContent className="h-full p-0">
          {/* Map Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-teal-100">
            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="grid grid-cols-8 grid-rows-6 h-full">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border border-emerald-300"></div>
                ))}
              </div>
            </div>

            {/* User Location Marker */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
                <div className="absolute -top-1 -left-1 w-6 h-6 bg-blue-600 rounded-full opacity-30 animate-ping"></div>
              </div>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  You are here
                </Badge>
              </div>
            </div>

            {/* Business Markers */}
            {businessesWithDistance.slice(0, 6).map((business, index) => {
              const positions = [
                { top: "25%", left: "30%" },
                { top: "35%", left: "70%" },
                { top: "60%", left: "25%" },
                { top: "70%", left: "65%" },
                { top: "20%", left: "60%" },
                { top: "75%", left: "40%" },
              ]

              const position = positions[index] || positions[0]

              return (
                <div
                  key={business.id}
                  className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                  style={{ top: position.top, left: position.left }}
                  onClick={() => handleBusinessClick(business)}
                >
                  <div className={`relative ${selectedBusiness?.id === business.id ? "z-10" : ""}`}>
                    <div
                      className={`w-3 h-3 rounded-full border-2 border-white shadow-lg ${
                        business.is_verified ? "bg-emerald-600" : "bg-orange-500"
                      }`}
                    ></div>
                    {selectedBusiness?.id === business.id && (
                      <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-48">
                        <div className="bg-white rounded-lg shadow-lg border p-3">
                          <h4 className="font-medium text-sm">{business.name}</h4>
                          <p className="text-xs text-muted-foreground">{business.address}</p>
                          {business.calculatedDistance && (
                            <p className="text-xs text-emerald-600 font-medium">
                              {business.calculatedDistance} miles away
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 space-y-2">
            <Button size="sm" variant="secondary" className="bg-white/90 backdrop-blur-sm">
              <Navigation className="w-4 h-4" />
            </Button>
          </div>

          {/* Location Info */}
          <div className="absolute bottom-4 left-4">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
              <MapPin className="w-3 h-3 mr-1" />
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Map Legend */}
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
          <span>Your Location</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
          <span>Verified Businesses</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span>Unverified Businesses</span>
        </div>
      </div>
    </div>
  )
}
