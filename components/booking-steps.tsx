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

// Generate time slots based on business operating hours
const generateTimeSlots = (operatingHours: any, selectedDate: Date, business: any, selectedStaff: any) => {
  if (!operatingHours || !selectedDate) return []
  
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayOfWeek = dayNames[selectedDate.getDay()]
  const dayHours = operatingHours[dayOfWeek]
  
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
  
  // Generate 15-minute slots when all slots are free
  const interval = 15 // 15-minute intervals
  for (let minutes = startMinutes; minutes < endMinutes; minutes += interval) {
    const hour = Math.floor(minutes / 60)
    const min = minutes % 60
    const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
    slots.push(timeString)
  }
  
  return slots
}

// Check if a time slot is in break time
const isTimeSlotInBreakTime = (timeSlot: string, business: any, selectedStaff: any) => {
  if (!business?.staff) return false
  
  return business.staff.some((staff: any) => {
    // If selectedStaff is specified, only check that specific staff member
    if (selectedStaff && staff.name !== selectedStaff.name) {
      return false
    }
    
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
  
  return business.staff.some((staff: any) => {
    // If selectedStaff is specified, only check that specific staff member
    if (selectedStaff && staff.name !== selectedStaff.name) {
      return false
    }
    
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
  const [selectedService, setSelectedService] = useState<any>(null)
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

  // Check if a time slot has a booking
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
      
      // Check if this time slot is covered by this booking
      const bookingSlots = getBookingTimeSlots(booking)
      return bookingSlots.includes(timeSlot)
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
      const isTimeInRange = timeSlot >= slot.startTime && timeSlot <= slot.endTime
      const isStaffMatch = !slot.staffName || !selectedStaff || slot.staffName === selectedStaff.name
      
      return isSameDate && isTimeInRange && isStaffMatch
    })
  }

  const availableTimeSlots = selectedDate ? 
    generateTimeSlots(business.operating_hours, selectedDate, business, selectedStaff).filter(time => {
      // Check basic availability
      if (isTimeSlotBlocked(selectedDate, time) || hasBookingAtTime(selectedDate, time) || isTimeSlotInBreakTime(time, business, selectedStaff)) {
        return false
      }
      
      // Check if service would overlap with break time
      if (selectedService) {
        const serviceDuration = (() => {
          const duration = selectedService?.duration || 30
          // If duration is a string like "30 min", extract the number
          if (typeof duration === 'string') {
            const match = duration.match(/\d+/)
            return match ? parseInt(match[0]) : 30
          }
          // If duration is already a number, use it
          return typeof duration === 'number' ? duration : 30
        })()
        
        if (wouldServiceOverlapWithBreakTime(time, serviceDuration, business, selectedStaff)) {
          return false
        }
      }
      
      return true
    }) : []

  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date())
    const isPastDate = !isAfter(date, today) && !isSameDay(date, today)
    
    // Also check if business is closed on this day
    if (business.operating_hours) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayOfWeek = dayNames[date.getDay()]
      const dayHours = business.operating_hours[dayOfWeek]
      
      if (dayHours && dayHours.closed) {
        return true
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
    setSelectedService(service)
    
    // Always reset staff selection to allow user to choose
    setSelectedStaff(null)
    
    // Stay in step 1 to show staff selection
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

    try {
      // Create booking data
      const bookingData = {
        businessId: business.id,
        serviceName: selectedService?.name || '',
        staffName: selectedStaff?.name || '',
        appointmentDate: format(selectedDate!, "yyyy-MM-dd"),
        appointmentTime: selectedTime,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        notes: data.notes || '',
        totalPrice: selectedService?.price || 0,
        serviceDuration: (() => {
          const duration = selectedService?.duration || 30
          // If duration is a string like "30 min", extract the number
          if (typeof duration === 'string') {
            const match = duration.match(/\d+/)
            return match ? parseInt(match[0]) : 30
          }
          // If duration is already a number, use it
          return typeof duration === 'number' ? duration : 30
        })()
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
      router.push(
        `/rezervimi-u-konfirmua?business=${business.name}&date=${format(selectedDate!, "yyyy-MM-dd")}&time=${selectedTime}&bookingId=${result.id}`,
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Welcome Message */}
            <div className={`text-center mb-4 transition-all duration-700 ease-out ${
              showWelcome ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <p className="text-gray-600 text-lg">Mirëseerdhet në</p>
            </div>

            {/* Business Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-6 mb-4">
                {business.logo && (
                  <div className={`w-28 h-28 relative rounded-full overflow-hidden shadow-lg border-4 border-white flex-shrink-0 transition-all duration-700 ease-out ${
                    showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                  }`}>
                    <img
                      src={business.logo}
                      alt={`${business.name} logo`}
                      className="w-full h-full object-contain bg-white"
                    />
                  </div>
                )}
                <div className="text-center">
                  <h2 className={`text-2xl font-bold text-gray-900 mb-2 transition-all duration-700 ease-out ${
                    showBusinessName ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    {business.name}
                  </h2>
                  <p className={`text-gray-600 transition-all duration-700 ease-out ${
                    showDescription ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    {business.description}
                  </p>
                </div>
              </div>
              
              {/* Separation Line */}
              <div className={`border-t border-gray-200 pt-6 transition-all duration-700 ease-out ${
                showInstruction ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <p className="text-gray-600 text-lg">Plotësoni hapat më poshtë për të rezervuar terminin tuaj</p>
              </div>
            </div>

            {/* Service Selection - Only show if no service selected */}
            {!selectedService && (
              <>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Zgjidhni shërbimin që dëshironi të rezervoni</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {business.services && business.services.length > 0 ? (
                    business.services.map((service: any, index: number) => (
                      <Card 
                        key={index} 
                        className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-teal-800"
                        onClick={() => handleServiceSelect(service)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{service.name}</h4>
                              {service.description && (
                                <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2">
                                {service.duration && (
                                  <div className="flex items-center gap-1 text-sm text-gray-500">
                                    <Clock className="w-4 h-4" />
                                    <span>{service.duration}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {service.price && (
                              <div className="text-right">
                                <span className="text-lg font-bold text-teal-800">{service.price}€</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nuk ka shërbime të disponueshme për këtë biznes.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Staff Selection - Show after service is selected */}
            {selectedService && (() => {
              const availableStaff = business.staff?.filter((member: any) => 
                member.isActive !== false && 
                member.services?.some((s: any) => 
                  typeof s === 'string' ? s === selectedService.name : s.name === selectedService.name
                )
              ) || [];
              
              // Always show staff selection if there are staff members
              if (availableStaff.length > 0) {
                return (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Zgjidhni Stafin</h3>
                      <p className="text-gray-600">Zgjidhni stafin që do të ofrojë shërbimin "{selectedService.name}"</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availableStaff.map((member: any, index: number) => (
                        <Card 
                          key={index} 
                          className={`cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-teal-800 ${
                            selectedStaff?.name === member.name ? 'border-teal-800 bg-teal-50' : ''
                          }`}
                          onClick={() => {
                            setSelectedStaff(member)
                            // Auto-move to next step after staff selection
                            setTimeout(() => setCurrentStep(2), 500)
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{member.name}</h5>
                                {member.specialization && (
                                  <p className="text-sm text-gray-600">{member.specialization}</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              }
              
              // If no staff available, show message
              return (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nuk ka staf të disponueshëm për këtë shërbim.</p>
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
              <div className="flex justify-center items-center min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
                <div className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto px-4">
                  <h4 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 text-center">Zgjidhni Datën</h4>
                  <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-12 mx-auto">
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={isDateDisabled}
                        className="scale-100 sm:scale-110 md:scale-125 origin-center [&_.rdp-caption]:!text-lg sm:[&_.rdp-caption]:!text-xl [&_.rdp-caption]:!font-bold [&_.rdp-caption]:!text-gray-800 [&_.rdp-caption]:!mb-3 sm:[&_.rdp-caption]:!mb-4 [&_.rdp-nav_button]:!w-8 [&_.rdp-nav_button]:!h-8 sm:[&_.rdp-nav_button]:!w-10 sm:[&_.rdp-nav_button]:!h-10 [&_.rdp-nav_button]:!text-base sm:[&_.rdp-nav_button]:!text-lg [&_.rdp-nav_button]:!font-bold [&_.rdp-weekday]:!text-sm sm:[&_.rdp-weekday]:!text-base [&_.rdp-weekday]:!font-semibold [&_.rdp-weekday]:!text-gray-600 [&_.rdp-weekday]:!py-1 sm:[&_.rdp-weekday]:!py-2 [&_.rdp-day]:!w-8 [&_.rdp-day]:!h-8 sm:[&_.rdp-day]:!w-10 sm:[&_.rdp-day]:!h-10 md:[&_.rdp-day]:!w-12 md:[&_.rdp-day]:!h-12 [&_.rdp-day]:!text-sm sm:[&_.rdp-day]:!text-base [&_.rdp-day]:!font-medium [&_.rdp-day]:!rounded-lg [&_.rdp-day]:!transition-all [&_.rdp-day]:!duration-200 [&_[data-selected-single=true]]:!bg-gradient-to-r [&_[data-selected-single=true]]:!from-gray-800 [&_[data-selected-single=true]]:!to-teal-800 [&_[data-selected-single=true]]:!text-white [&_[data-selected-single=true]]:!border-0 [&_[data-selected-single=true]]:!rounded-lg [&_[data-selected-single=true]]:!shadow-lg [&_[data-selected-single=true]]:!scale-105 [&_td.rdp-today]:!bg-gradient-to-r [&_td.rdp-today]:!from-gray-600 [&_td.rdp-today]:!to-gray-700 [&_td.rdp-today]:!text-white [&_td.rdp-today]:!border-0 [&_td.rdp-today]:!rounded-lg [&_td.rdp-today]:!shadow-md [&_td.rdp-today[data-selected-single=true]]:!bg-gradient-to-r [&_td.rdp-today[data-selected-single=true]]:!from-gray-800 [&_td.rdp-today[data-selected-single=true]]:!to-teal-800 [&_td.rdp-today[data-selected-single=true]]:!text-white [&_td.rdp-today[data-selected-single=true]]:!border-0 [&_td.rdp-today[data-selected-single=true]]:!rounded-lg [&_td.rdp-today[data-selected-single=true]]:!shadow-lg [&_td.rdp-today[data-selected-single=true]]:!scale-105 [&_.rdp-day]:hover:!bg-gradient-to-r [&_.rdp-day]:hover:!from-gray-700 [&_.rdp-day]:hover:!to-teal-700 [&_.rdp-day]:hover:!text-white [&_.rdp-day]:hover:!rounded-lg [&_.rdp-day]:hover:!shadow-md [&_.rdp-day]:hover:!scale-105 [&_.rdp-button_previous]:!bg-transparent [&_.rdp-button_previous]:hover:!bg-transparent [&_.rdp-button_previous]:hover:!bg-gradient-to-r [&_.rdp-button_previous]:hover:!from-gray-600 [&_.rdp-button_previous]:hover:!to-gray-700 [&_.rdp-button_previous]:hover:!text-white [&_.rdp-button_previous]:hover:!rounded-lg [&_.rdp-button_previous]:hover:!shadow-lg [&_.rdp-button_previous]:hover:!border-0 [&_.rdp-button_next]:!bg-transparent [&_.rdp-button_next]:hover:!bg-transparent [&_.rdp-button_next]:hover:!bg-gradient-to-r [&_.rdp-button_next]:hover:!from-gray-600 [&_.rdp-button_next]:hover:!to-gray-700 [&_.rdp-button_next]:hover:!text-white [&_.rdp-button_next]:hover:!rounded-lg [&_.rdp-button_next]:hover:!shadow-lg [&_.rdp-button_next]:hover:!border-0"
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
                  
                  {/* Reselect Date Button */}
                  <Button 
                    onClick={() => {
                      setSelectedDate(undefined)
                      setSelectedTime("")
                    }}
                    variant="outline"
                    size="sm"
                    className="text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Zgjidh Datë Tjetër
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 max-h-80 overflow-y-auto">
                  {availableTimeSlots.length > 0 ? (
                    availableTimeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        className={`justify-center text-sm py-3 ${
                          selectedTime === time 
                            ? "bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white" 
                            : "hover:bg-gray-50 hover:text-black"
                        }`}
                        onClick={() => handleTimeSelect(time)}
                      >
                        {time}
                      </Button>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-8">
                      <p className="text-gray-500">Nuk ka orë të disponueshme për këtë ditë.</p>
                      <Button 
                        onClick={() => setSelectedDate(undefined)}
                        variant="outline"
                        className="mt-4"
                      >
                        Zgjidh Datë Tjetër
                      </Button>
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ju lutemi shënoni të dhënat tuaja</h3>
            </div>

            {selectedService && selectedDate && selectedTime && (
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
                        <span className="text-gray-600">Shërbimi: </span>
                        <span className="font-medium text-gray-900">{selectedService.name}</span>
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
                          {format(selectedDate, "EEEE, d MMMM", { locale: sq })} në {selectedTime}
                        </span>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-200">
                        <span className="text-gray-600">Çmimi: </span>
                        <span className="font-semibold text-gray-900">{selectedService.price}€</span>
                      </div>
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
                      <FormLabel className="text-gray-700 text-lg font-semibold">Emri i Plotë</FormLabel>
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
                      <FormLabel className="text-gray-700 text-lg font-semibold">Email</FormLabel>
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
                      <FormLabel className="text-gray-700 text-lg font-semibold">Numri i Telefonit</FormLabel>
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
                      <FormLabel className="text-gray-700 text-lg font-semibold">Shënime Shtesë (Opsionale)</FormLabel>
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
                  className="w-full bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700" 
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
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep
                  ? "bg-gradient-to-r from-gray-800 to-teal-800 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {step < currentStep ? <Check className="w-4 h-4" /> : step}
            </div>
            {step < 3 && (
              <div
                className={`w-12 h-1 mx-2 ${
                  step < currentStep ? "bg-gradient-to-r from-gray-800 to-teal-800" : "bg-gray-200"
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
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Prapa
        </Button>

        {currentStep < 3 && (
          <Button
            onClick={handleNext}
            disabled={
              (currentStep === 1 && !selectedService) ||
              (currentStep === 1 && selectedService && business.staff && business.staff.length > 1 && !selectedStaff) ||
              (currentStep === 2 && (!selectedDate || !selectedTime))
            }
            className="bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white"
          >
            Vazhdo
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
