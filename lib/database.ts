// Database utility functions for TerminiYt.com platform
// This will work with either Supabase or Neon when integrated

export interface Business {
  id: string
  name: string
  description?: string
  category_id: string
  owner_name: string
  email: string
  phone: string
  address: string
  city?: string
  state?: string
  google_maps_link?: string
  latitude?: number
  longitude?: number
  website?: string
  instagram?: string
  facebook?: string
  logo?: string
  business_images?: string
  operating_hours?: any
  services?: any[]
  staff?: any[]
  account_email?: string
  is_verified: boolean
  is_active: boolean
  rating: number
  total_reviews: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  icon?: string
  sort_order?: number
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  business_id: string
  name: string
  description?: string
  price?: number
  duration_minutes?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  user_id?: string
  business_id: string
  service_id?: string
  appointment_date: string
  appointment_time: string
  customer_name: string
  customer_email: string
  customer_phone: string
  notes?: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  total_price?: number
  created_at: string
  updated_at: string
}

export interface BusinessHours {
  id: string
  business_id: string
  day_of_week: number // 0 = Sunday, 1 = Monday, etc.
  open_time?: string
  close_time?: string
  is_closed: boolean
  created_at: string
}

// Database connection utility - will be implemented when integration is added
export class DatabaseService {
  private static instance: DatabaseService

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  // Business operations
  async getBusinesses(filters?: {
    category?: string
    location?: { lat: number; lng: number; radius: number }
    search?: string
  }): Promise<Business[]> {
    // Implementation will be added when database integration is connected
    console.log("[v0] Database getBusinesses called with filters:", filters)
    return []
  }

  async getBusinessById(id: string): Promise<Business | null> {
    console.log("[v0] Database getBusinessById called with id:", id)
    return null
  }

  async createBusiness(
    business: Omit<Business, "id" | "created_at" | "updated_at" | "is_verified" | "rating" | "total_reviews">,
  ): Promise<Business> {
    console.log("[v0] Database createBusiness called with data:", business)
    throw new Error("Database integration not configured")
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    console.log("[v0] Database getCategories called")
    return []
  }

  // Service operations
  async getServicesByBusinessId(businessId: string): Promise<Service[]> {
    console.log("[v0] Database getServicesByBusinessId called with businessId:", businessId)
    return []
  }

  // Booking operations
  async createBooking(booking: Omit<Booking, "id" | "created_at" | "updated_at">): Promise<Booking> {
    console.log("[v0] Database createBooking called with data:", booking)
    throw new Error("Database integration not configured")
  }

  async getBookingsByBusinessId(businessId: string): Promise<Booking[]> {
    console.log("[v0] Database getBookingsByBusinessId called with businessId:", businessId)
    return []
  }

  // Business hours operations
  async getBusinessHours(businessId: string): Promise<BusinessHours[]> {
    console.log("[v0] Database getBusinessHours called with businessId:", businessId)
    return []
  }
}

export const db = DatabaseService.getInstance()
