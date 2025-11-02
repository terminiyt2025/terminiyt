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

// City coordinates mapping
const cityCoordinates: { [key: string]: { lat: number, lng: number } } = {
  "Prishtinë": { lat: 42.6629, lng: 21.1655 },
  "Prizren": { lat: 42.2139, lng: 20.7397 },
  "Pejë": { lat: 42.6593, lng: 20.2883 },
  "Gjakovë": { lat: 42.3803, lng: 20.4308 },
  "Gjilan": { lat: 42.4635, lng: 21.4694 },
  "Mitrovicë": { lat: 42.8826, lng: 20.8677 },
  "Ferizaj": { lat: 42.3709, lng: 21.1553 },
  "Podujeva": { lat: 42.9106, lng: 21.1933 },
  "Gllogoc": { lat: 42.6264, lng: 20.8939 },
  "Lipjan": { lat: 42.5242, lng: 21.1258 },
  "Rahovec": { lat: 42.3992, lng: 20.6547 },
  "Malishevë": { lat: 42.4822, lng: 20.7458 },
  "Suharekë": { lat: 42.3589, lng: 20.8258 },
  "Klinë": { lat: 42.6203, lng: 20.5775 },
  "Skënderaj": { lat: 42.7381, lng: 20.7897 },
  "Vushtrri": { lat: 42.8231, lng: 20.9675 },
  "Deçan": { lat: 42.5403, lng: 20.2875 },
  "Istog": { lat: 42.7806, lng: 20.4889 },
  "Kamenicë": { lat: 42.5781, lng: 21.5758 },
  "Dragash": { lat: 42.0625, lng: 20.6531 },
  "Shtime": { lat: 42.4331, lng: 21.0408 },
  "Kaçanik": { lat: 42.2306, lng: 21.2581 },
  "Novobërdë": { lat: 42.3167, lng: 21.4167 },
  "Ranillug": { lat: 42.5500, lng: 21.6000 },
  "Partesh": { lat: 42.4000, lng: 21.4500 },
  "Kllokot": { lat: 42.3667, lng: 21.3833 },
  "Graçanicë": { lat: 42.6000, lng: 21.2000 },
  "Han i Elezit": { lat: 42.1500, lng: 21.3000 },
  "Junik": { lat: 42.4833, lng: 20.2833 },
  "Mamushë": { lat: 42.3167, lng: 20.7167 },
  "Drenas": { lat: 42.6264, lng: 20.8939 },
  "F.Kosovë": { lat: 42.6408, lng: 21.1038 },
  "Obiliq": { lat: 42.6867, lng: 21.0775 },
  "Shtërpce": { lat: 42.2167, lng: 21.0167 },
  "Skenderaj": { lat: 42.7381, lng: 20.7897 },
  "Therandë": { lat: 42.3803, lng: 20.4308 },
  "Viti": { lat: 42.3167, lng: 21.4167 },
  "Mitrovicë E Veriut": { lat: 42.8945, lng: 20.8655 },
  "Zubin Potok": { lat: 42.9167, lng: 20.8333 },
  "Zveçan": { lat: 42.9167, lng: 20.8333 },
  "Leposaviq": { lat: 43.1000, lng: 20.8000 }
}

export function GoogleMaps({ businesses: propBusinesses, categories, selectedCategory, onCategoryChange, onBusinessSelect }: GoogleMapsProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const { latitude, longitude, error, loading, getCurrentLocation, calculateDistance, setLocationToPrishtina, detectedCity, isUserLocation } = useLocation()
  const { businesses: storeBusinesses } = useBusinesses()
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null)
  const [clusters, setClusters] = useState<google.maps.Marker[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState<string>("all")
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)
  const cityDropdownRef = useRef<HTMLDivElement>(null)

  // Set city based on location detection
  useEffect(() => {
    if (detectedCity && isUserLocation) {
      // User location is known and city is detected - show their city
      setSelectedCity(detectedCity)
    } else if (!isUserLocation) {
      // Location is blocked - default to Prishtina
      setSelectedCity("Prishtinë")
    } else {
      // Location is known but no city detected - show all cities
      setSelectedCity("all")
    }
  }, [detectedCity, isUserLocation])

  // Handle clicking outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false)
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Helper functions for category dropdown
  const getSelectedCategoryName = () => {
    if (selectedCategory === "all") return "Të gjitha"
    const category = categories.find(cat => String(cat.id) === selectedCategory)
    return category ? category.name : "Kategorinë"
  }

  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange(categoryId)
    setIsCategoryDropdownOpen(false)
  }

  // Helper functions for city dropdown
  const getSelectedCityName = () => {
    if (selectedCity === "all") return "Të gjitha"
    return selectedCity
  }

  const handleCitySelect = (city: string) => {
    handleCityChange(city)
    setIsCityDropdownOpen(false)
  }

  // Handle city selection
  const handleCityChange = (city: string) => {
    setSelectedCity(city)
    
    if (city === "all") {
      // Reset to user location or default to Prishtina with wide view
      if (latitude && longitude) {
        // Recenter on user location with wide view
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude })
          mapInstanceRef.current.setZoom(9) // Wide view for all cities
        }
      } else {
        // No location available, default to Prishtina with wide view
        const prishtinaCoords = cityCoordinates["Prishtinë"]
        if (prishtinaCoords && mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat: prishtinaCoords.lat, lng: prishtinaCoords.lng })
          mapInstanceRef.current.setZoom(11) // Wide view for all cities
        }
      }
    } else {
      // Center on selected city
      const cityCoords = cityCoordinates[city]
      if (cityCoords && mapInstanceRef.current) {
        mapInstanceRef.current.setCenter({ lat: cityCoords.lat, lng: cityCoords.lng })
        mapInstanceRef.current.setZoom(15)
      }
    }
  }

  // Use businesses from store if available, otherwise use props
  const businesses = storeBusinesses.length > 0 ? storeBusinesses : propBusinesses

  // Filter businesses by category only (show all businesses on map)
  const filteredBusinesses = businesses.filter(business => {
    const matchesCategory = selectedCategory === "all" || String(business.category_id) === String(selectedCategory)
    return matchesCategory
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
        zoom: 15, // More zoomed in initial view when location is allowed
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
         mapTypeControl: true,
         streetViewControl: false,
         fullscreenControl: false,
         mapTypeId: google.maps.MapTypeId.SATELLITE
       })

      mapInstanceRef.current = map
      setMapLoaded(true)

      // Add user location marker only if location is available and not blocked
      let userMarkerInstance: google.maps.Marker | null = null
      if (latitude && longitude && !error && !loading && isUserLocation) {
        userMarkerInstance = new google.maps.Marker({
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
      } else {
        setUserMarker(null)
      }

      // Add radius circle around user location only if they're in a detected city
      let radiusCircle: google.maps.Circle | null = null
      if (detectedCity) {
        radiusCircle = new google.maps.Circle({
        strokeColor: "#3B82F600",
        strokeOpacity: 0.3,
        strokeWeight: 2,
        fillColor: "#3B82F600",
        fillOpacity: 0.1,
        map: map,
        center: { lat: latitude, lng: longitude },
            radius: 4000, // 4km in meters
        })
        console.log(`[v0] Showing 4km radius circle for detected city: ${detectedCity}`)
      } else {
        console.log("[v0] No city detected, not showing radius circle")
      }

      // Set initial map view based on user location and business availability
      const searchRadius = 4000 // 4km radius in meters
      
      if (latitude && longitude) {
        // User location is known
        console.log(`[v0] User location known: ${latitude}, ${longitude}`)
        
        // Check if there are businesses within 4km radius of user location
        const nearbyBusinesses = filteredBusinesses.filter(business => {
          if (!business.latitude || !business.longitude) return false
          const distance = calculateDistance(business.latitude, business.longitude)
          return distance !== null && distance <= 4 // 4km radius
        })
        
        if (nearbyBusinesses.length > 0) {
          // Businesses exist within 4km radius - show tight view around user location ONLY
          // Use bounds calculation to show exactly 4km radius around user location
          const userBounds = new google.maps.LatLngBounds()
          const radiusInDegrees = 4000 / 111000 // Convert 4km to degrees (approximate)
          
          // Add bounds for exactly 4km radius around user location
          userBounds.extend({ 
            lat: latitude + radiusInDegrees, 
            lng: longitude + radiusInDegrees / Math.cos(latitude * Math.PI / 180) 
          })
          userBounds.extend({ 
            lat: latitude - radiusInDegrees, 
            lng: longitude - radiusInDegrees / Math.cos(latitude * Math.PI / 180) 
          })
          
          // Set zoom to level 15 when user location is known
          map.setZoom(15)
          
          // Prevent automatic zoom adjustments by disabling auto-fit
          map.setOptions({ 
            gestureHandling: 'cooperative',
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            fullscreenControl: false,
            mapTypeControl: true
          })
          
          console.log(`[v0] Map focused on user location only - ${nearbyBusinesses.length} businesses within 4km`)
        } else {
          // No businesses within 4km - show nearby businesses (wider view)
          map.setZoom(15) // More zoomed in view to show nearby businesses
          console.log(`[v0] No businesses within 4km, showing nearby businesses`)
        }
      } else {
        // User location unknown - default to Prishtina
        console.log("[v0] User location unknown, defaulting to Prishtina")
        const prishtinaLat = 42.6629
        const prishtinaLng = 21.1655
        
        // Check if there are businesses in Prishtina
        const prishtinaBusinesses = filteredBusinesses.filter(business => business.city === "Prishtinë")
        
        if (prishtinaBusinesses.length > 0) {
          // Show Prishtina area with tight bounds for exactly 4km radius
          const prishtinaBounds = new google.maps.LatLngBounds()
          const radiusInDegrees = 4000 / 111000 // Convert 4km to degrees (approximate)
          
          // Add bounds for exactly 4km radius around Prishtina
          prishtinaBounds.extend({ 
            lat: prishtinaLat + radiusInDegrees, 
            lng: prishtinaLng + radiusInDegrees / Math.cos(prishtinaLat * Math.PI / 180) 
          })
          prishtinaBounds.extend({ 
            lat: prishtinaLat - radiusInDegrees, 
            lng: prishtinaLng - radiusInDegrees / Math.cos(prishtinaLat * Math.PI / 180) 
          })
          
          // Fit map to Prishtina bounds only (no padding to avoid showing other cities)
          map.fitBounds(prishtinaBounds, 0) // Zero padding to show only the 4km radius
          
          // Prevent automatic zoom adjustments by disabling auto-fit
          map.setOptions({ 
            gestureHandling: 'cooperative',
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            fullscreenControl: false,
            mapTypeControl: true
          })
          
          console.log(`[v0] Map focused on Prishtina only (default) - ${prishtinaBusinesses.length} businesses found`)
        } else {
          // No businesses in Prishtina - show wider view
          map.setZoom(15)
          console.log("[v0] No businesses in Prishtina, showing wider view")
        }
      }

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
  }, [latitude, longitude, detectedCity])

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
          <div style=" min-width: 180px; font-family: system-ui, -apple-system, sans-serif;">
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
              onclick="window.open('/${business.slug}', '_blank')"
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
              Rezervo
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

    // Don't auto-fit to markers - keep the initial zoom level set by location
    // This prevents the map from zooming out to show all businesses
    console.log(`[v0] Added ${markersRef.current.length} business markers to map`)
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
            <MapPin className="w-16 h-16 mx-auto bg-custom-gradientt" />
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
                className="bg-custom-gradient  text-white"
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
      {/* Category and City Filters */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-3 lg:gap-4">
        {/* Single Layout: Works for both mobile and desktop */}
        <div className="flex items-center gap-2 lg:gap-4 justify-center">
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-white" />
            <span className="text-sm md:text-md text-white">Filtro:</span>
        </div>
          <div className="flex items-center gap-4 justify-center">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <div className="relative" ref={categoryDropdownRef}>
                <button
                  type="button"
                  className="w-38 lg:w-40 px-3 py-2 text-left bg-white border border-white rounded-md shadow-sm flex items-center justify-between text-black"
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                >
                  <span className="truncate text-sm">
              {selectedCategory === "all" ? (
                      <span className="text-gray-600">Kategorinë:</span>
                    ) : (
                      <span className="font-medium">{getSelectedCategoryName()}</span>
                    )}
                  </span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isCategoryDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg overflow-visible">
                    <div
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                      onClick={() => handleCategorySelect("all")}
                    >
                      <span className="text-gray-600 text-sm">Të gjitha</span>
                    </div>
                    {categories
                      .sort((a, b) => {
                        if (a.sort_order !== undefined && b.sort_order !== undefined) {
                          return a.sort_order - b.sort_order
                        }
                        if (a.sort_order !== undefined) return -1
                        if (b.sort_order !== undefined) return 1
                        return a.name.localeCompare(b.name)
                      })
                      .map((category) => (
                        <div
                          key={category.id}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                          onClick={() => handleCategorySelect(String(category.id))}
                        >
                          {category.icon && (
                            <img 
                              src={category.icon} 
                              alt={category.name}
                              className="w-4 h-4 rounded object-cover flex-shrink-0"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          )}
                          <span className="truncate text-sm text-black">{category.name}</span>
            </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* City Filter */}
              <div className="flex items-center gap-2">
              <div className="relative" ref={cityDropdownRef}>
                <button
                  type="button"
                  className="w-30 lg:w-40 px-3 py-2 text-left bg-white border border-white rounded-md shadow-sm flex items-center justify-between text-black"
                  onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                >
                  <span className="truncate text-sm">
                    {selectedCity === "all" ? (
                      <span className="text-gray-600">Qytetin:</span>
                    ) : (
                      <span className="font-medium">{selectedCity}</span>
                    )}
                  </span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isCityDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    <div
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                      onClick={() => handleCitySelect("all")}
                    >
                      <span className="text-gray-600 text-sm">Të gjitha</span>
              </div>
                    {Object.keys(cityCoordinates).map((city) => (
                      <div
                        key={city}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                        onClick={() => handleCitySelect(city)}
                      >
                        <span className="truncate text-sm text-black">{city}</span>
                </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout removed - using single layout for both */}
      </div>

      {/* Map Container */}
      <div className={`${selectedBusiness ? 'h-[40vh]' : 'h-[70vh]'} relative overflow-hidden ${selectedBusiness ? 'rounded-t-xl' : 'rounded-t-xl'} transition-all duration-300`}>
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
            <MapPin className="w-3 h-3 mr-1 bg-custom-gradientt" />
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
                    <span className="bg-custom-gradientt bg-clip-text text-transparent font-medium">{(selectedBusiness as any).category_name || 'Unknown Category'}</span>
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
                        .map(([day, hours]: [string, any]) => {
                          // Albanian day names
                          const dayNames: { [key: string]: string } = {
                            monday: 'E Hënë',
                            tuesday: 'E Martë', 
                            wednesday: 'E Mërkurë',
                            thursday: 'E Enjte',
                            friday: 'E Premte',
                            saturday: 'E Shtunë',
                            sunday: 'E Dielë'
                          }
                          
                          return (
                            <div key={day} className="flex justify-between text-sm">
                              <span className="font-medium text-gray-700">{dayNames[day] || day}:</span>
                              <span className="text-gray-600">{hours.open} - {hours.close}</span>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* Empty column for spacing */}
                <div></div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-gray-300 text-gray-600 hover:bg-gradient-to-r hover:from-gray-800 hover:via-teal-800 hover:to-purple-900 hover:via-60% hover:to-140% hover:text-white hover:border-transparent ml-4"
                onClick={() => setSelectedBusiness(null)}
              >
                Mbyll
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center items-center mt-6">
              <Button 
                className="bg-custom-gradient px-6"
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
