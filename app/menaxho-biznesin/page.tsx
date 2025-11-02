"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BusinessHeader } from "@/components/business-header"
import { useToast } from "@/hooks/use-toast"
import { Edit, Save, X, Building2, Trash2, ArrowLeft } from "lucide-react"

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

interface Category {
  id: number
  name: string
  slug: string
  icon?: string
  color?: string
  created_at: string
  updated_at: string
}

export default function BusinessPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [business, setBusiness] = useState<Business | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBusinessImage, setUploadingBusinessImage] = useState(false)
  const [showImageUploads, setShowImageUploads] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showLocationRequestModal, setShowLocationRequestModal] = useState(false)
  const [locationRequestData, setLocationRequestData] = useState({
    google_maps_link: '',
    reason: ''
  })
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [validationErrors, setValidationErrors] = useState<any>({})
  const [showServiceDeleteDialog, setShowServiceDeleteDialog] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<any>(null)
  const [showStaffDeleteDialog, setShowStaffDeleteDialog] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState<any>(null)
  const [showStaffHoursSection, setShowStaffHoursSection] = useState(false)
  const [expandedStaffHours, setExpandedStaffHours] = useState<number | null>(null)
  const [showImageSection, setShowImageSection] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Helper function to copy business hours to staff
  const copyBusinessHoursToStaff = (businessHours: any) => {
    if (!businessHours) return null
    return JSON.parse(JSON.stringify(businessHours))
  }

  // Helper function to check if staff hours are unchanged from business hours
  const isStaffHoursUnchanged = (staffHours: any, businessHours: any) => {
    if (!staffHours || !businessHours) return false
    return JSON.stringify(staffHours) === JSON.stringify(businessHours)
  }

  // Helper function to sync business hours changes to staff hours
  const syncBusinessHoursToStaff = (newBusinessHours: any) => {
    const updatedStaff = (editData.staff || []).map((member: any) => {
      const currentStaffHours = member.operatingHours || {}
      const updatedStaffHours = { ...currentStaffHours }
      
      // Add new days from business hours to staff hours
      Object.keys(newBusinessHours).forEach(day => {
        const businessDayHours = newBusinessHours[day]
        const staffDayHours = currentStaffHours[day]
        
        // If business day is now open and staff doesn't have this day, add it
        if (!businessDayHours.closed && !staffDayHours) {
          updatedStaffHours[day] = {
            open: businessDayHours.open,
            close: businessDayHours.close,
            closed: false
          }
        }
        // If business day is now closed, remove it from staff hours
        else if (businessDayHours.closed && staffDayHours) {
          updatedStaffHours[day] = {
            open: '',
            close: '',
            closed: true
          }
        }
        // If staff hours haven't been customized, sync the entire day
        else if (isStaffHoursUnchanged(member.operatingHours, editData.operating_hours)) {
          updatedStaffHours[day] = {
            open: businessDayHours.open,
            close: businessDayHours.close,
            closed: businessDayHours.closed
          }
        }
      })
      
      return {
        ...member,
        operatingHours: updatedStaffHours
      }
    })
    return updatedStaff
  }

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const businessAuthData = localStorage.getItem('businessAuth')
      if (businessAuthData) {
        try {
          const parsedData = JSON.parse(businessAuthData)
          const { businessId } = parsedData
          if (businessId) {
            setIsAuthenticated(true)
            await fetchBusinessData(businessId)
            await fetchCategories()
          } else {
            router.push('/identifikohu')
          }
        } catch (error) {
          console.error('Auth check error:', error)
          router.push('/identifikohu')
        }
      } else {
        router.push('/identifikohu')
      }
      setIsLoading(false)
    }

    checkAuth()
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


  const fetchBusinessData = async (businessId: number) => {
    try {
      const response = await fetch(`/api/businesses/${businessId}`)
      if (response.ok) {
        const businessData = await response.json()
        console.log('Fetched business data:', businessData)
        console.log('business_images type:', typeof businessData.business_images)
        console.log('business_images value:', businessData.business_images)
        setBusiness(businessData)
      } else {
        throw new Error('Failed to fetch business data')
      }
    } catch (error) {
      console.error('Error fetching business data:', error)
      toast({
        title: "Gabim",
        description: "Nuk mund të ngarkohen të dhënat e biznesit",
        variant: "destructive"
      })
    }
  }


  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const categoriesData = await response.json()
        setCategories(categoriesData)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleEditDataChange = (updates: any) => {
    setEditData((prev: any) => ({ ...prev, ...updates }))
  }

  const handlePasswordChange = (updates: any) => {
    setPasswordData((prev: any) => ({ ...prev, ...updates }))
  }

  const startEditing = () => {
    if (business) {
      setEditData({
        name: business.name || '',
        owner_name: business.owner_name || '',
        phone: business.phone || '',
        address: business.address || '',
        city: business.city || '',
        category_id: business.category_id || 1,
        description: business.description || '',
        website: business.website || '',
        facebook: business.facebook || '',
        instagram: business.instagram || '',
        google_maps_link: business.google_maps_link || '',
        latitude: business.latitude || 0,
        longitude: business.longitude || 0,
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
        services: business.services || [],
        staff: (business.staff || []).map((staff: any) => ({
          ...staff,
          breakTimes: staff.breakTimes && staff.breakTimes.length > 0 ? staff.breakTimes : [{ startTime: '', endTime: '' }], // Ensure breakTimes is initialized
          operatingHours: staff.operatingHours || copyBusinessHoursToStaff(business.operating_hours)
        }))
      })
      setIsEditing(true)
    }
  }

  const cancelEditing = () => {
    setEditData({})
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: ''
    })
    setShowPasswordFields(false)
    setIsEditing(false)
    setValidationErrors({})
  }

  const saveChanges = async () => {
    if (!business) return

    try {
      // Clear previous validation errors
      setValidationErrors({})
      
      // Validate staff members have required fields
      const staffErrors: any = {}
      if (editData.staff && editData.staff.length > 0) {
        const invalidStaff = []
        
        for (let i = 0; i < editData.staff.length; i++) {
          const staffMember = editData.staff[i]
          // Check if staff member has any data (name, email, or phone)
          const hasAnyData = (staffMember.name && staffMember.name.trim() !== '') || 
                           (staffMember.email && staffMember.email.trim() !== '') || 
                           (staffMember.phone && staffMember.phone.trim() !== '')
          
          if (hasAnyData) {
            // If staff member has any data, all required fields must be present
            if (!staffMember.name || staffMember.name.trim() === '') {
              staffErrors[`staff_${i}_name`] = 'Emri është i detyrueshëm'
              invalidStaff.push(`Stafi ${i + 1} - mungon emri`)
            }
            if (!staffMember.email || staffMember.email.trim() === '') {
              staffErrors[`staff_${i}_email`] = 'Email është i detyrueshëm'
              invalidStaff.push(`Stafi ${i + 1} - mungon email`)
            }
            if (!staffMember.phone || staffMember.phone.trim() === '') {
              staffErrors[`staff_${i}_phone`] = 'Telefoni është i detyrueshëm'
              invalidStaff.push(`Stafi ${i + 1} - mungon telefoni`)
            }
            
            // Check if staff has at least one service assigned
            if (!staffMember.services || staffMember.services.length === 0) {
              staffErrors[`staff_${i}_services`] = 'Duhet të ketë të paktën një shërbim të caktuar'
              invalidStaff.push(`Stafi ${i + 1} - duhet të ketë të paktën një shërbim`)
            }
          } else {
            // If staff member has no data, it's invalid
            staffErrors[`staff_${i}_name`] = 'Të dhënat e stafit janë të detyrueshme'
            invalidStaff.push(`Të dhënat e stafit janë të detyrueshme`)
          }
        }
        
        if (invalidStaff.length > 0) {
          setValidationErrors(staffErrors)
          toast({
            title: "Gabim!",
            description: `Stafi i mëposhtëm ka fusha të munguara: ${invalidStaff.join(', ')}`,
            variant: "destructive",
          })
          return
        }
      }

      // Validate services have required fields
      const serviceErrors: any = {}
      if (editData.services && editData.services.length > 0) {
        const invalidServices = []
        
        for (let i = 0; i < editData.services.length; i++) {
          const service = editData.services[i]
          // Check if service has any data (name, duration, cost, or description)
          const hasAnyData = (service.name && service.name.trim() !== '') || 
                           (service.duration && service.duration !== '') || 
                           (service.cost && service.cost.trim() !== '') || 
                           (service.description && service.description.trim() !== '')
          
          if (hasAnyData) {
            // If service has any data, required fields must be present
            if (!service.name || service.name.trim() === '') {
              serviceErrors[`service_${i}_name`] = 'Emri është i detyrueshëm'
              invalidServices.push(`Shërbimi ${i + 1} - mungon emri`)
            }
            if (!service.duration || service.duration === '') {
              serviceErrors[`service_${i}_duration`] = 'Kohëzgjatja është e detyrueshme'
              invalidServices.push(`Shërbimi ${i + 1} - mungon kohëzgjatja`)
            }
          } else {
            // If service has no data, it's invalid
            serviceErrors[`service_${i}_name`] = 'Të dhënat e shërbimit janë të detyrueshme'
            invalidServices.push(`Të dhënat e shërbimit janë të detyrueshme`)
          }
        }
        
        if (invalidServices.length > 0) {
          setValidationErrors({...staffErrors, ...serviceErrors})
          toast({
            title: "Gabim!",
            description: `Shërbimet e mëposhtme kanë fusha të munguara: ${invalidServices.join(', ')}`,
            variant: "destructive",
          })
          return
        }
      }

      // Validate that staff members have at least one service assigned
      if (editData.staff && editData.staff.length > 0) {
        const staffWithoutServices = []
        
        for (const staffMember of editData.staff) {
          if (!staffMember.name || staffMember.name.trim() === '') continue // Skip empty staff
          
          if (!staffMember.services || staffMember.services.length === 0) {
            staffWithoutServices.push(`${staffMember.name} - nuk ka shërbime të caktuara`)
          }
        }
        
        if (staffWithoutServices.length > 0) {
          toast({
            title: "Gabim!",
            description: `Stafi i mëposhtëm nuk ka shërbime të caktuara: ${staffWithoutServices.join(', ')}`,
            variant: "destructive",
          })
          return
        }
      }

      // Validate that each service has at least one staff member assigned
      if (editData.services && editData.services.length > 0) {
        const servicesWithoutStaff = []
        
        for (const service of editData.services) {
          if (!service.name || service.name.trim() === '') continue // Skip empty services
          
          const hasStaffAssigned = editData.staff && editData.staff.some((staffMember: any) => 
            staffMember.services && staffMember.services.includes(service.name)
          )
          
          if (!hasStaffAssigned) {
            servicesWithoutStaff.push(service.name)
          }
        }
        
        if (servicesWithoutStaff.length > 0) {
          toast({
            title: "Gabim!",
            description: `Shërbimet e mëposhtme duhet të kenë të paktën një staf të caktuar: ${servicesWithoutStaff.join(', ')}`,
            variant: "destructive",
          })
          return
        }
      }

      const updateData = {
        ...editData,
        ...(passwordData.new_password && passwordData.new_password === passwordData.confirm_password ? {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        } : {})
      }
      
      const response = await fetch(`/api/businesses/${business.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const updatedBusiness = await response.json()
        setBusiness(updatedBusiness)
        setIsEditing(false)
        setEditData({})
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        })
        setShowPasswordFields(false)
        setShowImageUploads(false)
          
          toast({
          title: "Sukses!",
          description: "Të dhënat u përditësuan me sukses",
          })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update business')
      }
    } catch (error) {
      console.error('Error saving changes:', error)
      toast({
        title: "Gabim",
        description: "Gabim gjatë ruajtjes së ndryshimeve",
        variant: "destructive"
      })
    }
  }

  const submitLocationRequest = async () => {
    if (!business) return

    try {
      const requestData = {
        business_id: business.id,
        business_name: business.name,
        requested_google_maps_link: locationRequestData.google_maps_link,
        reason: locationRequestData.reason
      }

      console.log('Submitting location request:', requestData)

      const response = await fetch('/api/location-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (response.ok) {
        const result = await response.json()
        console.log('Success response:', result)
        toast({
          title: "Sukses!",
          description: "Kërkesa për ndryshim të lokacionit u dërgua me sukses",
        })
        setShowLocationRequestModal(false)
        setLocationRequestData({ google_maps_link: '', reason: '' })
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.error || 'Failed to submit location request')
      }
    } catch (error) {
      console.error('Error submitting location request:', error)
      toast({
        title: "Gabim",
        description: `Gabim gjatë dërgimit të kërkesës: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-custom-gradient  flex items-center justify-center">
        <div className="text-white text-xl">Duke ngarkuar...</div>
      </div>
    )
  }

  if (!isAuthenticated || !business) {
    return (
      <div className="min-h-screen bg-custom-gradient  flex items-center justify-center">
        <div className="text-white text-xl">Nuk jeni të autorizuar</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-custom-gradient  relative overflow-hidden">
      <BusinessHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 -mt-16 md:pt-24 pt-20">

        {/* Header */}
        <div className="mb-4">
          <div className="flex justify-start sm:justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/rezervimet')}
              className="text-black border-white hover:bg-white hover:text-gray-800"
            >
              SHIKO REZERVIMET
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Menaxho Biznesin</h1>
            <p className="text-gray-200">Menaxhoni të dhënat e biznesit tuaj</p>
          </div>
        </div>


        {/* Business Data Edit Form - Admin Panel Style */}
        <div className="w-full mt-6">
          <Card className="bg-white border-gray-200 shadow-lg">
            <CardHeader className="pb-4 px-3 sm:px-6">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent flex items-center">
                    {business?.name || 'Menaxhoni të dhënat e biznesit tuaj'}
                  </CardTitle>
                </div>
                <div className="flex space-x-2">
                  {!isEditing && (
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white h-8 w-8 p-0 font-medium shadow-md transition-all duration-300 group"
                      onClick={startEditing}
                      title="Modifiko"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                        Modifiko
                      </span>
                    </Button>
                  )}
            </div>
              </div>
                </CardHeader>
                <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
            {/* Left Column - Business Info, Description, Operating Hours */}
            <div className="space-y-4 ">
                    <div>
                <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-2">Informacionet e Biznesit</h4>
                <div className="space-y-3 bg-white rounded">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Emri i Biznesit</label>
                    <input
                      type="text"
                        value={isEditing ? (editData.name || '') : (business?.name || '')}
                        onChange={(e) => handleEditDataChange({ name: e.target.value })}
                        disabled={!isEditing}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Pronari/Manaxheri</label>
                    <input
                      type="text"
                        value={isEditing ? (editData.owner_name || '') : (business?.owner_name || '')}
                        onChange={(e) => handleEditDataChange({ owner_name: e.target.value })}
                        disabled={!isEditing}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={business?.account_email || ''}
                        disabled={true}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Telefoni</label>
                      <input
                        type="text"
                        value={isEditing ? (editData.phone || '') : (business?.phone || '')}
                        onChange={(e) => handleEditDataChange({ phone: e.target.value })}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    </div>
                    <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Adresa</label>
                    <input
                      type="text"
                        value={isEditing ? (editData.address || '') : (business?.address || '')}
                        onChange={(e) => handleEditDataChange({ address: e.target.value })}
                        disabled={!isEditing}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Qyteti</label>
                      <select
                        value={isEditing ? (editData.city || '') : (business?.city || '')}
                        onChange={(e) => handleEditDataChange({ city: e.target.value })}
                        disabled={!isEditing}
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
                      <label className="block text-xs font-medium text-gray-600 mb-1">Kategoria</label>
                      <select
                        value={isEditing ? String(editData.category_id || '') : String(business?.category_id || '')}
                        onChange={(e) => handleEditDataChange({ category_id: parseInt(e.target.value) })}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={String(category.id)}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                              </div>
                        </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
                          <input 
                      type="url"
                      value={isEditing ? (editData.website || '') : (business?.website || '')}
                      onChange={(e) => setEditData((prev: any) => ({ ...prev, website: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                              </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Facebook</label>
                      <input
                        type="url"
                        value={isEditing ? (editData.facebook || '') : (business?.facebook || '')}
                        onChange={(e) => setEditData((prev: any) => ({ ...prev, facebook: e.target.value }))}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Instagram</label>
                      <input
                        type="url"
                        value={isEditing ? (editData.instagram || '') : (business?.instagram || '')}
                        onChange={(e) => setEditData((prev: any) => ({ ...prev, instagram: e.target.value }))}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    </div>
                    {/* Location Information */}
                    {isEditing && (
                      // Edit Mode - Show label and clickable request button on same row
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-gray-600">
                            Lokacioni: {business?.latitude ? `${business.latitude.toFixed(6)}` : 'N/A'}, {business?.longitude ? `${business.longitude.toFixed(6)}` : 'N/A'}
                          </label>
                          <button
                            onClick={() => setShowLocationRequestModal(true)}
                            className="text-sm bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent font-medium hover:from-gray-700 hover:to-teal-700 cursor-pointer transition-all duration-300"
                          >
                            Kërkesë për ndryshim
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                          </div>
                          
              <div>
                <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-2">Përshkrimi i Biznesit</h4>
                <div className="bg-whiterounded ">
                  <textarea
                    value={isEditing ? (editData.description || '') : (business?.description || '')}
                    onChange={(e) => handleEditDataChange({ description: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm h-20 resize-none"
                    placeholder="Përshkrimi i biznesit..."
                  />
                </div>
                        </div>
                        
              <div>
                <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-2">Orari i Punës</h4>
                <div className="bg-white rounded ">

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
                        const hours = isEditing ? (editData.operating_hours?.[day] || { open: '', close: '', closed: true }) : (business?.operating_hours?.[day] || { open: '', close: '', closed: true })
                        return (
                          <div key={day} className="flex items-center justify-between text-sm">
                            <span className="font-medium w-20">{dayNames[day]}:</span>
                            <div className="flex items-center space-x-2">
                              <label className="flex items-center">
                            <input
                              type="checkbox"
                                  checked={!hours.closed}
                              onChange={(e) => {
                                if (isEditing) {
                                      const newHours = { ...editData.operating_hours }
                                      if (!newHours[day]) newHours[day] = { open: '', close: '', closed: true }
                                      newHours[day] = { ...newHours[day], closed: !e.target.checked }
                                      const updatedStaff = syncBusinessHoursToStaff(newHours)
                                      handleEditDataChange({ operating_hours: newHours, staff: updatedStaff })
                                }
                              }}
                              disabled={!isEditing}
                                  className="mr-1 w-4 h-4 text-teal-800 bg-white rounded focus:ring-teal-800 focus:ring-2 accent-teal-800 border-0"
                                />
                                <span className="text-xs">Hapur</span>
                              </label>
                              {!hours.closed && (
                                <>
                                  <select
                                    value={hours.open || ''}
                                    onChange={(e) => {
                                      if (isEditing) {
                                        const newHours = { ...editData.operating_hours }
                                        if (!newHours[day]) newHours[day] = { open: '', close: '', closed: false }
                                        newHours[day] = { ...newHours[day], open: e.target.value }
                                        const updatedStaff = syncBusinessHoursToStaff(newHours)
                                        handleEditDataChange({ operating_hours: newHours, staff: updatedStaff })
                                      }
                                    }}
                                    disabled={!isEditing}
                                    className="px-2 py-1 border border-gray-300 rounded text-xs w-19 md:w-20"
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
                                      if (isEditing) {
                                        const newHours = { ...editData.operating_hours }
                                        if (!newHours[day]) newHours[day] = { open: '', close: '', closed: false }
                                        newHours[day] = { ...newHours[day], close: e.target.value }
                                        const updatedStaff = syncBusinessHoursToStaff(newHours)
                                        handleEditDataChange({ operating_hours: newHours, staff: updatedStaff })
                                      }
                                    }}
                                    disabled={!isEditing}
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
{/* Image Section */}
                      <div>
                <div 
                  className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setShowImageSection(!showImageSection)}
                >
                  <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">Imazhi i Biznesit & Logo</h4>
                  <div className={`transform transition-transform duration-200 ${showImageSection ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {showImageSection && (
                  <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Business Images - 50% */}
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/20">
                    <label className="block text-xs font-medium text-gray-600 mb-2">Imazhi i Biznesit</label>
                    <div className="space-y-2">
                      {((isEditing ? editData.business_images : business?.business_images) ? [isEditing ? editData.business_images : business?.business_images] : []).map((image: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <img 
                            src={image} 
                            alt={`Business image ${index + 1}`}
                            className="w-16 h-16 object-cover border border-gray-200 rounded cursor-pointer hover:opacity-80"
                            onClick={() => setSelectedImage(image)}
                          />
                          <div className="flex-1 flex items-center space-x-2 min-w-0">
                            <input
                              type="url"
                              value={image}
                                    onChange={(e) => {
                                if (isEditing) {
                                  setEditData({...editData, business_images: e.target.value})
                                }
                              }}
                              disabled={!isEditing}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs min-w-0"
                              placeholder="https://..."
                            />
                            {isEditing && (
                              <button
                                onClick={() => {
                                  setEditData({...editData, business_images: ''})
                                }}
                                className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white p-1 rounded transition-all duration-300 flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                                </div>
                              </div>
                      ))}
                      {isEditing && (
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setUploadingBusinessImage(true)
                                const formData = new FormData()
                                formData.append('file', file)
                                fetch('/api/upload-image', {
                                  method: 'POST',
                                  body: formData
                                })
                                .then(res => res.json())
                                .then(data => {
                                  if (data.success) {
                                    setEditData({...editData, business_images: data.url})
                                  } else {
                                    alert('Gabim gjatë ngarkimit të imazhit');
                                  }
                                })
                                .catch(() => {
                                  alert('Gabim gjatë ngarkimit të imazhit');
                                })
                                .finally(() => {
                                  setUploadingBusinessImage(false)
                                })
                              }
                            }}
                            className="hidden"
                            id="business-image-upload"
                          />
                          <label
                            htmlFor="business-image-upload"
                            className="w-full py-2 rounded bg-custom-gradient text-white text-sm cursor-pointer flex items-center justify-center transition-all duration-300"
                          >
                                {uploadingBusinessImage ? 'Duke ngarkuar...' : '+ Ngarko Imazh'}
                          </label>
                            </div>
                          )}
                        </div>
                    </div>

                  {/* Logo - 50% */}
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/20">
                    <label className="block text-xs font-medium text-gray-600 mb-2">Logo</label>
                    <div className="space-y-2">
                      {(isEditing ? editData.logo : business?.logo) && (
                        <div className="flex items-center space-x-2">
                          <img 
                            src={isEditing ? editData.logo : business?.logo} 
                            alt="Logo preview"
                            className="w-16 h-16 object-contain border border-gray-200 rounded-lg cursor-pointer hover:opacity-80"
                            onClick={() => setSelectedImage(isEditing ? editData.logo : business?.logo || null)}
                          />
                          <div className="flex-1 flex items-center space-x-2 min-w-0">
                            <input
                              type="url"
                              value={isEditing ? (editData.logo || '') : (business?.logo || '')}
                              onChange={(e) => setEditData({...editData, logo: e.target.value})}
                              disabled={!isEditing}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs min-w-0"
                              placeholder="https://..."
                            />
                            {isEditing && (
                              <button
                                onClick={() => setEditData({...editData, logo: ''})}
                                className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white p-1 rounded transition-all duration-300 flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                                </div>
                      )}
                      {isEditing && (
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                                    onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                    setUploadingLogo(true)
                                    const formData = new FormData()
                                    formData.append('file', file)
                                    fetch('/api/upload-image', {
                                      method: 'POST',
                                      body: formData
                                    })
                                    .then(res => res.json())
                                    .then(data => {
                                      if (data.success) {
                                        setEditData({...editData, logo: data.url})
                                      } else {
                                        alert('Gabim gjatë ngarkimit të logos');
                                      }
                                    })
                                    .catch(() => {
                                      alert('Gabim gjatë ngarkimit të logos');
                                    })
                                    .finally(() => {
                                      setUploadingLogo(false)
                                    })
                              }
                            }}
                            className="hidden"
                            id="logo-upload"
                          />
                          <label
                            htmlFor="logo-upload"
                            className="w-full py-2 rounded bg-custom-gradient text-white text-sm cursor-pointer flex items-center justify-center transition-all duration-300"
                          >
                                {uploadingLogo ? 'Duke ngarkuar...' : '+ Ngarko Logo'}
                          </label>
                            </div>
                      )}
                      {!isEditing && !business?.logo && (
                        <input
                          type="url"
                          value=""
                          disabled={true}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          placeholder="Ose shkruani URL-në direkt..."
                        />
                      )}
                    </div>
                  </div>
                      </div>
                    </div>
                )}
              </div>            </div>

            {/* Right Column - Images, Services, Staff */}
                        <div className="space-y-4">
                                

                            <div>
                <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-2">Shërbimet që ofron biznesi</h4>
                <div className="bg-white rounded ">
                  <div className="space-y-3">
                    {(isEditing ? (editData.services || []) : (business?.services || [])).map((service: any, index: number) => (
                      <div key={service.id || index} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                        {isEditing ? (
                          <>
                            {/* Name, Price, and Duration in one line */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                          <div>
                          <input
                            type="text"
                                value={service.name || ''}
                                onChange={(e) => {
                                  if (isEditing) {
                                    const oldName = service.name
                                    const newName = e.target.value
                                    
                                    // Update the service name
                                    const newServices = (editData.services || []).map((s: any) => 
                                      s.id === service.id ? { ...s, name: newName } : s
                                    )
                                    
                                    // Update staff services to use the new name
                                    const newStaff = (editData.staff || []).map((staffMember: any) => {
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
                                    
                                    setEditData({
                                      ...editData, 
                                      services: newServices,
                                      staff: newStaff
                                    })
                                  
                                  // Clear validation error when user starts typing
                                  if (validationErrors[`service_${index}_name`]) {
                                    const newErrors = {...validationErrors}
                                    delete newErrors[`service_${index}_name`]
                                    setValidationErrors(newErrors)
                                  }
                                  }
                                }}
                                disabled={!isEditing}
                            placeholder="Emri i shërbimit"
                              className={`px-2 py-1 border rounded text-xs w-full ${validationErrors[`service_${index}_name`] ? 'border-red-500' : 'border-gray-300'}`}
                          />
                            {validationErrors[`service_${index}_name`] && (
                              <p className="text-red-500 text-xs mt-1">{validationErrors[`service_${index}_name`]}</p>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              value={service.price || ''}
                              onChange={(e) => {
                                if (isEditing) {
                                  const newServices = (editData.services || []).map((s: any) => 
                                    s.id === service.id ? { ...s, price: e.target.value } : s
                                  )
                                  setEditData({...editData, services: newServices})
                                }
                              }}
                              disabled={!isEditing}
                              placeholder="Çmimi"
                              className="px-2 py-1 pr-6 border border-gray-300 rounded text-xs w-full"
                            />
                            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">€</span>
                          </div>
                          <div>
                          <select
                                value={service.duration || '30 min'}
                            onChange={(e) => {
                                  if (isEditing) {
                                const newServices = (editData.services || []).map((s: any) => 
                                  s.id === service.id ? { ...s, duration: e.target.value } : s
                                )
                                setEditData({...editData, services: newServices})
                                  
                                  // Clear validation error when user selects duration
                                  if (validationErrors[`service_${index}_duration`]) {
                                    const newErrors = {...validationErrors}
                                    delete newErrors[`service_${index}_duration`]
                                    setValidationErrors(newErrors)
                                  }
                                  }
                                }}
                                disabled={!isEditing}
                              className={`px-2 py-1 border rounded text-xs w-full ${validationErrors[`service_${index}_duration`] ? 'border-red-500' : 'border-gray-300'}`}
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
                            {validationErrors[`service_${index}_duration`] && (
                              <p className="text-red-500 text-xs mt-1">{validationErrors[`service_${index}_duration`]}</p>
                            )}
                          </div>
                            </div>
                        <textarea
                          value={service.description || ''}
                          onChange={(e) => {
                            if (isEditing) {
                              const newServices = (editData.services || []).map((s: any) => 
                                s.id === service.id ? { ...s, description: e.target.value } : s
                              )
                              setEditData({...editData, services: newServices})
                            }
                          }}
                          disabled={!isEditing}
                          placeholder="Përshkrimi i shërbimit"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs h-12 resize-none mb-2"
                        />
                        {/* Delete button */}
                          {isEditing && (
                          <div className="flex justify-end mt-2">
                            <button
                                onClick={() => {
                                setServiceToDelete({ service, index })
                                setShowServiceDeleteDialog(true)
                                }}
                              className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white p-1 rounded transition-all duration-300"
                              >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          )}
                          </>
                        ) : (
                          /* View mode - Admin panel style */
                          <div>
                            <div className="font-medium text-gray-900 text-sm mb-1">{service.name}</div>
                            <div className="text-gray-600 text-xs mb-1">{service.description || 'Nuk keni përshkrim për këtë shërbim'}</div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Kohëzgjatja: {service.duration || 'N/A'}</span>
                              {service.price && service.price > 0 && <span>Çmimi: {service.price}</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                      {isEditing && (
                      <button
                            onClick={() => {
                          const newServiceId = Date.now() + Math.random()
                          const newServices = [...(editData.services || []), { 
                            id: newServiceId,
                            name: '', 
                            description: '', 
                            price: '', 
                            duration: '30 min' 
                          }]
                          setEditData({...editData, services: newServices})
                        }}
                        className="w-full py-2 rounded bg-custom-gradient text-white text-sm transition-all duration-300"
                      >
                        + Shto Shërbim
                      </button>
                    )}
                        </div>
                      </div>
                    </div>

                            <div>
                <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-2">Stafi i biznesit</h4>
                <div className="bg-white rounded ">
                  <div className="space-y-3">
                    {(isEditing ? (editData.staff || []) : (business?.staff || [])).map((member: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                        {isEditing ? (
                          <>
                            {/* Name and Phone in one line */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                          <div>
                          <input
                            type="text"
                            value={member.name || ''}
                                onChange={(e) => {
                                  if (isEditing) {
                                    const newStaff = [...(editData.staff || [])]
                                newStaff[index] = { ...member, name: e.target.value }
                                setEditData({...editData, staff: newStaff})
                                  
                                  // Clear validation error when user starts typing
                                  if (validationErrors[`staff_${index}_name`]) {
                                    const newErrors = {...validationErrors}
                                    delete newErrors[`staff_${index}_name`]
                                    setValidationErrors(newErrors)
                                  }
                                  }
                                }}
                                disabled={!isEditing}
                            placeholder="Emri i stafit"
                              className={`px-2 py-1 border rounded text-xs w-full ${validationErrors[`staff_${index}_name`] ? 'border-red-500' : 'border-gray-300'}`}
                          />
                            {validationErrors[`staff_${index}_name`] && (
                              <p className="text-red-500 text-xs mt-1">{validationErrors[`staff_${index}_name`]}</p>
                            )}
                          </div>
                          <div>
                          <input
                              type="text"
                              value={member.phone || ''}
                            onChange={(e) => {
                              if (isEditing) {
                                const newStaff = [...(editData.staff || [])]
                                  newStaff[index] = { ...member, phone: e.target.value }
                                setEditData({...editData, staff: newStaff})
                                  
                                  // Clear validation error when user starts typing
                                  if (validationErrors[`staff_${index}_phone`]) {
                                    const newErrors = {...validationErrors}
                                    delete newErrors[`staff_${index}_phone`]
                                    setValidationErrors(newErrors)
                                  }
                              }
                            }}
                            disabled={!isEditing}
                              placeholder="Telefoni"
                              className={`px-2 py-1 border rounded text-xs w-full ${validationErrors[`staff_${index}_phone`] ? 'border-red-500' : 'border-gray-300'}`}
                              />
                            {validationErrors[`staff_${index}_phone`] && (
                              <p className="text-red-500 text-xs mt-1">{validationErrors[`staff_${index}_phone`]}</p>
                            )}
                            </div>
                        </div>
                        
                        {/* Email and Active Status in one line */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                          <div>
                          <input
                              type="email"
                              value={member.email || ''}
                                onChange={(e) => {
                                  if (isEditing) {
                                    const newStaff = [...(editData.staff || [])]
                                  newStaff[index] = { ...member, email: e.target.value }
                                setEditData({...editData, staff: newStaff})
                                  
                                  // Clear validation error when user starts typing
                                  if (validationErrors[`staff_${index}_email`]) {
                                    const newErrors = {...validationErrors}
                                    delete newErrors[`staff_${index}_email`]
                                    setValidationErrors(newErrors)
                                  }
                                  }
                                }}
                                disabled={!isEditing}
                              placeholder="Email"
                              className={`px-2 py-1 border rounded text-xs w-full ${validationErrors[`staff_${index}_email`] ? 'border-red-500' : 'border-gray-300'}`}
                          />
                            {validationErrors[`staff_${index}_email`] && (
                              <p className="text-red-500 text-xs mt-1">{validationErrors[`staff_${index}_email`]}</p>
                            )}
                          </div>
                          <div className="flex items-center">
                            <label className="flex items-center text-xs">
                              <input
                                type="checkbox"
                                checked={member.isActive || false}
                                onChange={(e) => {
                                  if (isEditing) {
                                    const newStaff = [...(editData.staff || [])]
                                    newStaff[index] = { ...member, isActive: e.target.checked }
                                    setEditData({...editData, staff: newStaff})
                                  }
                                }}
                                disabled={!isEditing}
                                className="mr-1 w-4 h-4 text-teal-800 bg-white rounded focus:ring-teal-800 focus:ring-2 accent-teal-800 border-0"
                              />
                              Është aktiv?
                            </label>
                            </div>
                          </div>

                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-600">Shërbimet që ofron ky anëtar i stafit:</div>
                          <div className="flex flex-wrap gap-2">
                            {(isEditing ? (editData.services || []) : (business?.services || [])).map((service: any, serviceIndex: number) => (
                              <label key={serviceIndex} className="flex items-center text-xs">
                                <input
                                  type="checkbox"
                                  checked={member.services?.includes(service.name) || false}
                                  onChange={(e) => {
                                    if (isEditing) {
                                      const newStaff = [...(editData.staff || [])]
                                      if (!newStaff[index].services) newStaff[index].services = []
                                      
                                      if (e.target.checked) {
                                        if (!newStaff[index].services.includes(service.name)) {
                                          newStaff[index].services.push(service.name)
                                        }
                                      } else {
                                        newStaff[index].services = newStaff[index].services.filter((s: string) => s !== service.name)
                                      }
                                      
                                      setEditData({...editData, staff: newStaff})
                                    }
                                  }}
                                  disabled={!isEditing}
                                  className="mr-1 w-4 h-4 text-teal-800 bg-white rounded focus:ring-teal-800 focus:ring-2 accent-teal-800 border-0"
                                />
                                <span className="text-gray-600">{service.name}</span>
                              </label>
                            ))}
                          </div>
                          {(!isEditing ? (business?.services || []) : (editData.services || [])).length === 0 && (
                            <div className="text-xs text-gray-400">Shtoni shërbime për të caktuar stafin</div>
                              )}
                            </div>
                            {validationErrors[`staff_${index}_services`] && (
                              <div className="text-xs text-red-500 mt-1">
                                {validationErrors[`staff_${index}_services`]}
                              </div>
                            )}
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500 pt-1">
                            Lista e shërbimeve: {member.services?.map((service: any) => typeof service === 'string' ? service : service.name).filter((name: any) => name && name.trim() !== '').join(', ') || 'Asnjë'}
                          </div>
                          {isEditing && (
                            <button
                                onClick={() => {
                                setStaffToDelete({ member, index })
                                setShowStaffDeleteDialog(true)
                                }}
                              className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white p-1 rounded transition-all duration-300"
                              >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        </>
                      ) : (
                        /* View mode - Admin panel style */
                        <div>
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
                      )}
                      </div>
                    ))}
                      {isEditing && (
                      <button
                            onClick={() => {
                          const newStaffMember = { 
                            name: '', 
                            email: '', 
                            phone: '', 
                            isActive: true, 
                            services: [],
                            breakTimes: [{ startTime: '', endTime: '' }], // Initialized for new staff
                            operatingHours: copyBusinessHoursToStaff(editData.operating_hours)
                          }
                          const newStaff = [...(editData.staff || []), newStaffMember]
                          setEditData({...editData, staff: newStaff})
                            }}
                        className="w-full py-2 rounded bg-custom-gradient text-white  text-sm transition-all duration-300"
                          >
                        + Shto Staf
                      </button>
                      )}
                    </div>
                      </div>
                    </div>

                      {/* Staff Operating Hours Section */}
                      {isEditing && (
                        <div className="mb-4">
                          <div 
                            className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            onClick={() => setShowStaffHoursSection(!showStaffHoursSection)}
                          >
                            <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">Orari i Punës së Stafit</h4>
                            <div className={`transform transition-transform duration-200 ${showStaffHoursSection ? 'rotate-180' : ''}`}>
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          
                          {showStaffHoursSection && (
                            <div className="mt-4 space-y-3">
                              {(editData.staff || []).map((member: any, index: number) => {
                                // Get working days for this staff member
                                const workingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].filter(day => {
                                  const staffHours = member.operatingHours?.[day] || { open: '', close: '', closed: true }
                                  const businessHours = editData.operating_hours?.[day] || { open: '', close: '', closed: true }
                                  return !staffHours.closed && !businessHours.closed
                                })
                                
                                return (
                                  <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    <div 
                                      className="flex items-center justify-between mb-2 cursor-pointer"
                                      onClick={() => setExpandedStaffHours(expandedStaffHours === index ? null : index)}
                                    >
                                      <h5 className="font-medium text-sm text-gray-700">
                                        {member.name || `Stafi ${index + 1}`}
                                      </h5>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">
                                          {workingDays.length} ditë pune
                                        </span>
                                        <div className={`transform transition-transform duration-200 ${expandedStaffHours === index ? 'rotate-180' : ''}`}>
                                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {expandedStaffHours === index && (
                                      <div className="space-y-2">
                                        {(() => {
                                          // Generate time options from 00:00 to 23:45 (every 15 minutes)
                                          const timeOptions: string[] = []
                                          for (let hour = 0; hour < 24; hour++) {
                                            for (let minute = 0; minute < 60; minute += 15) {
                                              const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                                              timeOptions.push(timeString)
                                            }
                                          }
                                          
                                          const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                                          const dayNames: { [key: string]: string } = {
                                            monday: 'E Hënë',
                                            tuesday: 'E Martë', 
                                            wednesday: 'E Mërkurë',
                                            thursday: 'E Enjte',
                                            friday: 'E Premte',
                                            saturday: 'E Shtunë',
                                            sunday: 'E Diel'
                                          }
                                          
                                          return dayOrder.filter(day => {
                                            const businessHours = editData.operating_hours?.[day] || { open: '', close: '', closed: true }
                                            return !businessHours.closed // Only show days when business is open
                                          }).map(day => {
                                            const staffHours = member.operatingHours?.[day] || { open: '', close: '', closed: true }
                                            const businessHours = editData.operating_hours?.[day] || { open: '', close: '', closed: true }
                                            
                                            // Filter time options based on business hours
                                            const filteredTimeOptions = timeOptions.filter(time => {
                                              return time >= businessHours.open && time <= businessHours.close
                                            })
                                            
                                            return (
                                              <div key={day} className="flex items-center justify-between text-sm">
                                                <span className="font-medium w-20 text-sm md:text-base">{dayNames[day]}:</span>
                                                <div className="flex items-center space-x-2">
                                                  <label className="flex items-center">
                                                    <input
                                                      type="checkbox"
                                                      checked={!staffHours.closed}
                                                      onChange={(e) => {
                                                        const newStaff = [...(editData.staff || [])]
                                                        if (!newStaff[index].operatingHours) {
                                                          newStaff[index].operatingHours = {}
                                                        }
                                                        newStaff[index].operatingHours[day] = {
                                                          ...staffHours,
                                                          closed: !e.target.checked,
                                                          open: !e.target.checked ? '' : staffHours.open || businessHours.open,
                                                          close: !e.target.checked ? '' : staffHours.close || businessHours.close
                                                        }
                                                        setEditData({...editData, staff: newStaff})
                                                      }}
                                                      className="mr-1 w-4 h-4 text-teal-800 bg-white rounded focus:ring-teal-800 focus:ring-2 accent-teal-800 border-0"
                                                    />
                                                    <span className="text-xs hidden md:inline">Dite pune</span>
                                                  </label>
                                                  {!staffHours.closed && (
                                                    <>
                                                      <select
                                                        value={staffHours.open || ''}
                                                        onChange={(e) => {
                                                          const newStaff = [...(editData.staff || [])]
                                                          if (!newStaff[index].operatingHours) {
                                                            newStaff[index].operatingHours = {}
                                                          }
                                                          newStaff[index].operatingHours[day] = {
                                                            ...staffHours,
                                                            open: e.target.value
                                                          }
                                                          setEditData({...editData, staff: newStaff})
                                                        }}
                                                        className="px-2 py-1 border border-gray-300 rounded text-xs w-16 md:w-20"
                                                      >
                                                        <option value="">Fillimi</option>
                                                        {filteredTimeOptions.map(time => (
                                                          <option key={time} value={time}>{time}</option>
                                                        ))}
                                                      </select>
                                                      <span className="text-xs">-</span>
                                                      <select
                                                        value={staffHours.close || ''}
                                                        onChange={(e) => {
                                                          const newStaff = [...(editData.staff || [])]
                                                          if (!newStaff[index].operatingHours) {
                                                            newStaff[index].operatingHours = {}
                                                          }
                                                          newStaff[index].operatingHours[day] = {
                                                            ...staffHours,
                                                            close: e.target.value
                                                          }
                                                          setEditData({...editData, staff: newStaff})
                                                        }}
                                                        className="px-2 py-1 border border-gray-300 rounded text-xs w-16 md:w-20"
                                                      >
                                                        <option value="">Mbarimi</option>
                                                        {filteredTimeOptions.map(time => (
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
                                    )}
                                  
                                    {/* Break Times Section */}
                                    {expandedStaffHours === index && (
                                      <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="text-xs font-medium text-gray-600 mb-2">Ora e Pauzës:</div>
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
                                          const newStaff = [...(editData.staff || [])]
                                          if (!newStaff[index].breakTimes) newStaff[index].breakTimes = []
                                          newStaff[index].breakTimes[breakIndex] = { 
                                            ...breakTime, 
                                            startTime: e.target.value 
                                          }
                                          setEditData({...editData, staff: newStaff})
                                      }}
                                      className="px-2 py-1 border border-gray-300 rounded text-xs w-20"
                                    >
                                                    <option value="">Fillimi</option>
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
                                          const newStaff = [...(editData.staff || [])]
                                          if (!newStaff[index].breakTimes) newStaff[index].breakTimes = []
                                          newStaff[index].breakTimes[breakIndex] = { 
                                            ...breakTime, 
                                            endTime: e.target.value 
                                          }
                                          setEditData({...editData, staff: newStaff})
                                      }}
                                      className="px-2 py-1 border border-gray-300 rounded text-xs w-20"
                                    >
                                                    <option value="">Mbarimi</option>
                                      {timeOptions.map(time => (
                                        <option key={time} value={time}>{time}</option>
                                      ))}
                                    </select>
                                  </div>
                                                <div className="flex space-x-1">
                                    <button
                                      onClick={() => {
                                        const newStaff = [...(editData.staff || [])]
                                                      newStaff[index].breakTimes.splice(breakIndex, 1)
                                        setEditData({...editData, staff: newStaff})
                                      }}
                                                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white p-1 rounded text-xs"
                                      title="Fshi pushimin"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                              <button
                                onClick={() => {
                                  const newStaff = [...(editData.staff || [])]
                                  if (!newStaff[index].breakTimes) newStaff[index].breakTimes = []
                                  newStaff[index].breakTimes.push({ startTime: '', endTime: '' })
                                  setEditData({...editData, staff: newStaff})
                                }}
                                                    className="bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white p-1 rounded text-xs"
                                title="Shto Pushim"
                              >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </button>
                          </div>
                        </div>
                                            )
                                          })}
                          </div>
                            </div>
                          )}
                        </div>
                                )
                              })}
                        </div>
                      )}
                    </div>
                      )}

                      {/* Password Section - Only show in edit mode with toggle */}
                      {isEditing && (
                        <div>
                          <div 
                            className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              onClick={() => setShowPasswordFields(!showPasswordFields)}
                          >
                            <h4 className="font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">Menaxhimi i Fjalëkalimit</h4>
                            <div className={`transform transition-transform duration-200 ${showPasswordFields ? 'rotate-180' : ''}`}>
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          
                          {showPasswordFields && (
                            <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg">
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Fjalëkalimi Aktual</label>
                                  <input
                                    type="password"
                                    value={passwordData.current_password}
                                    onChange={(e) => handlePasswordChange({ current_password: e.target.value })}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="Shkruani fjalëkalimin aktual"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Fjalëkalimi i Ri</label>
                                  <input
                                    type="password"
                                    value={passwordData.new_password}
                                    onChange={(e) => handlePasswordChange({ new_password: e.target.value })}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="Shkruani fjalëkalimin e ri"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Konfirmo Fjalëkalimin</label>
                                  <input
                                    type="password"
                                    value={passwordData.confirm_password}
                                    onChange={(e) => handlePasswordChange({ confirm_password: e.target.value })}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="Konfirmoni fjalëkalimin e ri"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
        </div>
                  </div>
                </CardContent>
                {isEditing && (
                  <div className="px-6 pb-6">
                    <div className="flex justify-end space-x-2">
            <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white h-8 w-8 p-0 font-medium shadow-md transition-all duration-300 group"
                onClick={saveChanges}
                        title="Ruaj"
                      >
                        <Save className="w-4 h-4" />
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                          Ruaj
                        </span>
              </Button>
              <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white h-8 w-8 p-0 font-medium shadow-md transition-all duration-300 group"
                onClick={cancelEditing}
                        title="Anulo"
              >
                        <X className="w-4 h-4" />
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                Anulo
                        </span>
              </Button>
                    </div>
            </div>
          )}
              </Card>
        </div>
      </div>

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

      {/* Location Request Modal */}
      {showLocationRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">
                Kërkesë për Ndryshim të Lokacionit
              </h3>
              <button
                onClick={() => setShowLocationRequestModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Maps Link
                </label>
                <input
                  type="url"
                  value={locationRequestData.google_maps_link}
                  onChange={(e) => setLocationRequestData(prev => ({ ...prev, google_maps_link: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="https://maps.google.com/maps?q=41.3275,19.8187"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arsyeja e Ndryshimit
                </label>
                <textarea
                  value={locationRequestData.reason}
                  onChange={(e) => setLocationRequestData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent h-24 resize-none"
                  placeholder="Shkruani arsyen për ndryshimin e lokacionit..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowLocationRequestModal(false)}
                className="px-4 py-2"
              >
                Anulo
              </Button>
              <Button
                onClick={submitLocationRequest}
                disabled={!locationRequestData.google_maps_link.trim() || !locationRequestData.reason.trim()}
                className="px-4 py-2 bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white"
              >
                Dërgo Kërkesën
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Service Delete Confirmation Dialog */}
      {showServiceDeleteDialog && serviceToDelete && (
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
                A jeni të sigurt që doni të fshini shërbimin "{serviceToDelete.service.name || 'Shërbimi pa emër'}"? Ky veprim nuk mund të anulohet.
              </p>
              <div className="flex space-x-3 justify-center">
                <Button
                  onClick={() => {
                    setShowServiceDeleteDialog(false)
                    setServiceToDelete(null)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white"
                >
                  Anulo
                </Button>
                <Button
                  onClick={() => {
                    const serviceName = serviceToDelete.service.name
                    
                    // Remove the service
                    const newServices = (editData.services || []).filter((s: any) => s.id !== serviceToDelete.service.id)
                    
                    // Remove the service from all staff members
                    const newStaff = (editData.staff || []).map((staffMember: any) => {
                      if (staffMember.services && staffMember.services.includes(serviceName)) {
                        return {
                          ...staffMember,
                          services: staffMember.services.filter((serviceName: string) => serviceName !== serviceToDelete.service.name)
                        }
                      }
                      return staffMember
                    })
                    
                    setEditData({
                      ...editData, 
                      services: newServices,
                      staff: newStaff
                    })
                    
                    setShowServiceDeleteDialog(false)
                    setServiceToDelete(null)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
                >
                  Fshi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Delete Confirmation Dialog */}
      {showStaffDeleteDialog && staffToDelete && (
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
                A jeni të sigurt që doni të fshini stafin "{staffToDelete.member.name || 'Stafi pa emër'}"? Ky veprim nuk mund të anulohet.
              </p>
              <div className="flex space-x-3 justify-center">
                <Button
                  onClick={() => {
                    setShowStaffDeleteDialog(false)
                    setStaffToDelete(null)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white"
                >
                  Anulo
                </Button>
                <Button
                  onClick={() => {
                    const newStaff = (editData.staff || []).filter((_: any, i: number) => i !== staffToDelete.index)
                    setEditData({...editData, staff: newStaff})
                    
                    setShowStaffDeleteDialog(false)
                    setStaffToDelete(null)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
                >
                  Fshi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}