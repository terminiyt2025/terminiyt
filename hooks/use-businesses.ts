import { useState, useEffect } from "react"
import { businessStore } from "@/lib/business-store"
import type { Business } from "@/lib/database"

export function useBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch businesses from API
    const fetchBusinesses = async () => {
      try {
        const response = await fetch('/api/businesses')
        if (response.ok) {
          const data = await response.json()
          setBusinesses(data)
        } else {
          console.error('Failed to fetch businesses:', response.status)
          // Fallback to mock data
          setBusinesses(businessStore.getAllBusinesses())
        }
      } catch (error) {
        console.error('Error fetching businesses:', error)
        // Fallback to mock data
        setBusinesses(businessStore.getAllBusinesses())
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()

    // Subscribe to business updates
    const unsubscribe = businessStore.subscribe((updatedBusinesses) => {
      setBusinesses(updatedBusinesses)
    })

    // Cleanup subscription
    return unsubscribe
  }, [])

  const addBusiness = (business: Omit<Business, 'id' | 'created_at' | 'updated_at'>) => {
    return businessStore.addBusiness(business)
  }

  const updateBusiness = (id: string, updates: Partial<Business>) => {
    return businessStore.updateBusiness(id, updates)
  }

  const deleteBusiness = (id: string) => {
    return businessStore.deleteBusiness(id)
  }

  const getBusinessById = (id: string) => {
    return businessStore.getBusinessById(id)
  }

  const getBusinessesByCategory = (categoryId: string) => {
    return businessStore.getBusinessesByCategory(categoryId)
  }

  return {
    businesses,
    loading,
    addBusiness,
    updateBusiness,
    deleteBusiness,
    getBusinessById,
    getBusinessesByCategory,
  }
}

