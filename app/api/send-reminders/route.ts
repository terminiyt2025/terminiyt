import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sendEmail, emailTemplates } from '@/lib/email'
import { format } from 'date-fns'
import { sq } from 'date-fns/locale'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Verify this is a Vercel Cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current time
    const now = new Date()
    
    // Calculate 30 minutes from now
    const reminderTime = new Date(now.getTime() + 30 * 60 * 1000)
    
    // Find bookings that start in 30 minutes (today only)
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    const bookingsToRemind = await prisma.booking.findMany({
      where: {
        appointmentDate: {
          gte: todayStart,
          lt: todayEnd
        },
        appointmentTime: {
          gte: format(reminderTime, 'HH:mm'),
          lt: format(new Date(reminderTime.getTime() + 5 * 60 * 1000), 'HH:mm') // 5 minute window
        },
        status: 'CONFIRMED' // Only send to confirmed bookings
      },
      include: {
        business: true
      }
    })

    console.log(`Found ${bookingsToRemind.length} bookings to send reminders for`)

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
export async function GET(request: NextRequest) {
  try {
    // Verify this is a Vercel Cron request or allow manual testing
    const authHeader = request.headers.get('authorization')
    const isCronRequest = authHeader === `Bearer ${process.env.CRON_SECRET}`
    const isManualTest = !authHeader // Allow manual testing without auth
    
    if (!isCronRequest && !isManualTest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const reminderTime = new Date(now.getTime() + 30 * 60 * 1000)
    
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    const bookingsToRemind = await prisma.booking.findMany({
      where: {
        appointmentDate: {
          gte: todayStart,
          lt: todayEnd
        },
        appointmentTime: {
          gte: format(reminderTime, 'HH:mm'),
          lt: format(new Date(reminderTime.getTime() + 5 * 60 * 1000), 'HH:mm')
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
      reminderTime: reminderTime.toISOString(),
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
