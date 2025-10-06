// Database service using Prisma for TerminiYt.com platform
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface Business {
  id: number
  name: string
  description?: string
  category_id: number
  owner_name: string
  phone: string
  address: string
  city: string
  state: string
  latitude?: number
  longitude?: number
  website?: string
  instagram?: string
  facebook?: string
  logo?: string
  businessImages?: any // JSON array for business images
  account_email: string
  account_password: string // This will be hashed
  operating_hours?: any // JSON object for operating hours
  services?: any // JSON array for services
  staff?: any // JSON array for staff members
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
  created_at: string
}

// Service interface removed - services are now stored as JSON in Business model

export interface Booking {
  id: number
  user_id?: number
  business_id: number
  service_id?: number
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


// Database service class using Prisma
export class PrismaDatabaseService {
  private static instance: PrismaDatabaseService

  static getInstance(): PrismaDatabaseService {
    if (!PrismaDatabaseService.instance) {
      PrismaDatabaseService.instance = new PrismaDatabaseService()
    }
    return PrismaDatabaseService.instance
  }

  // Business operations
  async getBusinesses(filters?: {
    category?: string
    location?: { lat: number; lng: number; radius: number }
    search?: string
  }): Promise<Business[]> {
    try {
      const where: any = {
        isActive: true,
        isVerified: true
      }

      if (filters?.category) {
        where.categoryId = filters.category
      }

      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      const businesses = await prisma.business.findMany({
        where,
        include: {
          category: true
        },
        orderBy: {
          rating: 'desc'
        }
      })

      return businesses.map(business => ({
        id: business.id,
        name: business.name,
        description: business.description || undefined,
        category_id: business.categoryId,
        owner_name: business.ownerName,
        email: business.email,
        phone: business.phone,
        address: business.address,
        city: business.city,
        state: business.state,
        google_maps_link: business.googleMapsLink || undefined,
        latitude: business.latitude || undefined,
        longitude: business.longitude || undefined,
        website: business.website || undefined,
        instagram: business.instagram || undefined,
        facebook: business.facebook || undefined,
        account_email: business.accountEmail || undefined,
        account_password: business.accountPassword || undefined,
        is_verified: business.isVerified,
        is_active: business.isActive,
        rating: business.rating,
        total_reviews: business.totalReviews,
        created_at: business.createdAt.toISOString(),
        updated_at: business.updatedAt.toISOString()
      }))
    } catch (error) {
      console.error('Error fetching businesses:', error)
      return []
    }
  }

  async getBusinessById(id: number): Promise<Business | null> {
    try {
      const business = await prisma.business.findUnique({
        where: { id },
        include: {
          category: true
        }
      })

      if (!business) return null

      return {
        id: business.id,
        name: business.name,
        description: business.description || undefined,
        category_id: business.categoryId,
        owner_name: business.ownerName,
        email: business.email,
        phone: business.phone,
        address: business.address,
        city: business.city,
        state: business.state,
        google_maps_link: business.googleMapsLink || undefined,
        latitude: business.latitude || undefined,
        longitude: business.longitude || undefined,
        website: business.website || undefined,
        instagram: business.instagram || undefined,
        facebook: business.facebook || undefined,
        account_email: business.accountEmail || undefined,
        account_password: business.accountPassword || undefined,
        is_verified: business.isVerified,
        is_active: business.isActive,
        rating: business.rating,
        total_reviews: business.totalReviews,
        created_at: business.createdAt.toISOString(),
        updated_at: business.updatedAt.toISOString()
      }
    } catch (error) {
      console.error('Error fetching business by ID:', error)
      return null
    }
  }

  async createBusiness(
    business: Omit<Business, "id" | "created_at" | "updated_at" | "is_verified" | "rating" | "total_reviews">,
  ): Promise<Business> {
    try {
      const newBusiness = await prisma.business.create({
        data: {
          name: business.name,
          description: business.description,
          categoryId: business.category_id,
          ownerName: business.owner_name,
          phone: business.phone,
          address: business.address,
          city: business.city,
          state: business.state,
          googleMapsLink: business.google_maps_link,
          latitude: business.latitude,
          longitude: business.longitude,
          website: business.website,
          instagram: business.instagram,
          facebook: business.facebook,
          logo: business.logo,
          businessImages: business.businessImages,
          accountEmail: business.account_email,
          accountPassword: business.account_password, // This should already be hashed when passed in
          operatingHours: business.operating_hours,
          // Temporarily comment out until Prisma client is regenerated
          // services: business.services,
          // staff: business.staff,
          isActive: business.is_active
        },
        include: {
          category: true
        }
      })

      return {
        id: newBusiness.id,
        name: newBusiness.name,
        description: newBusiness.description || undefined,
        category_id: newBusiness.categoryId,
        owner_name: newBusiness.ownerName,
        phone: newBusiness.phone,
        address: newBusiness.address,
        city: newBusiness.city,
        state: newBusiness.state,
        google_maps_link: newBusiness.googleMapsLink || undefined,
        latitude: newBusiness.latitude || undefined,
        longitude: newBusiness.longitude || undefined,
        website: newBusiness.website || undefined,
        instagram: newBusiness.instagram || undefined,
        facebook: newBusiness.facebook || undefined,
        logo: newBusiness.logo || undefined,
        businessImages: newBusiness.businessImages || undefined,
        account_email: newBusiness.accountEmail,
        account_password: newBusiness.accountPassword, // Return hashed password
        operating_hours: newBusiness.operatingHours || undefined,
        // Temporarily comment out until Prisma client is regenerated
        // services: newBusiness.services || undefined,
        // staff: newBusiness.staff || undefined,
        is_verified: newBusiness.isVerified,
        is_active: newBusiness.isActive,
        rating: newBusiness.rating,
        total_reviews: newBusiness.totalReviews,
        created_at: newBusiness.createdAt.toISOString(),
        updated_at: newBusiness.updatedAt.toISOString()
      }
    } catch (error) {
      console.error('Error creating business:', error)
      throw error
    }
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    try {
      const categories = await prisma.category.findMany({
        orderBy: {
          name: 'asc'
        }
      })

      return categories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        created_at: category.createdAt.toISOString()
      }))
    } catch (error) {
      console.error('Error fetching categories:', error)
      return []
    }
  }

  // Service operations
  async getServicesByBusinessId(businessId: string): Promise<Service[]> {
    try {
      const services = await prisma.service.findMany({
        where: {
          businessId,
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
      })

      return services.map(service => ({
        id: service.id,
        business_id: service.businessId,
        name: service.name,
        description: service.description || undefined,
        price: service.price || undefined,
        duration_minutes: service.durationMinutes || undefined,
        is_active: service.isActive,
        created_at: service.createdAt.toISOString(),
        updated_at: service.updatedAt.toISOString()
      }))
    } catch (error) {
      console.error('Error fetching services by business ID:', error)
      return []
    }
  }

  // Booking operations
  async createBooking(booking: Omit<Booking, "id" | "created_at" | "updated_at">): Promise<Booking> {
    try {
      const newBooking = await prisma.booking.create({
        data: {
          userId: booking.user_id,
          businessId: booking.business_id,
          serviceId: booking.service_id,
          appointmentDate: new Date(booking.appointment_date),
          appointmentTime: booking.appointment_time,
          customerName: booking.customer_name,
          customerEmail: booking.customer_email,
          customerPhone: booking.customer_phone,
          notes: booking.notes,
          status: booking.status.toUpperCase() as any,
          totalPrice: booking.total_price
        }
      })

      return {
        id: newBooking.id,
        user_id: newBooking.userId || undefined,
        business_id: newBooking.businessId,
        service_id: newBooking.serviceId || undefined,
        appointment_date: newBooking.appointmentDate.toISOString(),
        appointment_time: newBooking.appointmentTime,
        customer_name: newBooking.customerName,
        customer_email: newBooking.customerEmail,
        customer_phone: newBooking.customerPhone,
        notes: newBooking.notes || undefined,
        status: newBooking.status.toLowerCase() as any,
        total_price: newBooking.totalPrice || undefined,
        created_at: newBooking.createdAt.toISOString(),
        updated_at: newBooking.updatedAt.toISOString()
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      throw error
    }
  }

  async getBookingsByBusinessId(businessId: string): Promise<Booking[]> {
    try {
      const bookings = await prisma.booking.findMany({
        where: {
          businessId
        },
        orderBy: {
          appointmentDate: 'desc'
        }
      })

      return bookings.map(booking => ({
        id: booking.id,
        user_id: booking.userId || undefined,
        business_id: booking.businessId,
        service_id: booking.serviceId || undefined,
        appointment_date: booking.appointmentDate.toISOString(),
        appointment_time: booking.appointmentTime,
        customer_name: booking.customerName,
        customer_email: booking.customerEmail,
        customer_phone: booking.customerPhone,
        notes: booking.notes || undefined,
        status: booking.status.toLowerCase() as any,
        total_price: booking.totalPrice || undefined,
        created_at: booking.createdAt.toISOString(),
        updated_at: booking.updatedAt.toISOString()
      }))
    } catch (error) {
      console.error('Error fetching bookings by business ID:', error)
      return []
    }
  }

  // Business hours operations
  async getBusinessHours(businessId: string): Promise<BusinessHours[]> {
    try {
      const businessHours = await prisma.businessHours.findMany({
        where: {
          businessId
        },
        orderBy: {
          dayOfWeek: 'asc'
        }
      })

      return businessHours.map(hours => ({
        id: hours.id,
        business_id: hours.businessId,
        day_of_week: hours.dayOfWeek,
        open_time: hours.openTime || undefined,
        close_time: hours.closeTime || undefined,
        is_closed: hours.isClosed,
        created_at: hours.createdAt.toISOString()
      }))
    } catch (error) {
      console.error('Error fetching business hours:', error)
      return []
    }
  }


  // createService method removed - services are now stored as JSON in Business model
}

export const db = PrismaDatabaseService.getInstance()

// Export prisma client for direct access
export { prisma }
