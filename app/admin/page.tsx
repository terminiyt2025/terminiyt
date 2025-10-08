"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/header"
import { 
  Users, 
  Building2, 
  Calendar, 
  TrendingUp,
  LogOut,
  Shield,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  MessageCircle,
  Save,
  X,
  Check,
  Search,
  Plus
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateSlug } from "@/lib/slug"
import { extractCoordinatesFromGoogleMapsLink, generateGoogleMapsLink, isValidGoogleMapsUrl } from '@/lib/google-maps-utils'

interface AdminStats {
  totalBusinesses: number
  totalBookings: number
  activeBusinesses: number
  totalRevenue: number
  totalCategories: number
  totalRequests: number
}

interface Business {
  id: number
  name: string
  description?: string
  category_id: number
  owner_name: string
  phone: string
  address: string
  city: string
  state: string
  google_maps_link?: string
  latitude?: number
  longitude?: number
  website?: string
  instagram?: string
  facebook?: string
  account_email: string
  logo?: string
  business_images?: string
  operating_hours?: any
  services?: any[]
  staff?: any[]
  is_verified?: boolean
  is_active?: boolean
  rating?: number
  total_reviews?: number
  created_at?: string
  updated_at?: string
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [admin, setAdmin] = useState<any>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [editingBusiness, setEditingBusiness] = useState<number | null>(null)
  const [editFormData, setEditFormData] = useState<any>({})
  const [categories, setCategories] = useState<any[]>([])
  const [isHandlingView, setIsHandlingView] = useState(false)

  // Reset handling state if it gets stuck
  useEffect(() => {
    const resetTimer = setTimeout(() => {
      if (isHandlingView) {
        console.log('Resetting stuck isHandlingView state')
        setIsHandlingView(false)
      }
    }, 2000) // Reset after 2 seconds if still stuck

    return () => clearTimeout(resetTimer)
  }, [isHandlingView])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [businessToDelete, setBusinessToDelete] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [stats, setStats] = useState<AdminStats>({
    totalBusinesses: 0,
    totalBookings: 0,
    activeBusinesses: 0,
    totalRevenue: 0,
    totalCategories: 0,
    totalRequests: 0
  })
  
  // Categories state
  const [adminCategories, setAdminCategories] = useState<any[]>([])
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    icon: ''
  })
  const [showCategoryDeleteDialog, setShowCategoryDeleteDialog] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null)
  const [deletingCategory, setDeletingCategory] = useState(false)
  const [showCategoriesTable, setShowCategoriesTable] = useState(false)
  const [showBusinessesTable, setShowBusinessesTable] = useState(true) // Default open
  const [showBookingsTable, setShowBookingsTable] = useState(false)
  const [bookings, setBookings] = useState<any[]>([])
  const [filteredBookings, setFilteredBookings] = useState<any[]>([])
  const [bookingsViewMode, setBookingsViewMode] = useState<'businesses' | 'reservations'>('businesses')
  const [selectedBusinessForReservations, setSelectedBusinessForReservations] = useState<any>(null)
  const [showRequestsTable, setShowRequestsTable] = useState(false)
  const [businessSummaryFilter, setBusinessSummaryFilter] = useState<string>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [startDateFilter, setStartDateFilter] = useState<string>('')
  const [endDateFilter, setEndDateFilter] = useState<string>('')
  const [requests, setRequests] = useState<any[]>([])
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null)
  const [editingRequestData, setEditingRequestData] = useState({
    admin_notes: ''
  })
  const [viewingRequestId, setViewingRequestId] = useState<number | null>(null)
  const [deletingRequestId, setDeletingRequestId] = useState<number | null>(null)
  const [deletingRequest, setDeletingRequest] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [editingCategoryData, setEditingCategoryData] = useState({
    name: '',
    icon: ''
  })
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Check if admin is logged in
    const authData = localStorage.getItem('adminAuth')
    if (authData) {
      try {
        const adminData = JSON.parse(authData)
        setAdmin(adminData)
        setIsAuthenticated(true)
        fetchStats()
        fetchCategories()
        document.title = "Admin Panel - ServiceConnect"
      } catch (error) {
        console.error('Error parsing admin auth data:', error)
        localStorage.removeItem('adminAuth')
        router.push('/admin/login')
      }
    } else {
      router.push('/admin/login')
    }
    
    // Small delay to prevent header flash
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [router])

  // Handle Escape key to close image modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedImage) {
        setSelectedImage(null)
      }
    }

    if (selectedImage) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [selectedImage])

  // Cleanup effect to prevent state conflicts on mobile
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // When page becomes hidden, clean up states to prevent conflicts
        setExpandedCard(null)
        setEditingBusiness(null)
        setEditFormData({})
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch business stats (admin needs to see all businesses including inactive and unverified ones)
      const businessesResponse = await fetch('/api/businesses?includeInactive=true&includeUnverified=true')
      if (!businessesResponse.ok) {
        throw new Error(`Businesses API error: ${businessesResponse.status}`)
      }
      const businessesData = await businessesResponse.json()
      const businessesArray = Array.isArray(businessesData) ? businessesData : []
      setBusinesses(businessesArray)
      setFilteredBusinesses(businessesArray)
      
      // Fetch categories
      const categoriesResponse = await fetch('/api/categories')
      let categoriesData = []
      if (categoriesResponse.ok) {
        categoriesData = await categoriesResponse.json()
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      }
      
      // Fetch booking stats from admin API
      const bookingsResponse = await fetch('/api/admin/bookings')
      let bookings = []
      if (bookingsResponse.ok) {
        bookings = await bookingsResponse.json()
        setBookings(bookings) // Store bookings data in state
        setFilteredBookings(bookings) // Initialize filtered bookings
      } else {
        console.warn('Bookings API returned error:', bookingsResponse.status)
        setBookings([]) // Set empty array on error
        setFilteredBookings([]) // Set empty filtered array on error
      }

      // Fetch requests
      const requestsResponse = await fetch('/api/location-requests')
      let requests = []
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json()
        requests = requestsData.data || []
        setRequests(requests) // Store requests data in state
      } else {
        console.warn('Requests API returned error:', requestsResponse.status)
        setRequests([]) // Set empty array on error
      }

      setStats({
        totalBusinesses: Array.isArray(businessesData) ? businessesData.length : 0,
        totalBookings: Array.isArray(bookings) ? bookings.length : 0,
        activeBusinesses: Array.isArray(businessesData) ? businessesData.filter((b: any) => b.is_active).length : 0,
        totalRevenue: Array.isArray(bookings) ? bookings.reduce((sum: number, booking: any) => sum + (booking.total_price || 0), 0) : 0,
        totalCategories: Array.isArray(categoriesData) ? categoriesData.length : 0,
        totalRequests: Array.isArray(requests) ? requests.length : 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Set default stats on error
      setStats({
        totalBusinesses: 0,
        totalBookings: 0,
        activeBusinesses: 0,
        totalRevenue: 0,
        totalCategories: 0,
        totalRequests: 0
      })
      setRequests([]) // Set empty requests array on error
    }
  }

  // Handle viewing reservations for a specific business
  const handleViewBusinessReservations = (business: any) => {
    setSelectedBusinessForReservations(business)
    setBookingsViewMode('reservations')
    const businessReservations = bookings.filter(booking => booking.business_id === business.id)
    setFilteredBookings(businessReservations)
  }

  // Handle going back to business list
  const handleBackToBusinesses = () => {
    setBookingsViewMode('businesses')
    setSelectedBusinessForReservations(null)
  }

  // Get unique cities from businesses
  const getUniqueCities = () => {
    const cities = businesses.map(business => business.city).filter((city, index, self) => 
      city && self.indexOf(city) === index
    )
    return cities.sort()
  }

  // Clear all filters
  const clearAllFilters = () => {
    setBusinessSummaryFilter('all')
    setCityFilter('all')
    setStartDateFilter('')
    setEndDateFilter('')
  }

  // Get business summary with reservation counts and filters
  const getBusinessSummary = () => {
    let filteredBusinesses = businesses
    
    // Apply business filter
    if (businessSummaryFilter !== 'all') {
      filteredBusinesses = filteredBusinesses.filter(business => business.id === parseInt(businessSummaryFilter))
    }
    
    // Apply city filter
    if (cityFilter !== 'all') {
      filteredBusinesses = filteredBusinesses.filter(business => business.city === cityFilter)
    }
    
    const businessSummary = filteredBusinesses.map(business => {
      let businessBookings = bookings.filter(booking => booking.business_id === business.id)
      
      // Apply date range filter
      if (startDateFilter || endDateFilter) {
        businessBookings = businessBookings.filter(booking => {
          const bookingDate = new Date(booking.appointment_date)
          const startDate = startDateFilter ? new Date(startDateFilter) : null
          const endDate = endDateFilter ? new Date(endDateFilter) : null
          
          if (startDate && bookingDate < startDate) return false
          if (endDate && bookingDate > endDate) return false
          return true
        })
      }
      
      return {
        ...business,
        reservationCount: businessBookings.length
      }
    }).filter(business => business.reservationCount > 0) // Only show businesses with reservations
    
    return businessSummary.sort((a, b) => b.reservationCount - a.reservationCount) // Sort by reservation count
  }

  // Request handlers
  const handleEditRequest = (request: any) => {
    setEditingRequestId(request.id)
    setEditingRequestData({
      admin_notes: request.admin_notes || ''
    })
  }

  const handleSaveRequest = async (requestId: number) => {
    try {
      const response = await fetch(`/api/location-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_notes: editingRequestData.admin_notes
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update request')
      }

      // Update the requests state
      setRequests(requests.map(request => 
        request.id === requestId 
          ? { ...request, admin_notes: editingRequestData.admin_notes }
          : request
      ))

      setEditingRequestId(null)
      setEditingRequestData({ admin_notes: '' })

      toast({
        title: "Sukses",
        description: "Kërkesa u përditësua me sukses.",
      })
    } catch (error) {
      console.error('Error updating request:', error)
      toast({
        title: "Gabim",
        description: "Gabim gjatë përditësimit të kërkesës.",
        variant: "destructive",
      })
    }
  }

  const handleCancelEditRequest = () => {
    setEditingRequestId(null)
    setEditingRequestData({ admin_notes: '' })
  }

  const handleViewRequest = (request: any) => {
    setViewingRequestId(request.id)
  }

  const handleDeleteRequest = async (requestId: number) => {
    try {
      setDeletingRequest(true)
      
      const response = await fetch(`/api/location-requests/${requestId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete request')
      }

      // Remove the request from state
      setRequests(requests.filter(request => request.id !== requestId))

      setDeletingRequestId(null)
      setDeletingRequest(false)

      toast({
        title: "Sukses",
        description: "Kërkesa u fshi me sukses.",
      })
    } catch (error) {
      console.error('Error deleting request:', error)
      toast({
        title: "Gabim",
        description: "Gabim gjatë fshirjes së kërkesës.",
        variant: "destructive",
      })
      setDeletingRequest(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminAuth')
    window.dispatchEvent(new Event('adminLogout'))
    
    toast({
      title: "U shkëputët me sukses",
      description: "Jeni dërguar në faqen kryesore.",
    })
    
    router.push('/')
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (term.trim() === "") {
      setFilteredBusinesses(businesses)
    } else {
      const filtered = businesses.filter(business =>
        business.name.toLowerCase().includes(term.toLowerCase()) ||
        business.owner_name.toLowerCase().includes(term.toLowerCase()) ||
        business.account_email.toLowerCase().includes(term.toLowerCase()) ||
        business.city.toLowerCase().includes(term.toLowerCase()) ||
        business.phone.includes(term)
      )
      setFilteredBusinesses(filtered)
    }
  }

  const handleViewBusiness = (business: Business) => {
    console.log('handleViewBusiness called with:', business)
    
    // Prevent rapid clicking on mobile
    if (isHandlingView) {
      console.log('Already handling view, skipping')
      return
    }
    
    try {
      setIsHandlingView(true)
      
      // Validate business data - be more lenient
      if (!business) {
        console.error('Business is null or undefined:', business)
        setIsHandlingView(false)
        return
      }
      
      // Use business.id or fallback to business.name for identification
      const businessId = business.id || business.name || Math.random()
      
      // Clear any editing state when switching businesses
      if (editingBusiness !== businessId) {
        setEditingBusiness(null)
        setEditFormData({})
      }
      
      // Toggle expanded state
      setExpandedCard(expandedCard === businessId ? null : businessId)
      console.log('Toggled expanded card to:', expandedCard === businessId ? null : businessId)
      
      // Reset handling flag after a short delay
      setTimeout(() => {
        setIsHandlingView(false)
        console.log('Reset isHandlingView to false')
      }, 300)
    } catch (error) {
      console.error('Error in handleViewBusiness:', error, 'Business data:', business)
      // Fallback: ensure state is clean
      setExpandedCard(null)
      setEditingBusiness(null)
      setEditFormData({})
      setIsHandlingView(false)
    }
  }

  const handleEditBusiness = (business: Business) => {
    if (editingBusiness === business.id) {
      // Save changes
      handleSaveBusiness(business.id)
    } else {
      // Start editing
      setEditingBusiness(business.id)
      setEditFormData({
        name: business.name,
        slug: (business as any).slug || '',
        owner_name: business.owner_name,
        account_email: business.account_email,
        phone: business.phone,
        address: business.address,
        city: business.city,
        website: business.website || '',
        facebook: business.facebook || '',
        instagram: business.instagram || '',
        google_maps_link: business.google_maps_link || '',
        latitude: business.latitude || 0,
        longitude: business.longitude || 0,
        description: business.description || '',
        category_id: business.category_id,
        logo: business.logo || '',
        business_images: business.business_images || '',
        operating_hours: (() => {
          const defaultHours = {
            monday: { open: '', close: '', closed: true },
            tuesday: { open: '', close: '', closed: true },
            wednesday: { open: '', close: '', closed: true },
            thursday: { open: '', close: '', closed: true },
            friday: { open: '', close: '', closed: true },
            saturday: { open: '', close: '', closed: true },
            sunday: { open: '', close: '', closed: true }
          }
          
          if (business.operating_hours) {
            // Ensure all days are present, merge with defaults
            return { ...defaultHours, ...business.operating_hours }
          }
          
          return defaultHours
        })(),
        services: (business.services || []).map((service: any, index: number) => {
          const serviceId = service.id || `service_${business.id}_${index}_${Date.now()}`
          console.log(`Loading service ${index}:`, { original: service, newId: serviceId })
          return {
            ...service,
            id: serviceId
          }
        }),
        staff: business.staff || [],
        rating: business.rating,
        total_reviews: business.total_reviews,
        is_active: business.is_active,
        is_verified: business.is_verified,
        new_password: '',
        confirm_password: ''
      })
    }
  }

  // Handle Google Maps link changes and auto-extract coordinates
  const handleGoogleMapsLinkChange = (value: string) => {
    setEditFormData((prev: any) => ({ ...prev, google_maps_link: value }))
    
    // Try to extract coordinates from the Google Maps link
    if (value && isValidGoogleMapsUrl(value)) {
      const coords = extractCoordinatesFromGoogleMapsLink(value)
      if (coords.lat !== null && coords.lng !== null) {
        setEditFormData((prev: any) => ({
          ...prev,
          latitude: coords.lat!,
          longitude: coords.lng!
        }))
        toast({
          title: "Koordinatat u përditësuan automatikisht",
          description: `Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)}`,
        })
      }
    }
  }

  // Handle latitude/longitude changes and auto-generate Google Maps link
  const handleCoordinatesChange = (field: 'latitude' | 'longitude', value: number) => {
    setEditFormData((prev: any) => ({ ...prev, [field]: value }))
    
    // Auto-generate Google Maps link if both coordinates are valid
    const newLat = field === 'latitude' ? value : editFormData.latitude
    const newLng = field === 'longitude' ? value : editFormData.longitude
    
    if (newLat && newLng && newLat !== 0 && newLng !== 0) {
      const newLink = generateGoogleMapsLink(newLat, newLng)
      setEditFormData((prev: any) => ({ ...prev, google_maps_link: newLink }))
    }
  }

  const handleSaveBusiness = async (businessId: number) => {
    try {
      // Validate password if provided
      if (editFormData.new_password && editFormData.new_password !== '') {
        if (editFormData.new_password !== editFormData.confirm_password) {
          toast({
            title: "Gabim!",
            description: "Fjalëkalimet nuk përputhen.",
            variant: "destructive",
          })
          return
        }
        if (editFormData.new_password.length < 6) {
          toast({
            title: "Gabim!",
            description: "Fjalëkalimi duhet të jetë së paku 6 karaktere.",
            variant: "destructive",
          })
          return
        }
      }

      // Prepare data for API (exclude confirm_password)
      const { confirm_password, ...apiData } = editFormData
      
      console.log('Saving business with services:', apiData.services)
      
      const response = await fetch(`/api/businesses/${businessId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      })

      if (response.ok) {
        // Update the business in the local state
        setBusinesses(prev => prev.map(b => 
          b.id === businessId ? { ...b, ...editFormData } : b
        ))
        setFilteredBusinesses(prev => prev.map(b => 
          b.id === businessId ? { ...b, ...editFormData } : b
        ))
        
        setEditingBusiness(null)
        setEditFormData({})
        
        toast({
          title: "Sukses!",
          description: "Biznesi u përditësua me sukses.",
        })
      } else {
        throw new Error('Failed to update business')
      }
    } catch (error) {
      console.error('Error updating business:', error)
      toast({
        title: "Gabim!",
        description: "Ndodhi një gabim gjatë përditësimit të biznesit.",
        variant: "destructive",
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingBusiness(null)
    setEditFormData({})
  }

  const handleDeleteBusiness = async (businessId: number) => {
    try {
      setDeleting(true)
      const response = await fetch(`/api/businesses/${businessId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove business from local state
        setBusinesses(prev => prev.filter(b => b.id !== businessId))
        setFilteredBusinesses(prev => prev.filter(b => b.id !== businessId))
        
        // Close edit form if it was open for this business
        if (editingBusiness === businessId) {
          setEditingBusiness(null)
          setEditFormData({})
        }
        
        // Close delete dialog
        setShowDeleteDialog(false)
        setBusinessToDelete(null)
        
        toast({
          title: "Sukses!",
          description: "Biznesi u fshi me sukses.",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete business')
      }
    } catch (error) {
      console.error('Error deleting business:', error)
      toast({
        title: "Gabim!",
        description: error instanceof Error ? error.message : "Ndodhi një gabim gjatë fshirjes së biznesit.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const confirmDelete = (businessId: number) => {
    setBusinessToDelete(businessId)
    setShowDeleteDialog(true)
  }


  const handleImageUpload = async (file: File, isLogo: boolean = false) => {
    try {
      if (isLogo) {
        setUploadingLogo(true)
      } else {
        setUploadingImage(true)
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', isLogo ? 'logo' : 'business')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Upload response:', data)
        
        if (isLogo) {
          setEditFormData({...editFormData, logo: data.url})
        } else {
          setEditFormData({...editFormData, business_images: data.url})
        }
        
        toast({
          title: "Sukses",
          description: "Imazhi u ngarkua me sukses",
        })
      } else {
        let errorMessage = 'Upload failed'
        try {
          const errorData = await response.json()
          console.error('Upload failed:', errorData)
          errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Gabim",
        description: error instanceof Error ? error.message : "Ndodhi një gabim gjatë ngarkimit të imazhit",
        variant: "destructive"
      })
    } finally {
      setUploadingLogo(false)
      setUploadingImage(false)
    }
  }

  const getCategoryName = (categoryId: number) => {
    if (!categoryId) return 'N/A'
    // Convert to number if it's a string
    const id = typeof categoryId === 'string' ? parseInt(categoryId) : categoryId
    const category = adminCategories.find(cat => cat.id === id)
    return category ? category.name : `ID: ${categoryId}`
  }

  // Categories functions
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const categoriesData = await response.json()
        setAdminCategories(categoriesData)
      } else {
        console.error('Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
      const method = editingCategory ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryFormData),
      })

      if (response.ok) {
        const categoryData = await response.json()
        
        if (editingCategory) {
          setAdminCategories(adminCategories.map(cat => 
            cat.id === editingCategory.id ? categoryData : cat
          ))
          toast({
            title: "Sukses",
            description: "Kategoria u përditësua me sukses",
          })
        } else {
          setAdminCategories([...adminCategories, categoryData])
          toast({
            title: "Sukses", 
            description: "Kategoria u krijua me sukses",
          })
        }
        
        setShowCategoryForm(false)
        setEditingCategory(null)
        setCategoryFormData({ name: '', icon: '' })
      } else {
        const errorData = await response.json()
        toast({
          title: "Gabim",
          description: errorData.error || "Ndodhi një gabim",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error saving category:', error)
      toast({
        title: "Gabim",
        description: "Ndodhi një gabim gjatë ruajtjes së kategorisë",
        variant: "destructive"
      })
    }
  }

  const handleEditCategory = (category: any) => {
    setEditingCategory(category)
    setCategoryFormData({
      name: category.name,
      icon: category.icon || ''
    })
    setShowCategoryForm(true)
  }

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      setDeletingCategory(true)
      
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAdminCategories(adminCategories.filter(cat => cat.id !== categoryId))
        toast({
          title: "Sukses",
          description: "Kategoria u fshi me sukses",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Gabim",
          description: errorData.error || "Ndodhi një gabim gjatë fshirjes",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast({
        title: "Gabim",
        description: "Ndodhi një gabim gjatë fshirjes së kategorisë",
        variant: "destructive"
      })
    } finally {
      setDeletingCategory(false)
      setShowCategoryDeleteDialog(false)
      setCategoryToDelete(null)
    }
  }

  // Inline editing functions
  const handleStartEdit = (category: any) => {
    setEditingCategoryId(category.id)
    setEditingCategoryData({
      name: category.name,
      icon: category.icon || ''
    })
  }

  const handleCancelInlineEdit = () => {
    setEditingCategoryId(null)
    setEditingCategoryData({
      name: '',
      icon: ''
    })
  }

  const handleSaveEdit = async (categoryId: number) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingCategoryData),
      })

      if (response.ok) {
        const updatedCategory = await response.json()
        setAdminCategories(adminCategories.map(cat => 
          cat.id === categoryId ? updatedCategory : cat
        ))
        setEditingCategoryId(null)
        toast({
          title: "Sukses",
          description: "Kategoria u përditësua me sukses",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Gabim",
          description: errorData.error || "Ndodhi një gabim",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating category:', error)
      toast({
        title: "Gabim",
        description: "Ndodhi një gabim gjatë përditësimit",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 to-teal-800">
        <Header transparent={true} />
        <div className="container mx-auto px-4 py-32">
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-white text-lg">Po ngarkohet Admin Dashboard...</p>
            </div>
          </div>
        </div>
      </div>
  )
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-teal-800">
      <Header transparent={true} />

        <div className="container mx-auto px-4 md:py-24 py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 mr-3" style={{ color: '#92BDB4' }} />
            <h1 className="text-4xl font-bold text-white">
              Admin Dashboard
            </h1>
            </div>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white border-gray-200 py-3 md:py-6 shadow-lg cursor-pointer hover:bg-gray-50 transition-all duration-200"
                onClick={() => {
                  setShowBusinessesTable(true)
                  setShowBookingsTable(false)
                  setShowCategoriesTable(false)
                  setShowRequestsTable(false)
                }}>
            <CardContent className="px-4 py-2">
              <div className="flex items-center justify-between">
              <div>
                  <span className="text-base font-medium text-gray-600">Biznese:</span>
              </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-teal-800">{stats.totalBusinesses}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                      showBusinessesTable ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 py-3 md:py-6 shadow-lg cursor-pointer hover:bg-gray-50 transition-all duration-200"
                onClick={() => {
                  setShowBusinessesTable(false)
                  setShowBookingsTable(true)
                  setShowCategoriesTable(false)
                  setShowRequestsTable(false)
                }}>
            <CardContent className="px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-gray-600">Rezervime:</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-teal-900">{stats.totalBookings}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                      showBookingsTable ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
              </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 py-3 md:py-6 shadow-lg cursor-pointer hover:bg-gray-50 transition-all duration-200"
                onClick={() => {
                  setShowBusinessesTable(false)
                  setShowBookingsTable(false)
                  setShowCategoriesTable(true)
                  setShowRequestsTable(false)
                }}>
            <CardContent className="px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-gray-600">Kategoritë:</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-teal-900">{stats.totalCategories}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                      showCategoriesTable ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 py-3 md:py-6 shadow-lg cursor-pointer hover:bg-gray-50 transition-all duration-200"
                onClick={() => {
                  setShowBusinessesTable(false)
                  setShowBookingsTable(false)
                  setShowCategoriesTable(false)
                  setShowRequestsTable(true)
                }}>
            <CardContent className="px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-gray-600">Kërkesat:</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-teal-900">{stats.totalRequests}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                      showRequestsTable ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Table - Shows when bookings card is clicked */}
        {showBookingsTable && (
          <Card className="bg-gray-50 border-gray-200 shadow-lg mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <CardTitle className="md:text-2xl text-xl font-bold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent flex items-center">
                    <Calendar className="mr-2 h-6 w-6 text-teal-800" />
                    {bookingsViewMode === 'businesses' ? 'Rezervimet e Bizneseve' : 
                     selectedBusinessForReservations ? `Rezervimet - ${selectedBusinessForReservations.name}` : 'Rezervimet'}
                  </CardTitle>
                </div>
                <div className="flex justify-center sm:justify-end">
                  {bookingsViewMode === 'reservations' && (
                    <Button
                      onClick={handleBackToBusinesses}
                      className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white"
                    >
                      ← Kthehu te Bizneset
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {bookingsViewMode === 'businesses' ? (
                <>
                  {/* Filter Controls */}
                  <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      {/* Business Filter */}
              <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Biznesi</label>
                        <select
                          value={businessSummaryFilter}
                          onChange={(e) => setBusinessSummaryFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="all">Të gjitha bizneset</option>
                          {businesses.map((business) => (
                            <option key={business.id} value={business.id.toString()}>
                              {business.name}
                            </option>
                          ))}
                        </select>
              </div>

                      {/* City Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qyteti</label>
                        <select
                          value={cityFilter}
                          onChange={(e) => setCityFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="all">Të gjitha qytetet</option>
                          {getUniqueCities().map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Start Date Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Fillestare</label>
                        <input
                          type="date"
                          value={startDateFilter}
                          onChange={(e) => setStartDateFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      {/* End Date Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Përfundimtare</label>
                        <input
                          type="date"
                          value={endDateFilter}
                          onChange={(e) => setEndDateFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    {/* Filter Actions */}
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        {getBusinessSummary().length} biznese me rezervime
                        {(startDateFilter || endDateFilter) && (
                          <span className="ml-2 text-teal-600">
                            (në rangun e datës së zgjedhur)
                          </span>
                        )}
                      </div>
                      <Button
                        onClick={clearAllFilters}
                        variant="outline"
                        size="sm"
                        className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white"
                      >
                        Pastro Filtra
                      </Button>
                    </div>
                  </div>

                  {/* Business Summary Table */}
                  <div className="overflow-x-auto">
                  <table className="w-full text-gray-900 min-w-[700px] border-separate border-spacing-2 sm:border-spacing-0">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-0 sm:px-4 font-semibold w-[30%] min-w-[200px] whitespace-nowrap mr-2 sm:mr-0">Biznesi</th>
                        <th className="text-left py-3 px-0 sm:px-4 font-semibold w-[20%] min-w-[120px] whitespace-nowrap mr-2 sm:mr-0">Kategoria</th>
                        <th className="text-left py-3 px-0 sm:px-4 font-semibold w-[15%] min-w-[100px] whitespace-nowrap mr-2 sm:mr-0">Qyteti</th>
                        <th className="text-center py-3 px-0 sm:px-4 font-semibold w-[15%] min-w-[100px] whitespace-nowrap mr-2 sm:mr-0">Numri i Rezervimeve</th>
                        <th className="text-right py-3 px-0 sm:px-4 font-semibold w-[20%] min-w-[120px] whitespace-nowrap">Veprime</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getBusinessSummary().length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">
                            Nuk ka biznese me rezervime.
                          </td>
                        </tr>
                      ) : (
                        getBusinessSummary().map((business) => (
                          <tr key={business.id} className="border-b border-gray-200 bg-gray-50 hover:bg-gray-100">
                            <td className="py-3 px-0 sm:px-4 mr-2 sm:mr-0">
              <div>
                                <div className="font-medium whitespace-nowrap truncate" title={business.name}>
                                  {business.name}
              </div>
                                <div className="text-sm text-gray-500 whitespace-nowrap truncate" title={business.address}>
                                  {business.address}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-0 sm:px-4 mr-2 sm:mr-0">
                              <span className="whitespace-nowrap truncate block" title={(business as any).category_name || 'N/A'}>
                                {(business as any).category_name || 'N/A'}
                              </span>
                            </td>
                            <td className="py-3 px-0 sm:px-4 mr-2 sm:mr-0">
                              <span className="whitespace-nowrap truncate block" title={business.city || 'N/A'}>
                                {business.city || 'N/A'}
                              </span>
                            </td>
                            <td className="py-3 px-0 sm:px-4 text-center mr-2 sm:mr-0">
                              <span className="text-teal-900 text-2xl font-bold">
                                {business.reservationCount}
                              </span>
                            </td>
                            <td className="py-3 px-0 sm:px-4 text-right">
                              <div className="flex gap-1 sm:gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewBusinessReservations(business)}
                                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                </>
              ) : (
                // Reservations View
                <div className="overflow-x-auto">
                  <table className="w-full text-gray-900 min-w-[900px] border-separate border-spacing-2 sm:border-spacing-0">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-0 sm:px-4 font-semibold w-[20%] min-w-[160px] whitespace-nowrap mr-2 sm:mr-0">Biznesi</th>
                        <th className="text-left py-3 px-0 sm:px-4 font-semibold w-[18%] min-w-[140px] whitespace-nowrap mr-2 sm:mr-0">Sherbimi</th>
                        <th className="text-left py-3 px-0 sm:px-4 font-semibold w-[18%] min-w-[140px] whitespace-nowrap mr-2 sm:mr-0">Klienti</th>
                        <th className="text-left py-3 px-0 sm:px-4 font-semibold w-[15%] min-w-[120px] whitespace-nowrap mr-2 sm:mr-0">Data</th>
                        <th className="text-left py-3 px-0 sm:px-4 font-semibold w-[12%] min-w-[100px] whitespace-nowrap mr-2 sm:mr-0">Ora</th>
                        <th className="text-left py-3 px-0 sm:px-4 font-semibold w-[17%] min-w-[140px] whitespace-nowrap">Statusi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-500">
                            Nuk ka rezervime për biznesin e zgjedhur.
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((booking) => (
                          <tr key={booking.id} className="border-b border-gray-200 bg-gray-50 hover:bg-gray-100">
                            <td className="py-3 px-0 sm:px-4 mr-2 sm:mr-0">
                              <span className="font-medium whitespace-nowrap truncate block" title={booking.business_name || 'N/A'}>
                                {booking.business_name || 'N/A'}
                              </span>
                            </td>
                            <td className="py-3 px-0 sm:px-4 mr-2 sm:mr-0">
                              <span className="whitespace-nowrap truncate block" title={booking.service_name || 'N/A'}>
                                {booking.service_name || 'N/A'}
                              </span>
                            </td>
                            <td className="py-3 px-0 sm:px-4 mr-2 sm:mr-0">
                              <div>
                                <div className="font-medium whitespace-nowrap truncate" title={booking.customer_name}>
                                  {booking.customer_name}
                                </div>
                                <div className="text-sm text-gray-500 whitespace-nowrap truncate" title={booking.customer_email}>
                                  {booking.customer_email}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-0 sm:px-4 text-gray-900 text-sm whitespace-nowrap mr-2 sm:mr-0">
                              {new Date(booking.appointment_date).toLocaleDateString('sq-AL')}
                            </td>
                            <td className="py-3 px-0 sm:px-4 text-gray-900 text-sm whitespace-nowrap mr-2 sm:mr-0">
                              {booking.appointment_time}
                            </td>
                            <td className="py-3 px-0 sm:px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {booking.status === 'CONFIRMED' ? 'Konfirmuar' :
                                 booking.status === 'PENDING' ? 'Në pritje' :
                                 booking.status === 'CANCELLED' ? 'Anuluar' :
                                 booking.status === 'COMPLETED' ? 'Përfunduar' :
                                 booking.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Requests Table - Shows when requests card is clicked */}
        {showRequestsTable && (
          <Card className="bg-gray-50 border-gray-200 shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent flex items-center">
                <MessageCircle className="mr-2 h-6 w-6 text-teal-800" />
                Tabela e Kërkesave
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-gray-900 min-w-[800px] border-separate border-spacing-2 sm:border-spacing-0">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-0 sm:px-4 font-semibold w-[15%] min-w-[120px] whitespace-nowrap mr-2 sm:mr-0">Emri i Biznesit</th>
                      <th className="text-left py-3 px-0 sm:px-4 font-semibold w-[25%] min-w-[200px] whitespace-nowrap mr-2 sm:mr-0">Linku i Google Maps</th>
                      <th className="text-left py-3 px-0 sm:px-4 font-semibold w-[20%] min-w-[150px] whitespace-nowrap mr-2 sm:mr-0">Arsyeja</th>
                      <th className="text-left py-3 px-0 sm:px-4 font-semibold w-[20%] min-w-[150px] whitespace-nowrap mr-2 sm:mr-0">Admin Notes</th>
                      <th className="text-left py-3 px-0 sm:px-4 font-semibold w-[10%] min-w-[100px] whitespace-nowrap mr-2 sm:mr-0">Data e Kërkesës</th>
                      <th className="text-right py-3 px-0 sm:px-4 font-semibold w-[10%] min-w-[120px] whitespace-nowrap">Veprime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500">
                          Nuk ka kërkesa për ndryshim të lokacionit.
                        </td>
                      </tr>
                    ) : (
                      requests.map((request) => (
                        <tr key={request.id} className="border-b border-gray-200 bg-gray-50 hover:bg-gray-100">
                          <td className="py-3 px-0 sm:px-4 font-medium whitespace-nowrap mr-2 sm:mr-0">{request.business_name}</td>
                          <td className="py-3 px-0 sm:px-4 mr-2 sm:mr-0">
                            <a 
                              href={request.requested_google_maps_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-teal-600 hover:text-teal-800 underline text-sm sm:text-base block truncate"
                              title={request.requested_google_maps_link}
                            >
                              {request.requested_google_maps_link}
                            </a>
                          </td>
                          <td className="py-3 px-0 sm:px-4 text-sm sm:text-base whitespace-nowrap truncate mr-2 sm:mr-0" title={request.reason}>{request.reason}</td>
                          <td className="py-3 px-0 sm:px-4 mr-2 sm:mr-0">
                            {editingRequestId === request.id ? (
                              <Input
                                value={editingRequestData.admin_notes}
                                onChange={(e) => setEditingRequestData({ ...editingRequestData, admin_notes: e.target.value })}
                                placeholder="Shtoni shënime admin..."
                                className="w-full text-sm sm:text-base"
                              />
                            ) : (
                              <span className="text-gray-900 text-sm sm:text-base whitespace-nowrap truncate block" title={request.admin_notes || 'Nuk ka shënime'}>
                                {request.admin_notes || 'Nuk ka shënime'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-0 sm:px-4 text-gray-900 text-xs sm:text-sm whitespace-nowrap mr-2 sm:mr-0">
                            {new Date(request.created_at).toLocaleDateString('sq-AL')}
                          </td>
                          <td className="py-3 px-0 sm:px-4 text-right">
                            <div className="flex gap-1 sm:gap-2 justify-end">
                              {editingRequestId === request.id ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSaveRequest(request.id)}
                                    className="bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEditRequest}
                                    className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewRequest(request)}
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditRequest(request)}
                                    className="bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setDeletingRequestId(request.id)}
                                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
        </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categories Table - Shows when eye icon is clicked */}
        {showCategoriesTable && (
          <Card className="bg-gray-50 border-gray-200 shadow-lg mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent flex items-center">
                 
                  Kategoritë
                </CardTitle>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setEditingCategory(null)
                      setCategoryFormData({ name: '', icon: '' })
                      setShowCategoryForm(true)
                    }}
                    className="bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white"
                  >
                    + Shto Kategori
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-gray-900 min-w-[600px] border-separate border-spacing-2 sm:border-spacing-0">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-0 sm:px-4 font-semibold w-[30%] min-w-[150px] whitespace-nowrap mr-2 sm:mr-0">Emri</th>
                      <th className="text-left py-3 px-0 sm:px-4 font-semibold w-[20%] min-w-[100px] whitespace-nowrap mr-2 sm:mr-0">Ikona</th>
                      <th className="text-left py-3 px-0 sm:px-4 font-semibold w-[25%] min-w-[120px] whitespace-nowrap mr-2 sm:mr-0">Data Krijimit</th>
                      <th className="text-right py-3 px-0 sm:px-4 font-semibold w-[25%] min-w-[120px] whitespace-nowrap">Veprime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminCategories.map((category) => (
                      <tr key={category.id} className="border-b border-gray-200 bg-gray-50 hover:bg-gray-100">
                        <td className="py-3 px-0 sm:px-4 mr-2 sm:mr-0">
                          {editingCategoryId === category.id ? (
                            <input
                              type="text"
                              value={editingCategoryData.name}
                              onChange={(e) => setEditingCategoryData({...editingCategoryData, name: e.target.value})}
                              className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 whitespace-nowrap"
                            />
                          ) : (
                            <span className="font-medium whitespace-nowrap truncate block" title={category.name}>{category.name}</span>
                          )}
                        </td>
                        <td className="py-3 px-0 sm:px-4 mr-2 sm:mr-0">
                          {editingCategoryId === category.id ? (
                            <input
                              type="url"
                              value={editingCategoryData.icon}
                              onChange={(e) => setEditingCategoryData({...editingCategoryData, icon: e.target.value})}
                              className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 whitespace-nowrap"
                              placeholder="URL e ikonës"
                            />
                          ) : (
                            category.icon ? (
                              <img 
                                src={category.icon} 
                                alt={category.name}
                                className="w-6 h-6 rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none'
                                }}
                              />
                            ) : (
                              <span className="text-gray-400 whitespace-nowrap">-</span>
                            )
                          )}
                        </td>
                        <td className="py-3 px-0 sm:px-4 text-gray-900 text-sm whitespace-nowrap mr-2 sm:mr-0">
                          {new Date(category.created_at).toLocaleDateString('sq-AL')}
                        </td>
                        <td className="py-3 px-0 sm:px-4 text-right">
                          {editingCategoryId === category.id ? (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(category.id)}
                                className="bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white"
                              >
                                Ruaj
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelInlineEdit}
                                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white"
                              >
                                Anulo
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartEdit(category)}
                                className="bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCategoryToDelete(category.id)
                                  setShowCategoryDeleteDialog(true)
                                }}
                                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Businesses Section */}
        {showBusinessesTable && (
        <Card className="bg-gray-50 border-gray-200 shadow-lg">
                  <CardHeader>
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div>
                <CardTitle className="md:text-3xl text-2xl font-bold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent flex items-center">
                  
                  Menaxhimi i Bizneseve
                    </CardTitle>
            
              </div>
              
              {/* Search Bar and Add Business Button */}
              <div className="flex items-center gap-3">
                <div className="relative w-full lg:w-96">
                  <input
                    type="text"
                    placeholder="Kërko biznese sipas emrit, pronarit, email-it, qytetit..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full px-4 py-3 pl-10 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <Button
                  onClick={() => router.push('/regjistro-biznesin')}
                  className="bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white px-4 py-6 font-medium shadow-md transition-all duration-300 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Shto Biznes
                </Button>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm ">
              {filteredBusinesses.length} nga {businesses.length} biznese
            </p>
                  </CardHeader>
          <CardContent>
            {filteredBusinesses.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">
                  {searchTerm ? "Nuk u gjetën biznese për këtë kërkim" : "Nuk ka biznese të regjistruara"}
                </p>
          </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredBusinesses.filter(business => business && (business.id || business.name)).map((business) => (
                  <Card 
                    key={business.id || business.name || Math.random()} 
                    className={`bg-white border-gray-200 hover:shadow-lg transition-all duration-300 ${
                      expandedCard === (business.id || business.name) ? 'md:col-span-2 lg:col-span-4' : ''
                    }`}
                  >
                    <CardHeader className="pb-3 px-4 pt-2">
                      
                      <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="flex-1 min-w-0">
                            {editingBusiness === business.id ? (
                              <input
                                type="text"
                                value={editFormData.name || ''}
                                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                                className="font-bold text-gray-900 text-lg mb-2 bg-transparent border-b border-gray-300 focus:border-teal-800 focus:outline-none w-full"
                              />
                            ) : (
                              <h3 className="font-bold text-gray-900 text-lg mb-2">{business.name}</h3>
                            )}
                            <div className="flex items-center space-x-1">
                              {business.is_active ? (
                                <Badge className="bg-gradient-to-r from-gray-800 to-teal-800 text-white border-0 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Aktiv
                                </Badge>
                              ) : (
                                <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white border-0 text-xs">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Jo Aktiv
                                </Badge>
                              )}
                              {business.is_verified && (
                                <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 text-xs">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Verifikuar
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-1 flex-shrink-0">
                            {expandedCard === business.id ? (
                              // When expanded, show delete, edit and close buttons
                              <>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white h-8 w-8 p-0 font-medium shadow-md transition-all duration-300"
                                  onClick={() => confirmDelete(business.id)}
                                  title="Fshi biznesin"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white h-8 w-8 p-0 font-medium shadow-md transition-all duration-300"
                                  onClick={() => handleEditBusiness(business)}
                                  title="Modifiko"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white h-8 w-8 p-0 font-medium shadow-md transition-all duration-300"
                                  onClick={() => handleViewBusiness(business)}
                                  title="Mbyll"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              // When collapsed, show only eye button
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white h-8 w-8 p-0 font-medium shadow-md transition-all duration-300"
                                onClick={() => handleViewBusiness(business)}
                                title="Shiko"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                  </CardHeader>
                    
                    {expandedCard === (business.id || business.name) && business ? (
                      // Expanded View - Full Details
                  <CardContent className="space-y-4">
                        {editingBusiness === business.id ? (
                      <div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Left Column - Editable Contact Info */}
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-2">Informacione Biznesi</h4>
                                  <div className="space-y-3 bg-white rounded">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Emri i Biznesit</label>
                                      <input
                                        type="text"
                                        value={editFormData.name || ''}
                                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Slug (URL)</label>
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          value={editFormData.slug || ''}
                                          onChange={(e) => setEditFormData({...editFormData, slug: e.target.value})}
                                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                          placeholder="business-slug"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            try {
                                              const businessName = editFormData.name || ''
                                              if (businessName.trim()) {
                                                const generatedSlug = generateSlug(businessName)
                                                setEditFormData({...editFormData, slug: generatedSlug})
                                              }
                                            } catch (error) {
                                              console.error('Error generating slug:', error)
                                            }
                                          }}
                                          className="px-3 py-1 bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white text-xs rounded font-medium shadow-md transition-all duration-300"
                                        >
                                          Gjenero
                                        </button>
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1">
                                        URL: /{editFormData.slug || 'business-slug'}
                                      </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                                        <input
                                          type="email"
                                          value={editFormData.account_email || ''}
                                          onChange={(e) => setEditFormData({...editFormData, account_email: e.target.value})}
                                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                        />
                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
                                        <input
                                          type="text"
                                          value={editFormData.phone || ''}
                                          onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                        />
                    </div>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Emri i Pronarit</label>
                                      <input
                                        type="text"
                                        value={editFormData.owner_name || ''}
                                        onChange={(e) => setEditFormData({...editFormData, owner_name: e.target.value})}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      />
                                    </div>
                      <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Adresa</label>
                                      <input
                                        type="text"
                                        value={editFormData.address || ''}
                                        onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      />
                      </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Qyteti</label>
                                        <select
                                          value={editFormData.city || ''}
                                          onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                        >
                                          <option value="">Zgjidhni qytetin</option>
                                          <option value="Deçan">Deçan</option>
                                          <option value="Dragash">Dragash</option>
                                          <option value="Drenas">Drenas</option>
                                          <option value="F.Kosovë">F.Kosovë</option>
                                          <option value="Ferizaj">Ferizaj</option>
                                          <option value="Gjakovë">Gjakovë</option>
                                          <option value="Gjilan">Gjilan</option>
                                          <option value="Graçanic">Graçanic</option>
                                          <option value="Hani Elezit">Hani Elezit</option>
                                          <option value="Istog">Istog</option>
                                          <option value="Junik">Junik</option>
                                          <option value="Kaçanik">Kaçanik</option>
                                          <option value="Kamenicë">Kamenicë</option>
                                          <option value="Klinë">Klinë</option>
                                          <option value="Kllokot">Kllokot</option>
                                          <option value="Lipjan">Lipjan</option>
                                          <option value="Malishevë">Malishevë</option>
                                          <option value="Mamushë">Mamushë</option>
                                          <option value="Mitrovicë">Mitrovicë</option>
                                          <option value="Novobërdë">Novobërdë</option>
                                          <option value="Obiliq">Obiliq</option>
                                          <option value="Partesh">Partesh</option>
                                          <option value="Pejë">Pejë</option>
                                          <option value="Podujevë">Podujevë</option>
                                          <option value="Prishtinë">Prishtinë</option>
                                          <option value="Prizren">Prizren</option>
                                          <option value="Rahovec">Rahovec</option>
                                          <option value="Ranillug">Ranillug</option>
                                          <option value="Shtërpce">Shtërpce</option>
                                          <option value="Shtime">Shtime</option>
                                          <option value="Skenderaj">Skenderaj</option>
                                          <option value="Therandë">Therandë</option>
                                          <option value="Viti">Viti</option>
                                          <option value="Vushtrri">Vushtrri</option>
                                          <option value="Mitrovicë E Veriut">Mitrovicë E Veriut</option>
                                          <option value="Zubin Potok">Zubin Potok</option>
                                          <option value="Zveçan">Zveçan</option>
                                          <option value="Leposaviq">Leposaviq</option>
                                        </select>
                    </div>
                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Shteti</label>
                                        <input
                                          type="text"
                                          value={business.state || ''}
                                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100"
                                          disabled
                                        />
                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
                                      <input
                                        type="url"
                                        value={editFormData.website || ''}
                                        onChange={(e) => setEditFormData({...editFormData, website: e.target.value})}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Facebook</label>
                                        <input
                                          type="url"
                                          value={editFormData.facebook || ''}
                                          onChange={(e) => setEditFormData({...editFormData, facebook: e.target.value})}
                                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                          placeholder="https://facebook.com/..."
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Instagram</label>
                                        <input
                                          type="url"
                                          value={editFormData.instagram || ''}
                                          onChange={(e) => setEditFormData({...editFormData, instagram: e.target.value})}
                                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                          placeholder="https://instagram.com/..."
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Google Maps Link</label>
                                      <input
                                        type="url"
                                        value={editFormData.google_maps_link || ''}
                                        onChange={(e) => handleGoogleMapsLinkChange(e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                        placeholder="https://maps.google.com/maps?q=41.3275,19.8187"
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                                        <input
                                          type="number"
                                          step="0.000001"
                                          value={editFormData.latitude || ''}
                                          onChange={(e) => {
                                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                                            handleCoordinatesChange('latitude', value)
                                          }}
                                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                          placeholder="41.3275"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                                        <input
                                          type="number"
                                          step="0.000001"
                                          value={editFormData.longitude || ''}
                                          onChange={(e) => {
                                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                                            handleCoordinatesChange('longitude', value)
                                          }}
                                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                          placeholder="19.8187"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-2">Përshkrimi i Biznesit</h4>
                                  <div className="bg-white rounded ">
                                    <textarea
                                      value={editFormData.description || ''}
                                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm h-20 resize-none"
                                      placeholder="Përshkrimi i biznesit..."
                                    />
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-2">Orari i Punës</h4>
                                  <div className="bg-white rounded">
                                    <div className="space-y-2">
                                      {(() => {
                                        const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                                        const dayNames: { [key: string]: string } = {
                                          monday: 'E Hënë',
                                          tuesday: 'E Martë', 
                                          wednesday: 'E Mërkurë',
                                          thursday: 'E Enjte',
                                          friday: 'E Premte',
                                          saturday: 'E Shtunë',
                                          sunday: 'E Dielë'
                                        }
                                        
                                        // Generate time options from 00:00 to 23:45 (every 15 minutes)
                                        const timeOptions: string[] = []
                                        for (let hour = 0; hour < 24; hour++) {
                                          for (let minute = 0; minute < 60; minute += 15) {
                                            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                                          timeOptions.push(timeString)
                                          }
                                        }
                                        
                                        return dayOrder.map(day => {
                                          const hours = editFormData.operating_hours?.[day] || { open: '', close: '', closed: true }
                                          return (
                                            <div key={day} className="flex items-center justify-between text-sm">
                                              <span className="font-medium w-20">{dayNames[day]}:</span>
                                              <div className="flex items-center space-x-2">
                                                <label className="flex items-center">
                                                  <input
                                                    type="checkbox"
                                                    checked={!hours.closed}
                                                    onChange={(e) => {
                                                      const newHours = { ...editFormData.operating_hours }
                                                      if (!newHours[day]) newHours[day] = { open: '', close: '', closed: true }
                                                      newHours[day] = { ...newHours[day], closed: !e.target.checked }
                                                      setEditFormData({...editFormData, operating_hours: newHours})
                                                    }}
                                                    className="mr-1 w-4 h-4 text-teal-800 bg-white rounded focus:ring-teal-800 focus:ring-2 accent-teal-800 border-0"
                                                  />
                                                  <span className="text-xs">Hapur</span>
                                                </label>
                                                {!hours.closed && (
                                                  <>
                                                    <select
                                                      value={hours.open || ''}
                                                      onChange={(e) => {
                                                        const newHours = { ...editFormData.operating_hours }
                                                        if (!newHours[day]) newHours[day] = { open: '', close: '', closed: false }
                                                        newHours[day] = { ...newHours[day], open: e.target.value }
                                                        setEditFormData({...editFormData, operating_hours: newHours})
                                                      }}
                                                      className="px-2 py-1 border border-gray-300 rounded text-xs  w-19 md:w-20"
                                                    >
                                                      <option value="">Hapja</option>
                                                      {timeOptions.map(time => (
                                                        <option key={time} value={time}>{time}</option>
                                                      ))}
                                                    </select>
                                                    <span className="text-xs">-</span>
                                                    <select
                                                      value={hours.close || ''}
                                                      onChange={(e) => {
                                                        const newHours = { ...editFormData.operating_hours }
                                                        if (!newHours[day]) newHours[day] = { open: '', close: '', closed: false }
                                                        newHours[day] = { ...newHours[day], close: e.target.value }
                                                        setEditFormData({...editFormData, operating_hours: newHours})
                                                      }}
                                                      className="px-2 py-1 border border-gray-300 rounded text-xs w-19 md:w-20"
                                                    >
                                                      <option value="">Mbyllja</option>
                                                      {timeOptions.map(time => (
                                                        <option key={time} value={time}>{time}</option>
                                                      ))}
                                                    </select>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          )
                                        })
                                      })()}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-2">Statistikat</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    
                                    
                                    <div className="bg-white rounded">
                                      <div className="flex items-center text-gray-500 mb-1">
                                        <Star className="w-4 h-4 mr-1 text-teal-800" />
                                        Vlerësimi
                                      </div>
                                      <div className="flex items-center">
                                        <input
                                          type="number"
                                          min="0"
                                          max="5"
                                          step="0.1"
                                          value={editFormData.rating || business.rating}
                                          onChange={(e) => setEditFormData({...editFormData, rating: parseFloat(e.target.value)})}
                                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm mr-1"
                                        />
                                        <span className="text-gray-900 font-semibold text-lg">/5</span>
                                      </div>
                                    </div>
                                    <div className="bg-white rounded">
                                      <div className="flex items-center text-gray-500 mb-1">
                                        <MessageCircle className="w-4 h-4 mr-1 text-teal-800" />
                                        Vlerësime
                                      </div>
                                      <div className="flex items-center">
                                        <input
                                          type="number"
                                          min="0"
                                          value={editFormData.total_reviews || business.total_reviews}
                                          onChange={(e) => setEditFormData({...editFormData, total_reviews: parseInt(e.target.value)})}
                                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                        />
                                    </div>
                                  </div>
                                </div>
                              </div>

                                <div>
                                  <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-3">Imazhi i Biznesit & Logo</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Business Images - 50% */}
                                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/20">
                                      <label className="block text-xs font-medium text-gray-600 mb-2">Imazhi i Biznesit</label>
                                      <div className="space-y-2">
                                        {editFormData.business_images && (
                                          <div className="flex items-center space-x-2">
                                            <img 
                                              src={editFormData.business_images} 
                                              alt="Business image"
                                              className="w-16 h-16 object-cover border border-gray-200 rounded cursor-pointer hover:opacity-80"
                                              onClick={() => setSelectedImage(editFormData.business_images || null)}
                                            />
                                            <div className="flex-1 flex items-center space-x-2">
                                              <input
                                                type="url"
                                                value={editFormData.business_images}
                                                onChange={(e) => {
                                                  setEditFormData({...editFormData, business_images: e.target.value})
                                                }}
                                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs min-w-0"
                                                placeholder="https://..."
                                              />
                                              <button
                                                onClick={() => {
                                                  setEditFormData({...editFormData, business_images: ''})
                                                }}
                                                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white p-1 rounded transition-all duration-300"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                        <div className="space-y-2">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0]
                                              if (file) {
                                                handleImageUpload(file, false)
                                                // Reset the input so the same file can be uploaded again
                                                e.target.value = ''
                                              }
                                            }}
                                            className="hidden"
                                            id="business-image-upload"
                                          />
                                          <label
                                            htmlFor="business-image-upload"
                                            className="w-full py-2 bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white text-xs cursor-pointer flex items-center justify-center rounded font-medium shadow-md transition-all duration-300"
                                          >
                                            {uploadingImage ? (
                                              <div className="flex items-center">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Po ngarkohet...
                                              </div>
                                            ) : (
                                              "+ Ngarko Imazh"
                                            )}
                                          </label>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Logo - 50% */}
                                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/20">
                                      <label className="block text-xs font-medium text-gray-600 mb-2">Logo</label>
                                      <div className="space-y-2">
                                        {editFormData.logo && (
                                          <div className="flex items-center space-x-2">
                                            <img 
                                              src={editFormData.logo} 
                                              alt="Logo preview"
                                              className="w-16 h-16 object-contain border border-gray-200 rounded-lg cursor-pointer hover:opacity-80"
                                              onClick={() => setSelectedImage(editFormData.logo)}
                                            />
                                            <div className="flex-1 flex items-center space-x-2">
                                              <input
                                                type="url"
                                                value={editFormData.logo || ''}
                                                onChange={(e) => setEditFormData({...editFormData, logo: e.target.value})}
                                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs min-w-0"
                                                placeholder="https://..."
                                              />
                                              <button
                                                onClick={() => setEditFormData({...editFormData, logo: ''})}
                                                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white p-1 rounded transition-all duration-300"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                        <div className="space-y-2">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0]
                                              if (file) {
                                                handleImageUpload(file, true)
                                                // Reset the input so the same file can be uploaded again
                                                e.target.value = ''
                                              }
                                            }}
                                            className="hidden"
                                            id="logo-upload"
                                          />
                                          <label
                                            htmlFor="logo-upload"
                                            className="w-full py-2 bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white text-xs cursor-pointer flex items-center justify-center rounded font-medium shadow-md transition-all duration-300"
                                          >
                                            {uploadingLogo ? (
                                              <div className="flex items-center">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Po ngarkohet...
                                              </div>
                                            ) : (
                                              "+ Ngarko Logo"
                                            )}
                                          </label>
                                        </div>
                                        {!editFormData.logo && (
                                          <input
                                            type="url"
                                            value={editFormData.logo || ''}
                                            onChange={(e) => setEditFormData({...editFormData, logo: e.target.value})}
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                            placeholder="Ose shkruani URL-në direkt..."
                                          />
                                        )}
                                      </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                              {/* Right Column - Services, Staff */}
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-2">Shërbimet</h4>
                                  <div className="bg-white rounded">
                                    <div className="space-y-3">
                                      {(editFormData.services || []).map((service: any, index: number) => (
                                        <div key={service.id || index} className="border border-gray-200 rounded p-2 bg-white">
                                          <div className="grid grid-cols-2 gap-2 mb-2">
                                            <input
                                              type="text"
                                              value={service.name || ''}
                                              onChange={(e) => {
                                                const oldName = service.name
                                                const newName = e.target.value
                                                
                                                // Update the service name
                                                const newServices = (editFormData.services || []).map((s: any) => 
                                                  s.id === service.id ? { ...s, name: newName } : s
                                                )
                                                
                                                // Update staff services to use the new name
                                                const newStaff = (editFormData.staff || []).map((staffMember: any) => {
                                                  if (staffMember.services && staffMember.services.includes(oldName)) {
                                                    return {
                                                      ...staffMember,
                                                      services: staffMember.services.map((serviceName: string) => 
                                                        serviceName === oldName ? newName : serviceName
                                                      )
                                                    }
                                                  }
                                                  return staffMember
                                                })
                                                
                                                setEditFormData({
                                                  ...editFormData, 
                                                  services: newServices,
                                                  staff: newStaff
                                                })
                                              }}
                                              placeholder="Emri i shërbimit"
                                              className="px-2 py-1 border border-gray-300 rounded text-xs"
                                            />
                                            <div className="relative">
                                              <input
                                                type="text"
                                                value={service.price || ''}
                                                onChange={(e) => {
                                                  const newServices = (editFormData.services || []).map((s: any) => 
                                                    s.id === service.id ? { ...s, price: e.target.value } : s
                                                  )
                                                  setEditFormData({...editFormData, services: newServices})
                                                }}
                                                placeholder="Çmimi"
                                                className="px-2 py-1 pr-6 border border-gray-300 rounded text-xs w-full"
                                              />
                                              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">€</span>
                                            </div>
                                          </div>
                                          <textarea
                                            value={service.description || ''}
                                            onChange={(e) => {
                                              const newServices = (editFormData.services || []).map((s: any) => 
                                                s.id === service.id ? { ...s, description: e.target.value } : s
                                              )
                                              setEditFormData({...editFormData, services: newServices})
                                            }}
                                            placeholder="Përshkrimi i shërbimit"
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs h-12 resize-none mb-2"
                                          />
                                          <div className="flex justify-between items-center">
                                            <select
                                              value={service.duration || '30 min'}
                                                onChange={(e) => {
                                                  const newServices = (editFormData.services || []).map((s: any) => 
                                                    s.id === service.id ? { ...s, duration: e.target.value } : s
                                                  )
                                                  setEditFormData({...editFormData, services: newServices})
                                                }}
                                              className="px-2 py-1 border border-gray-300 rounded text-xs"
                                            >
                                              <option value="15 min">15 min</option>
                                              <option value="30 min">30 min</option>
                                              <option value="45 min">45 min</option>
                                              <option value="1 orë">1 orë</option>
                                              <option value="1 orë 15 min">1 orë 15 min</option>
                                              <option value="1 orë 30 min">1 orë 30 min</option>
                                              <option value="1 orë 45 min">1 orë 45 min</option>
                                              <option value="2 orë">2 orë</option>
                                              <option value="2 orë 15 min">2 orë 15 min</option>
                                              <option value="2 orë 30 min">2 orë 30 min</option>
                                              <option value="2 orë 45 min">2 orë 45 min</option>
                                              <option value="3 orë">3 orë</option>
                                              <option value="3 orë 15 min">3 orë 15 min</option>
                                              <option value="3 orë 30 min">3 orë 30 min</option>
                                              <option value="3 orë 45 min">3 orë 45 min</option>
                                              <option value="4 orë">4 orë</option>
                                              <option value="5 orë">5 orë</option>
                                              <option value="6 orë">6 orë</option>
                                              <option value="8 orë">8 orë</option>
                                              <option value="1 ditë">1 ditë</option>
                                            </select>
                                            <button
                                              onClick={() => {
                                                const serviceName = service.name
                                                
                                                // Remove the service
                                                const newServices = (editFormData.services || []).filter((s: any) => s.id !== service.id)
                                                
                                                // Remove the service from all staff members
                                                const newStaff = (editFormData.staff || []).map((staffMember: any) => {
                                                  if (staffMember.services && staffMember.services.includes(serviceName)) {
                                                    return {
                                                      ...staffMember,
                                                      services: staffMember.services.filter((serviceName: string) => serviceName !== service.name)
                                                    }
                                                  }
                                                  return staffMember
                                                })
                                                
                                                setEditFormData({
                                                  ...editFormData, 
                                                  services: newServices,
                                                  staff: newStaff
                                                })
                                              }}
                                              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white p-1 rounded transition-all duration-300"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => {
                                          const newServiceId = Date.now() + Math.random()
                                          const newServices = [...(editFormData.services || []), { 
                                            id: newServiceId, // Unique ID
                                            name: '', 
                                            description: '', 
                                            price: '', 
                                            duration: '30 min' 
                                          }]
                                          setEditFormData({...editFormData, services: newServices})
                                        }}
                                        className="w-full py-2 bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white text-xs rounded font-medium shadow-md transition-all duration-300"
                                      >
                                        + Shto Shërbim
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-2">Stafi</h4>
                                  <div className="bg-white rounded">
                                    <div className="space-y-3">
                                      {(editFormData.staff || []).map((member: any, index: number) => (
                                        <div key={index} className="border border-gray-200 rounded p-2 bg-white">
                                          <div className="grid grid-cols-2 gap-2 mb-2">
                                            <input
                                              type="text"
                                              value={member.name || ''}
                                              onChange={(e) => {
                                                const newStaff = [...(editFormData.staff || [])]
                                                newStaff[index] = { ...member, name: e.target.value }
                                                setEditFormData({...editFormData, staff: newStaff})
                                              }}
                                              placeholder="Emri i stafit"
                                              className="px-2 py-1 border border-gray-300 rounded text-xs"
                                            />
                                            <input
                                              type="email"
                                              value={member.email || ''}
                                              onChange={(e) => {
                                                const newStaff = [...(editFormData.staff || [])]
                                                newStaff[index] = { ...member, email: e.target.value }
                                                setEditFormData({...editFormData, staff: newStaff})
                                              }}
                                              placeholder="Email"
                                              className="px-2 py-1 border border-gray-300 rounded text-xs"
                                            />
                                          </div>
                                          <div className="grid grid-cols-2 gap-2 mb-2">
                                            <input
                                              type="text"
                                              value={member.phone || ''}
                                              onChange={(e) => {
                                                const newStaff = [...(editFormData.staff || [])]
                                                newStaff[index] = { ...member, phone: e.target.value }
                                                setEditFormData({...editFormData, staff: newStaff})
                                              }}
                                              placeholder="Telefon"
                                              className="px-2 py-1 border border-gray-300 rounded text-xs"
                                            />
                                            <div className="flex items-center">
                                              <label className="flex items-center text-xs">
                                                <input
                                                  type="checkbox"
                                                  checked={member.isActive || false}
                                                  onChange={(e) => {
                                                    const newStaff = [...(editFormData.staff || [])]
                                                    newStaff[index] = { ...member, isActive: e.target.checked }
                                                    setEditFormData({...editFormData, staff: newStaff})
                                                  }}
                                                  className="mr-1 w-4 h-4 text-teal-800 bg-white rounded focus:ring-teal-800 focus:ring-2 accent-teal-800 border-0"
                                                />
                                                Aktiv
                                              </label>
                                            </div>
                                          </div>
                                          <div className="space-y-2">
                                            <div className="text-xs font-medium text-gray-600">Shërbimet e Caktuar:</div>
                                            <div className="grid grid-cols-2 gap-1">
                                              {(editFormData.services || []).map((service: any, serviceIndex: number) => (
                                                <label key={serviceIndex} className="flex items-center text-xs">
                                                  <input
                                                    type="checkbox"
                                                    checked={member.services?.includes(service.name) || false}
                                                    onChange={(e) => {
                                                      const newStaff = [...(editFormData.staff || [])]
                                                      if (!newStaff[index].services) newStaff[index].services = []
                                                      
                                                      if (e.target.checked) {
                                                        // Add service if not already present
                                                        if (!newStaff[index].services.includes(service.name)) {
                                                          newStaff[index].services.push(service.name)
                                                        }
                                                      } else {
                                                        // Remove service
                                                        newStaff[index].services = newStaff[index].services.filter((s: string) => s !== service.name)
                                                      }
                                                      
                                                      setEditFormData({...editFormData, staff: newStaff})
                                                    }}
                                                    className="mr-1 w-4 h-4 text-teal-800 bg-white rounded focus:ring-teal-800 focus:ring-2 accent-teal-800 border-0"
                                                  />
                                                  <span className="text-gray-600">{service.name}</span>
                                                </label>
                                              ))}
                                            </div>
                                            {(!editFormData.services || editFormData.services.length === 0) && (
                                              <div className="text-xs text-gray-400">Shtoni shërbime për të caktuar stafin</div>
                                            )}
                                          </div>
                                          
                                          {/* Break Times Section */}
                                          <div className="space-y-2">
                                            <div className="text-xs font-medium text-gray-600">Ora e Pauzës:</div>
                                            <div className="space-y-2">
                                              {(member.breakTimes || []).map((breakTime: any, breakIndex: number) => {
                                                // Generate time options from 00:00 to 23:45 (every 15 minutes)
                                                const timeOptions: string[] = []
                                                for (let hour = 0; hour < 24; hour++) {
                                                  for (let minute = 0; minute < 60; minute += 15) {
                                                    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                                                    timeOptions.push(timeString)
                                                  }
                                                }
                                                
                                                return (
                                                  <div key={breakIndex} className="flex items-center space-x-2">
                                                    <div className="flex items-center space-x-1">
                                                      <label className="text-xs text-gray-500">Nga:</label>
                                                      <select
                                                        value={breakTime.startTime || ''}
                                                        onChange={(e) => {
                                                          const newStaff = [...(editFormData.staff || [])]
                                                          if (!newStaff[index].breakTimes) newStaff[index].breakTimes = []
                                                          newStaff[index].breakTimes[breakIndex] = { 
                                                            ...breakTime, 
                                                            startTime: e.target.value 
                                                          }
                                                          setEditFormData({...editFormData, staff: newStaff})
                                                        }}
                                                        className="px-2 py-1 border border-gray-300 rounded text-xs w-20"
                                                      >
                                                        <option value="">Hapja</option>
                                                        {timeOptions.map(time => (
                                                          <option key={time} value={time}>{time}</option>
                                                        ))}
                                                      </select>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                      <label className="text-xs text-gray-500">Deri:</label>
                                                      <select
                                                        value={breakTime.endTime || ''}
                                                        onChange={(e) => {
                                                          const newStaff = [...(editFormData.staff || [])]
                                                          if (!newStaff[index].breakTimes) newStaff[index].breakTimes = []
                                                          newStaff[index].breakTimes[breakIndex] = { 
                                                            ...breakTime, 
                                                            endTime: e.target.value 
                                                          }
                                                          setEditFormData({...editFormData, staff: newStaff})
                                                        }}
                                                        className="px-2 py-1 border border-gray-300 rounded text-xs w-20"
                                                      >
                                                        <option value="">Mbyllja</option>
                                                        {timeOptions.map(time => (
                                                          <option key={time} value={time}>{time}</option>
                                                        ))}
                                                      </select>
                                                    </div>
                                                    <button
                                                      onClick={() => {
                                                        const newStaff = [...(editFormData.staff || [])]
                                                        newStaff[index].breakTimes = newStaff[index].breakTimes.filter((_: any, i: number) => i !== breakIndex)
                                                        setEditFormData({...editFormData, staff: newStaff})
                                                      }}
                                                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white p-1 rounded text-xs"
                                                      title="Fshi pushimin"
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                    </button>
                                                  </div>
                                                )
                                              })}
                                              <button
                                                onClick={() => {
                                                  const newStaff = [...(editFormData.staff || [])]
                                                  if (!newStaff[index].breakTimes) newStaff[index].breakTimes = []
                                                  newStaff[index].breakTimes.push({ startTime: '', endTime: '' })
                                                  setEditFormData({...editFormData, staff: newStaff})
                                                }}
                                                className="bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white p-1 rounded transition-all duration-300"
                                                title="Shto Pushim"
                                              >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                              </button>
                                            </div>
                                          </div>
                                          
                                          <div className="flex justify-between items-center">
                                            <div className="text-xs text-gray-500">
                                              Shërbimet: {member.services?.map((service: any) => typeof service === 'string' ? service : service.name).filter((name: any) => name && name.trim() !== '').join(', ') || 'Asnjë'}
                                            </div>
                                            <button
                                              onClick={() => {
                                                const newStaff = (editFormData.staff || []).filter((_: any, i: number) => i !== index)
                                                setEditFormData({...editFormData, staff: newStaff})
                                              }}
                                              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white p-1 rounded transition-all duration-300"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => {
                                          const newStaff = [...(editFormData.staff || []), { name: '', email: '', phone: '', isActive: true, services: [] }]
                                          setEditFormData({...editFormData, staff: newStaff})
                                        }}
                                        className="w-full py-2 bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white text-xs rounded font-medium shadow-md transition-all duration-300"
                                      >
                                        + Shto Staf
                                      </button>
                                    </div>
                                  </div>
                                </div>

                      <div>
                                  <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-2">Informacione Shtesë</h4>
                                  <div className="space-y-2 text-sm bg-white rounded">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">ID e Biznesit:</span>
                                      <span className="font-medium">{business.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Kategoria:</span>
                                      <select
                                        value={editFormData.category_id || business.category_id}
                                        onChange={(e) => setEditFormData({...editFormData, category_id: parseInt(e.target.value)})}
                                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                                      >
                                        {categories.map(category => (
                                          <option key={category.id} value={category.id}>
                                            {category.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Statusi:</span>
                                      <label className="flex items-center">
                                        <input
                                          type="checkbox"
                                          checked={editFormData.is_active || false}
                                          onChange={(e) => setEditFormData({...editFormData, is_active: e.target.checked})}
                                          className="mr-2 w-4 h-4 text-teal-800 bg-white rounded focus:ring-teal-800 focus:ring-2 accent-teal-800 border-0"
                                        />
                                        <span className={editFormData.is_active ? 'text-green-600' : 'text-red-600'}>
                                          {editFormData.is_active ? 'Aktiv' : 'Jo Aktiv'}
                                        </span>
                                      </label>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Verifikuar:</span>
                                      <label className="flex items-center">
                                        <input
                                          type="checkbox"
                                          checked={editFormData.is_verified || false}
                                          onChange={(e) => setEditFormData({...editFormData, is_verified: e.target.checked})}
                                          className="mr-2 w-4 h-4 text-teal-800 bg-white rounded focus:ring-teal-800 focus:ring-2 accent-teal-800 border-0"
                                        />
                                        <span className={editFormData.is_verified ? 'text-blue-600' : 'text-gray-600'}>
                                          {editFormData.is_verified ? 'Po' : 'Jo'}
                                        </span>
                                      </label>
                                    </div>
                                  </div>
                                </div>

                                {/* Password Section */}
                                <div>
                                  <div 
                                    className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                                  >
                                    <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">Menaxhimi i Fjalëkalimit</h4>
                                    <div className={`transform transition-transform duration-200 ${showPasswordSection ? 'rotate-180' : ''}`}>
                                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                              </div>
                      </div>
                                  
                                  {showPasswordSection && (
                                    <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg">
                                      <div className="space-y-3">
                                        <div className="grid grid-cols-1 gap-3">
                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Fjalëkalimi i Ri</label>
                                            <input
                                              type="password"
                                              value={editFormData.new_password || ''}
                                              onChange={(e) => setEditFormData({...editFormData, new_password: e.target.value})}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                              placeholder="Lëreni bosh për të mos ndryshuar"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Konfirmo Fjalëkalimin</label>
                                            <input
                                              type="password"
                                              value={editFormData.confirm_password || ''}
                                              onChange={(e) => setEditFormData({...editFormData, confirm_password: e.target.value})}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                              placeholder="Konfirmo fjalëkalimin e ri"
                                            />
                                          </div>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Lëreni të zbrazët për të ruajtur fjalëkalimin aktual
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                      </div>

                            
                            {/* Save/Cancel Buttons */}
                            <div className="pt-4 border-t border-gray-200">
                              <div className="flex space-x-2 justify-end">
                                <Button 
                                  onClick={() => handleEditBusiness(business)}
                                  className="bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white h-8 w-8 p-0 font-medium shadow-md transition-all duration-300"
                                  title="Ruaj"
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button 
                                  onClick={handleCancelEdit}
                                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white h-8 w-8 p-0 font-medium shadow-md transition-all duration-300"
                                  title="Anulo"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                    </div>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-2">Informacione Kontakti</h4>
                              <div className="space-y-3 bg-white rounded">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <div className="text-xs text-gray-500">Email</div>
                                    <div className="text-sm font-medium text-gray-900">{business.account_email}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-gray-500">Telefon</div>
                                    <div className="text-sm font-medium text-gray-900">{business.phone}</div>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Adresa</div>
                                  <div className="text-sm font-medium text-gray-900">{business.address}</div>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                  <div>
                                    <div className="text-xs text-gray-500">Qyteti</div>
                                    <div className="text-sm font-medium text-gray-900">{business.city}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-gray-500">Shteti</div>
                                    <div className="text-sm font-medium text-gray-900">{business.state}</div>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Website</div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {business.website ? (
                                      <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                        {business.website}
                                      </a>
                                    ) : (
                                      <span className="text-gray-400">Nuk është vendosur</span>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <div className="text-xs text-gray-500">Facebook</div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {business.facebook ? (
                                        <a href={business.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                          {business.facebook}
                                        </a>
                                      ) : (
                                        <span className="text-gray-400">Nuk është vendosur</span>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-gray-500">Instagram</div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {business.instagram ? (
                                        <a href={business.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                          {business.instagram}
                                        </a>
                                      ) : (
                                        <span className="text-gray-400">Nuk është vendosur</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                      <div>
                              <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-2">Përshkrimi i Biznesit</h4>
                              <div className="text-gray-600 text-sm bg-white rounded">
                                {business.description || 'Nuk ka përshkrim të disponueshëm'}
                      </div>
                    </div>

                      <div>
                              <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-2">Orari i Punës</h4>
                              <div className="text-gray-600 text-sm bg-white rounded">
                                {business.operating_hours ? (
                                  <div className="space-y-1">
                                    {(() => {
                                      const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                                      const dayNames: { [key: string]: string } = {
                                        monday: 'E Hënë',
                                        tuesday: 'E Martë', 
                                        wednesday: 'E Mërkurë',
                                        thursday: 'E Enjte',
                                        friday: 'E Premte',
                                        saturday: 'E Shtunë',
                                        sunday: 'E Dielë'
                                      }
                                      
                                      return dayOrder.map(day => {
                                        const hours = business.operating_hours[day]
                                        return (
                                          <div key={day} className="flex justify-between">
                                            <span className="font-medium">{dayNames[day]}:</span>
                                            <span>
                                              {hours && hours.closed === false ? 
                                                `${hours.open} - ${hours.close}` : 
                                                'Mbyllur'
                                              }
                                            </span>
                      </div>
                                        )
                                      })
                                    })()}
                    </div>
                                ) : (
                                  'Nuk ka orar të regjistruar'
                                )}
                              </div>
                            </div>

                      <div>
                                <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-2">Statistikat</h4>
                              <div className="grid grid-cols-2 gap-4">
                                
                                
                                <div className="bg-gray-50 rounded p-3">
                                  <div className="flex items-center text-gray-500 mb-1">
                                    <Star className="w-4 h-4 mr-1" />
                                    Vlerësimi
                      </div>
                                  <div className="text-gray-900 font-semibold text-lg">
                                    {business.rating ? business.rating.toFixed(1) : '0.0'}/5
                    </div>
                                </div>
                                <div className="bg-gray-50 rounded p-3">
                                  <div className="flex items-center text-gray-500 mb-1">
                                    <MessageCircle className="w-4 h-4 mr-1" />
                                    Vlerësime
                                  </div>
                                  <div className="text-gray-900 font-semibold text-lg">
                                    {business.total_reviews}
                                </div>
                              </div>
                      </div>
                    </div>

                      <div>
                              <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-3">Imazhi i Biznesit | Logo</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Business Images Box */}
                                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                               
                                  {business.business_images ? (
                                    <div className="flex justify-center">
                                      <img 
                                        src={business.business_images} 
                                        alt="Business image"
                                        className="w-36 h-36 object-contain cursor-pointer hover:opacity-80"
                                        onClick={() => setSelectedImage(business.business_images || null)}
                                      />
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 text-xs">Nuk ka imazh</p>
                                  )}
              </div>
                                
                                {/* Logo Box */}
                                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                  
                                  <div className="flex justify-center">
                                    {business.logo ? (
                                      <img 
                                        src={business.logo} 
                                        alt={business.name}
                                        className="w-36 h-36 object-contain rounded-lg cursor-pointer hover:opacity-80"
                                        onClick={() => setSelectedImage(business.logo || null)}
                                      />
                                    ) : (
                                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center border border-gray-200">
                                        <Building2 className="w-8 h-8 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  </div>
                                </div>
                      </div>
                    </div>

                          {/* Right Column */}
                          <div className="space-y-4">
                      <div>
                      <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-2">Shërbimet</h4>
                      {business.services && business.services.length > 0 ? (
                        <div className="space-y-3">
                          {business.services.map((service: any, index: number) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                              <div className="font-medium text-gray-900 text-sm mb-1">{service.name}</div>
                              <div className="text-gray-600 text-xs mb-2">{service.description}</div>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Kohëzgjatja: {service.duration || 'N/A'}</span>
                                {service.price && <span>Çmimi: {service.price}</span>}
                  </div>
                            </div>
                          ))}
                      </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Nuk ka shërbime të regjistruara</p>
                      )}
                    </div>

                      <div>
                      <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-2">Stafi</h4>
                      {business.staff && business.staff.length > 0 ? (
                        <div className="space-y-3">
                          {business.staff.map((member: any, index: number) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                              <div className="font-medium text-gray-900 text-sm mb-1">{member.name}</div>
                              <div className="text-gray-600 text-xs mb-1">{member.email}</div>
                              <div className="text-gray-500 text-xs mb-1">Telefon: {member.phone}</div>
                              <div className="text-gray-500 text-xs mb-1">
                                Status: <span className={member.isActive ? 'text-green-600' : 'text-red-600'}>
                                  {member.isActive ? 'Aktiv' : 'Jo Aktiv'}
                                </span>
                              </div>
                              {member.services && member.services.length > 0 && (
                                <div className="text-gray-500 text-xs">
                                  Shërbimet: {member.services.map((service: any) => typeof service === 'string' ? service : service.name).filter((name: any) => name && name.trim() !== '').join(', ')}
                                </div>
                              )}
                              
                              {/* Break Times Section */}
                              {member.breakTimes && member.breakTimes.length > 0 && (
                                <div className="mt-2">
                                  <div className="text-gray-500 text-xs mb-1">Ora e Pauzës:</div>
                                  <div className="space-y-1">
                                    {member.breakTimes.map((breakTime: any, breakIndex: number) => (
                                      <div key={breakIndex} className="text-gray-600 text-xs">
                                        {breakTime.startTime && breakTime.endTime ? (
                                          `${breakTime.startTime} - ${breakTime.endTime}`
                                        ) : (
                                          'E papërcaktuar'
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Nuk ka staf të regjistruar</p>
                      )}
                    </div>

                      <div>
                              <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-2">Informacione Shtesë</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">ID e Biznesit:</span>
                                  <span className="font-medium">{business.id}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Kategoria:</span>
                                  <span className="font-medium">
                                    {categories.length > 0 ? getCategoryName(business.category_id) : 'Loading...'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Statusi:</span>
                                  <span className={`font-medium ${business.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                    {business.is_active ? 'Aktiv' : 'Jo Aktiv'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Verifikuar:</span>
                                  <span className={`font-medium ${business.is_verified ? 'text-blue-600' : 'text-gray-600'}`}>
                                    {business.is_verified ? 'Po' : 'Jo'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>Regjistruar: {business.created_at ? new Date(business.created_at).toLocaleDateString('sq-AL') : 'N/A'}</span>
                            
                          </div>
                        </div>
                        </>
                        )}
                </CardContent>
                    ) : (
                      // Compact View
                      <CardContent className="space-y-3 px-4 pb-4 pt-2">
                        {/* Business Info */}
                        <div className="space-y-1">
                          <div className="flex items-center text-gray-600 text-xs">
                            <Mail className="w-3 h-3 mr-1 text-gray-400" />
                            <span className="truncate">{business.account_email}</span>
                          </div>
                          <div className="flex items-center text-gray-600 text-xs">
                            <Phone className="w-3 h-3 mr-1 text-gray-400" />
                            {business.phone}
                          </div>
                          <div className="flex items-center text-gray-600 text-xs">
                            <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                            <span className="truncate">{business.city}</span>
                          </div>
                        </div>

                        {/* Services & Staff */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center text-gray-500 mb-1">
                              <Clock className="w-3 h-3 mr-1" />
                              Shërbimet
                            </div>
                            <div className="text-gray-900 font-semibold text-sm">
                              {business.services?.length || 0}
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center text-gray-500 mb-1">
                              <Users className="w-3 h-3 mr-1" />
                              Stafi
                            </div>
                            <div className="text-gray-900 font-semibold text-sm">
                              {business.staff?.length || 0}
                            </div>
                      </div>
                    </div>

                        {/* Rating */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center">
                            <Star className="w-3 h-3 text-teal-800 mr-1" />
                            <span className="text-gray-900 font-semibold text-xs">{business.rating ? business.rating.toFixed(1) : '0.0'}</span>
                            <span className="text-gray-500 text-xs ml-1">({business.total_reviews})</span>
                          </div>
                          <div className="text-gray-500 text-xs">
                            {business.created_at ? new Date(business.created_at).toLocaleDateString('sq-AL') : 'N/A'}
                      </div>
                    </div>
                  </CardContent>
                    )}
              </Card>
                ))}
        </div>
            )}
                </CardContent>
              </Card>
      )}

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <img 
              src={selectedImage} 
              alt="Fullscreen view"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full p-3 transition-all shadow-lg"
              title="Mbyll (Escape)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Konfirmo Fshirjen
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                A jeni të sigurt që doni të fshini këtë biznes? Ky veprim nuk mund të anulohet.
              </p>
              <div className="flex space-x-3 justify-center">
                <Button
                  onClick={() => {
                    setShowDeleteDialog(false)
                    setBusinessToDelete(null)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white"
                >
                  Anulo
                </Button>
                <Button
                  onClick={() => businessToDelete && handleDeleteBusiness(businessToDelete)}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
                  disabled={deleting}
                >
                  {deleting ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Po fshihet...
                    </div>
                  ) : (
                    'Fshi Biznesin'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingCategory ? 'Përditëso Kategori' : 'Shto Kategori të Re'}
              </h3>
              <button
                onClick={() => {
                  setShowCategoryForm(false)
                  setEditingCategory(null)
                  setCategoryFormData({ name: '', icon: '' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emri i Kategorisë
                </label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="P.sh. Restorant, Hotel, etc."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL e Ikonës
                </label>
                <input
                  type="url"
                  value={categoryFormData.icon}
                  onChange={(e) => setCategoryFormData({...categoryFormData, icon: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/icon.png"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false)
                    setEditingCategory(null)
                    setCategoryFormData({ name: '', icon: '' })
                  }}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white"
                >
                  Anulo
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white"
                >
                  {editingCategory ? 'Përditëso' : 'Krijo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Delete Confirmation Dialog */}
      {showCategoryDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Konfirmo Fshirjen e Kategorisë
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                A jeni të sigurt që doni të fshini këtë kategori? Ky veprim nuk mund të anulohet.
              </p>
              <div className="flex space-x-3 justify-center">
                <Button
                  onClick={() => {
                    setShowCategoryDeleteDialog(false)
                    setCategoryToDelete(null)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white"
                >
                  Anulo
                </Button>
                <Button
                  onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete)}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
                  disabled={deletingCategory}
                >
                  {deletingCategory ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Po fshihet...
                    </div>
                  ) : (
                    'Fshi Kategorinë'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Request Confirmation Dialog */}
      {deletingRequestId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Konfirmo Fshirjen
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                A jeni të sigurt që doni të fshini këtë kërkesë? Ky veprim nuk mund të anulohet.
              </p>
              <div className="flex space-x-3 justify-center">
                <Button
                  onClick={() => setDeletingRequestId(null)}
                  variant="outline"
                  className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white"
                >
                  Anulo
                </Button>
                <Button
                  onClick={() => handleDeleteRequest(deletingRequestId)}
                  disabled={deletingRequest}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-2"
                >
                  {deletingRequest ? 'Po fshihet...' : 'Fshi'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Request Modal */}
      {viewingRequestId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Detajet e Kërkesës
              </h3>
              <Button
                onClick={() => setViewingRequestId(null)}
                variant="outline"
                size="sm"
                className="bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {(() => {
              const request = requests.find(r => r.id === viewingRequestId)
              if (!request) return null
              
              return (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emri i Biznesit
                    </label>
                    <p className="text-gray-900">{request.business_name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Linku i Google Maps
                    </label>
                    <a 
                      href={request.requested_google_maps_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-800 underline break-all"
                    >
                      {request.requested_google_maps_link}
                    </a>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Arsyeja
                    </label>
                    <p className="text-gray-900">{request.reason}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Notes
                    </label>
                    <p className="text-gray-900">{request.admin_notes || 'Nuk ka shënime'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data e Kërkesës
                    </label>
                    <p className="text-gray-900">
                      {new Date(request.created_at).toLocaleDateString('sq-AL')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data e Përditësimit
                    </label>
                    <p className="text-gray-900">
                      {new Date(request.updated_at).toLocaleDateString('sq-AL')}
                    </p>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
      </div>
      </div>
  )
}