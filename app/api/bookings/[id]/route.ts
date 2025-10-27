import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-prisma'
import { sendEmail, emailTemplates } from '@/lib/email'
import { format } from 'date-fns'
import { sq } from 'date-fns/locale'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const booking = await prisma.booking.findUnique({
      where: {
        id: parseInt(id)
      },
      select: {
        id: true,
        serviceName: true,
        staffName: true,
        appointmentDate: true,
        appointmentTime: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        notes: true,
        totalPrice: true,
        serviceDuration: true,
        status: true,
        createdAt: true,
        business: {
          select: {
            name: true,
            phone: true,
            staff: true,
            slug: true
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë gjetjes së rezervimit' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    console.log('Updating booking with ID:', id, 'Status:', body.status)

    // Validate required fields
    if (!body.status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Validate status value
    const validStatuses = ['PENDING', 'ACTIVE', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      )
    }

    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: {
        id: parseInt(id)
      },
      data: {
        status: body.status
      },
      select: {
        id: true,
        serviceName: true,
        staffName: true,
        appointmentDate: true,
        appointmentTime: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        notes: true,
        totalPrice: true,
        serviceDuration: true,
        status: true,
        createdAt: true,
        business: {
          select: {
            name: true,
            phone: true,
            staff: true,
            slug: true
          }
        }
      }
    })

    // Send cancellation email if booking is cancelled
    if (body.status === 'CANCELLED') {
      try {
        // Find the staff member for this booking
        const staffArray = updatedBooking.business.staff as any[] || []
        const staffMember = staffArray.find(
          (staff: any) => staff.name === updatedBooking.staffName
        )

        // Prepare email data
        const emailData = {
          customerName: updatedBooking.customerName,
          customerEmail: updatedBooking.customerEmail,
          businessName: updatedBooking.business.name,
          businessSlug: updatedBooking.business.slug,
          serviceName: updatedBooking.serviceName,
          staffName: updatedBooking.staffName,
          date: format(new Date(updatedBooking.appointmentDate), 'EEEE, d MMMM yyyy', { locale: sq }),
          time: updatedBooking.appointmentTime,
          duration: updatedBooking.serviceDuration,
          notes: updatedBooking.notes || '',
          staffPhone: staffMember?.phone || updatedBooking.business.phone
        }

        // Send cancellation email
        const emailResult = await sendEmail({
          to: updatedBooking.customerEmail,
          subject: emailTemplates.bookingCancellation(emailData).subject,
          html: emailTemplates.bookingCancellation(emailData).html,
          text: emailTemplates.bookingCancellation(emailData).text
        })

        if (emailResult.success) {
          console.log(`Cancellation email sent successfully for booking ${updatedBooking.id}`)
        } else {
          console.error(`Failed to send cancellation email for booking ${updatedBooking.id}:`, emailResult.error)
        }
      } catch (error) {
        console.error(`Error sending cancellation email for booking ${updatedBooking.id}:`, error)
      }
    }

    return NextResponse.json(updatedBooking)

  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë përditësimit të rezervimit' },
      { status: 500 }
    )
  }
}
