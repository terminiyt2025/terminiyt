"use client"

import { useState, useCallback } from "react"

interface LocationState {
  latitude: number | null
  longitude: number | null
  error: string | null
  loading: boolean
}

interface LocationHook extends LocationState {
  getCurrentLocation: () => void
  calculateDistance: (lat: number, lng: number) => number | null
}

export function useLocation(): LocationHook {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
  })

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error: "Geolocation is not supported by this browser",
        loading: false,
      }))
      return
    }

    setLocation((prev) => ({ ...prev, loading: true, error: null }))
    console.log("[v0] Requesting user location...")

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("[v0] Location obtained:", position.coords)
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        })
      },
      (error) => {
        console.log("[v0] Location error:", error.message)
        let errorMessage = "Unable to retrieve your location"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user"
            break
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

  return {
    ...location,
    getCurrentLocation,
    calculateDistance,
  }
}
