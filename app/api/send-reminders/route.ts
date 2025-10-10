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
    // Compare dates in local timezone to match how bookings are stored
    const today = new Date()
    const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const localTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    // Calculate the time window for reminders (25-35 minutes from now)
    const reminderWindowStart = new Date(now.getTime() + 25 * 60 * 1000) // 25 minutes from now
    const reminderWindowEnd = new Date(now.getTime() + 35 * 60 * 1000)   // 35 minutes from now
    
    console.log('=== REMINDER API DEBUG ===')
    console.log('Current time:', now.toISOString())
    console.log('Reminder window start (25 min):', reminderWindowStart.toISOString())
    console.log('Reminder window end (35 min):', reminderWindowEnd.toISOString())
    console.log('Local today:', localToday.toISOString())
    console.log('Local tomorrow:', localTomorrow.toISOString())
    console.log('Time window (HH:mm):', format(reminderWindowStart, 'HH:mm'), 'to', format(reminderWindowEnd, 'HH:mm'))
    
    // Debug: Check all bookings first
    const allBookings = await prisma.booking.findMany({
      where: {
        appointmentDate: {
          gte: localToday,
          lt: localTomorrow
        },
        status: 'CONFIRMED'
      },
      select: {
        id: true,
        appointmentTime: true,
        customerName: true
      }
    })
    console.log(`All confirmed bookings today: ${allBookings.length}`)
    allBookings.forEach(b => console.log(`- ID: ${b.id}, Time: ${b.appointmentTime}, Customer: ${b.customerName}`))
    
    // Simplified query - just get all confirmed bookings today
    const bookingsToRemind = await prisma.booking.findMany({
      where: {
        appointmentDate: {
          gte: localToday,
          lt: localTomorrow
        },
        status: 'CONFIRMED' // Only send to confirmed bookings
      },
      include: {
        business: true
      }
    })

    console.log(`Found ${bookingsToRemind.length} bookings to send reminders for`)
    
    // Filter by time window on the client side to debug timezone issues
    const filteredBookings = bookingsToRemind.filter(booking => {
      const bookingTime = booking.appointmentTime
      const windowStart = format(reminderWindowStart, 'HH:mm')
      const windowEnd = format(reminderWindowEnd, 'HH:mm')
      
      const inWindow = bookingTime >= windowStart && bookingTime < windowEnd
      console.log(`- Booking ID: ${booking.id}, Time: ${bookingTime}, Window: ${windowStart}-${windowEnd}, In window: ${inWindow}`)
      
      return inWindow
    })
    
    console.log(`After time filtering: ${filteredBookings.length} bookings`)

    const results = []

    for (const booking of filteredBookings) {
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
      message: `Processed ${filteredBookings.length} bookings`,
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
    const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const localTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    // Calculate the time window for reminders (25-35 minutes from now)
    const reminderWindowStart = new Date(now.getTime() + 25 * 60 * 1000) // 25 minutes from now
    const reminderWindowEnd = new Date(now.getTime() + 35 * 60 * 1000)   // 35 minutes from now
    
    const bookingsToRemind = await prisma.booking.findMany({
      where: {
        appointmentDate: {
          gte: localToday,
          lt: localTomorrow
        },
        appointmentTime: {
          gte: format(reminderWindowStart, 'HH:mm'),
          lt: format(reminderWindowEnd, 'HH:mm')
        },
        status: 'CONFIRMED'
      },
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        appointmentDate: true,
        appointmentTime: true,
        business: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      currentTime: now.toISOString(),
      reminderWindowStart: reminderWindowStart.toISOString(),
      reminderWindowEnd: reminderWindowEnd.toISOString(),
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
