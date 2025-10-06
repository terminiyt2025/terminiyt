"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, X, CheckCircle } from "lucide-react"
import { useBusinesses } from "@/hooks/use-businesses"
import type { Business } from "@/lib/database"

export function NewBusinessNotification() {
  const { businesses } = useBusinesses()
  const [newBusinesses, setNewBusinesses] = useState<Business[]>([])
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    // Check for new businesses (added in the last 30 seconds)
    const now = Date.now()
    const recentBusinesses = businesses.filter(business => {
      const businessTime = new Date(business.created_at).getTime()
      return now - businessTime < 30000 // 30 seconds
    })

    if (recentBusinesses.length > 0) {
      setNewBusinesses(recentBusinesses)
      setShowNotification(true)

      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setShowNotification(false)
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [businesses])

  if (!showNotification || newBusinesses.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className="bg-emerald-50 border-emerald-200 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-emerald-900">New Business Added!</h4>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                  Live
                </Badge>
              </div>
              {newBusinesses.map((business) => (
                <div key={business.id} className="mb-2 last:mb-0">
                  <p className="font-medium text-emerald-800">{business.name}</p>
                  <p className="text-sm text-emerald-600">{business.address}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600">
                      Now visible on the map
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotification(false)}
              className="text-emerald-600 hover:text-emerald-700 p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

