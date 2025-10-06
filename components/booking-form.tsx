"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format, isSameDay, isAfter, startOfDay } from "date-fns"
import { CalendarDays, Clock, User, Mail, Phone, MessageSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { Business, Service } from "@/lib/database"

const bookingSchema = z.object({
  serviceId: z.string().min(1, "Please select a service"),
  date: z.date({
    required_error: "Please select a date",
  }),
  time: z.string().min(1, "Please select a time"),
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Please enter a valid email"),
  customerPhone: z.string().min(10, "Please enter a valid phone number"),
  notes: z.string().optional(),
})

type BookingFormData = z.infer<typeof bookingSchema>

interface BookingFormProps {
  business: Business
  services: Service[]
}

// Generate time slots based on business operating hours
const generateTimeSlots = (operatingHours: any, selectedDate: Date) => {
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
  
  // Generate 30-minute slots
  for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
    const hour = Math.floor(minutes / 60)
    const min = minutes % 60
    const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
    slots.push(timeString)
  }
  
  return slots
}

export function BookingForm({ business, services }: BookingFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceId: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      notes: "",
    },
  })

  const selectedService = services.find((s) => s.id === form.watch("serviceId"))
  const availableTimeSlots = generateTimeSlots(business.operating_hours, selectedDate)

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true)
    console.log("Booking form submitted with data:", data)

    try {
      // Create booking data
      const bookingData = {
        businessId: business.id,
        serviceName: selectedService?.name || '',
        appointmentDate: format(data.date, "yyyy-MM-dd"),
        appointmentTime: data.time,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        notes: data.notes || '',
        totalPrice: selectedService?.price || 0
      }

      // Submit booking to API
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        throw new Error('Failed to create booking')
      }

      const result = await response.json()

      toast({
        title: "Booking Confirmed!",
        description: `Your appointment with ${business.name} has been scheduled for ${format(data.date, "MMMM d, yyyy")} at ${data.time}.`,
      })

      // Redirect to confirmation page
      router.push(
        `/rezervimi-u-konfirmua?business=${business.name}&date=${format(data.date, "yyyy-MM-dd")}&time=${data.time}&bookingId=${result.id}`,
      )
    } catch (error) {
      console.error('Booking error:', error)
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-emerald-600" />
          Book Appointment
        </CardTitle>
        <CardDescription>Schedule your appointment with {business.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Service Selection */}
            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Select Service</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{service.name}</span>
                            {service.price && (
                              <span className="ml-2 text-emerald-600 font-medium">{service.price}€</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Selection */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Select Date</FormLabel>
                  <FormControl>
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date)
                        setSelectedDate(date)
                      }}
                      disabled={isDateDisabled}
                      initialFocus
                      className="rounded-md border border-slate-200"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Selection */}
            {selectedDate && (
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Select Time
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a time slot" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTimeSlots.length > 0 ? (
                          availableTimeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            No available time slots for this day
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4" />
                Your Information
              </h3>

              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
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
                    <FormLabel className="text-slate-700 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
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
                    <FormLabel className="text-slate-700 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Enter your phone number" {...field} />
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
                    <FormLabel className="text-slate-700 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Additional Notes (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any special requests or notes for your appointment"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Booking Summary */}
            {selectedService && selectedDate && form.watch("time") && (
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <h4 className="font-medium text-slate-900 mb-2">Booking Summary</h4>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>
                    <span className="font-medium">Service:</span> {selectedService.name}
                  </p>
                  <p>
                    <span className="font-medium">Date:</span> {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </p>
                  <p>
                    <span className="font-medium">Time:</span> {form.watch("time")}
                  </p>
                  {selectedService.duration_minutes && (
                    <p>
                      <span className="font-medium">Duration:</span> {selectedService.duration_minutes} minutes
                    </p>
                  )}
                  {selectedService.price && (
                    <p>
                      <span className="font-medium">Price:</span> {selectedService.price}€
                    </p>
                  )}
                </div>
              </div>
            )}

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Confirm Booking"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
