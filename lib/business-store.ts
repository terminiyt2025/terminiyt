import { Business } from "./database"
import { mockBusinesses } from "./mock-data"

// Simple in-memory store for businesses
class BusinessStore {
  private businesses: Business[] = [...mockBusinesses]
  private listeners: Set<(businesses: Business[]) => void> = new Set()

  // Get all businesses
  getAllBusinesses(): Business[] {
    return [...this.businesses]
  }

  // Add a new business
  addBusiness(business: Omit<Business, 'id' | 'created_at' | 'updated_at'>): Business {
    const newBusiness: Business = {
      ...business,
      id: Date.now().toString(), // Simple ID generation
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    this.businesses.push(newBusiness)
    this.notifyListeners()
    return newBusiness
  }

  // Get businesses by category
  getBusinessesByCategory(categoryId: string): Business[] {
    if (categoryId === "all") return this.getAllBusinesses()
    return this.businesses.filter(business => business.category_id === categoryId)
  }

  // Subscribe to business updates
  subscribe(listener: (businesses: Business[]) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getAllBusinesses()))
  }

  // Get business by ID
  getBusinessById(id: string): Business | undefined {
    return this.businesses.find(business => business.id === id)
  }

  // Update business
  updateBusiness(id: string, updates: Partial<Business>): Business | null {
    const index = this.businesses.findIndex(business => business.id === id)
    if (index === -1) return null

    this.businesses[index] = {
      ...this.businesses[index],
      ...updates,
      updated_at: new Date().toISOString()
    }

    this.notifyListeners()
    return this.businesses[index]
  }

  // Delete business
  deleteBusiness(id: string): boolean {
    const index = this.businesses.findIndex(business => business.id === id)
    if (index === -1) return false

    this.businesses.splice(index, 1)
    this.notifyListeners()
    return true
  }
}

// Export singleton instance
export const businessStore = new BusinessStore()

