"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Header } from "@/components/header"
import { MapPin, Upload, Check, ArrowLeft, Clock, Calendar, Building2, User, Mail, Phone, Globe, X, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { GoogleMapsPickerWrapper } from "@/components/google-maps-picker-wrapper"
import { ImageUpload } from "@/components/image-upload"
import { useBusinesses } from "@/hooks/use-businesses"
// Remove direct Prisma imports - use API routes instead
import { z } from "zod"

// Validation schemas
const businessSchema = z.object({
  businessName: z.string().min(2, "Emri i biznesit duhet të jetë i vlefshëm!"),
  category: z.string().min(1, "Ju lutemi zgjidhni një kategori!"),
  description: z.string().min(10, "Ju lutem shënoni një përshkrim korrekt!"),
  ownerName: z.string().min(2, "Emri i pronarit duhet të ketë të paktën 2 karaktere"),
  phone: z.string().min(8, "Numri i telefonit duhet të ketë të paktën 8 shifra"),
  address: z.string().min(5, "Adresa duhet të ketë të paktën 5 karaktere"),
  city: z.string().min(2, "Qyteti duhet të ketë të paktën 2 karaktere"),
  state: z.string().min(2, "Shteti duhet të ketë të paktën 2 karaktere"),
  accountEmail: z.string().email("Email-i i llogarisë nuk është i vlefshëm"),
  accountPassword: z.string().min(6, "Fjalëkalimi duhet të ketë të paktën 6 karaktere"),
})

const serviceSchema = z.object({
  name: z.string().min(2, "Emri i shërbimit duhet të ketë të paktën 2 karaktere"),
  duration: z.string().min(1, "Kohëzgjatja është e detyrueshme"),
})

const teamMemberSchema = z.object({
  name: z.string().min(2, "Emri duhet të ketë të paktën 2 karaktere"),
  email: z.string().email("Email-i nuk është i vlefshëm"),
  phone: z.string().min(8, "Numri i telefonit duhet të ketë të paktën 8 shifra"),
})

// Generate operating hours with 15-minute intervals
const operatingHours = (() => {
  const hours = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      hours.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
    }
  }
  hours.push("24:00") // Add midnight for next day
  return hours
})()

const serviceDurations = [
  "15 min",
  "30 min",
  "45 min",
  "1 orë",
  "1 orë 15 min",
  "1 orë 30 min",
  "1 orë 45 min",
  "2 orë",
  "2 orë 15 min",
  "2 orë 30 min",
  "2 orë 45 min",
  "3 orë",
  "3 orë 15 min",
  "3 orë 30 min",
  "3 orë 45 min",
  "4 orë",
  "5 orë",
  "6 orë",
  "8 orë",
  "1 ditë",
]

const daysOfWeek = [
  { key: "monday", label: "E Hënë" },
  { key: "tuesday", label: "E Martë" },
  { key: "wednesday", label: "E Mërkurë" },
  { key: "thursday", label: "E Enjte" },
  { key: "friday", label: "E Premte" },
  { key: "saturday", label: "E Shtunë" },
  { key: "sunday", label: "E Diel" },
]

// Helper function to validate time selection
const validateTimeSelection = (openTime: string, closeTime: string) => {
  if (!openTime || !closeTime) return true // Allow empty values
  const open = parseInt(openTime.replace(':', ''))
  const close = parseInt(closeTime.replace(':', ''))
  return close > open
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
  "F.Kosovë": { lat: 42.6629, lng: 21.1655 },
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

export default function RegisterBusinessPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { addBusiness } = useBusinesses()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Array<{id: number, name: string, slug: string, sort_order?: number, icon?: string}>>([])
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number } | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapLoading, setMapLoading] = useState(false)

  // Debug log for categories changes
  useEffect(() => {
    console.log('Categories state changed:', categories)
  }, [categories])

  // Handle step transitions and map readiness
  useEffect(() => {
    if (currentStep === 2) {
      // When moving to step 2, wait a bit for the component to stabilize
      const timer = setTimeout(() => {
        setMapReady(true)
      }, 900)
      
      return () => {
        clearTimeout(timer)
        setMapReady(false)
      }
    } else {
      setMapReady(false)
    }
  }, [currentStep])

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true)
        const response = await fetch('/api/categories')
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        const dbCategories = await response.json()
        console.log('Loaded categories from API:', dbCategories)
        console.log('Categories count:', dbCategories.length)
        setCategories(dbCategories)
      } catch (error) {
        console.error('Error loading categories:', error)
        toast({
          title: "Gabim",
          description: "Nuk mund të ngarkohen kategoritë. Ju lutemi rifreskoni faqen.",
          variant: "destructive"
        })
      } finally {
        setCategoriesLoading(false)
      }
    }
    loadCategories()
  }, [toast])

  // Handle city selection and update map center
  const handleCityChange = (cityName: string) => {
    updateFormData("city", cityName)
    
    // Update map center if city coordinates are available
    const coordinates = cityCoordinates[cityName]
    if (coordinates) {
      setMapCenter(coordinates)
    }
  }

  // Real-time validation function
  const validateField = (fieldName: string, value: any) => {
    const errors = { ...validationErrors }
    
    // Step 1 fields
    if (fieldName === 'businessName') {
      if (!value || value.length < 2) {
        errors.businessName = "Emri i biznesit duhet të jetë i vlefshëm!"
      } else {
        delete errors.businessName
      }
    }
    
    if (fieldName === 'category') {
      if (!value || value === '') {
        errors.category = "Ju lutemi zgjidhni një kategori!"
      } else {
        delete errors.category
      }
    }
    
    if (fieldName === 'description') {
      if (!value || value.length < 10) {
        errors.description = "Ju lutem shënoni një përshkrim korrekt!"
      } else {
        delete errors.description
      }
    }
    
    // Step 2 fields
    if (fieldName === 'ownerName') {
      if (!value || value.length < 2) {
        errors.ownerName = "Emri i pronarit duhet të plotësohet!"
      } else {
        delete errors.ownerName
      }
    }
    
    
    if (fieldName === 'phone') {
      if (!value || value.length < 8) {
        errors.phone = "Numri i telefonit duhet të jetë i vlefshëm"
      } else {
        delete errors.phone
      }
    }
    
    if (fieldName === 'address') {
      if (!value || value.length < 5) {
        errors.address = "Adresa duhet të ketë të paktën 5 karaktere"
      } else {
        delete errors.address
      }
    }
    
    if (fieldName === 'city') {
      if (!value || value.length < 2) {
        errors.city = "Qyteti duhet të ketë të paktën 2 karaktere"
      } else {
        delete errors.city
      }
    }
    
    if (fieldName === 'state') {
      if (!value || value.length < 2) {
        errors.state = "Rajoni duhet të ketë të paktën 2 karaktere"
      } else {
        delete errors.state
      }
    }
    
    
    
    if (fieldName === 'accountEmail') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!value || !emailRegex.test(value)) {
        errors.accountEmail = "Email-i i llogarisë nuk është i vlefshëm"
      } else {
        delete errors.accountEmail
      }
    }
    
    if (fieldName === 'accountPassword') {
      if (!value || value.length < 8) {
        errors.accountPassword = "Fjalëkalimi duhet të përmbajë të paktën 1 shkronjë të madhe dhe 1 numër dhe 8 karaktere minimum në total"
      } else if (!/^(?=.*[A-Z])(?=.*\d).+$/.test(value)) {
        errors.accountPassword = "Fjalëkalimi duhet të përmbajë të paktën 1 shkronjë të madhe dhe 1 numër dhe 8 karaktere minimum në total"
      } else {
        delete errors.accountPassword
      }
    }
    
    setValidationErrors(errors)
  }

  // Validation functions
  const validateStep = (step: number): boolean => {
    const errors: {[key: string]: string} = {}
    
    if (step === 1) {
      // Only validate step 1 fields
      const step1Schema = z.object({
        businessName: z.string().min(2, "Emri i biznesit duhet të jetë i vlefshëm!"),
        category: z.string().min(1, "Ju lutemi zgjidhni një kategori!"),
        description: z.string().min(10, "Ju lutem shënoni një përshkrim korrekt!"),
      })
      
      const result = step1Schema.safeParse({
        businessName: formData.businessName,
        category: formData.category,
        description: formData.description,
      })
      
      if (!result.success) {
        result.error.errors.forEach((error) => {
          errors[error.path[0] as string] = error.message
        })
      }
    }
    
    if (step === 2) {
      // Only validate step 2 fields
      const step2Schema = z.object({
  ownerName: z.string().min(1, "Kjo fushë është e detyrueshme!"),
  phone: z.string()
    .min(1, "Kjo fushë është e detyrueshme!")
    .regex(/^\+?[0-9]+$/, "Numri i telefonit duhet të jetë i vlefshëm!"),
  address: z.string().min(5, "Kjo fushë është e detyrueshme!"),
  city: z.string().min(2, "Kjo fushë është e detyrueshme!"),
  state: z.string().min(2, "Kjo fushë është e detyrueshme!"),
  accountEmail: z.string().email("Email-i i llogarisë nuk është i vlefshëm"),
  accountPassword: z.string()
    .min(8, "Fjalëkalimi duhet të përmbajë të paktën 1 shkronjë të madhe dhe 1 numër dhe 8 karaktere minimum në total")
    .regex(/^(?=.*[A-Z])(?=.*\d).+$/, "Fjalëkalimi duhet të përmbajë të paktën 1 shkronjë të madhe dhe 1 numër dhe 8 karaktere minimum në total"),
        latitude: z.number().min(-90).max(90, "Latitude duhet të jetë midis -90 dhe 90").optional(),
        longitude: z.number().min(-180).max(180, "Longitude duhet të jetë midis -180 dhe 180").optional(),
      })
      
      const result = step2Schema.safeParse({
        ownerName: formData.ownerName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        accountEmail: formData.accountEmail,
        accountPassword: formData.accountPassword,
        latitude: formData.latitude !== undefined ? formData.latitude : undefined,
        longitude: formData.longitude !== undefined ? formData.longitude : undefined,
      })
      
      if (!result.success) {
        result.error.errors.forEach((error) => {
          errors[error.path[0] as string] = error.message
        })
      }
      
      // Additional validation: Check if location is properly set
      if (formData.latitude === undefined || formData.longitude === undefined || 
          (formData.latitude === 42.062091 && formData.longitude === 20.652714)) {
        errors.location = "Ju lutemi vendosni vendndodhjen e saktë të biznesit në hartë"
      }
    }
    
    if (step === 3) {
      // Validate operating hours
      const hasOpenDay = Object.values(formData.operatingHours).some(day => !day.closed)
      if (!hasOpenDay) {
        errors.operatingHours = "Të paktën një ditë pune duhet të selektohet!"
      } else {
        // Validate individual days
        Object.entries(formData.operatingHours).forEach(([day, dayData]) => {
          if (!dayData.closed) { // If day is open
            if (!dayData.open) {
              errors[`${day}_open`] = `Ora e hapjes për ${daysOfWeek.find(d => d.key === day)?.label} është e detyrueshme`
            }
            if (!dayData.close) {
              errors[`${day}_close`] = `Ora e mbylljes për ${daysOfWeek.find(d => d.key === day)?.label} është e detyrueshme`
            }
            if (dayData.open && dayData.close) {
              const openMinutes = timeToMinutes(dayData.open)
              const closeMinutes = timeToMinutes(dayData.close)
              if (closeMinutes <= openMinutes) {
                errors[`${day}_close`] = `Ora e mbylljes duhet të jetë pas orës së hapjes`
              }
            }
          }
        })
      }
    }
    
    if (step === 4) {
      // Validate services - at least one service is required
      const validServices = formData.services.filter(service => 
        service.name && service.duration
      )
      
      if (validServices.length === 0) {
        errors.services = "Ju duhet të shtoni të paktën një shërbim"
      }
      
      // Validate each service
      formData.services.forEach((service, index) => {
        if (service.name || service.duration) {
          const result = serviceSchema.safeParse(service)
          if (!result.success) {
            result.error.errors.forEach((error) => {
              errors[`service_${index}_${error.path[0]}`] = error.message
            })
          }
        }
      })
      
      // Validate team members - at least one team member is required
      const validTeamMembers = formData.teamMembers.filter(member => 
        member.name && member.email && member.phone
      )
      
      if (validTeamMembers.length === 0) {
        errors.teamMembers = "Ju duhet të shtoni të paktën një anëtar!"
      }
      
      // Validate each team member
      formData.teamMembers.forEach((member, index) => {
        if (member.name || member.email || member.phone) {
          const result = teamMemberSchema.safeParse(member)
          if (!result.success) {
            result.error.errors.forEach((error) => {
              errors[`member_${index}_${error.path[0]}`] = error.message
            })
          }
        }
      })
      
      // Validate that team members have at least one service assigned
      validTeamMembers.forEach((member, memberIndex) => {
        if (!member.services || member.services.length === 0) {
          errors[`member_${memberIndex}_services`] = `Anëtari i ekipit "${member.name}" duhet të ketë të paktën një shërbim të caktuar`
        }
      })

      // Validate that each service has at least one team member assigned
      if (validServices.length > 0 && validTeamMembers.length > 0) {
        validServices.forEach((service, serviceIndex) => {
          const hasAssignedMember = validTeamMembers.some(member => 
            member.services && (member.services as number[]).includes(serviceIndex)
          )
          
          if (!hasAssignedMember) {
            errors[`service_${serviceIndex}_assignment`] = `Shërbimi "${service.name}" duhet të ketë të paktën një anëtar të ekipit të caktuar`
          }
        })
      }
      
      // Images are optional - no validation needed
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const [formData, setFormData] = useState({
    // Basic Information
    businessName: "",
    category: "",
    description: "",
    logo: null as File | string | null,
    businessImages: [] as string[],

    // Contact Information
    ownerName: "",
    phone: "",

    // Account Credentials
    accountEmail: "",
    accountPassword: "",

    // Location Information
    address: "",
    city: "",
    state: "Kosovë", // Always selected
    latitude: undefined,
    longitude: undefined,

    // Operating Hours
    operatingHours: {
      monday: { open: "", close: "", closed: false },
      tuesday: { open: "", close: "", closed: false },
      wednesday: { open: "", close: "", closed: false },
      thursday: { open: "", close: "", closed: false },
      friday: { open: "", close: "", closed: false },
      saturday: { open: "", close: "", closed: false },
      sunday: { open: "", close: "", closed: true },
    },

    // Services & Pricing
    services: [{ name: "", cost: "", duration: "", description: "" }],

    // Team Members
    teamMembers: [{ name: "", email: "", phone: "", services: [] }],

    // Business Images
    images: [],
  })

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Real-time validation
    validateField(field, value)
  }

  const updateOperatingHours = (day: string, field: string, value: any) => {
    setFormData((prev) => {
      const newOperatingHours = {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day as keyof typeof prev.operatingHours],
          [field]: value,
        },
      }
      
      // Clear validation errors for this day when updating
      const newErrors = { ...validationErrors }
      delete newErrors[`${day}_open`]
      delete newErrors[`${day}_close`]
      setValidationErrors(newErrors)
      
      return {
        ...prev,
        operatingHours: newOperatingHours,
      }
    })
  }

  // Helper function to convert time to minutes for comparison
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Validate operating hours
  const validateOperatingHours = () => {
    const errors: { [key: string]: string } = {}
    
    Object.entries(formData.operatingHours).forEach(([day, dayData]) => {
      if (!dayData.closed) { // If day is open
        if (!dayData.open) {
          errors[`${day}_open`] = `Ora e hapjes për ${daysOfWeek.find(d => d.key === day)?.label} është e detyrueshme`
        }
        if (!dayData.close) {
          errors[`${day}_close`] = `Ora e mbylljes për ${daysOfWeek.find(d => d.key === day)?.label} është e detyrueshme`
        }
        if (dayData.open && dayData.close) {
          const openMinutes = timeToMinutes(dayData.open)
          const closeMinutes = timeToMinutes(dayData.close)
          if (closeMinutes <= openMinutes) {
            errors[`${day}_close`] = `Ora e mbylljes duhet të jetë pas orës së hapjes`
          }
        }
      }
    })
    
    setValidationErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const addService = () => {
    setFormData((prev) => ({
      ...prev,
      services: [...prev.services, { name: "", cost: "", duration: "", description: "" }],
    }))
  }

  const updateService = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === index ? { ...service, [field]: value } : service
      ),
    }))
    
    // Clear validation errors for this field
    const newErrors = { ...validationErrors }
    delete newErrors[`service_${index}_${field}`]
    delete newErrors[`service_${index}_assignment`]
    setValidationErrors(newErrors)
  }

  const removeService = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }))
  }

  const addTeamMember = () => {
    setFormData((prev) => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { name: "", email: "", phone: "", services: [] }],
    }))
  }

  const updateTeamMember = (index: number, field: string, value: string | number[]) => {
    setFormData((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      ),
    }))
    
    // Clear validation errors for this field
    const newErrors = { ...validationErrors }
    delete newErrors[`member_${index}_${field}`]
    delete newErrors[`member_${index}_services`]
    if (field === 'services') {
      // Also clear service assignment errors when services are updated
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith('service_') && key.endsWith('_assignment')) {
          delete newErrors[key]
        }
      })
    }
    setValidationErrors(newErrors)
  }

  const removeTeamMember = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async () => {
    console.log('Starting form submission...')
    console.log('Form data:', formData)
    
    // Validate all steps before submitting
    const step1Valid = validateStep(1)
    const step2Valid = validateStep(2)
    const step3Valid = validateStep(3)
    const step4Valid = validateStep(4)
    
    console.log('Validation results:', {
      step1: step1Valid,
      step2: step2Valid,
      step3: step3Valid,
      step4: step4Valid,
      validationErrors
    })
    
    if (!step1Valid || !step2Valid || !step3Valid || !step4Valid) {
      toast({
        title: "Gabim në Validim",
        description: "Ju lutemi plotësoni të gjitha fushat e detyrueshme përpara se të regjistroni biznesin.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Find category ID from database categories
      const selectedCategory = categories.find(cat => cat.name === formData.category)
      if (!selectedCategory) {
        throw new Error("Kategoria e zgjedhur nuk u gjet")
      }

      // Create business object
      const newBusiness = {
        name: formData.businessName,
        description: formData.description,
        category_id: selectedCategory.id,
        owner_name: formData.ownerName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        latitude: formData.latitude,
        longitude: formData.longitude,
        accountEmail: formData.accountEmail,
        accountPassword: formData.accountPassword,
        logo: formData.logo,
        business_images: formData.businessImages,
        is_verified: false,
        is_active: true,
        rating: 0,
        total_reviews: 0,
      }

      // Save business via API
      console.log('Submitting business data:', {
        ...newBusiness,
        operating_hours: formData.operatingHours,
        services: formData.services,
        team_members: formData.teamMembers
      })

      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newBusiness,
          operating_hours: formData.operatingHours,
          services: formData.services,
          team_members: formData.teamMembers
        })
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(`Failed to create business: ${errorData.details || errorData.error || 'Unknown error'}`)
      }

      const savedBusiness = await response.json()

      // Add business to local store for immediate UI update
      addBusiness(savedBusiness)

      // Automatically log in the business after registration
      const authData = {
        businessId: savedBusiness.id,
        email: savedBusiness.account_email
      }
      localStorage.setItem('businessAuth', JSON.stringify(authData))
      
      // Trigger custom event to update header
      window.dispatchEvent(new Event('businessLogin'))

      toast({
        title: "Regjistrimi i Biznesit u Krye me Sukses!",
        description: `"${formData.businessName}" është shtuar në platformën tonë! Ju jeni kyçur automatikisht në panelin e biznesit.`,
      })

      // Redirect to business management (user will be automatically authenticated)
      router.push("/menaxho-biznesin")
    } catch (error) {
      console.error("Error creating business:", error)
      toast({
        title: "Gabim në Regjistrim",
        description: "Ndodhi një gabim gjatë regjistrimit të biznesit. Ju lutemi provoni përsëri.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    console.log('Next step clicked! Current step:', currentStep)
    console.log('Form data:', formData)
    console.log('Current validation errors:', validationErrors)
    
    if (currentStep < 4) {
      // Validate current step before proceeding
      const isValid = validateStep(currentStep)
      console.log('Step validation result:', isValid)
      
      if (isValid) {
        console.log('Moving to next step!')
        setCurrentStep(currentStep + 1)
        setValidationErrors({}) // Clear errors when moving to next step
      } else {
        console.log('Validation failed, showing toast')
        toast({
          title: "Gabim në Validim",
          description: "Ju lutemi plotësoni të gjitha fushat e detyrueshme përpara se të vazhdoni.",
          variant: "destructive"
        })
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const steps = [
    { number: 1, title: "Informacioni Bazë", description: "Na tregoni për biznesin tuaj", icon: Building2 },
    { number: 2, title: "Kontakti & Vendndodhja", description: "Si mund t'ju gjejnë klientët", icon: User },
    { number: 3, title: "Orari i Punës", description: "Kur jeni i disponueshëm", icon: Clock },
    { number: 4, title: "Shërbimet & Imazhet", description: "Çfarë ofroni", icon: Upload },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-800 to-teal-800 relative overflow-hidden">

      <Header transparent={true} />

      <div className="container mx-auto px-[15px] md:px-4 py-12 md:py-18 relative z-10">
        

        {/* Welcome Section */}
        <div className="text-center mb-3 md:mb-6">
          <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-medium mb-2 md:mb-3">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            Listimi i Biznesit
          </div>
          
          <p className="text-white/80 text-sm md:text-lg max-w-2xl mx-auto">
            Regjistrohuni si ofrues shërbimesh dhe filloni të pranoni rezervime 
          </p>
        </div>

        {/* Progress Steps - Moved to bottom */}

        <div className="max-w-4xl mx-auto">
          <Card className="bg-[#f4f4f4] border-0 shadow-2xl backdrop-blur-sm">
            <CardContent className="px-4 md:px-8 py-1 ">
              {/* Hapi 1: Informacioni Bazë */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-6 mb-6">
                    <div className="md:w-16 md:h-16 w-14 h-14 bg-gradient-to-r from-gray-800 to-teal-800 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="md:w-8 md:h-8 w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-heading font-bold text-gray-800 ">Informacioni Bazë</h3>
                      <p className="text-gray-600">Na tregoni për biznesin tuaj</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <Label htmlFor="businessName" className="text-base md:text-base md:text-lg font-semibold text-gray-800">Emri i Biznesit *</Label>
                      <Input
                        id="businessName"
                        placeholder="Shkruani emrin e biznesit tuaj"
                        value={formData.businessName}
                        onChange={(e) => updateFormData("businessName", e.target.value)}
                        className={`w-full text-sm md:text-lg py-3 md:py-5 bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400/30 placeholder:text-gray-500 placeholder:text-sm md:placeholder:text-base placeholder:font-normal ${validationErrors.businessName ? 'border-red-500' : ''}`}
                      />
                    {validationErrors.businessName && (
                      <p className="text-red-500 text-sm">Emri i biznesi duhet të jetë i vlefshëm!</p>
                    )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="category" className="text-base md:text-base md:text-lg font-semibold text-gray-800">Kategoria e Biznesit *</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => updateFormData("category", value)}
                        disabled={categoriesLoading}
                      >
                        <SelectTrigger className={`w-full text-sm md:text-lg py-3 md:py-5 bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400/30 placeholder:text-gray-500 placeholder:text-sm md:placeholder:text-base placeholder:font-normal ${validationErrors.category ? 'border-red-500' : ''} ${categoriesLoading ? 'opacity-50' : ''}`}>
                          <SelectValue placeholder={categoriesLoading ? "Duke ngarkuar kategoritë..." : "Zgjidhni kategorinë e biznesit tuaj"} />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriesLoading ? (
                            <SelectItem value="loading" disabled>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                Duke ngarkuar...
                              </div>
                            </SelectItem>
                          ) : categories.length > 0 ? (
                            [...categories]
                              .sort((a, b) => {
                                // Use sort_order if both have it
                                if (a.sort_order !== undefined && b.sort_order !== undefined) {
                                  return a.sort_order - b.sort_order
                                }
                                // If only one has sort_order, prioritize it
                                if (a.sort_order !== undefined) return -1
                                if (b.sort_order !== undefined) return 1
                                // Fallback to alphabetical
                                return a.name.localeCompare(b.name)
                              })
                              .map((category) => (
                                <SelectItem key={category.id} value={category.name}>
                                  <div className="flex items-center gap-2">
                                    {category.icon && (
                                      <img 
                                        src={category.icon} 
                                        alt={category.name}
                                        className="w-4 h-4 rounded"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none'
                                        }}
                                      />
                                    )}
                                    <span>{category.name}</span>
                                  </div>
                                </SelectItem>
                              ))
                          ) : (
                            <SelectItem value="no-categories" disabled>
                              Nuk u gjetën kategoritë
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {validationErrors.category && (
                        <p className="text-red-500 text-sm">{validationErrors.category}</p>
                      )}
                    </div>
                  </div>
                    {!categoriesLoading && categories.length === 0 && (
                      <div className="flex items-center gap-2">
                        <p className="text-yellow-600 text-sm">Nuk u gjetën kategoritë.</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            setCategoriesLoading(true)
                            try {
                              const response = await fetch('/api/categories')
                              if (response.ok) {
                                const cats = await response.json()
                                setCategories(cats)
                              } else {
                                throw new Error('Failed to fetch categories')
                              }
                            } catch (err) {
                              console.error('Error reloading categories:', err)
                            } finally {
                              setCategoriesLoading(false)
                            }
                          }}
                        >
                          Rifresko
                        </Button>
                      </div>
                    )}

                  <div className="space-y-1" >
                    <Label htmlFor="description" className="text-base md:text-base md:text-lg font-semibold text-gray-800">Përshkrimi i Biznesit *</Label>
                    <Textarea
                      id="description"
                      placeholder="Përshkruani biznesin tuaj, shërbimet dhe atë që ju bën të veçantë..."
                      rows={3}
                      value={formData.description}
                      onChange={(e) => updateFormData("description", e.target.value)}
                      className={`text-sm md:text-lg bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400/30 placeholder:text-gray-500 placeholder:text-sm md:placeholder:text-base placeholder:font-normal ${validationErrors.description ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.description && (
                      <p className="text-red-500 text-sm">{validationErrors.description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Hapi 2: Kontakti & Vendndodhja */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-6 mb-4">
                    <div className="md:w-16 md:h-16 w-14 h-14 bg-gradient-to-r from-gray-800 to-teal-800 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <User className="md:w-8 md:h-8 w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-heading font-bold text-gray-800">Kontakti & Vendndodhja</h3>
                      <p className="text-gray-600">Si mund t'ju gjejnë klientët</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 md:gap-6">
                    <div className="space-y-1">
                      <Label htmlFor="ownerName" className="text-base md:text-lg font-semibold text-gray-800">Emri i Pronarit/Menaxherit *</Label>
                      <Input
                        id="ownerName"
                        placeholder="Emri juaj i plotë"
                        value={formData.ownerName}
                        onChange={(e) => updateFormData("ownerName", e.target.value)}
                        className={`text-sm md:text-lg py-3 md:py-5 bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400/30 placeholder:text-gray-500 placeholder:text-sm md:placeholder:text-base placeholder:font-normal ${validationErrors.ownerName ? 'border-red-500' : ''}`}
                      />
                      {validationErrors.ownerName && (
                        <p className="text-red-500 text-sm">{validationErrors.ownerName}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-base md:text-lg font-semibold text-gray-800">Numri i Telefonit *</Label>
                      <Input
                        id="phone"
                        placeholder="+383 44 123 456"
                        value={formData.phone}
                        onChange={(e) => updateFormData("phone", e.target.value)}
                        className={`text-sm md:text-lg py-3 md:py-5 bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400/30 placeholder:text-gray-500 placeholder:text-sm md:placeholder:text-base placeholder:font-normal ${validationErrors.phone ? 'border-red-500' : ''}`}
                      />
                      {validationErrors.phone && (
                        <p className="text-red-500 text-sm">{validationErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-gray-300" />

                  <div className="space-y-1">
                    <h4 className="text-lg md:text-xl font-semibold text-gray-800 mb-1">Kredencialet e Llogarisë</h4>
                    <p className="text-gray-600 text-sm">Përdoren për të hyrë në panelin e biznesit tuaj</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 md:gap-6">
                    <div className="space-y-1">
                      <Label htmlFor="accountEmail" className="text-base md:text-lg font-semibold text-gray-800">Email i Llogarisë *</Label>
                      <Input
                        id="accountEmail"
                        type="email"
                        placeholder="account@yourbusiness.com"
                        value={formData.accountEmail}
                        onChange={(e) => updateFormData("accountEmail", e.target.value)}
                        className={`text-sm md:text-lg py-3 md:py-5 bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400/30 placeholder:text-gray-500 placeholder:text-sm md:placeholder:text-base placeholder:font-normal ${validationErrors.accountEmail ? 'border-red-500' : ''}`}
                      />
                      {validationErrors.accountEmail && (
                        <p className="text-red-500 text-sm">{validationErrors.accountEmail}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="accountPassword" className="text-base md:text-lg font-semibold text-gray-800">Fjalëkalimi *</Label>
                      <Input
                        id="accountPassword"
                        type="password"
                        placeholder="Fjalëkalimi juaj"
                        value={formData.accountPassword}
                        onChange={(e) => updateFormData("accountPassword", e.target.value)}
                        className={`text-sm md:text-lg py-3 md:py-5 bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400/30 placeholder:text-gray-500 placeholder:text-sm md:placeholder:text-base placeholder:font-normal ${validationErrors.accountPassword ? 'border-red-500' : ''}`}
                      />
                      {validationErrors.accountPassword && (
                        <p className="text-red-500 text-sm">{validationErrors.accountPassword}</p>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-gray-300" />

                  <div className="space-y-1">
                    <Label htmlFor="address" className="text-base md:text-lg font-semibold text-gray-800">Adresa e Rrugës *</Label>
                    <Input
                      id="address"
                      placeholder="123 Rruga Kryesore"
                      value={formData.address}
                      onChange={(e) => updateFormData("address", e.target.value)}
                      className={`text-sm md:text-lg py-3 md:py-5 bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400/30 placeholder:text-gray-500 placeholder:text-sm md:placeholder:text-base placeholder:font-normal ${validationErrors.address ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.address && (
                      <p className="text-red-500 text-sm">{validationErrors.address}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 md:gap-6">
                    <div className="space-y-1">
                      <Label htmlFor="city" className="text-base md:text-lg font-semibold text-gray-800">Qyteti *</Label>
                      <Select
                        value={formData.city}
                        onValueChange={handleCityChange}
                      >
                        <SelectTrigger className={`w-full text-sm md:text-lg py-3 md:py-5 bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400/30 placeholder:text-gray-500 placeholder:text-sm md:placeholder:text-base placeholder:font-normal ${validationErrors.city ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Zgjidhni qytetin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Deçan">Deçan</SelectItem>
                          <SelectItem value="Dragash">Dragash</SelectItem>
                          <SelectItem value="Drenas">Drenas</SelectItem>
                          <SelectItem value="F.Kosovë">F.Kosovë</SelectItem>
                          <SelectItem value="Ferizaj">Ferizaj</SelectItem>
                          <SelectItem value="Gjakovë">Gjakovë</SelectItem>
                          <SelectItem value="Gjilan">Gjilan</SelectItem>
                          <SelectItem value="Graçanic">Graçanic</SelectItem>
                          <SelectItem value="Hani Elezit">Hani Elezit</SelectItem>
                          <SelectItem value="Istog">Istog</SelectItem>
                          <SelectItem value="Junik">Junik</SelectItem>
                          <SelectItem value="Kaçanik">Kaçanik</SelectItem>
                          <SelectItem value="Kamenicë">Kamenicë</SelectItem>
                          <SelectItem value="Klinë">Klinë</SelectItem>
                          <SelectItem value="Kllokot">Kllokot</SelectItem>
                          <SelectItem value="Lipjan">Lipjan</SelectItem>
                          <SelectItem value="Malishevë">Malishevë</SelectItem>
                          <SelectItem value="Mamushë">Mamushë</SelectItem>
                          <SelectItem value="Mitrovicë">Mitrovicë</SelectItem>
                          <SelectItem value="Novobërdë">Novobërdë</SelectItem>
                          <SelectItem value="Obiliq">Obiliq</SelectItem>
                          <SelectItem value="Partesh">Partesh</SelectItem>
                          <SelectItem value="Pejë">Pejë</SelectItem>
                          <SelectItem value="Podujevë">Podujevë</SelectItem>
                          <SelectItem value="Prishtinë">Prishtinë</SelectItem>
                          <SelectItem value="Prizren">Prizren</SelectItem>
                          <SelectItem value="Rahovec">Rahovec</SelectItem>
                          <SelectItem value="Ranillug">Ranillug</SelectItem>
                          <SelectItem value="Shtërpce">Shtërpce</SelectItem>
                          <SelectItem value="Shtime">Shtime</SelectItem>
                          <SelectItem value="Skenderaj">Skenderaj</SelectItem>
                          <SelectItem value="Therandë">Therandë</SelectItem>
                          <SelectItem value="Viti">Viti</SelectItem>
                          <SelectItem value="Vushtrri">Vushtrri</SelectItem>
                          <SelectItem value="Mitrovicë E Veriut">Mitrovicë E Veriut</SelectItem>
                          <SelectItem value="Zubin Potok">Zubin Potok</SelectItem>
                          <SelectItem value="Zveçan">Zveçan</SelectItem>
                          <SelectItem value="Leposaviq">Leposaviq</SelectItem>
                        </SelectContent>
                      </Select>
                      {validationErrors.city && (
                        <p className="text-red-500 text-sm">{validationErrors.city}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="state" className="text-base md:text-lg font-semibold text-gray-800">Shteti *</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) => updateFormData("state", value)}
                        disabled={true}
                      >
                        <SelectTrigger className={`w-full text-sm md:text-lg py-3 md:py-5 bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400/30 placeholder:text-gray-500 placeholder:text-sm md:placeholder:text-base placeholder:font-normal ${validationErrors.state ? 'border-red-500' : ''} opacity-75`}>
                          <SelectValue placeholder="Kosovë" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Kosovë">Kosovë</SelectItem>
                        </SelectContent>
                      </Select>
                      {validationErrors.state && (
                        <p className="text-red-500 text-sm">{validationErrors.state}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-base md:text-lg font-semibold text-gray-800">Vendndodhja në Hartë *</Label>
                    <GoogleMapsPickerWrapper
                      key={`map-${currentStep}-${mapReady}-${mapCenter?.lat}-${mapCenter?.lng}`}
                      onLocationSelect={(location) => {
                        // Only update coordinates, not the address field
                        updateFormData("latitude", location.latitude)
                        updateFormData("longitude", location.longitude)
                        
                        // Clear location validation error when user selects a location
                        if (validationErrors.location) {
                          const newErrors = {...validationErrors}
                          delete newErrors.location
                          setValidationErrors(newErrors)
                        }
                      }}
                      initialAddress={formData.address}
                      initialLatitude={mapCenter?.lat}
                      initialLongitude={mapCenter?.lng}
                    />
                    {validationErrors.latitude && (
                      <p className="text-red-500 text-sm">{validationErrors.latitude}</p>
                    )}
                    {validationErrors.longitude && (
                      <p className="text-red-500 text-sm">{validationErrors.longitude}</p>
                    )}
                    {validationErrors.location && (
                      <p className="text-red-500 text-sm">{validationErrors.location}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Hapi 3: Orari i Punës */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="flex items-center gap-6 mb-6">
                    <div className="md:w-16 md:h-16 w-14 h-14 bg-gradient-to-r from-gray-800 to-teal-800 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Clock className="md:w-8 md:h-8 w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-heading font-bold text-gray-800">Orari i Punës</h3>
                      <p className="text-gray-600">Kur jeni i disponueshëm</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {daysOfWeek.map((day) => {
                      const dayData = formData.operatingHours[day.key as keyof typeof formData.operatingHours]
                      return (
                        <div key={day.key} className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-white rounded-lg border border-gray-200 space-y-3 md:space-y-0">
                          <div className="flex items-center space-x-3">
                            <Label className="text-base font-medium text-gray-700">{day.label}</Label>
                          </div>
                          <div className="flex flex-row items-center space-x-2 md:space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={!dayData.closed}
                                onChange={(e) => updateOperatingHours(day.key, "closed", !e.target.checked)}
                                className="w-4 h-4 text-teal-800 bg-white rounded focus:ring-teal-800 focus:ring-2 accent-teal-800 border-0"
                              />
                              <span className="text-xs md:text-sm text-gray-600">Ditë pune?</span>
                            </div>
                            {!dayData.closed && (
                              <div className="flex items-center space-x-2">
                                <Select
                                  value={dayData.open}
                                  onValueChange={(value) => updateOperatingHours(day.key, "open", value)}
                                >
                                  <SelectTrigger className={`w-22 md:w-36 text-sm md:text-lg placeholder:text-gray-500 placeholder:text-sm md:placeholder:text-base placeholder:font-normal ${validationErrors[`${day.key}_open`] ? 'border-red-500' : ''}`}>
                                    <SelectValue placeholder="Hapja" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {operatingHours.map((hour) => (
                                      <SelectItem key={hour} value={hour}>
                                        {hour}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <span className="text-gray-400">-</span>
                                <Select
                                  value={dayData.close}
                                  onValueChange={(value) => updateOperatingHours(day.key, "close", value)}
                                >
                                  <SelectTrigger className={`w-22 md:w-36 text-sm md:text-lg placeholder:text-gray-500 placeholder:text-sm md:placeholder:text-base placeholder:font-normal ${validationErrors[`${day.key}_close`] ? 'border-red-500' : ''}`}>
                                    <SelectValue placeholder="Mbyllja" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {operatingHours.map((hour) => (
                                      <SelectItem key={hour} value={hour}>
                                        {hour}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {validationErrors.operatingHours && (
                      <p className="text-red-500 text-sm">{validationErrors.operatingHours}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Hapi 4: Shërbimet & Imazhet */}
              {currentStep === 4 && (
                <div className="space-y-8">
                  <div className="flex items-center gap-6 mb-6">
                    <div className="md:w-16 md:h-16 w-14 h-14 bg-gradient-to-r from-gray-800 to-teal-800 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Upload className="md:w-8 md:h-8 w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-heading font-bold text-gray-800">Shërbimet & Imazhet</h3>
                      <p className="text-gray-600">Çfarë ofroni</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <Label className="text-base md:text-base md:text-lg font-semibold text-gray-800 mb-4 block">Shto shërbimet që ofroni: *</Label>
                      {validationErrors.services && (
                        <p className="text-red-500 text-sm mb-4">{validationErrors.services}</p>
                      )}
                      <div className="space-y-4">
                        {formData.services.map((service, index) => (
                          <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 ">
                            <div className="flex items-center justify-between">
                           
                              {formData.services.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeService(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            <div className="space-y-4">
                              {/* Service Name, Price and Duration - All in one line */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-xs md:text-sm font-medium text-gray-700">Emri i Shërbimit *</Label>
                                  <Input
                                    placeholder="Shkruani emrin e shërbimit"
                                    value={service.name}
                                    onChange={(e) => updateService(index, "name", e.target.value)}
                                    className={`text-sm md:text-lg py-3 md:py-5 bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400/30 placeholder:text-gray-500 placeholder:text-sm md:placeholder:text-base placeholder:font-normal ${validationErrors[`service_${index}_name`] ? 'border-red-500' : ''}`}
                                  />
                                  {validationErrors[`service_${index}_name`] && (
                                    <p className="text-red-500 text-sm">{validationErrors[`service_${index}_name`]}</p>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs md:text-sm font-medium text-gray-700">Çmimi (€)</Label>
                                  <Input
                                    type="number"
                                    placeholder="0.00 (opsional)"
                                    value={service.cost || ''}
                                    onChange={(e) => updateService(index, "cost", e.target.value)}
                                    className="text-sm md:text-lg py-3 md:py-5 bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400/30 placeholder:text-gray-500 placeholder:text-sm md:placeholder:text-base placeholder:font-normal"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs md:text-sm font-medium text-gray-700">Kohëzgjatja *</Label>
                                  <Select
                                    value={service.duration}
                                    onValueChange={(value) => updateService(index, "duration", value)}
                                  >
                                    <SelectTrigger className={`text-sm md:text-lg py-3 md:py-5 bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400/30 placeholder:text-gray-500 placeholder:text-sm md:placeholder:text-base placeholder:font-normal ${validationErrors[`service_${index}_duration`] ? 'border-red-500' : ''}`}>
                                      <SelectValue placeholder="Zgjidhni kohëzgjatjen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {serviceDurations.map((duration) => (
                                        <SelectItem key={duration} value={duration}>
                                          {duration}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {validationErrors[`service_${index}_duration`] && (
                                    <p className="text-red-500 text-sm">{validationErrors[`service_${index}_duration`]}</p>
                                  )}
                                </div>
                              </div>

                              {/* Description - Full width */}
                              <div className="space-y-1">
                                <Label className="text-xs md:text-sm font-medium text-gray-700">Përshkrimi i Shërbimit</Label>
                                <Textarea
                                  placeholder="Shkruani përshkrimin e shërbimit (opsional)"
                                  value={service.description || ''}
                                  onChange={(e) => updateService(index, "description", e.target.value)}
                                  className="text-sm md:text-lg py-2 bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400/30 placeholder:text-gray-500 placeholder:text-sm md:placeholder:text-base placeholder:font-normal"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          onClick={addService}
                          className="w-full bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white border-0 py-3 md:py-5"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Shtoni Shërbim tjetër
                        </Button>
                      </div>
                    </div>

                    <Separator className="bg-gray-300" />

                    <div>
                      <Label className="text-base md:text-base md:text-lg font-semibold text-gray-800 mb-4 block">Shto anëtarët e stafit tuaj:</Label>
                      {validationErrors.teamMembers && (
                        <p className="text-red-500 text-sm mb-4">{validationErrors.teamMembers}</p>
                      )}
                      <div className="space-y-4">
                        {formData.teamMembers.map((member, index) => (
                          <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 ">
                            <div className="flex items-center justify-between">
                             
                              {formData.teamMembers.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeTeamMember(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <Label className="text-xs md:text-sm font-medium text-gray-700">Emri i Plotë *</Label>
                                <Input
                                  placeholder="Emri i plotë i anëtarit"
                                  value={member.name}
                                  onChange={(e) => updateTeamMember(index, "name", e.target.value)}
                                  className={`text-sm md:text-lg py-3 md:py-5 bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400/30 placeholder:text-gray-500 placeholder:text-sm md:placeholder:text-base placeholder:font-normal ${validationErrors[`member_${index}_name`] ? 'border-red-500' : ''}`}
                                />
                                {validationErrors[`member_${index}_name`] && (
                                  <p className="text-red-500 text-sm">{validationErrors[`member_${index}_name`]}</p>
                                )}
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs md:text-sm font-medium text-gray-700">Email *</Label>
                                <Input
                                  type="email"
                                  placeholder="email@example.com"
                                  value={member.email}
                                  onChange={(e) => updateTeamMember(index, "email", e.target.value)}
                                  className={`text-sm md:text-lg py-3 md:py-5 bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400/30 placeholder:text-gray-500 placeholder:text-sm md:placeholder:text-base placeholder:font-normal ${validationErrors[`member_${index}_email`] ? 'border-red-500' : ''}`}
                                />
                                {validationErrors[`member_${index}_email`] && (
                                  <p className="text-red-500 text-sm">{validationErrors[`member_${index}_email`]}</p>
                                )}
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs md:text-sm font-medium text-gray-700">Numri i Telefonit *</Label>
                                <Input
                                  placeholder="+383 44 123 456"
                                  value={member.phone}
                                  onChange={(e) => updateTeamMember(index, "phone", e.target.value)}
                                  className={`text-sm md:text-lg py-3 md:py-5 bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400/30 placeholder:text-gray-500 placeholder:text-sm md:placeholder:text-base placeholder:font-normal ${validationErrors[`member_${index}_phone`] ? 'border-red-500' : ''}`}
                                />
                                {validationErrors[`member_${index}_phone`] && (
                                  <p className="text-red-500 text-sm">{validationErrors[`member_${index}_phone`]}</p>
                                )}
                              </div>
                            </div>
                            
                            {/* Services Selection */}
                            <div className="mt-4">
                              <Label className="text-xs md:text-sm font-medium text-gray-700 mb-2 block">Shërbimet që ofron ky anëtar</Label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {formData.services.map((service, serviceIndex) => (
                                  <div key={serviceIndex} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`member-${index}-service-${serviceIndex}`}
                                      checked={(member.services as number[])?.includes(serviceIndex) || false}
                                      onChange={(e) => {
                                        const currentServices = (member.services as number[]) || []
                                        let newServices: number[]
                                        
                                        if (e.target.checked) {
                                          newServices = [...currentServices, serviceIndex]
                                        } else {
                                          newServices = currentServices.filter((idx: number) => idx !== serviceIndex)
                                        }
                                        
                                        updateTeamMember(index, "services", newServices)
                                      }}
                                      className="h-4 w-4 text-teal-900 bg-white rounded focus:ring-teal-800 focus:ring-2 accent-teal-800 border-0"
                                    />
                                    <label 
                                      htmlFor={`member-${index}-service-${serviceIndex}`}
                                      className="text-sm text-gray-700 cursor-pointer"
                                    >
                                      {service.name} {service.cost ? `(€${service.cost})` : ''}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              {formData.services.length === 0 && (
                                <p className="text-sm text-gray-500 italic">Shtoni shërbime në seksionin e shërbimeve për t'u zgjedhur këtu.</p>
                              )}
                              {validationErrors[`member_${index}_services`] && (
                                <p className="text-red-500 text-sm mt-2">{validationErrors[`member_${index}_services`]}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          onClick={addTeamMember}
                          className="w-full bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white border-0 py-3 md:py-5"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Shto Anëtar të Ri në Ekip
                        </Button>
                      </div>
                    </div>

                    <Separator className="bg-gray-300" />

                    {/* Logo and Business Images Section */}
                    <div>
                      <Label className="text-base md:text-base md:text-lg font-semibold text-gray-800 mb-4 block">Logo & Imazhet e Biznesit</Label>
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Logo Section - 50% width */}
                        <div className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-lg p-6">
                          <div className="text-center mb-4">
                            <h4 className="text-base md:text-lg font-heading font-bold text-gray-800"> Logo i Biznesit</h4>
                          </div>
                          <div className="space-y-4">
                            {/* Current Logo Display */}
                            <div className="w-full">
                              {formData.logo ? (
                                <div className="w-full min-h-48 mb-4 rounded-lg border-2 border-gray-200 bg-white flex items-center justify-center p-4">
                                  <img 
                                    src={typeof formData.logo === 'string' ? formData.logo : URL.createObjectURL(formData.logo)} 
                                    alt="Business Logo" 
                                    className="max-w-full max-h-80 object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-full min-h-48 mb-4 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                                  <p className="text-gray-500">Nuk keni imazhe të ngarkuara</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Upload Area */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 transition-colors">
                              <p className="text-gray-600 mb-2">Klikoni për të ngarkuar logo</p>
                              <p className="text-sm text-gray-500 mb-4">PNG, JPG deri në 1MB</p>
                            <input 
                              type="file" 
                              accept="image/png,image/jpeg,image/jpg" 
                              className="hidden" 
                              id="logo-upload"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 1024 * 1024) { // 1MB limit
                                    alert('Logo duhet të jetë më pak se 1MB');
                                    return;
                                  }
                                  
                                  // Upload to Cloudinary
                                  const uploadFormData = new FormData();
                                  uploadFormData.append('file', file);
                                  uploadFormData.append('type', 'logo');
                                  
                                  try {
                                    const response = await fetch('/api/upload', {
                                      method: 'POST',
                                      body: uploadFormData,
                                    });
                                    
                                    const result = await response.json();
                                    
                                    if (result.success) {
                                      updateFormData("logo", result.url);
                                    } else {
                                      alert(result.error || 'Gabim gjatë ngarkimit');
                                    }
                                  } catch (error) {
                                    console.error('Upload error:', error);
                                    alert('Gabim gjatë ngarkimit të logos');
                                  }
                                }
                              }}
                            />
                              <Button 
                                type="button"
                                onClick={() => document.getElementById('logo-upload')?.click()}
                                className="bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                {formData.logo ? 'Ndrysho Logon' : 'Ngarko Logo'}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Business Images Section - 50% width */}
                        <div className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-lg p-6">
                          <div className="text-center mb-4">
                            <h4 className="text-base md:text-lg font-heading font-bold text-gray-800"> Imazhet e Biznesit</h4>
                          </div>
                          <div className="space-y-4">
                            {/* Current Images Display */}
                            <div className="grid grid-cols-2 gap-3">
                              {formData.businessImages && formData.businessImages.length > 0 ? (
                                formData.businessImages.map((image: string, index: number) => (
                                  <div key={index} className="w-full min-h-48 bg-gray-100 rounded-lg border-2 border-gray-200 relative group flex items-center justify-center p-2">
                                    <img 
                                      src={image} 
                                      alt={`Business Image ${index + 1}`} 
                                      className="max-w-full max-h-80 object-contain"
                                    />
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const updatedImages = formData.businessImages.filter((_: any, i: number) => i !== index);
                                        updateFormData("businessImages", updatedImages);
                                      }}
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-2 text-center py-8 text-gray-500 min-h-48 flex items-center justify-center bg-gray-100 rounded-lg border-2 border-gray-200">
                                  Nuk keni imazhe të ngarkuara
                                </div>
                              )}
                            </div>
                            
                            {/* Upload Area */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 transition-colors">
                              <p className="text-gray-600 mb-2">Klikoni për të ngarkuar imazhe</p>
                              <p className="text-sm text-gray-500 mb-4">PNG, JPG deri në 2MB</p>
                            <input 
                              type="file" 
                              accept="image/png,image/jpeg,image/jpg" 
                              className="hidden" 
                              id="business-images-upload"
                              multiple
                              onChange={async (e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length > 0) {
                                  for (const file of files) {
                                    if (file.size > 2 * 1024 * 1024) { // 2MB limit
                                      alert('Imazhi duhet të jetë më pak se 2MB');
                                      continue;
                                    }
                                    
                                    // Upload to Cloudinary
                                    const uploadFormData = new FormData();
                                    uploadFormData.append('file', file);
                                    uploadFormData.append('type', 'business_image');
                                    
                                    try {
                                      const response = await fetch('/api/upload', {
                                        method: 'POST',
                                        body: uploadFormData,
                                      });
                                      
                                      const result = await response.json();
                                      
                                      if (result.success) {
                                        const currentImages = formData.businessImages || [];
                                        updateFormData("businessImages", [...currentImages, result.url]);
                                      } else {
                                        alert(result.error || 'Gabim gjatë ngarkimit');
                                      }
                                    } catch (error) {
                                      console.error('Upload error:', error);
                                      alert('Gabim gjatë ngarkimit të imazhit');
                                    }
                                  }
                                }
                              }}
                            />
                              <Button 
                                type="button"
                                onClick={() => document.getElementById('business-images-upload')?.click()}
                                className="bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Ngarko Imazhe
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6 pt-4 border-t border-gray-300">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="px-4 md:px-8 py-3 md:py-3 md:py-5 text-lg hover:bg-gradient-to-r hover:from-gray-700 hover:to-teal-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Prapa
                </Button>

                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="px-4 md:px-8 py-3 md:py-3 md:py-5 text-lg bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white"
                  >
                    Vazhdo
                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-4 md:px-8 py-3 md:py-3 md:py-5 text-lg bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Po regjistrohet...
                      </>
                    ) : (
                      <>
                        Regjistro Biznesin
                        <Check className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress Steps - Bottom of page */}
          <div className="mt-8 md:mt-12">
            <div className="flex items-center justify-center max-w-3xl mx-auto px-2">
              {steps.map((step, index) => {
                const IconComponent = step.icon
                return (
                  <div key={step.number} className="flex items-center">
                    {/* Step Number and Icon */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex items-center justify-center w-10 h-10 md:w-16 md:h-16 rounded-xl transition-all duration-300 ${
                          currentStep >= step.number
                            ? "bg-[#f4f4f4] border-2 border-gray-800 text-gray-800 shadow-lg"
                            : "bg-[#f4f4f4] border-2 border-gray-300 text-gray-400"
                        }`}
                      >
                        {currentStep > step.number ? (
                          <Check className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
                        ) : (
                          <IconComponent className="w-4 h-4 md:w-6 md:h-6" />
                        )}
                      </div>
                      {/* Step Number */}
                      <div className={`mt-1 md:mt-2 w-4 h-4 md:w-6 md:h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        currentStep >= step.number
                          ? "bg-white text-gray-800"
                          : "bg-white/30 text-white/70"
                      }`}>
                        {step.number}
                      </div>
                    </div>
                    
                    {/* Connection Line */}
                    {index < steps.length - 1 && (
                      <div className={`w-8 md:w-16 h-0.5 mx-2 md:mx-4 ${
                        currentStep > step.number ? "bg-white" : "bg-white/30"
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}