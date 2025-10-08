"use client"

import { useEffect, useRef, useState } from "react"
import { Loader } from "@googlemaps/js-api-loader"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Search, Loader2, AlertCircle, Check } from "lucide-react"

interface GoogleMapsPickerProps {
  onLocationSelect: (location: {
    address: string
    latitude: number
    longitude: number
  }) => void
  initialAddress?: string
  initialLatitude?: number
  initialLongitude?: number
}

export function GoogleMapsPicker({ 
  onLocationSelect, 
  initialAddress = "", 
  initialLatitude, 
  initialLongitude 
}: GoogleMapsPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const searchBoxRef = useRef<HTMLInputElement>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState(initialAddress)
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string
    latitude: number
    longitude: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  // Helper function to add/update marker
  const addOrUpdateMarker = (map: google.maps.Map, position: google.maps.LatLng, title: string) => {
    console.log("Adding marker at position:", position.lat(), position.lng())
    
    // Remove existing marker if it exists
    if (markerRef.current) {
      markerRef.current.setMap(null)
      markerRef.current = null
    }
    
    // Create new marker with explicit options
    markerRef.current = new window.google.maps.Marker({
      map: map,
      position: position,
      title: title,
      draggable: false,
      animation: window.google.maps.Animation.DROP
    })
    
    console.log("Marker created:", markerRef.current)
    console.log("Marker map:", markerRef.current.getMap())
    console.log("Marker position:", markerRef.current.getPosition())
  }

  // Helper function to create map instance
  const createMapInstance = async () => {
    if (!mapRef.current) {
      throw new Error("Map container not available")
    }

    // Double check that container is still in DOM
    if (!document.contains(mapRef.current)) {
      throw new Error("Map container not in DOM")
    }

    // Ensure Google Maps is fully loaded
    if (!window.google || !window.google.maps || !window.google.maps.Map) {
      throw new Error("Google Maps API not fully loaded")
    }

    // Additional check for required classes
    if (!window.google.maps.LatLng || !window.google.maps.Marker || !window.google.maps.places) {
      throw new Error("Google Maps API classes not available")
    }

    const map = new window.google.maps.Map(mapRef.current, {
      center: selectedLocation ? 
        { lat: selectedLocation.latitude, lng: selectedLocation.longitude } : 
        initialLatitude && initialLongitude ?
          { lat: initialLatitude, lng: initialLongitude } :
          { lat: 42.8826, lng: 20.8677 }, // Default to Mitrovica, Kosovo
      zoom: 16,
      mapTypeId: 'satellite',
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true
    })
    
    // Store map instance in ref
    mapInstanceRef.current = map

    // Wait for map to be ready before adding markers
    window.google.maps.event.addListenerOnce(map, 'idle', () => {
      console.log("Map is idle and ready, adding initial marker...")
      const testPosition = new window.google.maps.LatLng(42.8826, 20.8677)
      addOrUpdateMarker(map, testPosition, "Click to select location")
    })

    // Create search box
    if (searchBoxRef.current) {
      const searchBox = new window.google.maps.places.SearchBox(searchBoxRef.current)
      
      // Bias search results to current map viewport
      map.addListener("bounds_changed", () => {
        searchBox.setBounds(map.getBounds() as window.google.maps.LatLngBounds)
      })

      // Listen for search results
      searchBox.addListener("places_changed", () => {
        console.log("Search places changed")
        const places = searchBox.getPlaces()
        console.log("Found places:", places)
        if (!places || places.length === 0) return

        const place = places[0]
        if (!place.geometry?.location) return

        const location = {
          address: place.formatted_address || "",
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        }

        console.log("Search result location:", location)
        setSelectedLocation(location)
        onLocationSelect(location)

        // Update map
        map.setCenter(place.geometry.location)
        map.setZoom(17)

        // Add/update marker
        addOrUpdateMarker(map, place.geometry.location, place.name || "Selected Location")
      })
    }

    // Add click listener to map
    map.addListener("click", (event: window.google.maps.MapMouseEvent) => {
      console.log("Map clicked at:", event.latLng)
      if (!event.latLng) {
        console.log("No latLng in click event")
        return
      }

      const lat = event.latLng.lat()
      const lng = event.latLng.lng()
      console.log("Click coordinates:", lat, lng)

      const location = {
        address: "", // Don't auto-fill address, let user type it
        latitude: lat,
        longitude: lng
      }

      console.log("Setting location:", location)
      setSelectedLocation(location)
      onLocationSelect(location)

      // Update map center and add/update marker
      map.setCenter(event.latLng)
      console.log("About to add marker at clicked location")
      addOrUpdateMarker(map, event.latLng, "Selected Location")
    })

    // If we have initial coordinates, update marker after map is ready
    if (initialLatitude && initialLongitude) {
      window.google.maps.event.addListenerOnce(map, 'idle', () => {
        console.log("Map ready, adding initial business location marker...")
        const initialPosition = new window.google.maps.LatLng(initialLatitude, initialLongitude)
        addOrUpdateMarker(map, initialPosition, "Business Location")
      })
    }

    return map
  }

  // Initialize Google Maps
  useEffect(() => {
    let retryCount = 0
    const maxRetries = 5
    let isMounted = true
    
    const initializeMap = async () => {
      console.log(`Starting map initialization... (attempt ${retryCount + 1})`)
      
      // Add a small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Check if component is still mounted
      if (!isMounted) {
        console.log("Component unmounted, stopping initialization")
        return
      }
      
      if (!mapRef.current) {
        console.log("Map container not ready yet, retrying...")
        retryCount++
        if (retryCount < maxRetries) {
          setTimeout(() => initializeMap(), 1000)
        } else {
          if (isMounted) {
            setError("Map container not available after multiple attempts")
            setLoading(false)
          }
        }
        return
      }

      console.log("Map container found, proceeding with initialization")

      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        console.log("Google Maps already loaded, using existing instance")
        try {
          // Check if component is still mounted before waiting
          if (!isMounted) {
            console.log("Component unmounted before waiting, stopping")
            return
          }
          
          // Wait a bit more to ensure everything is ready
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Check if component is still mounted before creating map
          if (!isMounted || !mapRef.current) {
            console.log("Component unmounted or container disappeared, stopping")
            return
          }
          
          await createMapInstance()
          if (isMounted) {
            setMapLoaded(true)
            setLoading(false)
          }
        } catch (err) {
          console.error("Error creating map with existing Google Maps:", err)
          if (isMounted) {
            setError("Failed to create map instance")
            setLoading(false)
          }
        }
        return
      }

      try {
        if (isMounted) {
          setLoading(true)
          setError(null)
        }

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        console.log("Google Maps API Key:", apiKey ? "Present" : "Missing")
        
        if (!apiKey) {
          setError("Google Maps API key is not configured. Please contact the administrator.")
          return
        }
        
        // Check if component is still mounted before creating loader
        if (!isMounted) {
          console.log("Component unmounted before creating loader, stopping")
          return
        }
        
        // Check if component is still mounted before creating loader
        if (!isMounted) {
          console.log("Component unmounted before creating loader, stopping")
          return
        }
        
        // Double check before creating loader
        if (!isMounted) {
          console.log("Component unmounted during loader creation check, stopping")
          return
        }
        
        // Triple check before creating loader
        if (!isMounted) {
          console.log("Component unmounted during final loader creation check, stopping")
          return
        }
        
        // Quadruple check before creating loader
        if (!isMounted) {
          console.log("Component unmounted during quadruple loader creation check, stopping")
          return
        }
        
        // Quintuple check before creating loader
        if (!isMounted) {
          console.log("Component unmounted during quintuple loader creation check, stopping")
          return
        }
        
        // Sextuple check before creating loader
        if (!isMounted) {
          console.log("Component unmounted during sextuple loader creation check, stopping")
          return
        }
        
        // Septuple check before creating loader
        if (!isMounted) {
          console.log("Component unmounted during septuple loader creation check, stopping")
          return
        }
        
        const loader = new Loader({
          apiKey: apiKey,
          version: "weekly",
          libraries: ["places", "geometry"],
          language: 'sq' // Albanian language
        })

        let google: any
        try {
          console.log("Loading Google Maps API...")
          
          // Check if component is still mounted before loading API
          if (!isMounted) {
            console.log("Component unmounted before loading API, stopping")
            return
          }
          
          google = await loader.load()
          console.log("Google Maps API loaded successfully")
          
          // Check if component is still mounted after API loading
          if (!isMounted) {
            console.log("Component unmounted during API loading, stopping")
            return
          }
        } catch (loadError) {
          console.error("Error loading Google Maps API:", loadError)
          if (isMounted) {
            setError("Failed to load Google Maps. Please check your API key and internet connection.")
            setLoading(false)
          }
          return
        }
        
        // Ensure the map container is still available
        if (!isMounted || !mapRef.current) {
          console.error("Component unmounted or map container disappeared during loading")
          if (isMounted) {
            setError("Map container not available")
            setLoading(false)
          }
          return
        }
        
        // Create map instance using helper function
        try {
          // Final check before creating map
          if (!isMounted || !mapRef.current) {
            console.log("Component unmounted or container disappeared before map creation")
            return
          }
          
          await createMapInstance()
          if (isMounted) {
            setMapLoaded(true)
            setLoading(false)
          }
        } catch (mapError) {
          console.error("Error creating map:", mapError)
          if (isMounted) {
            setError("Failed to create map. Please check your API key and try again.")
            setLoading(false)
          }
          return
        }

        } catch (err) {
          console.error("Error loading Google Maps:", err)
          if (isMounted) {
            setError("Failed to load Google Maps. Please check your API key.")
            setLoading(false)
          }
        }
    }

    initializeMap()

    // Cleanup function
    return () => {
      isMounted = false
      if (markerRef.current) {
        markerRef.current.setMap(null)
        markerRef.current = null
      }
    }
  }, [retryKey]) // Re-run when retry key changes

  // Update map center when initial coordinates change
  useEffect(() => {
    if (mapLoaded && initialLatitude && initialLongitude && mapInstanceRef.current) {
      const mapInstance = mapInstanceRef.current
      const newCenter = new window.google.maps.LatLng(initialLatitude, initialLongitude)
      mapInstance.setCenter(newCenter)
      mapInstance.setZoom(16)
      
      // Update marker
      if (markerRef.current) {
        markerRef.current.setPosition(newCenter)
      } else {
        addOrUpdateMarker(mapInstance, newCenter, "Selected City")
      }
    }
  }, [initialLatitude, initialLongitude, mapLoaded])

  const handleSearch = () => {
    if (searchBoxRef.current) {
      searchBoxRef.current.focus()
      // Trigger search by pressing Enter
      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      searchBoxRef.current.dispatchEvent(event)
    }
  }

  const handleRetry = () => {
    setError(null)
    setMapLoaded(false)
    setRetryKey(prev => prev + 1)
  }

  return (
    <div className="space-y-2">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={searchBoxRef}
          placeholder="Kërko për një adresë ose biznes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-20"
        />
        <Button 
          size="sm" 
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 bg-gradient-to-r from-gray-800 to-teal-800"
          onClick={handleSearch}
        >
          Kërko
        </Button>
      </div>

      {/* Map Container */}
      <div className="h-80 relative overflow-hidden rounded-lg border border-gray-300">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
              <p className="text-sm text-muted-foreground">Duke ngarkuar Google Maps...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <AlertCircle className="w-8 h-8 mx-auto text-red-600" />
              <div>
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <Button 
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-50"
                >
                  🔄 Provo Përsëri
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div ref={mapRef} className="w-full h-full" />
        )}
      </div>

      {/* Instructions */}
      <div className="text-sm text-muted-foreground">
        <p>💡 <strong>Si të përdoret:</strong> Shkruani një adresë në kutinë e kërkimit ose klikoni në hartë për të vendosur një vendndodhje të saktë</p>
      </div>

      {/* Selected Location Display */}
      {selectedLocation && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-emerald-900">Vendndodhja Është Vendosur</h4>
                <p className="text-sm text-emerald-700 mt-1">{selectedLocation.address}</p>
                <div className="flex items-center gap-4 mt-2 text-base text-emerald-600">
                  <span>Lat: {selectedLocation.latitude.toFixed(6)}</span>
                  <span>Lng: {selectedLocation.longitude.toFixed(6)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Key Warning */}
      {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Kërkohet Çelësi i Google Maps API</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Për të përdorur këtë funksion, duhet të konfiguroni një çelës Google Maps API. 
                  Shtoni <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> në variablat e mjedisit.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
