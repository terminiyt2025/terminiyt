import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sendEmail, emailTemplates } from '@/lib/email'
import { format } from 'date-fns'
import { sq } from 'date-fns/locale'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Get current time
    const now = new Date()
    
    // Find bookings that start in 30 minutes (today only)
    // Query by date string to match database format
    const today = new Date()
    const todayString = today.toISOString().split('T')[0] // "2025-10-10"
    
    // Calculate the time window for reminders (26-34 minutes from now) in LOCAL time
    // Convert current UTC time to local time (UTC+1)
    const localNow = new Date(now.getTime() + 1 * 60 * 60 * 1000) // Add 1 hours for UTC+1
    const reminderWindowStart = new Date(localNow.getTime() + 26 * 60 * 1000) // 26 minutes from local now
    const reminderWindowEnd = new Date(localNow.getTime() + 34 * 60 * 1000)   // 34 minutes from local now
    
    // Convert to local time for comparison with appointment_time
    const localWindowStart = format(reminderWindowStart, 'HH:mm')
    const localWindowEnd = format(reminderWindowEnd, 'HH:mm')
    
    console.log('=== REMINDER API DEBUG ===')
    console.log('Current UTC time:', now.toISOString())
    console.log('Current local time:', format(localNow, 'HH:mm'))
    console.log('Reminder window start (26 min):', reminderWindowStart.toISOString())
    console.log('Reminder window end (34 min):', reminderWindowEnd.toISOString())
    console.log('Today string:', todayString)
    console.log('Local time window (HH:mm):', localWindowStart, 'to', localWindowEnd)
    
    // Get all confirmed bookings and filter by date in memory
    const allBookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED'
      },
      include: {
        business: true
      }
    })
    
    // Filter by today's date (check both today and tomorrow since bookings might be stored for next UTC day)
    const tomorrowString = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const todayBookings = allBookings.filter(booking => {
      const bookingDate = new Date(booking.appointmentDate)
      const bookingDateString = bookingDate.toISOString().split('T')[0]
      return bookingDateString === todayString || bookingDateString === tomorrowString
    })
    
    console.log(`All confirmed bookings: ${allBookings.length}`)
    console.log(`Today's confirmed bookings: ${todayBookings.length}`)
    console.log(`Checking dates: ${todayString} and ${tomorrowString}`)
    todayBookings.forEach(b => console.log(`- ID: ${b.id}, Date: ${b.appointmentDate}, Time: ${b.appointmentTime}, Customer: ${b.customerName}`))
    
    // Filter by time window using LOCAL time comparison
    const bookingsToRemind = todayBookings.filter(booking => {
      const bookingTime = booking.appointmentTime
      
      // Normalize time format (ensure HH:MM format)
      const normalizedBookingTime = bookingTime.length === 4 ? `0${bookingTime}` : bookingTime
      const normalizedWindowStart = localWindowStart.length === 4 ? `0${localWindowStart}` : localWindowStart
      const normalizedWindowEnd = localWindowEnd.length === 4 ? `0${localWindowEnd}` : localWindowEnd
      
      const inWindow = normalizedBookingTime >= normalizedWindowStart && normalizedBookingTime < normalizedWindowEnd
      console.log(`- Booking ID: ${booking.id}, Time: ${bookingTime} (normalized: ${normalizedBookingTime}), Window: ${normalizedWindowStart}-${normalizedWindowEnd}, In window: ${inWindow}`)
      
      return inWindow
    })

    console.log(`After time filtering: ${bookingsToRemind.length} bookings`)

    const results = []

    for (const booking of bookingsToRemind) {
      try {
        // Find the staff member for this booking
        const staffArray = booking.business.staff as any[] || []
        const staffMember = staffArray.find(
          (staff: any) => staff.name === booking.staffName
        )

        // Prepare email data
        const emailData = {
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          businessName: booking.business.name,
          serviceName: booking.serviceName,
          staffName: booking.staffName,
          date: format(new Date(booking.appointmentDate), 'EEEE, d MMMM yyyy', { locale: sq }),
          time: booking.appointmentTime,
          duration: booking.serviceDuration,
          notes: booking.notes || '',
          staffPhone: staffMember?.phone || booking.business.phone
        }

        // Send reminder email
        const emailResult = await sendEmail({
          to: booking.customerEmail,
          subject: emailTemplates.bookingReminder(emailData).subject,
          html: emailTemplates.bookingReminder(emailData).html,
          text: emailTemplates.bookingReminder(emailData).text
        })

        if (emailResult.success) {
          results.push({
            bookingId: booking.id,
            customerEmail: booking.customerEmail,
            status: 'sent',
            messageId: emailResult.messageId
          })

          console.log(`Reminder sent successfully for booking ${booking.id}`)
        } else {
          results.push({
            bookingId: booking.id,
            customerEmail: booking.customerEmail,
            status: 'failed',
            error: emailResult.error
          })

          console.error(`Failed to send reminder for booking ${booking.id}:`, emailResult.error)
        }
      } catch (error) {
        console.error(`Error processing booking ${booking.id}:`, error)
        results.push({
          bookingId: booking.id,
          customerEmail: booking.customerEmail,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${bookingsToRemind.length} bookings`,
      results
    })

  } catch (error) {
    console.error('Error in send-reminders API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// GET endpoint to check for reminders (for testing)
export async function GET() {
  try {
    const now = new Date()
    
    const today = new Date()
    const todayString = today.toISOString().split('T')[0] // "2025-10-10"
    
    // Calculate the time window for reminders (26-34 minutes from now) in LOCAL time
    // Convert current UTC time to local time (UTC+1)
    const localNow = new Date(now.getTime() + 1 * 60 * 60 * 1000) // Add 1 hours for UTC+1
    const reminderWindowStart = new Date(localNow.getTime() + 26 * 60 * 1000) // 26 minutes from local now
    const reminderWindowEnd = new Date(localNow.getTime() + 34 * 60 * 1000)   // 34 minutes from local now
    
    // Convert to local time for comparison with appointment_time
    const localWindowStart = format(reminderWindowStart, 'HH:mm')
    const localWindowEnd = format(reminderWindowEnd, 'HH:mm')
    
    // Get all confirmed bookings and filter by date in memory
    const allBookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED'
      },
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        appointmentDate: true,
        appointmentTime: true,
        status: true,
        business: {
          select: {
            name: true
          }
        }
      }
    })
    
    // Filter by today's date (check both today and tomorrow since bookings might be stored for next UTC day)
    const tomorrowString = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const todayBookings = allBookings.filter(booking => {
      const bookingDate = new Date(booking.appointmentDate)
      const bookingDateString = bookingDate.toISOString().split('T')[0]
      return bookingDateString === todayString || bookingDateString === tomorrowString
    })
    
    // Filter by time window using LOCAL time comparison
    const bookingsToRemind = todayBookings.filter(booking => {
      const bookingTime = booking.appointmentTime
      
      // Normalize time format (ensure HH:MM format)
      const normalizedBookingTime = bookingTime.length === 4 ? `0${bookingTime}` : bookingTime
      const normalizedWindowStart = localWindowStart.length === 4 ? `0${localWindowStart}` : localWindowStart
      const normalizedWindowEnd = localWindowEnd.length === 4 ? `0${localWindowEnd}` : localWindowEnd
      
      return normalizedBookingTime >= normalizedWindowStart && normalizedBookingTime < normalizedWindowEnd
    })

    return NextResponse.json({
      success: true,
      currentTime: now.toISOString(),
      currentLocalTime: localNow.toISOString(),
      reminderWindowStart: reminderWindowStart.toISOString(),
      reminderWindowEnd: reminderWindowEnd.toISOString(),
      localWindowStart: localWindowStart,
      localWindowEnd: localWindowEnd,
      bookingsFound: bookingsToRemind.length,
      bookings: bookingsToRemind
    })

  } catch (error) {
    console.error('Error in send-reminders GET:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
