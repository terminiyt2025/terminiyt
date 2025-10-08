"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Loader } from "@googlemaps/js-api-loader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Navigation, Loader2, AlertCircle, Filter, Instagram, Facebook, Phone, Globe, Clock } from "lucide-react"
import { useLocation } from "@/hooks/use-location"
import { useBusinesses } from "@/hooks/use-businesses"
import type { Business, Category } from "@/lib/database"

// Declare global types for MarkerClusterer
declare global {
  interface Window {
    google: any
  }
}

interface GoogleMapsProps {
  businesses: Business[]
  categories: Category[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  onBusinessSelect?: (business: Business) => void
}

export function GoogleMaps({ businesses: propBusinesses, categories, selectedCategory, onCategoryChange, onBusinessSelect }: GoogleMapsProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const { latitude, longitude, error, loading, getCurrentLocation, calculateDistance, setLocationToPrishtina } = useLocation()
  const { businesses: storeBusinesses } = useBusinesses()
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null)
  const [clusters, setClusters] = useState<google.maps.Marker[]>([])
  const [mapError, setMapError] = useState<string | null>(null)

  // Use businesses from store if available, otherwise use props
  const businesses = storeBusinesses.length > 0 ? storeBusinesses : propBusinesses

  // Filter businesses by category
  const filteredBusinesses = businesses.filter(business => {
    if (selectedCategory === "all") return true
    return String(business.category_id) === String(selectedCategory)
  })

  // Automatically get location when component mounts
  useEffect(() => {
    if (!latitude || !longitude) {
      getCurrentLocation()
    }
  }, [])

  // Initialize Google Maps
  const initializeMap = useCallback(async () => {
    if (!mapRef.current || !latitude || !longitude) {
      return
    }

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude) || 
        latitude < -90 || latitude > 90 || 
        longitude < -180 || longitude > 180) {
      console.error("Invalid coordinates:", { latitude, longitude })
      return
    }

    try {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE",
        version: "weekly",
        libraries: ["places", "geometry"],
        language: 'sq' // Albanian language
      })

      const google = await loader.load()
      
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: latitude, lng: longitude },
        zoom: 12, // City-level zoom - shows neighborhood/city area
         styles: [
           {
             featureType: "poi.business",
             stylers: [{ visibility: "on" }]
           },
           {
             featureType: "landscape",
             elementType: "geometry",
             stylers: [{ color: "#f5f5f5" }]
           },
           {
             featureType: "water",
             elementType: "geometry",
             stylers: [{ color: "#e3f2fd" }]
           },
           {
             featureType: "road",
             elementType: "geometry",
             stylers: [{ color: "#ffffff" }]
           },
           {
             featureType: "poi",
             elementType: "labels",
             stylers: [{ visibility: "off" }]
           }
         ],
         mapTypeControl: false,
         streetViewControl: false,
         fullscreenControl: false
       })

      mapInstanceRef.current = map
      setMapLoaded(true)

      // Add user location marker
      const userMarkerInstance = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map,
        icon: {
          url: "https://i.ibb.co/ksKjrR10/pin-red.png",
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(32, 32),
          strokeWeight: 0 // Remove outline
        },
        title: "Vendndodhja Juaj"
      })
      setUserMarker(userMarkerInstance)

      // Add info window for user location
      const userInfoWindow = new google.maps.InfoWindow({
        content: `
          <div style="
            display: flex;
            align-items: center;
            margin-bottom: 8px;
          ">
            <h3 style="
              font-weight: 600;
              font-size: 14px;
              color: #059669;
              margin: 0;
              display: flex;
              align-items: center;
              gap: 6px;
            ">
              <div style="
                width: 8px;
                height: 8px;
                background: #059669;
                border-radius: 50%;
                animation: pulse 2s infinite;
              "></div>
              Ju jeni këtu
            </h3>
          </div>
          <p style="
            font-size: 12px;
            color: #6b7280;
            margin: 0;
            font-family: 'Outfit', Monaco, 'Cascadia Code', monospace;
            background: white;
            padding: 4px 8px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          ">
            ${latitude.toFixed(4)}, ${longitude.toFixed(4)}
          </p>
       
          <style>
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          </style>
        `,
        disableAutoPan: true,
        pixelOffset: new google.maps.Size(0, -10)
      })
      
      
      userMarkerInstance.addListener("click", () => {
        userInfoWindow.open(map, userMarkerInstance)
      })

      // Add 10km radius circle around user location
      const radiusCircle = new google.maps.Circle({
        strokeColor: "#3B82F6",
        strokeOpacity: 0.3,
        strokeWeight: 2,
        fillColor: "#3B82F6",
        fillOpacity: 0.1,
        map: map,
        center: { lat: latitude, lng: longitude },
        radius: 10000, // 10km in meters
      })

      // Set city-level view bounds (approximately 15km radius)
      const cityBounds = new google.maps.LatLngBounds()
      const cityRadius = 15000 // 15km in meters
      
      // Add bounds for city view
      cityBounds.extend({ lat: latitude + (cityRadius / 111000), lng: longitude + (cityRadius / (111000 * Math.cos(latitude * Math.PI / 180))) })
      cityBounds.extend({ lat: latitude - (cityRadius / 111000), lng: longitude - (cityRadius / (111000 * Math.cos(latitude * Math.PI / 180))) })
      
      // Fit map to city bounds with padding
      map.fitBounds(cityBounds, 50)

      // Get city name using reverse geocoding
      const geocoder = new google.maps.Geocoder()
      geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const cityComponent = results[0].address_components.find(component => 
            component.types.includes('locality') || component.types.includes('administrative_area_level_2')
          )
          if (cityComponent) {
            console.log(`Map centered on: ${cityComponent.long_name}`)
          }
        }
      })

    } catch (error) {
      console.error("Error loading Google Maps:", error)
      setMapError("Failed to load Google Maps. Please check your API key and try again.")
    }
  }, [latitude, longitude])

  // Calculate distance between two points (fallback method)
  const calculateDistanceBetween = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lng2 - lng1) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  // Function to get pin icon for each category
  const getCategoryPinIcon = (categoryId: string | number) => {
    const category = categories.find(cat => String(cat.id) === String(categoryId))
    if (category?.icon) {
      // Check if it's a local icon path or external URL
      if (category.icon.startsWith('/')) {
        return category.icon // Local icon
      } else if (category.icon.startsWith('http')) {
        return category.icon // External URL
      }
    }
    // Fallback to a default icon
    return "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
  }


  // Add business markers to map with simple clustering
  const addBusinessMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !mapLoaded) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    const google = window.google
    const markers: google.maps.Marker[] = []
    const clusterRadius = 100 // meters

    filteredBusinesses.forEach((business) => {
      if (!business.latitude || !business.longitude) return

      // Validate business coordinates
      if (isNaN(business.latitude) || isNaN(business.longitude) || 
          business.latitude < -90 || business.latitude > 90 || 
          business.longitude < -180 || business.longitude > 180) {
        console.warn("Invalid business coordinates:", business.name, { 
          latitude: business.latitude, 
          longitude: business.longitude 
        })
        return
      }

      // Check if there's already a marker nearby
      let nearbyMarker: google.maps.Marker | null = null
      let nearbyIndex = -1

      for (let i = 0; i < markers.length; i++) {
        const existingMarker = markers[i]
        const existingPos = existingMarker.getPosition()
        if (existingPos) {
          let distance: number
          try {
            // Try to use Google Maps geometry library first
            distance = google.maps.geometry.spherical.computeDistanceBetween(
              existingPos,
              { lat: business.latitude, lng: business.longitude }
            )
          } catch (error) {
            // Fallback to custom calculation if geometry library fails
            distance = calculateDistanceBetween(
              existingPos.lat(),
              existingPos.lng(),
              business.latitude,
              business.longitude
            )
          }
          if (distance <= clusterRadius) {
            nearbyMarker = existingMarker
            nearbyIndex = i
            break
          }
        }
      }

      if (nearbyMarker) {
        // Update existing marker to show cluster count
        const currentLabel = nearbyMarker.getLabel()
        const currentCount = typeof currentLabel === 'string' ? 1 : (currentLabel?.text ? parseInt(currentLabel.text) : 1)
        const newCount = currentCount + 1
        
        nearbyMarker.setLabel({
          text: newCount > 1 ? `+${newCount}` : '',
          color: "#FFFFFF",
          fontSize: "14px",
          fontWeight: "bold"
        })
        
                 // Update marker size and color for clusters
         if (newCount > 1) {
           nearbyMarker.setIcon({
             url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
             scaledSize: new google.maps.Size(40, 40),
             anchor: new google.maps.Point(20, 20),
             strokeWeight: 0 // Remove outline
           })
         }
      } else {
        // Get marker icon from category data
        const markerIcon = getCategoryPinIcon(business.category_id)

        // Create new marker
        const marker = new google.maps.Marker({
          position: { lat: business.latitude, lng: business.longitude },
          map: mapInstanceRef.current,
          icon: {
            url: markerIcon,
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16),
            strokeWeight: 0 // Remove outline
          },
          title: business.name
        })

        // Create info window content - updated
        const distance = calculateDistance(business.latitude, business.longitude)
        const infoWindowContent = `
          <div style="padding: 12px; min-width: 180px; font-family: system-ui, -apple-system, sans-serif;">
            <h3 style="font-weight: 600; color: #1f2937; margin: 0 0 8px 0; font-size: 16px;">${business.name}</h3>
            <div style="display: flex; align-items: center; gap: 6px; margin: 0 0 6px 0; font-size: 14px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span style="color: #6b7280;">${business.phone}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; margin: 0 0 6px 0; font-size: 14px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span style="color: #6b7280;">${distance ? distance.toFixed(1) + ' km' : 'Distance unavailable'}</span>
            </div>
            <p style="background: linear-gradient(135deg, #1f2937, #0d9488); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0 0 12px 0; font-size: 13px; font-weight: 500;">${(business as any).category_name || 'Unknown Category'}</p>
            <button 
              onclick="window.selectBusiness('${business.id}')"
              style="
                width: 100%; 
                background: linear-gradient(135deg, #1f2937, #0d9488); 
                color: white; 
                font-size: 13px; 
                padding: 8px 12px; 
                border: none; 
                border-radius: 6px; 
                cursor: pointer; 
                font-weight: 500;
                transition: all 0.2s;
              "
              onmouseover="this.style.background='linear-gradient(135deg, #374151, #0f766e)'"
              onmouseout="this.style.background='linear-gradient(135deg, #1f2937, #0d9488)'"
            >
              Shiko Detajet
            </button>
          </div>
        `

        const infoWindow = new google.maps.InfoWindow({
          content: infoWindowContent
        })

        marker.addListener("click", () => {
          infoWindow.open(mapInstanceRef.current, marker)
          setSelectedBusiness(business)
        })

        markers.push(marker)
        markersRef.current.push(marker)
      }
    })

    // Fit map to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      markersRef.current.forEach(marker => {
        const position = marker.getPosition()
        if (position) {
          bounds.extend(position)
        }
      })
      // Include user location in bounds
      if (latitude && longitude) {
        bounds.extend({ lat: latitude, lng: longitude })
      }
      mapInstanceRef.current.fitBounds(bounds)
    }
  }, [filteredBusinesses, mapLoaded, calculateDistance, latitude, longitude])

  // Initialize map when location is available
  useEffect(() => {
    if (latitude && longitude && !mapLoaded) {
      initializeMap()
    }
  }, [latitude, longitude, mapLoaded, initializeMap])

  // Update markers when businesses or category filter changes
  useEffect(() => {
    if (mapLoaded) {
      addBusinessMarkers()
    }
  }, [filteredBusinesses, mapLoaded, addBusinessMarkers])

  // Add global function for info window button clicks
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).selectBusiness = (businessId: string) => {
        const business = businesses.find(b => b.id === businessId)
        if (business) {
          setSelectedBusiness(business)
          onBusinessSelect?.(business)
        }
      }
    }

    // Cleanup function to remove global function
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).selectBusiness
      }
    }
  }, [businesses, onBusinessSelect])

  if (!latitude || !longitude || mapError) {
    return (
      <Card className="h-96">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <MapPin className="w-16 h-16 mx-auto text-teal-600" />
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {error === "Location access denied by user" ? "Vendndodhja e Kërkuar" : "Duke ngarkuar Google Maps"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {error === "Location access denied by user" 
                  ? "Ju lutem aktivizoni vendndodhjen në shfletuesin tuaj për të parë shërbimet pranë jush" 
                  : "Ju lutem prisni që harta të ngarkohet"}
              </p>
              {(error || mapError) && (
                <div className="flex items-center justify-center gap-2 text-red-600 mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error || mapError}</span>
                </div>
              )}
              <Button 
                onClick={() => {
                  setMapError(null)
                  if (error === "Location access denied by user") {
                    // If location was previously denied, set to Prishtina
                    setLocationToPrishtina()
                  } else {
                    // Otherwise, try to get current location
                    getCurrentLocation()
                  }
                }} 
                disabled={loading}
                className="bg-gradient-to-br from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Duke Marrë Vendndodhjen...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 mr-2" />
                    {error === "Location access denied by user" ? "Shiko në Prishtinë" : "Aktivizo Vendndodhjen"}
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
      {/* Category Filter */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white" />
          <span className="text-md ">Filtro kategoritë:</span>
        </div>
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-48 bg-white text-black border-white">
            <div className="flex items-center gap-2">
              {selectedCategory === "all" ? (
                <>
                 
                  <span className="text-md text-black">Të Gjitha Kategoritë</span>
                </>
              ) : (
                <>
                  <img 
                    src={getCategoryPinIcon(selectedCategory)} 
                    alt="Category" 
                    className="w-5 h-5" 
                  />
                  <span className="text-black">{categories.find(cat => String(cat.id) === selectedCategory)?.name}</span>
                </>
              )}
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white text-black">
            <SelectItem value="all" className="text-black hover:bg-gray-100 focus:bg-gray-100">
              <div className="flex items-center gap-2">
              
                <span className="text-black">Të Gjitha Kategoritë</span>
              </div>
            </SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)} className="text-black hover:bg-gray-100 focus:bg-gray-100">
                <div className="flex items-center gap-2">
                  <img 
                    src={getCategoryPinIcon(category.id)} 
                    alt={category.name} 
                    className="w-5 h-5" 
                  />
                  <span className="text-black">{category.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Map Container */}
      <div className={`${selectedBusiness ? 'h-[50vh]' : 'h-[70vh]'} relative overflow-hidden rounded-xl transition-all duration-300`}>
        <div ref={mapRef} className="w-full h-full" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}} />
          
        {/* Map Controls */}
        <div className="absolute top-4 right-4 space-y-2">
          <Button 
            size="sm" 
            variant="secondary" 
            className="bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white hover:text-gray-900 border border-gray-300"
            onClick={() => {
              if (mapInstanceRef.current && userMarker) {
                const position = userMarker.getPosition()
                if (position) {
                  mapInstanceRef.current.panTo(position)
                  mapInstanceRef.current.setZoom(15)
                }
              }
            }}
          >
            <Navigation className="w-4 h-4" />
          </Button>
        </div>

        {/* Location Info */}
        <div className="absolute bottom-4 left-4">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-gray-900 border border-gray-300">
            <MapPin className="w-3 h-3 mr-1 text-teal-600" />
            <span className="text-gray-900 font-medium">{latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
          </Badge>
        </div>
      </div>



      {/* Selected Business Info */}
      {selectedBusiness && (
        <Card className="mt-4 animate-in slide-in-from-bottom-4 duration-300">
          <CardContent className="p-3">
            {/* Business Info - All in One Row on Desktop */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Business Basic Info */}
                <div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2">{selectedBusiness.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-gradient-to-br from-gray-800 to-teal-800 bg-clip-text text-transparent font-medium">{(selectedBusiness as any).category_name || 'Unknown Category'}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-teal-900" />
                    <p className="text-gray-600 text-sm">{selectedBusiness.address}, {selectedBusiness.city}</p>
                  </div>
                  
                  {/* Social Media Icons - Under Business Name */}
                  <div className="flex flex-row gap-3">
                    {selectedBusiness.instagram && (
                      <a 
                        href={`https://instagram.com/${selectedBusiness.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-900 hover:text-teal-700 transition-colors"
                      >
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {selectedBusiness.facebook && (
                      <a 
                        href={selectedBusiness.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-900 hover:text-teal-700 transition-colors"
                      >
                        <Facebook className="w-5 h-5" />
                      </a>
                    )}
                    {selectedBusiness.website && (
                      <a 
                        href={selectedBusiness.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-900 hover:text-teal-700 transition-colors"
                      >
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Services */}
                {selectedBusiness.services && selectedBusiness.services.length > 0 && (
                  <div className="lg:w-4/5">
                    <h4 className="font-semibold text-gray-900 mb-3">Shërbimet</h4>
                    <ul className="space-y-2">
                      {selectedBusiness.services.map((service: any, index: number) => (
                        <li key={index} className="flex justify-between items-center py-1 text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-gray-900 truncate">{service.name}</span>
                            <span className="text-gray-500 text-xs flex items-center gap-1 flex-shrink-0"><Clock className="w-3 h-3" />{service.duration}</span>
                          </div>
                          {service.price && service.price > 0 && (
                            <span className="bg-gradient-to-br from-gray-800 to-teal-800 bg-clip-text text-transparent font-semibold flex-shrink-0 ml-2">{service.price}€</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Operating Hours */}
                {selectedBusiness.operating_hours && (
                  <div className="lg:w-4/5">
                    <h4 className="font-semibold text-gray-900 mb-3">Orari i Punës</h4>
                    <div className="space-y-1">
                      {Object.entries(selectedBusiness.operating_hours)
                        .filter(([day, hours]: [string, any]) => !hours.closed)
                        .map(([day, hours]: [string, any]) => (
                          <div key={day} className="flex justify-between text-sm">
                            <span className="font-medium text-gray-700 capitalize">{day}:</span>
                            <span className="text-gray-600">{hours.open} - {hours.close}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Empty column for spacing */}
                <div></div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-gray-300 text-gray-600 hover:bg-gradient-to-br hover:from-gray-800 hover:to-teal-800 hover:text-white hover:border-transparent ml-4"
                onClick={() => setSelectedBusiness(null)}
              >
                Mbyll
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center items-center mt-6">
              <Button 
                className="bg-gradient-to-br from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 px-6"
                onClick={() => window.open(`/${(selectedBusiness as any).slug}`, '_blank')}
              >
                Rezervo termin te ky biznes
              </Button>
            </div>

          </CardContent>
        </Card>
      )}
    </div>
  )
}
