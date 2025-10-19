"use client"

import { useState, useCallback } from "react"

interface LocationState {
  latitude: number | null
  longitude: number | null
  error: string | null
  loading: boolean
  detectedCity: string | null
  isUserLocation: boolean // Track if coordinates are from actual user location
}

interface LocationHook extends LocationState {
  getCurrentLocation: () => void
  calculateDistance: (lat: number, lng: number) => number | null
  setLocationToPrishtina: () => void
  detectCityFromCoordinates: (lat: number, lng: number) => string | null
}

export function useLocation(): LocationHook {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
    detectedCity: null,
    isUserLocation: false,
  })

  // Prishtina coordinates as fallback
  const PRISHTINA_COORDS = {
    latitude: 42.6629,
    longitude: 21.1655
  }

  // City coordinates mapping for Kosovo cities
  const CITY_COORDINATES: { [key: string]: { lat: number, lng: number, radius: number } } = {
    "Prishtinë": { lat: 42.6629, lng: 21.1655, radius: 15000 },
    "Prizren": { lat: 42.2139, lng: 20.7397, radius: 15000 },
    "Pejë": { lat: 42.6593, lng: 20.2883, radius: 15000 },
    "Gjakovë": { lat: 42.3803, lng: 20.4308, radius: 15000 },
    "Gjilan": { lat: 42.4635, lng: 21.4694, radius: 15000 },
    "Mitrovicë": { lat: 42.8826, lng: 20.8677, radius: 15000 },
    "Ferizaj": { lat: 42.3709, lng: 21.1553, radius: 15000 },
    "Podujeva": { lat: 42.9106, lng: 21.1933, radius: 15000 },
    "Lipjan": { lat: 42.5242, lng: 21.1258, radius: 15000 },
    "Rahovec": { lat: 42.3992, lng: 20.6547, radius: 15000 },
    "Malishevë": { lat: 42.4822, lng: 20.7458, radius: 15000 },
    "Klinë": { lat: 42.6203, lng: 20.5775, radius: 15000 },
    "Skënderaj": { lat: 42.7381, lng: 20.7897, radius: 15000 },
    "Vushtrri": { lat: 42.8231, lng: 20.9675, radius: 15000 },
    "Deçan": { lat: 42.5403, lng: 20.2875, radius: 15000 },
    "Istog": { lat: 42.7806, lng: 20.4889, radius: 15000 },
    "Kamenicë": { lat: 42.5781, lng: 21.5758, radius: 15000 },
    "Dragash": { lat: 42.0625, lng: 20.6531, radius: 15000 },
    "Shtime": { lat: 42.4331, lng: 21.0408, radius: 15000 },
    "Kaçanik": { lat: 42.2306, lng: 21.2581, radius: 15000 },
  }

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.log("[v0] Geolocation not supported, falling back to Prishtina")
      const detectedCity = detectCityFromCoordinates(PRISHTINA_COORDS.latitude, PRISHTINA_COORDS.longitude)
      setLocation({
        latitude: PRISHTINA_COORDS.latitude,
        longitude: PRISHTINA_COORDS.longitude,
        error: null,
        loading: false,
        detectedCity,
        isUserLocation: false,
      })
      return
    }

    setLocation((prev) => ({ ...prev, loading: true, error: null }))
    console.log("[v0] Requesting user location...")

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("[v0] Location obtained:", position.coords)
        const detectedCity = detectCityFromCoordinates(position.coords.latitude, position.coords.longitude)
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
          detectedCity,
          isUserLocation: true,
        })
      },
      (error) => {
        console.log("[v0] Location error:", error.message)
        let errorMessage = "Unable to retrieve your location"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user"
            // Automatically fallback to Prishtina when location is denied
            console.log("[v0] Location denied, falling back to Prishtina")
            const detectedCity = detectCityFromCoordinates(PRISHTINA_COORDS.latitude, PRISHTINA_COORDS.longitude)
            setLocation({
              latitude: PRISHTINA_COORDS.latitude,
              longitude: PRISHTINA_COORDS.longitude,
              error: null, // Don't show error since we have fallback
              loading: false,
              detectedCity,
              isUserLocation: false,
            })
            return
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable"
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out"
            break
        }

        setLocation((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    )
  }, [])

  const calculateDistance = (lat: number, lng: number): number | null => {
    if (!location.latitude || !location.longitude) return null

    // Haversine formula to calculate distance between two points
    const R = 6371 // Earth's radius in kilometers
    const dLat = ((lat - location.latitude) * Math.PI) / 180
    const dLng = ((lng - location.longitude) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((location.latitude * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return Math.round(distance * 10) / 10 // Round to 1 decimal place
  }

  const detectCityFromCoordinates = useCallback((lat: number, lng: number): string | null => {
    // Calculate distance to each city and find the closest one within radius
    for (const [cityName, cityData] of Object.entries(CITY_COORDINATES)) {
      const distance = calculateDistanceBetweenPoints(lat, lng, cityData.lat, cityData.lng)
      if (distance <= cityData.radius / 1000) { // Convert radius from meters to km
        console.log(`[v0] User detected in ${cityName} (distance: ${distance.toFixed(2)}km)`)
        return cityName
      }
    }
    console.log("[v0] User not detected in any supported city")
    return null
  }, [])

  const calculateDistanceBetweenPoints = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const setLocationToPrishtina = useCallback(() => {
    console.log("[v0] Manually setting location to Prishtina")
    const detectedCity = detectCityFromCoordinates(PRISHTINA_COORDS.latitude, PRISHTINA_COORDS.longitude)
    setLocation({
      latitude: PRISHTINA_COORDS.latitude,
      longitude: PRISHTINA_COORDS.longitude,
      error: null,
      loading: false,
      detectedCity,
      isUserLocation: false,
    })
  }, [detectCityFromCoordinates])

  return {
    ...location,
    getCurrentLocation,
    calculateDistance,
    setLocationToPrishtina,
    detectCityFromCoordinates,
  }
}
