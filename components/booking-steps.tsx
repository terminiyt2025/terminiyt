"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format, isSameDay, isAfter, startOfDay } from "date-fns"
import { sq } from "date-fns/locale"
import { 
  CalendarDays, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  MessageSquare, 
  ArrowLeft, 
  ArrowRight,
  Check,
  MapPin,
  Star,
  Building2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

const contactSchema = z.object({
  customerName: z.string().min(2, "Emri duhet të jetë të paktën 2 karaktere"),
  customerEmail: z.string().email("Ju lutemi shkruani një email të vlefshëm"),
  customerPhone: z.string().min(8, "Numri i telefonit duhet të ketë të paktën 8 shifra"),
  notes: z.string().optional(),
})

type ContactFormData = z.infer<typeof contactSchema>

interface BookingStepsProps {
  business: any
}

// Generate time slots based on business or staff operating hours
const generateTimeSlots = (operatingHours: any, selectedDate: Date, business: any, selectedStaff: any, serviceDuration: number = 30) => {
  if (!operatingHours || !selectedDate) return []
  
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayOfWeek = dayNames[selectedDate.getDay()]
  
  // Use staff operating hours if a specific staff is selected, otherwise use business hours
  let dayHours
  if (selectedStaff && business?.staff) {
    const staffMember = business.staff.find((s: any) => s.name === selectedStaff.name)
    if (staffMember?.operatingHours?.[dayOfWeek]) {
      dayHours = staffMember.operatingHours[dayOfWeek]
    } else {
      // Fallback to business hours if staff doesn't have specific hours for this day
      dayHours = operatingHours[dayOfWeek]
    }
  } else {
    // Use business hours when no staff is selected
    dayHours = operatingHours[dayOfWeek]
  }
  
  if (!dayHours || dayHours.closed) return []
  
  const slots = []
  const startTime = dayHours.open
  const endTime = dayHours.close
  
  if (!startTime || !endTime) return []
  
  // Parse start and end times
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  // Generate 15-minute base slots
  const interval = 15 // 15-minute base intervals
  const now = new Date()
  const isToday = selectedDate.toDateString() === now.toDateString()
  const currentTime = now.getHours() * 60 + now.getMinutes()
  
  // Calculate the latest time slot that allows for service completion before closing
  const latestSlotTime = endMinutes - serviceDuration
  
  const timeSlotsSet = new Set<string>()
  
  // Generate base 15-minute slots
  for (let minutes = startMinutes; minutes < endMinutes; minutes += interval) {
    const hour = Math.floor(minutes / 60)
    const min = minutes % 60
    const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
    
    // If it's today, only show future time slots
    if (isToday && minutes <= currentTime) {
      continue
    }
    
    // Only show slots that allow service completion before closing time
    if (minutes > latestSlotTime) {
      continue
    }
    
    timeSlotsSet.add(timeString)
  }
  
  // Add slots at booking end times to utilize remaining time after short bookings
  // Note: bookings are passed from the component, we'll handle this in the component itself
  // For now, just return the base slots - the component will add booking end times
  
  return Array.from(timeSlotsSet).sort()
}

// Check if a time slot is in break time
const isTimeSlotInBreakTime = (timeSlot: string, business: any, selectedStaff: any) => {
  if (!business?.staff) return false
  
  // If a specific staff is selected, only check that staff member's break times
  if (selectedStaff) {
    const staffMember = business.staff.find((s: any) => s.name === selectedStaff.name)
    if (!staffMember?.isActive || !staffMember.breakTimes || !Array.isArray(staffMember.breakTimes)) {
      return false
    }
    
    return staffMember.breakTimes.some((breakTime: any) => {
      if (!breakTime.startTime || !breakTime.endTime) return false
      return timeSlot >= breakTime.startTime && timeSlot < breakTime.endTime
    })
  }
  
  // For no staff selected, check if any staff member has a break at this time
  return business.staff.some((staff: any) => {
    // Check if staff is active and has break times
    if (!staff.isActive || !staff.breakTimes || !Array.isArray(staff.breakTimes)) {
      return false
    }
    
    // Check if timeSlot falls within any break time
    return staff.breakTimes.some((breakTime: any) => {
      if (!breakTime.startTime || !breakTime.endTime) return false
      
      return timeSlot >= breakTime.startTime && timeSlot < breakTime.endTime
    })
  })
}

// Check if a service starting at a given time would overlap with break time
const wouldServiceOverlapWithBreakTime = (startTime: string, serviceDuration: number, business: any, selectedStaff: any) => {
  if (!business?.staff || !serviceDuration) return false
  
  // If a specific staff is selected, only check that staff member's break times
  if (selectedStaff) {
    const staffMember = business.staff.find((s: any) => s.name === selectedStaff.name)
    if (!staffMember?.isActive || !staffMember.breakTimes || !Array.isArray(staffMember.breakTimes)) {
      return false
    }
    
    // Parse start time
    const [startHour, startMin] = startTime.split(':').map(Number)
    const startTotalMinutes = startHour * 60 + startMin
    
    // Calculate end time
    const endTotalMinutes = startTotalMinutes + serviceDuration
    
    // Check if service would overlap with any break time
    return staffMember.breakTimes.some((breakTime: any) => {
      if (!breakTime.startTime || !breakTime.endTime) return false
      
      // Parse break time
      const [breakStartHour, breakStartMin] = breakTime.startTime.split(':').map(Number)
      const [breakEndHour, breakEndMin] = breakTime.endTime.split(':').map(Number)
      const breakStartTotalMinutes = breakStartHour * 60 + breakStartMin
      const breakEndTotalMinutes = breakEndHour * 60 + breakEndMin
      
      // Check for overlap: service starts before break ends AND service ends after break starts
      return startTotalMinutes < breakEndTotalMinutes && endTotalMinutes > breakStartTotalMinutes
    })
  }
  
  // For no staff selected, check if any staff member has a break that would overlap
  return business.staff.some((staff: any) => {
    // Check if staff is active and has break times
    if (!staff.isActive || !staff.breakTimes || !Array.isArray(staff.breakTimes)) {
      return false
    }
    
    // Parse start time
    const [startHour, startMin] = startTime.split(':').map(Number)
    const startTotalMinutes = startHour * 60 + startMin
    
    // Calculate end time
    const endTotalMinutes = startTotalMinutes + serviceDuration
    
    // Check if service would overlap with any break time
    return staff.breakTimes.some((breakTime: any) => {
      if (!breakTime.startTime || !breakTime.endTime) return false
      
      // Parse break time
      const [breakStartHour, breakStartMin] = breakTime.startTime.split(':').map(Number)
      const [breakEndHour, breakEndMin] = breakTime.endTime.split(':').map(Number)
      const breakStartTotalMinutes = breakStartHour * 60 + breakStartMin
      const breakEndTotalMinutes = breakEndHour * 60 + breakEndMin
      
      // Check for overlap: service starts before break ends AND service ends after break starts
      return startTotalMinutes < breakEndTotalMinutes && endTotalMinutes > breakStartTotalMinutes
    })
  })
}

export function BookingSteps({ business }: BookingStepsProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedServices, setSelectedServices] = useState<any[]>([])
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [blockedSlots, setBlockedSlots] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  
  // Animation states
  const [showWelcome, setShowWelcome] = useState(false)
  const [showLogo, setShowLogo] = useState(false)
  const [showBusinessName, setShowBusinessName] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  const [showInstruction, setShowInstruction] = useState(false)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      notes: "",
    },
  })

  // Fetch blocked slots and bookings when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch blocked slots
        const blockedResponse = await fetch(`/api/blocked-slots?businessId=${business.id}`)
        if (blockedResponse.ok) {
          const blockedData = await blockedResponse.json()
          setBlockedSlots(blockedData)
        }

        // Fetch existing bookings
        const bookingsResponse = await fetch(`/api/bookings?businessId=${business.id}`)
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json()
          setBookings(bookingsData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    
    if (business.id) {
      fetchData()
    }
  }, [business.id])

  // Animation sequence for welcome section
  useEffect(() => {
    if (currentStep === 1) {
      const timer1 = setTimeout(() => setShowWelcome(true), 200)
      const timer2 = setTimeout(() => setShowLogo(true), 600)
      const timer3 = setTimeout(() => setShowBusinessName(true), 1000)
      const timer4 = setTimeout(() => setShowDescription(true), 1400)
      const timer5 = setTimeout(() => setShowInstruction(true), 1800)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
        clearTimeout(timer4)
        clearTimeout(timer5)
      }
    } else {
      // Reset animation states when not in step 1
      setShowWelcome(false)
      setShowLogo(false)
      setShowBusinessName(false)
      setShowDescription(false)
      setShowInstruction(false)
    }
  }, [currentStep])


  // Helper function to get time slots covered by a booking
  const getBookingTimeSlots = (booking: any): string[] => {
    // Use the booking's serviceDuration if available, otherwise fall back to business service duration
    const duration = booking.serviceDuration || (() => {
      const service = business.services?.find((s: any) => s.name === booking.serviceName)
      return service?.duration || 30 // Default 30 minutes
    })()
    
    const startTime = booking.appointmentTime
    const slots: string[] = []
    
    // Parse start time
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const startTotalMinutes = startHours * 60 + startMinutes
    
    // Calculate how many 15-minute slots this service covers
    const slotCount = Math.ceil(duration / 15)
    
    // Generate all time slots for this booking
    for (let i = 0; i < slotCount; i++) {
      const slotTotalMinutes = startTotalMinutes + (i * 15)
      const slotHours = Math.floor(slotTotalMinutes / 60)
      const slotMinutes = slotTotalMinutes % 60
      const slotTime = `${slotHours.toString().padStart(2, '0')}:${slotMinutes.toString().padStart(2, '0')}`
      slots.push(slotTime)
    }
    
    return slots
  }

  // Check if a time slot has a booking or would conflict with existing bookings
  const hasBookingAtTime = (date: Date, timeSlot: string) => {
    if (!bookings.length) return false
    
    // Use local date format to avoid timezone issues
    const dateStr = date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0')
    
    return bookings.some(booking => {
      // Parse booking date and convert to local date string
      const bookingDateObj = new Date(booking.appointmentDate)
      const bookingDate = bookingDateObj.getFullYear() + '-' + 
                         String(bookingDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(bookingDateObj.getDate()).padStart(2, '0')
      
      const isSameDate = bookingDate === dateStr
      const isStaffMatch = !booking.staffName || !selectedStaff || booking.staffName === selectedStaff.name
      const isNotCancelled = booking.status !== 'CANCELLED'
      
      if (!isSameDate || !isStaffMatch || !isNotCancelled) return false
      
      // Check for time overlap instead of just exact slot matches
      const bookingStartTime = booking.appointmentTime
      const bookingDuration = booking.serviceDuration || (() => {
        const service = business.services?.find((s: any) => s.name === booking.serviceName)
        return parseServiceDuration(service?.duration || 30)
      })()
      
      // Parse times to minutes for easier comparison
      const [bookingStartHour, bookingStartMin] = bookingStartTime.split(':').map(Number)
      const bookingStartMinutes = bookingStartHour * 60 + bookingStartMin
      const bookingEndMinutes = bookingStartMinutes + bookingDuration
      
      const [slotHour, slotMin] = timeSlot.split(':').map(Number)
      const slotStartMinutes = slotHour * 60 + slotMin
      const slotEndMinutes = slotStartMinutes + serviceDuration
      
      // Check if the new booking would overlap with existing booking
      // Overlap occurs if: new start < existing end AND new end > existing start
      return slotStartMinutes < bookingEndMinutes && slotEndMinutes > bookingStartMinutes
    })
  }

  // Filter out blocked time slots
  const isTimeSlotBlocked = (date: Date, timeSlot: string) => {
    if (!blockedSlots.length) return false
    
    // Use local date format to avoid timezone issues
    const dateStr = date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0')
    
    return blockedSlots.some(slot => {
      // Parse blocked slot date and convert to local date string
      const slotDateObj = new Date(slot.date)
      const slotDate = slotDateObj.getFullYear() + '-' + 
                      String(slotDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(slotDateObj.getDate()).padStart(2, '0')
      
      const isSameDate = slotDate === dateStr
      const isStaffMatch = !slot.staffName || !selectedStaff || slot.staffName === selectedStaff.name
      
      if (!isSameDate || !isStaffMatch) return false
      
      // Check for time overlap with blocked slot
      const [blockedHour, blockedMin] = slot.startTime.split(':').map(Number)
      const blockedMinutes = blockedHour * 60 + blockedMin
      
      const [timeSlotHour, timeSlotMin] = timeSlot.split(':').map(Number)
      const timeSlotStartMinutes = timeSlotHour * 60 + timeSlotMin
      const timeSlotEndMinutes = timeSlotStartMinutes + serviceDuration
      
      // Check if the service would overlap with blocked time
      // Overlap occurs if: service start < blocked end AND service end > blocked start
      // Since blocked slot is 15 minutes, blocked end = blocked start + 15
      const blockedEndMinutes = blockedMinutes + 15
      return timeSlotStartMinutes < blockedEndMinutes && timeSlotEndMinutes > blockedMinutes
    })
  }

  // Parse service duration - handle both string and number formats
  const parseServiceDuration = (duration: any): number => {
    if (typeof duration === 'number') return duration
    if (typeof duration === 'string') {
      const durationMap: { [key: string]: number } = {
        '5 min': 5,
        '10 min': 10,
        '15 min': 15,
        '20 min': 20,
        '25 min': 25,
        '30 min': 30,
        '45 min': 45,
        '1 orë': 60,
        '1 orë 15 min': 75,
        '1 orë 30 min': 90,
        '1 orë 45 min': 105,
        '2 orë': 120,
        '2 orë 15 min': 135,
        '2 orë 30 min': 150,
        '2 orë 45 min': 165,
        '3 orë': 180,
        '3 orë 15 min': 195,
        '3 orë 30 min': 210,
        '3 orë 45 min': 225,
        '4 orë': 240,
        '5 orë': 300,
        '6 orë': 360,
        '8 orë': 480,
        '1 ditë': 1440,
      }
      // First try exact match
      if (durationMap[duration]) {
        return durationMap[duration]
      }
      // Fallback: try to extract number (for backwards compatibility)
      const match = duration.match(/\d+/)
      return match ? parseInt(match[0]) : 30
    }
    return 30
  }
  
  // Calculate total duration for all selected services
  const calculateTotalDuration = () => {
    if (selectedServices.length === 0) return 30
    return selectedServices.reduce((total, service) => {
      return total + parseServiceDuration(service?.duration || 30)
    }, 0)
  }
  
  // Calculate total price for all selected services
  const calculateTotalPrice = () => {
    if (selectedServices.length === 0) return 0
    return selectedServices.reduce((total, service) => {
      const price = service?.price ? parseFloat(service.price.toString()) : 0
      return total + price
    }, 0)
  }
  
  const serviceDuration = calculateTotalDuration()
  
  // Generate base 15-minute slots
  const baseTimeSlots = selectedDate ? 
    generateTimeSlots(business.operating_hours, selectedDate, business, selectedStaff, serviceDuration) : []
  
  // Add slots at booking end times to utilize remaining time after short bookings
  const timeSlotsSet = new Set(baseTimeSlots)
  
  if (selectedDate && bookings.length > 0) {
    const dateStr = selectedDate.getFullYear() + '-' + 
                   String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(selectedDate.getDate()).padStart(2, '0')
    
    // Get operating hours for the selected date
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayOfWeek = dayNames[selectedDate.getDay()]
    let dayHours = business.operating_hours?.[dayOfWeek]
    
    if (selectedStaff && business?.staff) {
      const staffMember = business.staff.find((s: any) => s.name === selectedStaff.name)
      if (staffMember?.operatingHours?.[dayOfWeek]) {
        dayHours = staffMember.operatingHours[dayOfWeek]
      }
    }
    
    if (dayHours && !dayHours.closed) {
      const [endHour, endMin] = dayHours.close.split(':').map(Number)
      const endMinutes = endHour * 60 + endMin
      const latestSlotTime = endMinutes - serviceDuration
      const now = new Date()
      const isToday = selectedDate.toDateString() === now.toDateString()
      const currentTime = now.getHours() * 60 + now.getMinutes()
      
      bookings.forEach(booking => {
        const bookingDateObj = new Date(booking.appointmentDate)
        const bookingDate = bookingDateObj.getFullYear() + '-' + 
                           String(bookingDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(bookingDateObj.getDate()).padStart(2, '0')
        
        const dateMatch = bookingDate === dateStr
        const isStaffMatch = !booking.staffName || !selectedStaff || booking.staffName === selectedStaff.name
        const isNotCancelled = booking.status !== 'CANCELLED'
        
        if (dateMatch && isStaffMatch && isNotCancelled) {
          const bookingStartTime = booking.appointmentTime
          const bookingDuration = booking.serviceDuration || (() => {
            const service = business.services?.find((s: any) => s.name === booking.serviceName)
            return parseServiceDuration(service?.duration || 30)
          })()
          
          // Parse booking end time
          const [bookingStartHour, bookingStartMin] = bookingStartTime.split(':').map(Number)
          const bookingStartMinutes = bookingStartHour * 60 + bookingStartMin
          const bookingEndMinutes = bookingStartMinutes + bookingDuration
          
          // Check if booking ends before the next 15-minute slot
          const next15MinSlot = Math.ceil(bookingEndMinutes / 15) * 15
          if (bookingEndMinutes < next15MinSlot && bookingEndMinutes < endMinutes) {
            // Add the booking end time as an available slot
            const endHour = Math.floor(bookingEndMinutes / 60)
            const endMin = bookingEndMinutes % 60
            const endTimeString = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`
            
            // Only add if it's in the future and allows service completion
            if ((!isToday || bookingEndMinutes > currentTime) && bookingEndMinutes <= latestSlotTime) {
              timeSlotsSet.add(endTimeString)
            }
          }
        }
      })
    }
  }
  
  const availableTimeSlots = Array.from(timeSlotsSet).sort().filter(time => {
    // Check basic availability
    if (isTimeSlotBlocked(selectedDate!, time) || hasBookingAtTime(selectedDate!, time) || isTimeSlotInBreakTime(time, business, selectedStaff)) {
      return false
    }
    
    // Check if service would overlap with break time
    if (selectedServices.length > 0) {
      if (wouldServiceOverlapWithBreakTime(time, serviceDuration, business, selectedStaff)) {
        return false
      }
    }
    
    return true
  })

  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date())
    const isPastDate = !isAfter(date, today) && !isSameDay(date, today)
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayOfWeek = dayNames[date.getDay()]
    
    // Check if business is closed on this day
    if (business.operating_hours) {
      const dayHours = business.operating_hours[dayOfWeek]
      
      if (dayHours && dayHours.closed) {
        return true
      }
    }
    
    // Check if selected staff doesn't work on this day
    if (selectedStaff && business?.staff) {
      const staffMember = business.staff.find((s: any) => s.name === selectedStaff.name)
      if (staffMember?.operatingHours?.[dayOfWeek]) {
        const staffDayHours = staffMember.operatingHours[dayOfWeek]
        
        // If staff has empty hours (no open/close times), disable this day
        if (!staffDayHours.open || !staffDayHours.close || 
            staffDayHours.open === '' || staffDayHours.close === '' ||
            staffDayHours.closed) {
          return true
        }
      }
    }
    
    return isPastDate
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleServiceSelect = (service: any) => {
    // If staff is selected, check if service is available for that staff
    if (selectedStaff) {
      if (!isServiceAvailableForStaff(service, selectedStaff)) {
        toast({
          title: "Shërbimi nuk disponohet",
          description: `${service.name} nuk ofrohet nga ${selectedStaff.name}. Ju lutemi zgjidhni një shërbim tjetër ose staf tjetër.`,
          variant: "destructive",
        })
        return // Don't allow selection
      }
    }
    
    // Toggle service selection
    const isSelected = selectedServices.some(s => s.name === service.name)
    if (isSelected) {
      // Remove service if already selected
      setSelectedServices(selectedServices.filter(s => s.name !== service.name))
    } else {
      // Add service if not selected
      setSelectedServices([...selectedServices, service])
    }
    
    // Reset staff selection when services change (only if staff was selected first)
    if (selectedStaff) {
      // Check if staff can still handle all selected services after this change
      const newServices = isSelected 
        ? selectedServices.filter(s => s.name !== service.name)
        : [...selectedServices, service]
      
      const canHandleAll = newServices.every(s => isServiceAvailableForStaff(s, selectedStaff))
      if (!canHandleAll) {
        setSelectedStaff(null)
        toast({
          title: "Stafi u resetuar",
          description: "Stafi i zgjedhur nuk mund të ofrojë të gjitha shërbimet e zgjedhura.",
          variant: "default",
        })
      }
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedTime("") // Reset time when date changes
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    handleNext()
  }

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    console.log("Booking form submitted with data:", data)
    console.log("Business object:", business)
    console.log("Business ID:", business?.id)

    try {
      // Create booking data with multiple services
      const bookingData = {
        businessId: business.id,
        serviceName: JSON.stringify(selectedServices.map(s => ({ name: s.name, price: s.price || 0, duration: s.duration || '30 min' }))),
        staffName: selectedStaff?.name || '',
        appointmentDate: format(selectedDate!, "yyyy-MM-dd"),
        appointmentTime: selectedTime,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        notes: data.notes || '',
        totalPrice: calculateTotalPrice(),
        serviceDuration: serviceDuration
      }

      console.log('Booking data being sent:', bookingData)

      // Submit booking to API
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Booking API error:', errorData)
        throw new Error(errorData.error || 'Failed to create booking')
      }

      const result = await response.json()

      toast({
        title: "Rezervimi u Konfirmua!",
        description: `Termini juaj me ${business.name} është planifikuar për ${format(selectedDate!, "MMMM d, yyyy", { locale: sq })} në ${selectedTime}.`,
      })

      // Redirect to confirmation page
      const serviceNames = selectedServices.map(s => s.name).join(', ')
      const staffName = selectedStaff?.name || ''
      router.push(
        `/booking-confirmation?business=${encodeURIComponent(business.name)}&date=${format(selectedDate!, "yyyy-MM-dd")}&time=${encodeURIComponent(selectedTime)}&service=${encodeURIComponent(serviceNames)}&staff=${encodeURIComponent(staffName)}&bookingId=${result.id}`,
      )
    } catch (error) {
      console.error('Booking error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Ndodhi një gabim gjatë përpunimit të rezervimit tuaj. Ju lutemi provoni përsëri.'
      toast({
        title: "Rezervimi Dështoi",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if a service is available for a specific staff member
  const isServiceAvailableForStaff = (service: any, staffMember: any) => {
    if (!staffMember || staffMember.isActive === false) return false
    // If staff has no services defined, they can handle all services
    if (!staffMember.services || staffMember.services.length === 0) return true
    // Check if staff can handle this service
    return staffMember.services.some((s: any) => 
      typeof s === 'string' ? s === service.name : s.name === service.name
    )
  }

  // Check if all selected services are available for selected staff
  const areAllServicesAvailableForStaff = () => {
    if (!selectedStaff || selectedServices.length === 0) return true
    return selectedServices.every(service => 
      isServiceAvailableForStaff(service, selectedStaff)
    )
  }

  // Calculate available staff for selected services (used in multiple places)
  const getAvailableStaff = () => {
    if (selectedServices.length === 0) return []
    return business.staff?.filter((member: any) => {
      if (member.isActive === false) return false
      // If staff has no services defined, they can handle all services
      if (!member.services || member.services.length === 0) return true
      // Check if staff can handle all selected services
      return selectedServices.every(selectedService => 
        member.services?.some((s: any) => 
          typeof s === 'string' ? s === selectedService.name : s.name === selectedService.name
        )
      )
    }) || []
  }

  const renderStepContent = () => {
    const availableStaff = getAvailableStaff()
    
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Business Header */}
            <div className="text-center mb-2">
              <div className="flex items-center justify-center gap-6 mb-4">
                {business.logo && (
                  <div className={`w-28 h-28 relative rounded-full overflow-hidden shadow-lg border-4 border-white flex-shrink-0 transition-all duration-700 ease-out ${
                    showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                  }`}>
                    <img
                      src={business.logo}
                      alt={`${business.name} logo`}
                      className="w-full h-full object-cover bg-white"
                    />
                  </div>
                )}
                <div className="text-left">
                  {/* Welcome Message */}
                  <div className={`text-left mb-1 transition-all duration-700 ease-out ${
                    showWelcome ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    <p className="text-gray-600 text-sm md:text-md">Mirëseerdhet në</p>
                  </div>
                  <h2 className={`text-xl md:text-3xl font-bold text-gray-900 mb-2 transition-all duration-700 ease-out ${
                    showBusinessName ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    {business.name}
                  </h2>
                </div>
              </div>
              
              {/* Instructions */}
              <div className={`text-center pt-4  transition-all duration-700 ease-out ${
                showInstruction ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <p className="text-gray-600 text-xs md:text-sm p-0">Plotësoni hapat më poshtë për të rezervuar terminin tuaj</p>
              </div>
              
              {/* Choose Another Service Button - Show when service is selected */}
            </div>

            {/* Service Selection */}
            <div className="text-center">
              <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-1">
                {selectedServices.length === 0 
                  ? "Zgjidhni shërbimin/shërbimet që dëshironi të rezervoni" 
                  : `Shërbime të zgjedhura: ${selectedServices.length}`}
              </h3>
              {selectedServices.length > 0 && (
                <p className="text-xs text-gray-600 mt-1">Mund të zgjidhni më shumë shërbime</p>
              )}
              {selectedStaff && !selectedServices.length && (
                <p className="text-xs text-teal-700 mt-1 font-medium">
                  Shërbimet e disponueshme për {selectedStaff.name} janë të shënuara me ngjyrë jeshile
                </p>
              )}
            </div>

            {/* Service Options */}
            {(
              <div className={`grid gap-3 ${
                business.services?.length === 1 
                  ? 'grid-cols-1 max-w-md mx-auto' 
                  : business.services?.length === 2 
                    ? 'grid-cols-1 md:grid-cols-2' 
                    : 'grid-cols-1 md:grid-cols-2'
              }`}>
                {business.services && business.services.length > 0 ? (
                  business.services.map((service: any, index: number) => {
                    const isSelected = selectedServices.some(s => s.name === service.name)
                    const isAvailable = !selectedStaff || isServiceAvailableForStaff(service, selectedStaff)
                    const isDisabled = selectedStaff && !isAvailable
                    const isAvailableForSelectedStaff = selectedStaff && isAvailable && !isSelected
                    
                    return (
                    <Card 
                      key={index} 
                      className={`transition-all duration-300 border-2 relative ${
                        isDisabled 
                          ? 'opacity-60 cursor-not-allowed border-red-300 bg-red-50'
                          : isSelected
                            ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] border-transparent bg-gradient-to-br from-white to-gray-50'
                            : isAvailableForSelectedStaff
                              ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] border-green-300 bg-green-50'
                              : 'cursor-pointer hover:shadow-lg hover:scale-[1.02] border-gray-200 hover:border-transparent bg-gradient-to-br from-white to-gray-50'
                      }`}
                      style={{
                        background: isDisabled 
                          ? 'linear-gradient(to bottom right, #fef2f2, #fee2e2)'
                          : isSelected
                            ? 'linear-gradient(white, #f9fafb) padding-box, linear-gradient(to right, #1f2937, #0f766e) border-box'
                            : isAvailableForSelectedStaff
                              ? 'linear-gradient(to bottom right, #f0fdf4, #dcfce7)'
                              : 'linear-gradient(to bottom right, white, #f9fafb)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isDisabled && !isSelected) {
                          if (isAvailableForSelectedStaff) {
                            e.currentTarget.style.background = 'linear-gradient(to bottom right, #dcfce7, #bbf7d0)'
                          } else {
                            e.currentTarget.style.background = 'linear-gradient(white, #f9fafb) padding-box, linear-gradient(to right, #1f2937, #0f766e) border-box'
                          }
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDisabled && !isSelected) {
                          if (isAvailableForSelectedStaff) {
                            e.currentTarget.style.background = 'linear-gradient(to bottom right, #f0fdf4, #dcfce7)'
                          } else {
                            e.currentTarget.style.background = 'linear-gradient(to bottom right, white, #f9fafb)'
                            e.currentTarget.style.border = '2px solid #e5e7eb'
                          }
                        }
                      }}
                      onClick={() => !isDisabled && handleServiceSelect(service)}
                    >
                      <CardContent >
                        <div>
                          {/* Service Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className={`text-md md:text-lg font-bold ${
                                  isDisabled 
                                    ? 'text-red-700' 
                                    : isAvailableForSelectedStaff
                                      ? 'text-green-800'
                                      : 'text-gray-900'
                                }`}>{service.name}</h4>
                                {isSelected && (
                                  <div className="w-5 h-5 bg-custom-gradient rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                )}
                                {isAvailableForSelectedStaff && (
                                  <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                                    Disponueshëm
                                  </Badge>
                                )}
                              </div>
                              {service.description && (
                                <p className={`text-sm ${isDisabled ? 'text-red-600' : 'text-gray-600'}`}>
                                  {service.description}
                                </p>
                              )}
                              {isDisabled && selectedStaff && (
                                <p className="text-xs text-red-600 font-medium mt-1">
                                  Nuk ofrohet nga {selectedStaff.name}
                                </p>
                              )}
                            </div>
                            {service.price && service.price > 0 && (
                              <div className="ml-3 text-right">
                                <div className={`px-2 py-1 rounded-md ${
                                  isDisabled 
                                    ? 'bg-red-200' 
                                    : 'bg-custom-gradient'
                                }`}>
                                  <span className={`text-md md:text-lg font-bold ${
                                    isDisabled ? 'text-red-800' : 'text-white'
                                  }`}>{service.price}€</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Service Details */}
                          {service.duration && (
                            <div className="flex items-center">
                              <div className={`flex items-center gap-1 ${
                                isDisabled ? 'text-red-600' : 'text-teal-800'
                              }`}>
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium">{service.duration}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nuk ka shërbime të disponueshme për këtë biznes.</p>
                  </div>
                )}
              </div>
            )}

            {/* Staff Selection - Show after at least one service is selected */}
            {selectedServices.length > 0 && (() => {
              // Show staff selection if there are staff members, otherwise allow proceeding without staff
              if (availableStaff.length > 0) {
                return (
                  <div className="md:space-y-3 space-y-2">
                    <div className="text-center">
                      <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-2">
                        Zgjidhni stafin që dëshironi të ofrojë shërbimet për ju:
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {selectedServices.map(s => s.name).join(', ')}
                      </p>
                    </div>
                    
                    <div className={`grid gap-3 ${
                      availableStaff.length === 1 
                        ? 'grid-cols-1 max-w-md mx-auto' 
                        : availableStaff.length === 2 
                          ? 'grid-cols-1 md:grid-cols-2' 
                          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    }`}>
                      {availableStaff.map((member: any, index: number) => (
                        <Card 
                          key={index} 
                          className={`cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-gray-200 hover:border-transparent hover:scale-[1.02] bg-gradient-to-br from-white to-gray-50 relative ${
                            selectedStaff?.name === member.name ? 'border-transparent' : ''
                          }`}
                          style={{
                            background: selectedStaff?.name === member.name 
                              ? 'linear-gradient(white, #f9fafb) padding-box, linear-gradient(to right, #1f2937, #0f766e) border-box'
                              : 'linear-gradient(to bottom right, white, #f9fafb)'
                          }}
                          onMouseEnter={(e) => {
                            if (selectedStaff?.name !== member.name) {
                              e.currentTarget.style.background = 'linear-gradient(white, #f9fafb) padding-box, linear-gradient(to right, #1f2937, #0f766e) border-box'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedStaff?.name !== member.name) {
                              e.currentTarget.style.background = 'linear-gradient(to bottom right, white, #f9fafb)'
                              e.currentTarget.style.border = '2px solid #e5e7eb'
                            }
                          }}
                          onClick={() => {
                            setSelectedStaff(member)
                            // Don't auto-move - let user select services first
                            // Check if any selected services are not available for this staff
                            if (selectedServices.length > 0) {
                              const unavailableServices = selectedServices.filter(s => !isServiceAvailableForStaff(s, member))
                              if (unavailableServices.length > 0) {
                                toast({
                                  title: "Shërbime të padisponueshme",
                                  description: `${member.name} nuk mund të ofrojë: ${unavailableServices.map(s => s.name).join(', ')}`,
                                  variant: "destructive",
                                })
                                // Remove unavailable services
                                setSelectedServices(selectedServices.filter(s => isServiceAvailableForStaff(s, member)))
                              }
                            }
                          }}
                        >
                          <CardContent className="py-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-custom-gradient rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h5 className="text-lg font-bold text-gray-900">{member.name}</h5>
                                  {member.specialization && (
                                    <p className="text-sm text-gray-600">{member.specialization}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              }
              
              // If no staff available, allow proceeding without staff selection
              return (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">Nuk ka staf të caktuar për këto shërbime. Mund të vazhdoni pa zgjedhur staf.</p>
                </div>
              );
            })()}

          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            {/* Calendar - Show first, disappear after date selection */}
            {!selectedDate && (
              <div className="flex justify-center items-center min-h-[400px] md:min-h-[450px] lg:min-h-[500px]">
                <div className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto px-4">
                  <h4 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 text-center">Zgjidhni Datën</h4>
                  <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 mx-auto">
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={isDateDisabled}
                        className="scale-95 sm:scale-100 md:scale-95 origin-center [&_.rdp-caption]:!text-lg sm:[&_.rdp-caption]:!text-xl [&_.rdp-caption]:!font-bold [&_.rdp-caption]:!text-gray-800 [&_.rdp-caption]:!mb-3 sm:[&_.rdp-caption]:!mb-4 [&_.rdp-nav_button]:!w-8 [&_.rdp-nav_button]:!h-8 sm:[&_.rdp-nav_button]:!w-10 sm:[&_.rdp-nav_button]:!h-10 [&_.rdp-nav_button]:!text-base sm:[&_.rdp-nav_button]:!text-lg [&_.rdp-nav_button]:!font-bold [&_.rdp-weekday]:!text-sm sm:[&_.rdp-weekday]:!text-base [&_.rdp-weekday]:!font-semibold [&_.rdp-weekday]:!text-gray-600 [&_.rdp-weekday]:!py-1 sm:[&_.rdp-weekday]:!py-2 [&_.rdp-day]:!w-8 [&_.rdp-day]:!h-8 sm:[&_.rdp-day]:!w-10 sm:[&_.rdp-day]:!h-10 md:[&_.rdp-day]:!w-12 md:[&_.rdp-day]:!h-12 [&_.rdp-day]:!text-sm sm:[&_.rdp-day]:!text-base [&_.rdp-day]:!font-medium [&_.rdp-day]:!rounded-lg [&_.rdp-day]:!transition-all [&_.rdp-day]:!duration-200 [&_[data-selected-single=true]]:!bg-gradient-to-r [&_[data-selected-single=true]]:!from-gray-800 [&_[data-selected-single=true]]:!to-teal-800 [&_[data-selected-single=true]]:!text-white [&_[data-selected-single=true]]:!border-0 [&_[data-selected-single=true]]:!rounded-lg [&_[data-selected-single=true]]:!shadow-lg [&_[data-selected-single=true]]:!scale-105 [&_td.rdp-today]:!bg-gradient-to-r [&_td.rdp-today]:!from-gray-600 [&_td.rdp-today]:!to-gray-700 [&_td.rdp-today]:!text-white [&_td.rdp-today]:!border-0 [&_td.rdp-today]:!rounded-lg [&_td.rdp-today]:!shadow-md [&_td.rdp-today[data-selected-single=true]]:!bg-gradient-to-r [&_td.rdp-today[data-selected-single=true]]:!from-gray-800 [&_td.rdp-today[data-selected-single=true]]:!to-teal-800 [&_td.rdp-today[data-selected-single=true]]:!text-white [&_td.rdp-today[data-selected-single=true]]:!border-0 [&_td.rdp-today[data-selected-single=true]]:!rounded-lg [&_td.rdp-today[data-selected-single=true]]:!shadow-lg [&_td.rdp-today[data-selected-single=true]]:!scale-105 [&_.rdp-day]:hover:!bg-gradient-to-r [&_.rdp-day]:hover:!from-gray-800 [&_.rdp-day]:hover:!via-teal-800 [&_.rdp-day]:hover:!to-purple-800/60 [&_.rdp-day]:hover:!text-white [&_.rdp-day]:hover:!rounded-lg [&_.rdp-day]:hover:!shadow-md [&_.rdp-day]:hover:!scale-105 [&_.rdp-button_previous]:!bg-transparent [&_.rdp-button_previous]:hover:!bg-transparent [&_.rdp-button_previous]:hover:!bg-gradient-to-r [&_.rdp-button_previous]:hover:!from-gray-600 [&_.rdp-button_previous]:hover:!to-gray-700 [&_.rdp-button_previous]:hover:!text-white [&_.rdp-button_previous]:hover:!rounded-lg [&_.rdp-button_previous]:hover:!shadow-lg [&_.rdp-button_previous]:hover:!border-0 [&_.rdp-button_next]:!bg-transparent [&_.rdp-button_next]:hover:!bg-transparent [&_.rdp-button_next]:hover:!bg-gradient-to-r [&_.rdp-button_next]:hover:!from-gray-600 [&_.rdp-button_next]:hover:!to-gray-700 [&_.rdp-button_next]:hover:!text-white [&_.rdp-button_next]:hover:!rounded-lg [&_.rdp-button_next]:hover:!shadow-lg [&_.rdp-button_next]:hover:!border-0"
                        locale={sq}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Time Slots - Show after date selection */}
            {selectedDate && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Zgjidhni Orën</h3>
                  <p className="text-gray-600 mb-4">Zgjidhni orën për ditën e {format(selectedDate, "EEEE, d MMMM", { locale: sq })}.</p>
                  
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 max-h-80 overflow-y-auto">
                  {availableTimeSlots.length > 0 ? (
                    availableTimeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        className={`justify-center text-sm py-3 ${
                          selectedTime === time 
                            ? "bg-custom-gradient text-white" 
                            : "hover:bg-gray-50 hover:text-black"
                        }`}
                        onClick={() => handleTimeSelect(time)}
                      >
                        {time}
                      </Button>
                    ))
                  ) : (
                      <div className="col-span-3 flex items-center justify-center py-8">
                        <p className="text-gray-500">Nuk ka orë të disponueshme për këtë ditë.</p>
                      </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Ju lutemi shënoni të dhënat tuaja</h3>
            </div>

            {selectedServices.length > 0 && selectedDate && selectedTime && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg">
                <button
                  onClick={() => setIsSummaryOpen(!isSummaryOpen)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100 transition-colors"
                >
                  <h4 className="font-semibold text-gray-900">Përmbledhja e Rezervimit</h4>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                      isSummaryOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isSummaryOpen && (
                  <div className="px-4 pb-4">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Shërbimet: </span>
                        <div className="mt-1">
                          {selectedServices.map((service, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{service.name}</span>
                              {service.price && service.price > 0 && (
                                <span className="text-gray-600 ml-2">{service.price}€</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {selectedStaff && (
                        <div>
                          <span className="text-gray-600">Stafi: </span>
                          <span className="font-medium text-gray-900">{selectedStaff.name}</span>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-gray-600">Data dhe Ora: </span>
                        <span className="font-medium text-gray-900">
                          e {format(selectedDate, "EEEE, d MMMM", { locale: sq })} në {selectedTime}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-gray-600">Kohëzgjatja totale: </span>
                        <span className="font-medium text-gray-900">{serviceDuration} minuta</span>
                      </div>
                      
                      {calculateTotalPrice() > 0 && (
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-gray-600">Çmimi total: </span>
                          <span className="font-semibold text-gray-900">{calculateTotalPrice()}€</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 text-md md:text-lg font-semibold">Emri i Plotë</FormLabel>
                      <FormControl>
                        <Input placeholder="Shkruani emrin tuaj të plotë" className="py-5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 text-md md:text-lg font-semibold">Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Shkruani email-in tuaj" className="py-5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 text-md md:text-lg font-semibold">Numri i Telefonit</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Shkruani numrin tuaj të telefonit" className="py-5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 text-md md:text-lg font-semibold">Shënime Shtesë (Opsionale)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Çdo kërkesë e veçantë ose shënime për terminin tuaj"
                          className="resize-none py-5"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-custom-gradient" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Duke përpunuar..." : "Konfirmo Rezervimin"}
                </Button>
              </form>
            </Form>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Progress Bar */}
      <div className="flex items-center justify-center space-x-4 mb-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step <= currentStep
                  ? "bg-custom-gradient text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {step < currentStep ? <Check className="w-3 h-3" /> : step}
            </div>
            {step < 3 && (
              <div
                className={`w-12 h-1 mx-2 ${
                  step < currentStep ? "bg-custom-gradient" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px] mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t">
        {/* Show appropriate back button based on current step */}
        {currentStep === 1 && selectedServices.length > 0 ? (
          <Button
            onClick={() => {
              setSelectedServices([])
              setSelectedStaff(null)
            }}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zgjidh shërbime të tjera
          </Button>
        ) : currentStep === 2 && selectedDate ? (
          <Button
            onClick={() => {
              setSelectedDate(null)
              setSelectedTime(null)
            }}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zgjidh datë tjetër
          </Button>
        ) : (
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 1 && (selectedServices?.length ?? 0) === 0}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Prapa
          </Button>
        )}

        {currentStep < 3 && (
          <Button
            onClick={handleNext}
            disabled={
              (currentStep === 1 && selectedServices.length === 0) ||
              (currentStep === 1 && selectedServices.length > 0 && getAvailableStaff().length > 0 && !selectedStaff) ||
              (currentStep === 1 && selectedStaff && !areAllServicesAvailableForStaff()) ||
              (currentStep === 2 && (!selectedDate || !selectedTime))
            }
            className="bg-custom-gradient  text-white"
          >
            Vazhdo
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
        
        {/* Warning message if services are not available for selected staff */}
        {currentStep === 1 && selectedStaff && selectedServices.length > 0 && !areAllServicesAvailableForStaff() && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium">
              ⚠️ {selectedStaff.name} nuk mund të ofrojë të gjitha shërbimet e zgjedhura. Ju lutemi zgjidhni shërbime të tjera ose staf tjetër.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
