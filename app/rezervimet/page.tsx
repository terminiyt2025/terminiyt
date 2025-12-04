"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/header"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Calendar, Clock, User, Phone, Mail, Euro, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"

interface Business {
  id: number
  name: string
  staff?: any[]
  services?: any[]
  operating_hours?: any
}

interface Booking {
  id: number
  serviceName: string
  staffName?: string
  appointmentDate: string
  appointmentTime: string
  customerName: string
  customerEmail: string
  customerPhone: string
  notes?: string
  totalPrice?: number
  price?: number
  status: string
  serviceDuration?: number
  createdAt: string
}

export default function ReservationsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [business, setBusiness] = useState<Business | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [blockedSlots, setBlockedSlots] = useState<any[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([])
  const [expandedTimeSlots, setExpandedTimeSlots] = useState<string[]>([])
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showBookingsList, setShowBookingsList] = useState(false)
  const [showBlockedSlots, setShowBlockedSlots] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState<{
    show: boolean
    booking: {
      id: number
      customerName: string
      appointmentTime: string
      serviceName: string
    } | null
  }>({ show: false, booking: null })
  const { toast } = useToast()
  const router = useRouter()

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is staff
        const staffAuthData = localStorage.getItem('staffAuth')
        if (staffAuthData) {
          const parsedStaffData = JSON.parse(staffAuthData)
          const { businessId, staffName, role } = parsedStaffData
          console.log('Staff auth data:', parsedStaffData)
          
          if (businessId) {
            setIsAuthenticated(true)
            await fetchBusinessData(businessId)
            await fetchBookings(businessId)
            await fetchBlockedSlots(businessId)
            
            // If staff (not MANAGER), auto-select their name and filter bookings
            if (role === 'STAFF' && staffName) {
              setSelectedStaff(staffName)
            }
            // If MANAGER, show all bookings (selectedStaff remains empty or 'all')
            
            setIsLoading(false)
            return
          }
        }
        
        // Check if user is business owner
        const businessAuthData = localStorage.getItem('businessAuth')
        console.log('Business auth data:', businessAuthData)
        
        if (businessAuthData) {
          const parsedData = JSON.parse(businessAuthData)
          const { businessId } = parsedData
          console.log('Business ID:', businessId)
          
           if (businessId) {
             setIsAuthenticated(true)
             await fetchBusinessData(businessId)
             await fetchBookings(businessId)
             await fetchBlockedSlots(businessId)
           } else {
            console.log('No business ID found')
            router.push('/identifikohu')
          }
        } else {
          console.log('No auth data found')
          router.push('/identifikohu')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/identifikohu')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Auto-open bookings list if reservations exist for selected date
  useEffect(() => {
    if (bookings.length > 0 && business) {
      const hasReservationsForDate = getBookingsForDate(selectedDate, selectedStaff === 'all' ? undefined : selectedStaff).length > 0
      if (hasReservationsForDate) {
        setShowBookingsList(true)
      }
    }
  }, [selectedDate, selectedStaff, bookings, business])

  // Refresh blocked slots when date or staff changes
  useEffect(() => {
    if (business && isAuthenticated) {
      fetchBlockedSlots(business.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedStaff])

  const fetchBusinessData = async (businessId: number) => {
    try {
      console.log('Fetching business data for ID:', businessId)
      const response = await fetch(`/api/businesses/${businessId}`)
      if (response.ok) {
        const businessData = await response.json()
        console.log('Business data fetched:', businessData)
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

  // Auto-complete past reservations
  const autoCompletePastReservations = async () => {
    if (!business) return

    try {
      const now = new Date()
      
      // Find reservations that are past their service finish time and still confirmed
      const pastReservations = bookings.filter(booking => {
        if (booking.status !== 'CONFIRMED') return false
        
        // Get service duration
        const serviceDuration = booking.serviceDuration ?? getServiceDuration(booking.serviceName)
        const durationMinutes = typeof serviceDuration === 'number' ? serviceDuration : 30
        
        // Calculate service finish time
        const [hours, minutes] = booking.appointmentTime.split(':').map(Number)
        const serviceEndTime = new Date(booking.appointmentDate)
        serviceEndTime.setHours(hours, minutes + durationMinutes, 0, 0)
        
        // Check if service finish time has passed
        return serviceEndTime < now
      })

      if (pastReservations.length > 0) {
        // Update all past reservations to completed
        const promises = pastReservations.map(booking => 
          updateBookingStatus(booking.id, 'COMPLETED')
        )
        
        await Promise.all(promises)
        
        // Refresh bookings data
        await fetchBookings(business.id)
        
        console.log(`Auto-completed ${pastReservations.length} past reservations`)
      }
    } catch (error) {
      console.error('Error auto-completing past reservations:', error)
    }
  }

  // Check for past reservations when component mounts and date changes
  useEffect(() => {
    if (business && bookings.length > 0) {
      autoCompletePastReservations()
    }
  }, [selectedDate, business, bookings.length])

  // Daily check for past reservations (runs every 24 hours)
  useEffect(() => {
    const checkPastReservations = () => {
      if (business && bookings.length > 0) {
        autoCompletePastReservations()
      }
    }

    // Run immediately
    checkPastReservations()

    // Set up interval to check every 24 hours
    const interval = setInterval(checkPastReservations, 24 * 60 * 60 * 1000) // 24 hours

    return () => clearInterval(interval)
  }, [business, bookings.length])

  const fetchBookings = async (businessId: number) => {
    try {
      console.log('Fetching bookings for business ID:', businessId)
      const response = await fetch(`/api/bookings?businessId=${businessId}`)
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (response.ok) {
        const bookingsData = await response.json()
        console.log('Bookings data:', bookingsData)
        setBookings(bookingsData)
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(`Failed to fetch bookings: ${errorData.error || response.statusText}`)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast({
        title: "Gabim",
        description: `Nuk mund të merren rezervimet: ${error instanceof Error ? error.message : 'Gabim i panjohur'}`,
        variant: "destructive"
      })
    }
  }

  const fetchBlockedSlots = async (businessId: number) => {
    try {
      console.log('Fetching blocked slots for business ID:', businessId)
      const response = await fetch(`/api/blocked-slots?businessId=${businessId}`)
      if (response.ok) {
        const blockedSlotsData = await response.json()
        console.log('Blocked slots data:', blockedSlotsData)
        setBlockedSlots(blockedSlotsData)
      } else {
        throw new Error('Failed to fetch blocked slots')
      }
    } catch (error) {
      console.error('Error fetching blocked slots:', error)
      toast({
        title: "Gabim",
        description: "Nuk mund të merren slotat e bllokuara",
        variant: "destructive"
      })
    }
  }

  const filteredBookings = bookings.filter(booking => 
    selectedStaff === 'all' || booking.staffName === selectedStaff
  )

  const getBookingsForDate = (date: Date, staffName?: string) => {
    // Use local date format to avoid timezone issues
    const dateString = date.getFullYear() + '-' + 
                      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(date.getDate()).padStart(2, '0')
    
    return filteredBookings.filter(booking => {
      // Parse booking date and convert to local date string
      const bookingDateObj = new Date(booking.appointmentDate)
      const bookingDate = bookingDateObj.getFullYear() + '-' + 
                         String(bookingDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(bookingDateObj.getDate()).padStart(2, '0')
      
      const dateMatch = bookingDate === dateString
      const staffMatch = !staffName || booking.staffName === staffName
      const isNotCancelled = booking.status !== 'CANCELLED'
      
      console.log('getBookingsForDate check:', {
        selectedDate: dateString,
        bookingDate,
        dateMatch,
        staffMatch,
        isNotCancelled,
        bookingStatus: booking.status,
        bookingStaff: booking.staffName,
        requestedStaff: staffName
      })
      
      return dateMatch && staffMatch
    })
  }

  // Generate time slots for a specific date (same logic as booking flow)
  const generateTimeSlots = (date: Date, serviceDuration: number = 30) => {
    if (!business?.operating_hours) return []

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[date.getDay()]
    
    // Use staff operating hours if a specific staff is selected, otherwise use business hours
    let dayHours
    if (selectedStaff && selectedStaff !== 'all' && business?.staff) {
      const staffMember = business.staff.find((s: any) => s.name === selectedStaff)
      if (staffMember?.operatingHours?.[dayName]) {
        dayHours = staffMember.operatingHours[dayName]
      } else {
        // Fallback to business hours if staff doesn't have specific hours for this day
        dayHours = business.operating_hours[dayName]
      }
    } else {
      // Use business hours for 'all' staff or when no staff is selected
      dayHours = business.operating_hours[dayName]
    }

    if (!dayHours || dayHours.closed) return []

    const startTime = dayHours.open
    const endTime = dayHours.close
    const interval = 15 // 15-minute intervals

    const timeSlots = []
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    // Calculate the latest time slot that allows for service completion before closing
    const latestSlotTime = endMinutes - serviceDuration
    
    for (let minutes = startMinutes; minutes < endMinutes; minutes += interval) {
      const hour = Math.floor(minutes / 60)
      const minute = minutes % 60
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      
      // If it's today, only show future time slots
      if (isToday && minutes <= currentTime) {
        continue
      }
      
      // Only show slots that allow service completion before closing time
      if (minutes > latestSlotTime) {
        continue
      }
      
      timeSlots.push(timeString)
    }

    // Don't filter blocked slots - show them but disable selection
    return timeSlots
  }

  // Helper function to get service duration in minutes
  const getServiceDuration = (serviceName: string): number => {
    if (!business?.services) return 30 // Default 30 minutes
    
    const service = business.services.find((s: any) => s.name === serviceName)
    return service?.duration || 30 // Default 30 minutes if not found
  }

  // Helper function to calculate end time from start time and duration
  const getEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startTotalMinutes = hours * 60 + minutes
    const endTotalMinutes = startTotalMinutes + duration
    const endHours = Math.floor(endTotalMinutes / 60)
    const endMinutes = endTotalMinutes % 60
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  }

  // Helper function to get time slots covered by a booking
  const getBookingTimeSlots = (booking: Booking): string[] => {
    // Use the booking's serviceDuration if available, otherwise fall back to business service duration
    const duration = booking.serviceDuration || getServiceDuration(booking.serviceName)
    const startTime = booking.appointmentTime
    const slots: string[] = []
    
    console.log('getBookingTimeSlots:', {
      bookingId: booking.id,
      serviceName: booking.serviceName,
      startTime,
      serviceDuration: booking.serviceDuration,
      calculatedDuration: duration
    })
    
    // Parse start time
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const startTotalMinutes = startHours * 60 + startMinutes
    
    // Calculate how many 15-minute slots this service covers
    const slotCount = Math.ceil(duration / 15)
    
    console.log('Slot calculation:', {
      startTotalMinutes,
      slotCount,
      duration
    })
    
    // Generate all time slots for this booking
    for (let i = 0; i < slotCount; i++) {
      const slotTotalMinutes = startTotalMinutes + (i * 15)
      const slotHours = Math.floor(slotTotalMinutes / 60)
      const slotMinutes = slotTotalMinutes % 60
      const slotTime = `${slotHours.toString().padStart(2, '0')}:${slotMinutes.toString().padStart(2, '0')}`
      slots.push(slotTime)
    }
    
    console.log('Generated slots:', slots)
    return slots
  }

  // Check if a time slot has a booking or would conflict with existing bookings
  const hasBookingAtTime = (date: Date, timeSlot: string, staffName?: string) => {
    // Use local date format to avoid timezone issues
    const dateString = date.getFullYear() + '-' + 
                      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(date.getDate()).padStart(2, '0')
    
    console.log('Checking booking for date:', dateString, 'time:', timeSlot, 'staff:', staffName)
    console.log('Available bookings:', bookings)
    
    return bookings.some(booking => {
      // Parse booking date and convert to local date string
      const bookingDateObj = new Date(booking.appointmentDate)
      const bookingDate = bookingDateObj.getFullYear() + '-' + 
                         String(bookingDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(bookingDateObj.getDate()).padStart(2, '0')
      
      const dateMatch = bookingDate === dateString
      const staffMatch = !staffName || booking.staffName === staffName
      const isNotCancelled = booking.status !== 'CANCELLED'
      
      console.log('Booking check:', {
        originalBookingDate: booking.appointmentDate,
        parsedBookingDate: bookingDate,
        selectedDate: dateString,
        dateMatch,
        staffMatch,
        isNotCancelled,
        bookingStatus: booking.status,
        bookingStaff: booking.staffName,
        requestedStaff: staffName
      })
      
      if (!dateMatch || !staffMatch || !isNotCancelled) return false
      
      // Check for time overlap instead of just exact slot matches
      const bookingStartTime = booking.appointmentTime
      const bookingDuration = booking.serviceDuration || getServiceDuration(booking.serviceName)
      
      // Parse times to minutes for easier comparison
      const [bookingStartHour, bookingStartMin] = bookingStartTime.split(':').map(Number)
      const bookingStartMinutes = bookingStartHour * 60 + bookingStartMin
      const bookingEndMinutes = bookingStartMinutes + bookingDuration
      
      const [slotHour, slotMin] = timeSlot.split(':').map(Number)
      const slotStartMinutes = slotHour * 60 + slotMin
      const slotEndMinutes = slotStartMinutes + 15 // 15-minute slot duration
      
      // Check if the new booking would overlap with existing booking
      // Overlap occurs if: new start < existing end AND new end > existing start
      const isBlocked = slotStartMinutes < bookingEndMinutes && slotEndMinutes > bookingStartMinutes
      console.log('Time overlap check:', {
        bookingTime: bookingStartTime,
        bookingDuration: bookingDuration,
        bookingEnd: bookingEndMinutes,
        slotTime: timeSlot,
        slotStart: slotStartMinutes,
        slotEnd: slotEndMinutes,
        isBlocked
      })
      return isBlocked
    })
  }

  // Check if a time slot is blocked
  const isTimeSlotBlocked = (date: Date, timeSlot: string, staffName?: string) => {
    // Use local date format to avoid timezone issues
    const dateString = date.getFullYear() + '-' + 
                      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(date.getDate()).padStart(2, '0')
    
    const result = blockedSlots.some(slot => {
      // Handle different date formats - could be Date object, ISO string, or date string
      let slotDate: string
      if (typeof slot.date === 'string') {
        // If it's already a string (YYYY-MM-DD format), use it directly
        if (slot.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          slotDate = slot.date
        } else {
          // Otherwise parse it as a date
          const slotDateObj = new Date(slot.date)
          slotDate = slotDateObj.getFullYear() + '-' + 
                     String(slotDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(slotDateObj.getDate()).padStart(2, '0')
        }
      } else {
        // If it's a Date object or other format, parse it
        const slotDateObj = new Date(slot.date)
        slotDate = slotDateObj.getFullYear() + '-' + 
                   String(slotDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(slotDateObj.getDate()).padStart(2, '0')
      }
      
      const staffMatch = !staffName || !slot.staffName || slot.staffName === staffName
      
      if (slotDate !== dateString || !staffMatch) return false
      
      // Check for exact time match or overlap
      // For single slot blocking, check exact match first
      if (slot.startTime === timeSlot) {
        return true
      }
      
      // Check for time overlap with blocked slot (for range blocks)
      const [blockedHour, blockedMin] = slot.startTime.split(':').map(Number)
      const blockedMinutes = blockedHour * 60 + blockedMin
      
      // Get end time (could be same as start for single slot, or different for range)
      const [blockedEndHour, blockedEndMin] = (slot.endTime || slot.startTime).split(':').map(Number)
      const blockedEndMinutes = blockedEndHour * 60 + blockedEndMin
      
      const [timeSlotHour, timeSlotMin] = timeSlot.split(':').map(Number)
      const timeSlotStartMinutes = timeSlotHour * 60 + timeSlotMin
      const timeSlotEndMinutes = timeSlotStartMinutes + 15 // 15-minute slot duration
      
      // Check if the time slot overlaps with blocked time
      return timeSlotStartMinutes < blockedEndMinutes && timeSlotEndMinutes > blockedMinutes
    })
    
    // Debug logging
    if (timeSlot === '01:00' || blockedSlots.length > 0) {
      console.log('isTimeSlotBlocked check:', {
        dateString,
        timeSlot,
        staffName,
        blockedSlotsCount: blockedSlots.length,
        blockedSlots: blockedSlots.map(s => ({
          id: s.id,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          staffName: s.staffName
        })),
        result
      })
    }
    
    return result
  }

  // Check if a time slot is in break time
  const isTimeSlotInBreakTime = (timeSlot: string, staffName?: string) => {
    if (!business?.staff) return false
    
    // If a specific staff is selected, only check that staff member's break times
    if (staffName && staffName !== 'all') {
      const staffMember = business.staff.find((s: any) => s.name === staffName)
      if (!staffMember?.isActive || !staffMember.breakTimes || !Array.isArray(staffMember.breakTimes)) {
        return false
      }
      
      return staffMember.breakTimes.some((breakTime: any) => {
        if (!breakTime.startTime || !breakTime.endTime) return false
        return timeSlot >= breakTime.startTime && timeSlot < breakTime.endTime
      })
    }
    
    // For 'all' staff, check if any staff member has a break at this time
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

  // Helper function to get break time for a specific time slot
  const getBreakTimeForSlot = (timeSlot: string, staffName?: string): { startTime: string, endTime: string, staffName: string } | null => {
    if (!business?.staff) return null
    
    // If a specific staff is selected, only check that staff member's break times
    if (staffName && staffName !== 'all') {
      const staffMember = business.staff.find((s: any) => s.name === staffName)
      if (!staffMember?.isActive || !staffMember.breakTimes || !Array.isArray(staffMember.breakTimes)) {
        return null
      }
      
      const breakTime = staffMember.breakTimes.find((bt: any) => {
        if (!bt.startTime || !bt.endTime) return false
        return timeSlot >= bt.startTime && timeSlot < bt.endTime
      })
      
      return breakTime ? { startTime: breakTime.startTime, endTime: breakTime.endTime, staffName } : null
    }
    
    // For 'all' staff, find the first staff member with a break at this time
    for (const staff of business.staff) {
      if (!staff.isActive || !staff.breakTimes || !Array.isArray(staff.breakTimes)) {
        continue
      }
      
      const breakTime = staff.breakTimes.find((bt: any) => {
        if (!bt.startTime || !bt.endTime) return false
        return timeSlot >= bt.startTime && timeSlot < bt.endTime
      })
      
      if (breakTime) {
        return { startTime: breakTime.startTime, endTime: breakTime.endTime, staffName: staff.name }
      }
    }
    
    return null
  }

  // Helper function to get all time slots covered by a break time
  const getBreakTimeSlots = (startTime: string, endTime: string): string[] => {
    const allTimeSlots = generateTimeSlots(selectedDate, 30)
    const slots: string[] = []
    
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    const startTotalMinutes = startHour * 60 + startMin
    const endTotalMinutes = endHour * 60 + endMin
    
    // Generate all 15-minute slots within the break time range
    for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += 15) {
      const slotHours = Math.floor(minutes / 60)
      const slotMins = minutes % 60
      const slotTime = `${slotHours.toString().padStart(2, '0')}:${slotMins.toString().padStart(2, '0')}`
      
      if (allTimeSlots.includes(slotTime)) {
        slots.push(slotTime)
      }
    }
    
    return slots
  }

  // Block selected time slots
  const blockSelectedTimeSlots = async (staffName?: string) => {
    if (!business || selectedTimeSlots.length === 0) {
      toast({
        title: "Gabim",
        description: "Ju lutemi zgjidhni të paktën një slot kohor",
        variant: "destructive"
      })
      return
    }

    // Filter out already blocked slots
    const staffNameForCheck = staffName || (selectedStaff && selectedStaff !== 'all' ? selectedStaff : undefined)
    const alreadyBlockedSlots = selectedTimeSlots.filter(slot => 
      isTimeSlotBlocked(selectedDate, slot, staffNameForCheck)
    )
    
    if (alreadyBlockedSlots.length > 0) {
      toast({
        title: "Gabim",
        description: `Këto orare janë tashmë të bllokuara: ${alreadyBlockedSlots.join(', ')}`,
        variant: "destructive"
      })
      // Remove already blocked slots from selection
      setSelectedTimeSlots(prev => prev.filter(slot => !alreadyBlockedSlots.includes(slot)))
      return
    }

    try {
      // Format date as YYYY-MM-DD using local time to avoid timezone issues
      const dateString = selectedDate.getFullYear() + '-' + 
                        String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(selectedDate.getDate()).padStart(2, '0')
      
      const promises = selectedTimeSlots.map(timeSlot => 
        fetch('/api/blocked-slots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessId: business.id,
            staffName: staffName || null,
            date: dateString,
            startTime: timeSlot,
            endTime: timeSlot, // Same start and end time for single slot
            reason: 'Bllokuar nga biznesi'
          })
        })
      )

      await Promise.all(promises)
      
      toast({
        title: "Sukses",
        description: `${selectedTimeSlots.length} slot(e) u bllokuan me sukses`,
      })
      
      setShowBlockModal(false)
      setSelectedTimeSlots([])
      // Refresh blocked slots immediately
      await fetchBlockedSlots(business.id)
    } catch (error) {
      console.error('Error blocking time slots:', error)
      toast({
        title: "Gabim",
        description: "Nuk mund të bllokohen slotat",
        variant: "destructive"
      })
    }
  }

  // Delete blocked slot
  const deleteBlockedSlot = async (slotId: number) => {
    try {
      const response = await fetch(`/api/blocked-slots?id=${slotId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Sukses",
          description: "Sloti u zhbllokua me sukses",
        })
        if (business) {
          await fetchBlockedSlots(business.id)
        }
      } else {
        const errorData = await response.json()
        console.error('Delete failed:', errorData)
        throw new Error(errorData.error || 'Failed to delete blocked slot')
      }
    } catch (error) {
      console.error('Error deleting blocked slot:', error)
      toast({
        title: "Gabim",
        description: error instanceof Error ? error.message : "Nuk mund të zhbllokohet sloti",
        variant: "destructive"
      })
    }
  }

  // Update booking status
  const updateBookingStatus = async (bookingId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update booking status')
      }

      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus }
          : booking
      ))
      
      const statusText = newStatus === 'COMPLETED' ? 'përfunduar' : 'anuluar'
      toast({
        title: "Rezervimi u Përditësua",
        description: `Rezervimi u ${statusText} me sukses.`,
      })
    } catch (error) {
      console.error('Error updating booking status:', error)
      toast({
        title: "Gabim",
        description: error instanceof Error ? error.message : "Ndodhi një gabim gjatë përditësimit të rezervimit.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (date: Date) => {
    const dayNames = {
      'Monday': 'E hënë',
      'Tuesday': 'E martë', 
      'Wednesday': 'E mërkurë',
      'Thursday': 'E enjte',
      'Friday': 'E premte',
      'Saturday': 'E shtunë',
      'Sunday': 'E diel'
    }
    
    const englishDate = date.toLocaleDateString('en-US', {
      weekday: 'long'
    })
    
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    
    let albanianDay = englishDate
    Object.entries(dayNames).forEach(([en, sq]) => {
      albanianDay = albanianDay.replace(en, sq)
    })
    
        return (
          <span>
            <span >{albanianDay}</span>
            <span className="ml-1">({day}/{month}/{year})</span>
          </span>
        )
  }

  // Helper function to get time slots in a range
  const getTimeSlotsInRange = (startTime: string, endTime: string) => {
    const allTimeSlots = generateTimeSlots(selectedDate, 30)
    const startIndex = allTimeSlots.indexOf(startTime)
    const endIndex = allTimeSlots.indexOf(endTime)
    
    if (startIndex === -1 || endIndex === -1) return []
    
    const minIndex = Math.min(startIndex, endIndex)
    const maxIndex = Math.max(startIndex, endIndex)
    
    return allTimeSlots.slice(minIndex, maxIndex + 1)
  }

  // Handle single click for individual selection
  const handleTimeSlotClick = (timeSlot: string) => {
    const hasBooking = hasBookingAtTime(selectedDate, timeSlot)
    const staffNameForCheck = selectedStaff && selectedStaff !== 'all' ? selectedStaff : undefined
    const isBlocked = isTimeSlotBlocked(selectedDate, timeSlot, staffNameForCheck)
    const isInBreakTime = isTimeSlotInBreakTime(timeSlot, staffNameForCheck)
    
    if (hasBooking || isBlocked || isInBreakTime) {
      // Show a toast message if trying to select a blocked slot
      if (isBlocked) {
        toast({
          title: "Ora është e bllokuar",
          description: `Ora ${timeSlot} është tashmë e bllokuar dhe nuk mund të zgjidhet.`,
          variant: "destructive"
        })
      }
      return
    }

    const isSelected = selectedTimeSlots.includes(timeSlot)
    if (isSelected) {
      setSelectedTimeSlots(prev => prev.filter(t => t !== timeSlot))
    } else {
      setSelectedTimeSlots(prev => [...prev, timeSlot])
    }
  }

  // Handle double click for range selection
  const handleTimeSlotDoubleClick = (timeSlot: string) => {
    const hasBooking = hasBookingAtTime(selectedDate, timeSlot)
    const staffNameForCheck = selectedStaff && selectedStaff !== 'all' ? selectedStaff : undefined
    const isBlocked = isTimeSlotBlocked(selectedDate, timeSlot, staffNameForCheck)
    const isInBreakTime = isTimeSlotInBreakTime(timeSlot, staffNameForCheck)
    
    if (hasBooking || isBlocked || isInBreakTime) return

    // Use the last selected slot as starting point
    const lastSelectedSlot = selectedTimeSlots[selectedTimeSlots.length - 1]
    
    if (!lastSelectedSlot) {
      // No previous selection, just select this slot
      setSelectedTimeSlots(prev => [...prev, timeSlot])
      return
    }

    // Create range from last selected slot to double-clicked slot
    const rangeSlots = getTimeSlotsInRange(lastSelectedSlot, timeSlot)
    
    // Filter out already booked, blocked, or break time slots
    const validSlots = rangeSlots.filter(slot => 
      !hasBookingAtTime(selectedDate, slot) && !isTimeSlotBlocked(selectedDate, slot, staffNameForCheck) && !isTimeSlotInBreakTime(slot, staffNameForCheck)
    )
    
    setSelectedTimeSlots(prev => {
      const newSlots = [...prev, ...validSlots]
      return [...new Set(newSlots)] // Remove duplicates
    })
  }

  const handleTimeSlotExpand = (timeSlot: string) => {
    setExpandedTimeSlots(prev => 
      prev.includes(timeSlot) 
        ? prev.filter(slot => slot !== timeSlot)
        : [...prev, timeSlot]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
      <Header transparent={true} />
      <div className="container mx-auto px-[15px] md:px-4 py-8 relative z-10 pt-24">
        <div className="bg-gray-50 rounded-lg p-6">
        
        {/* Header */}
        <div className="mb-2">
          <div className="text-2xl sm:text-3xl font-bold flex items-center justify-between gap-4 mb-0">
            
              Rezervimet
            
            {(() => {
              // Hide "MENAXHO BIZNESIN" button for staff (only show for business owners and managers)
              const staffAuth = localStorage.getItem('staffAuth')
              if (staffAuth) {
                const { role } = JSON.parse(staffAuth)
                if (role === 'STAFF') {
                  return null // Don't show button for regular staff
                }
              }
              // Show button for business owners and managers
              return (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/menaxho-biznesin')}
                  className="bg-custom-gradient text-white border-transparent hover:opacity-90"
                >
                  Menaxho Biznesin
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              )
            })()}
          </div>
          <div>
            <p className="text-gray-700 font-medium">{business.name}</p>
          </div>
        </div>

        {/* Staff Selection - Only show if staff exists and user is not a regular staff member */}
        {(() => {
          const staffAuth = localStorage.getItem('staffAuth')
          const isRegularStaff = staffAuth && JSON.parse(staffAuth).role === 'STAFF'
          
          // Don't show staff selection dropdown for regular staff (they can only see their own bookings)
          if (isRegularStaff) {
            return null
          }
          
          // Show staff selection for business owners and managers
          if (business?.staff && business.staff.length > 0) {
            return (

                    <div className="flex items-center gap-4 pb-4">
                      <Label className="font-medium text-gray-900">Filtro sipas stafit:</Label>
                      <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                        <SelectTrigger className="w-48 bg-white">
                          <SelectValue placeholder="Zgjidhni stafin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Të gjithë stafi</SelectItem>
                          {business?.staff?.filter((member: any) => member.isActive !== false).map((member: any, index: number) => (
                            <SelectItem key={index} value={member.name}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                 
             
            )
          }
          return null
        })()}

        {/* Show message if no staff selected and staff exists */}
        {business?.staff && business.staff.length > 0 && !selectedStaff && (
          <Card className="bg-white border-gray-200 shadow-lg mb-6">
            <CardContent className="py-2 sm:py-3 px-6">
              <div className="text-center text-gray-600">
                <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">Ju lutemi zgjidhni një anëtar të stafit për të parë kalendarin dhe orët e disponueshme</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendar and Time Slots - Only show if staff selected or no staff exists */}
        {((business?.staff && business.staff.length > 0 && selectedStaff) || (!business?.staff || business.staff.length === 0)) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar View */}
            <Card className="bg-white border-gray-200 shadow-lg">
            <CardHeader className="pl-0">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent flex items-center">
                <Calendar className="w-5 h-5" />
                Kalendari i {selectedStaff === 'all' ? 'Rezervimeve' : business?.staff?.find((s: any) => s.name === selectedStaff)?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                 {/* Calendar Header with Navigation */}
                 <div className="flex items-center justify-between mb-4">
                   <button
                     onClick={() => {
                       const newDate = new Date(selectedDate)
                       newDate.setMonth(newDate.getMonth() - 1)
                       setSelectedDate(newDate)
                     }}
                     className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                   >
                     <ChevronLeft className="w-4 h-4 text-gray-600" />
                   </button>
                   
                   <h3 className="text-lg font-semibold text-gray-900">
                     {(() => {
                       const monthNames = {
                         'January': 'Janar',
                         'February': 'Shkurt',
                         'March': 'Mars',
                         'April': 'Prill',
                         'May': 'Maj',
                         'June': 'Qershor',
                         'July': 'Korrik',
                         'August': 'Gusht',
                         'September': 'Shtator',
                         'October': 'Tetor',
                         'November': 'Nëntor',
                         'December': 'Dhjetor'
                       }
                       const englishMonth = selectedDate.toLocaleDateString('en-US', { 
                         month: 'long', 
                         year: 'numeric' 
                       })
                       return englishMonth.replace(/January|February|March|April|May|June|July|August|September|October|November|December/, 
                         (match) => monthNames[match as keyof typeof monthNames])
                     })()}
                   </h3>
                   
                   <button
                     onClick={() => {
                       const newDate = new Date(selectedDate)
                       newDate.setMonth(newDate.getMonth() + 1)
                       setSelectedDate(newDate)
                     }}
                     className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                   >
                     <ChevronRight className="w-4 h-4 text-gray-600" />
                   </button>
                 </div>

                 {/* Simple Calendar Grid */}
                 <div className="grid grid-cols-7 gap-1 text-center">
                   {['H', 'M', 'M', 'E', 'P', 'S', 'D'].map((day, index) => (
                     <div key={`day-header-${index}`} className="p-2 text-sm font-medium text-gray-500">
                       {day}
                     </div>
                   ))}
                   
                   {(() => {
                     const year = selectedDate.getFullYear()
                     const month = selectedDate.getMonth()
                     const daysInMonth = new Date(year, month + 1, 0).getDate()
                     const firstDayOfMonth = new Date(year, month, 1).getDay() // 0 = Sunday, 1 = Monday, etc.
                     
                     const calendarDays = []
                     
                     // Convert Sunday (0) to 6, Monday (1) to 0, etc. for Monday-first week
                     const mondayFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1
                     
                     // Add empty cells for days before the first day of the month
                     for (let i = 0; i < mondayFirstDay; i++) {
                       calendarDays.push(
                         <div key={`empty-${i}`} className="p-2 text-sm"></div>
                       )
                     }
                     
                     // Add days of the month
                     for (let day = 1; day <= daysInMonth; day++) {
                       const date = new Date(year, month, day)
                       const dayBookings = getBookingsForDate(date, selectedStaff === 'all' ? undefined : selectedStaff)
                       const isToday = date.toDateString() === new Date().toDateString()
                       const isSelected = date.toDateString() === selectedDate.toDateString()
                       const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0))
                       
                       // Check if business is closed on this day
                       const isBusinessClosed = (() => {
                         if (!business?.operating_hours) return false
                         const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                         const dayOfWeek = dayNames[date.getDay()]
                         const dayHours = business.operating_hours[dayOfWeek]
                         return !dayHours || dayHours.closed
                       })()
                       
                       // Check if selected staff doesn't work on this day
                       const isStaffUnavailable = (() => {
                         if (!selectedStaff || selectedStaff === 'all' || !business?.staff) return false
                         const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                         const dayOfWeek = dayNames[date.getDay()]
                         const staffMember = business.staff.find((s: any) => s.name === selectedStaff)
                         
                         if (staffMember?.operatingHours?.[dayOfWeek]) {
                           const staffDayHours = staffMember.operatingHours[dayOfWeek]
                           
                           // If staff has empty hours (no open/close times), they're unavailable
                           if (!staffDayHours.open || !staffDayHours.close || 
                               staffDayHours.open === '' || staffDayHours.close === '' ||
                               staffDayHours.closed) {
                             return true
                           }
                         }
                         return false
                       })()
                       
                       const isDisabled = isPastDate || isBusinessClosed || isStaffUnavailable
                       
                       calendarDays.push(
                         <button
                           key={`day-${day}`}
                           onClick={() => !isDisabled && setSelectedDate(date)}
                           disabled={isDisabled}
                           className={`p-2 text-sm rounded-md transition-colors ${
                             isDisabled
                               ? 'text-gray-300 cursor-not-allowed'
                               : isSelected
                               ? 'bg-custom-gradient  text-white'
                               : isToday
                               ? 'bg-teal-100 text-teal-800'
                               : 'hover:bg-gray-100'
                           }`}
                         >
                           <div>{day}</div>
                           {dayBookings.length > 0 && !isDisabled && (
                             <div className="text-xs mt-1">
                               <span className="inline-block w-2 h-2 bg-teal-500 rounded-full"></span>
                             </div>
                           )}
                         </button>
                       )
                     }
                     
                     return calendarDays
                   })()}
                 </div>
                 
                 {/* Summary */}
                 <div className="bg-gray-50 p-4 rounded-lg">
                   <h4 className="font-medium text-gray-900 mb-2">Përmbledhje</h4>
                   <div className="space-y-1 text-sm text-gray-600">
                     <p>Rezervime për {formatDate(selectedDate)}: {getBookingsForDate(selectedDate, selectedStaff === 'all' ? undefined : selectedStaff).length}</p>
                   </div>
                 </div>
               </div>
             </CardContent>
          </Card>

          {/* Time Slots View */}
          <Card className="bg-white border-gray-200 shadow-lg">
            <CardHeader className="pl-0">
              <CardTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">
                <div className="flex items-center mb-1">
                  <Clock className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="break-words">
                    Orari i {selectedStaff === 'all' ? 'Të gjithë stafin' : business?.staff?.find((s: any) => s.name === selectedStaff)?.name}
                  </span>
                </div>
                <div className="ml-7">
                  {formatDate(selectedDate)}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Instructions */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>Udhëzime:</strong> Klikoni një herë për të zgjedhur një orar, klikoni dy herë për të zgjedhur intervalin nga orari i fundit i zgjedhur
                  </p>
                </div>

                {/* Time Slots Grid */}
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {generateTimeSlots(selectedDate, 30)
                    .map((timeSlot) => {
                      const staffNameForCheck = selectedStaff === 'all' ? undefined : selectedStaff
                      const hasBooking = hasBookingAtTime(selectedDate, timeSlot, staffNameForCheck)
                      const isBlocked = isTimeSlotBlocked(selectedDate, timeSlot, staffNameForCheck)
                      const isInBreakTime = isTimeSlotInBreakTime(timeSlot, staffNameForCheck)
                      const isSelected = selectedTimeSlots.includes(timeSlot)
                      
                      // Find the booking for this slot
                      const bookingForSlot = bookings.find(b => {
                        const dateString = selectedDate.getFullYear() + '-' + 
                                          String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
                                          String(selectedDate.getDate()).padStart(2, '0')
                        
                        const bookingDateObj = new Date(b.appointmentDate)
                        const bookingDate = bookingDateObj.getFullYear() + '-' + 
                                           String(bookingDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                                           String(bookingDateObj.getDate()).padStart(2, '0')
                        
                        const staffMatch = selectedStaff === 'all' || b.staffName === selectedStaff
                        const dateMatch = bookingDate === dateString
                        
                        if (!dateMatch || !staffMatch) return false
                        
                        const bookingSlots = getBookingTimeSlots(b)
                        return bookingSlots.includes(timeSlot)
                      })
                      
                      // Find the break time for this slot
                      const breakTimeForSlot = getBreakTimeForSlot(timeSlot, staffNameForCheck)
                      
                      // Check if this is the first slot of a booking (to show only first slot)
                      const isFirstSlotOfBooking = bookingForSlot ? 
                        getBookingTimeSlots(bookingForSlot)[0] === timeSlot : false
                      
                      // Check if this is the first slot of a break time (to show only first slot)
                      const isFirstSlotOfBreakTime = breakTimeForSlot ? 
                        getBreakTimeSlots(breakTimeForSlot.startTime, breakTimeForSlot.endTime)[0] === timeSlot : false
                      
                      // Check if time slot is in the past
                      const isPastTime = (() => {
                        const today = new Date()
                        const selectedDateOnly = new Date(selectedDate.toDateString())
                        const todayOnly = new Date(today.toDateString())
                        
                        // If selected date is in the past, all time slots are past
                        if (selectedDateOnly < todayOnly) return true
                        
                        // If selected date is today, check if time slot is in the past
                        if (selectedDateOnly.getTime() === todayOnly.getTime()) {
                          const [hours, minutes] = timeSlot.split(':').map(Number)
                          const slotTime = new Date()
                          slotTime.setHours(hours, minutes, 0, 0)
                          return slotTime < today
                        }
                        
                        return false
                      })()
                      
                      return { timeSlot, hasBooking, isBlocked, isInBreakTime, isSelected, bookingForSlot, isFirstSlotOfBooking, breakTimeForSlot, isFirstSlotOfBreakTime, isPastTime }
                    })
                    .filter(({ hasBooking, bookingForSlot, isFirstSlotOfBooking, isInBreakTime, breakTimeForSlot, isFirstSlotOfBreakTime }) => {
                      // Hide slots that are part of a booking but not the first slot
                      if (hasBooking && bookingForSlot && !isFirstSlotOfBooking) {
                        return false
                      }
                      // Hide slots that are part of a break time but not the first slot
                      if (isInBreakTime && breakTimeForSlot && !isFirstSlotOfBreakTime) {
                        return false
                      }
                      return true
                    })
                    .map(({ timeSlot, hasBooking, isBlocked, isInBreakTime, isSelected, bookingForSlot, isFirstSlotOfBooking, breakTimeForSlot, isFirstSlotOfBreakTime, isPastTime }) => {
                    
                    // Debug logging for blocked slots
                    if (isBlocked) {
                      const staffNameForCheck = selectedStaff === 'all' ? undefined : selectedStaff
                      console.log('🔴 Blocked slot detected:', {
                        timeSlot,
                        date: selectedDate.toISOString().split('T')[0],
                        staffName: staffNameForCheck,
                        blockedSlotsArray: blockedSlots.filter(s => {
                          const slotDateStr = typeof s.date === 'string' && s.date.match(/^\d{4}-\d{2}-\d{2}$/) 
                            ? s.date 
                            : new Date(s.date).toISOString().split('T')[0]
                          return slotDateStr === selectedDate.toISOString().split('T')[0]
                        })
                      })
                    }
                    
                    // Debug logging for 13:00 specifically
                    if (timeSlot === '13:00') {
                      console.log('13:00 slot debug:', {
                        timeSlot,
                        hasBooking,
                        isBlocked,
                        isSelected,
                        selectedStaff,
                        bookings: bookings.map(b => ({
                          id: b.id,
                          date: b.appointmentDate,
                          time: b.appointmentTime,
                          duration: b.serviceDuration,
                          staff: b.staffName
                        }))
                      })
                    }
                    
                    // Use bookingForSlot that we already found above
                    const booking = bookingForSlot || null
                    
                    const isExpanded = expandedTimeSlots.includes(timeSlot)
                    const hasAdditionalText = isInBreakTime || hasBooking || isBlocked || isPastTime
                    
                    return (
                      <button
                        key={timeSlot}
                        onClick={() => {
                          if (hasBooking || isBlocked || isInBreakTime || isPastTime) {
                            // Expand/collapse for non-selectable slots
                            handleTimeSlotExpand(timeSlot)
                          } else {
                            handleTimeSlotClick(timeSlot)
                          }
                        }}
                        onDoubleClick={(e) => {
                          // Prevent double-click selection on blocked/booked/past/break time slots
                          if (hasBooking || isBlocked || isInBreakTime || isPastTime) {
                            e.preventDefault()
                            return
                          }
                          handleTimeSlotDoubleClick(timeSlot)
                        }}
                        disabled={isPastTime}
                        className={`p-2 sm:p-3 text-xs sm:text-sm rounded-md transition-colors ${
                          isBlocked
                            ? 'bg-red-100 text-red-600 border border-red-200 cursor-pointer hover:bg-red-200'
                            : isInBreakTime
                            ? 'bg-orange-100 text-orange-600 border border-orange-200 cursor-pointer hover:bg-orange-200'
                            : hasBooking
                            ? 'bg-teal-100 text-teal-600 border border-teal-200 cursor-pointer hover:bg-teal-200'
                            : isPastTime
                            ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-75'
                            : isSelected
                            ? 'bg-custom-gradient text-white'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">
                          {hasBooking && booking && isFirstSlotOfBooking 
                            ? `${booking.appointmentTime}-${getEndTime(booking.appointmentTime, booking.serviceDuration || getServiceDuration(booking.serviceName))}`
                            : isInBreakTime && breakTimeForSlot && isFirstSlotOfBreakTime
                            ? `${breakTimeForSlot.startTime}-${breakTimeForSlot.endTime}`
                            : timeSlot}
                        </div>
                        {hasAdditionalText && isExpanded && (
                          <>
                            {isBlocked && (
                              <div className="text-xs mt-1 text-red-600 font-medium leading-tight">
                                Bllokuar nga biznesi
                              </div>
                            )}
                            {isInBreakTime && breakTimeForSlot && isFirstSlotOfBreakTime && (
                              <div className="text-xs mt-1 text-orange-600 font-medium leading-tight">
                                Koha e pauzës{selectedStaff === 'all' ? ` - ${breakTimeForSlot.staffName}` : ''}
                              </div>
                            )}
                            {hasBooking && booking && isFirstSlotOfBooking && (
                              <div className="text-xs mt-1 space-y-1 leading-tight">
                                <div className="font-medium text-teal-800">{booking.customerName}</div>
                                <div className="text-teal-600">{booking.serviceName}</div>
                              </div>
                            )}
                            {isPastTime && (
                              <div className="text-xs mt-1 text-gray-400 leading-tight">
                                E kaluar
                              </div>
                            )}
                          </>
                        )}
                      </button>
                    )
                  })}
                </div>
                
                {selectedTimeSlots.length > 0 && (
                  <div className="flex flex-col items-center sm:flex-row sm:justify-between sm:items-center gap-3 mt-4">
                    <p className="text-sm text-gray-600 whitespace-nowrap">
                      {selectedTimeSlots.length} orë të zgjedhura
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setSelectedTimeSlots([])}
                        variant="outline"
                        className="text-sm px-3 py-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white border-transparent"
                      >
                        Anulo
                      </Button>
                      <Button
                        onClick={() => blockSelectedTimeSlots(selectedStaff === 'all' ? undefined : selectedStaff)}
                        className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white text-sm px-3 py-1"
                      >
                        Blloko të Zgjedhurat
                      </Button>
                    </div>
                  </div>
                )}
                
                {generateTimeSlots(selectedDate, 30).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nuk ka orë të disponueshme për këtë datë</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Bookings List - Below Calendar and Time Slots - Only show if staff selected or no staff exists */}
        {((business?.staff && business.staff.length > 0 && selectedStaff) || (!business?.staff || business.staff.length === 0)) && (
          <>
        <Card className="bg-white border-gray-200 shadow-lg mt-6">
          <CardHeader className="pl-0">
            <div className="flex items-start sm:items-center gap-2">
              <CardTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent flex items-start sm:items-center w-4/5 min-w-0">
                <Calendar className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5 sm:mt-0" />
                <span className="break-words leading-tight">
                  Rezervimet për {selectedStaff === 'all' ? 'Të gjithë stafin' : business?.staff?.find((s: any) => s.name === selectedStaff)?.name} - {formatDate(selectedDate)}
                </span>
              </CardTitle>
              <div className="flex items-center gap-1 w-1/5 justify-end flex-shrink-0">
                {getBookingsForDate(selectedDate, selectedStaff === 'all' ? undefined : selectedStaff).length > 0 && (
                  <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-gray-800 to-teal-800 text-white text-xs font-bold rounded-full flex-shrink-0">
                    {getBookingsForDate(selectedDate, selectedStaff === 'all' ? undefined : selectedStaff).length}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBookingsList(!showBookingsList)}
                  className="p-2 hover:bg-gradient-to-r hover:from-gray-800 hover:to-teal-800 hover:text-white hover:border-transparent active:bg-gradient-to-r active:from-gray-800 active:to-teal-800 active:text-white active:border-transparent focus:outline-none focus:ring-0 flex-shrink-0"
                >
                  {showBookingsList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          {showBookingsList && (
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {getBookingsForDate(selectedDate, selectedStaff === 'all' ? undefined : selectedStaff)
                  .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
                  .map((booking) => (
                  <div 
                    key={booking.id} 
                    className={`p-3 rounded-lg border ${
                      booking.status === 'CANCELLED' 
                        ? 'bg-red-50 border-red-200 opacity-75' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className={`w-4 h-4 ${booking.status === 'CANCELLED' ? 'text-red-500' : 'text-gray-500'}`} />
                          <span className={`font-medium text-sm ${booking.status === 'CANCELLED' ? 'text-red-700' : 'text-gray-900'}`}>
                            {booking.customerName}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>{booking.appointmentTime}-{getEndTime(booking.appointmentTime, booking.serviceDuration || getServiceDuration(booking.serviceName))}</span>
                          </div>
                          {booking.staffName && (
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3" />
                              <span>{booking.staffName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            <span>{booking.customerPhone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Shërbimi:</span>
                            <span className="font-medium">{booking.serviceName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Statusi:</span>
                            <span className={`text-xs font-medium ${
                              booking.status === 'COMPLETED' ? 'text-green-600' :
                              booking.status === 'CANCELLED' ? 'text-red-600' :
                              'text-blue-600'
                            }`}>
                              {booking.status === 'COMPLETED' ? 'Përfunduar' :
                               booking.status === 'CANCELLED' ? 'Anuluar' :
                               'Konfirmuar'}
                            </span>
                          </div>
                          {booking.notes && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Shënime:</span>
                              <span>{booking.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-2 border-t">
                        <div className="text-xs text-gray-500 mb-2">
                          Rezervuar: {new Date(booking.createdAt).toLocaleDateString('sq-AL')}
                        </div>
                        <div className="flex items-center gap-1">
                          {booking.status === 'CONFIRMED' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateBookingStatus(booking.id, 'COMPLETED')}
                                className="text-xs px-2 py-1 h-6 bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-800 text-white border-transparent flex-1"
                              >
                                Perfunduar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowCancelModal({ 
                                  show: true, 
                                  booking: {
                                    id: booking.id,
                                    customerName: booking.customerName,
                                    appointmentTime: booking.appointmentTime,
                                    serviceName: booking.serviceName
                                  }
                                })}
                                className="text-xs px-2 py-1 h-6 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white border-transparent flex-1"
                              >
                                Anulo
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {getBookingsForDate(selectedDate, selectedStaff === 'all' ? undefined : selectedStaff).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nuk ka rezervime për këtë datë</p>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Blocked Slots for Selected Date */}
        <Card className="bg-white border-gray-200 shadow-lg mt-6">
          <CardHeader>
            <div className="flex items-start sm:items-center gap-2">
              <CardTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent flex items-start sm:items-center w-4/5 min-w-0">
                <span className="break-words leading-tight">
                  Orari i bllokuar për {selectedStaff === 'all' ? 'Të gjithë stafin' : business?.staff?.find((s: any) => s.name === selectedStaff)?.name} - {formatDate(selectedDate)}
                </span>
              </CardTitle>
              <div className="flex items-center gap-1 w-1/5 justify-end flex-shrink-0">
                {blockedSlots.filter(slot => {
                  // Format dates using local time to avoid timezone issues
                  const slotDateObj = new Date(slot.date)
                  const slotDate = slotDateObj.getFullYear() + '-' + 
                                  String(slotDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                                  String(slotDateObj.getDate()).padStart(2, '0')
                  const dateString = selectedDate.getFullYear() + '-' + 
                                    String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
                                    String(selectedDate.getDate()).padStart(2, '0')
                  const staffMatch = selectedStaff === 'all' || !slot.staffName || slot.staffName === selectedStaff
                  return slotDate === dateString && staffMatch
                }).length > 0 && (
                  <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-gray-800 to-teal-800 text-white text-xs font-bold rounded-full">
                    {blockedSlots.filter(slot => {
                      // Format dates using local time to avoid timezone issues
                      const slotDateObj = new Date(slot.date)
                      const slotDate = slotDateObj.getFullYear() + '-' + 
                                      String(slotDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                                      String(slotDateObj.getDate()).padStart(2, '0')
                      const dateString = selectedDate.getFullYear() + '-' + 
                                        String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
                                        String(selectedDate.getDate()).padStart(2, '0')
                      const staffMatch = selectedStaff === 'all' || !slot.staffName || slot.staffName === selectedStaff
                      return slotDate === dateString && staffMatch
                    }).length}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBlockedSlots(!showBlockedSlots)}
                  className="p-2 hover:bg-gradient-to-r hover:from-gray-800 hover:to-teal-800 hover:text-white hover:border-transparent active:bg-gradient-to-r active:from-gray-800 active:to-teal-800 active:text-white active:border-transparent focus:outline-none focus:ring-0"
                >
                  {showBlockedSlots ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          {showBlockedSlots && (
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2">
                  {blockedSlots.filter(slot => {
                    // Format dates using local time to avoid timezone issues
                    const slotDateObj = new Date(slot.date)
                    const slotDate = slotDateObj.getFullYear() + '-' + 
                                    String(slotDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                                    String(slotDateObj.getDate()).padStart(2, '0')
                    const dateString = selectedDate.getFullYear() + '-' + 
                                      String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
                                      String(selectedDate.getDate()).padStart(2, '0')
                    const staffMatch = selectedStaff === 'all' || !slot.staffName || slot.staffName === selectedStaff
                    return slotDate === dateString && staffMatch
                  }).sort((a, b) => {
                    // Sort by start time from smallest to largest
                    return a.startTime.localeCompare(b.startTime)
                  }).map((slot) => (
                    <div key={slot.id} className="bg-red-50 p-2 rounded border border-red-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {slot.startTime}
                        </span>
                        <Button
                          onClick={() => deleteBlockedSlot(slot.id)}
                          className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white text-xs px-2 py-1 h-6"
                        >
                          Zhblloko
                        </Button>
                      </div>
                      {slot.staffName && (
                        <p className="text-xs text-gray-600 mb-1">{slot.staffName}</p>
                      )}
                      <p className="text-xs text-gray-600">Bllokuar nga biznesi</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
          </>
        )}
        </div>
      </div>

      {/* Block Confirmation Modal */}
       {showBlockModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
             <h3 className="text-lg font-bold text-gray-900 mb-4">Konfirmo Bllokimin</h3>
             
             <div className="space-y-4">
               <div>
                 <p className="text-sm text-gray-600">Data: {selectedDate.toLocaleDateString('sq-AL', { 
                   weekday: 'long', 
                   year: 'numeric', 
                   month: 'long', 
                   day: 'numeric' 
                 })}</p>
                 {selectedStaff !== 'all' && (
                   <p className="text-sm text-gray-600">Stafi: {selectedStaff}</p>
                 )}
                 <p className="text-sm text-gray-600">
                   Oraret e përzgjedhura: {selectedTimeSlots.join(', ')}
                 </p>
               </div>
             </div>
             
             <div className="flex justify-end space-x-3 mt-6">
               <Button
                 onClick={() => {
                   setShowBlockModal(false)
                   setSelectedTimeSlots([])
                 }}
                 variant="outline"
                 className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white border-transparent"
               >
                 Anulo
               </Button>
               <Button
                 onClick={() => blockSelectedTimeSlots(undefined)}
                 className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2"
               >
                 Blloko {selectedTimeSlots.length} Orare
               </Button>
             </div>
           </div>
         </div>
       )}

       {/* Cancel Booking Confirmation Modal */}
       {showCancelModal.show && showCancelModal.booking && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">
               Konfirmo Anulimin
             </h3>
             <p className="text-gray-600 mb-4">
               A jeni të sigurtë që doni të anuloni terminin e <strong>{showCancelModal.booking.customerName}</strong> nga ora <strong>{showCancelModal.booking.appointmentTime}</strong> për shërbimin <strong>{showCancelModal.booking.serviceName}</strong>? 
             </p>
             <div className="flex items-center gap-2 mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
               <div className="text-red-600 text-lg font-bold">!</div>
               <p className="text-red-700 text-xs font-medium">
                 Në rast të anulimit, një email njoftues do të shkojë te klienti dhe në emailën e biznesit!
               </p>
             </div>
             <div className="flex gap-3 justify-center">
               <Button
                 onClick={() => setShowCancelModal({ show: false, booking: null })}
                 variant="outline"
                 className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white border-transparent"
               >
                 Anulo
               </Button>
               <Button
                 onClick={() => {
                   updateBookingStatus(showCancelModal.booking!.id, 'CANCELLED')
                   setShowCancelModal({ show: false, booking: null })
                 }}
                 className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2"
               >
                 Konfirmo Anulimin
               </Button>
             </div>
           </div>
         </div>
       )}
     </div>
   )
 }
