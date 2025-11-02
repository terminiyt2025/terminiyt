import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-prisma'
import { sendEmail, emailTemplates } from '@/lib/email'
import { format } from 'date-fns'
import { sq } from 'date-fns/locale'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json(
        { error: 'ID i biznesit është i detyrueshëm' },
        { status: 400 }
      )
    }

    const bookings = await prisma.booking.findMany({
      where: {
        businessId: parseInt(businessId)
      },
      orderBy: {
        appointmentDate: 'desc'
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
        createdAt: true
      }
    })

    return NextResponse.json(bookings)

  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë marrjes së rezervimeve' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Creating booking with data:', body)
    console.log('Business ID from request:', body.businessId)
    console.log('Business ID type:', typeof body.businessId)

    // Validate required fields
    const requiredFields = ['businessId', 'serviceName', 'appointmentDate', 'appointmentTime', 'customerName', 'customerEmail', 'customerPhone']
    for (const field of requiredFields) {
      if (!body[field]) {
        console.log(`Missing required field: ${field}, value:`, body[field])
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate businessId is a valid number
    if (isNaN(parseInt(body.businessId))) {
      console.log('Invalid businessId:', body.businessId)
      return NextResponse.json(
        { error: 'ID i biznesit është i detyrueshëm' },
        { status: 400 }
      )
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        businessId: parseInt(body.businessId),
        serviceName: body.serviceName,
        staffName: body.staffName || null,
        appointmentDate: (() => {
          // Create a date that represents the local time correctly in UTC
          const [year, month, day] = body.appointmentDate.split('-')
          const [hours, minutes] = body.appointmentTime.split(':')
          // Create UTC date that represents the local time
          return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0))
        })(),
        appointmentTime: body.appointmentTime,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        notes: body.notes || null,
        totalPrice: body.totalPrice ? parseFloat(body.totalPrice.toString()) : null,
        serviceDuration: body.serviceDuration || 30, // Default 30 minutes if not specified
        status: 'CONFIRMED'
      }
    })

    // Get business and staff information for emails
    const business = await prisma.business.findUnique({
      where: { id: parseInt(body.businessId) },
      select: { 
        name: true, 
        accountEmail: true,
        phone: true,
        staff: true 
      }
    })

    // Send emails if business exists and SMTP is configured
    if (business && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        // Get staff phone number if staff is selected
        let staffPhone = null
        if (body.staffName && business.staff && Array.isArray(business.staff)) {
          const selectedStaff = business.staff.find((staff: any) => 
            staff.name === body.staffName && staff.isActive !== false
          ) as any
          staffPhone = selectedStaff?.phone || null
        }

        // Format date for display and URL
        const appointmentDate = new Date(body.appointmentDate)
        const dateForDisplay = format(appointmentDate, "EEEE, d MMMM", { locale: sq })
        const dateForUrl = format(appointmentDate, "yyyy-MM-dd")
        
        const emailData = {
          businessName: business.name,
          customerName: body.customerName,
          customerEmail: body.customerEmail,
          customerPhone: body.customerPhone,
          serviceName: body.serviceName,
          date: dateForDisplay,
          dateForUrl: dateForUrl,
          time: body.appointmentTime,
          price: body.totalPrice ? parseFloat(body.totalPrice.toString()) : 0,
          staffName: body.staffName || 'Nuk është caktuar',
          staffPhone: staffPhone || business.phone,
          duration: body.serviceDuration || 30,
          notes: body.notes,
          bookingId: booking.id
        }

        // 1. Send confirmation email to customer
        const customerEmail = emailTemplates.customerConfirmation(emailData)
        await sendEmail({
          to: body.customerEmail,
          subject: customerEmail.subject,
          html: customerEmail.html,
          text: customerEmail.text
        })

        // 2. Send notification email to staff member (if staff is selected)
        if (body.staffName && business.staff && Array.isArray(business.staff)) {
          const selectedStaff = business.staff.find((staff: any) => 
            staff.name === body.staffName && staff.isActive !== false
          ) as any
          if (selectedStaff && selectedStaff.email) {
            const staffEmail = emailTemplates.staffNotification(emailData)
            await sendEmail({
              to: selectedStaff.email,
              subject: staffEmail.subject,
              html: staffEmail.html,
              text: staffEmail.text
            })
            console.log(`Email sent to staff member: ${selectedStaff.email}`)
          } else {
            console.log(`Staff member ${body.staffName} not found or has no email`)
          }
        }


        console.log('All emails sent successfully')
      } catch (emailError) {
        console.error('Email sending failed:', emailError)
        console.error('Email error details:', JSON.stringify(emailError, null, 2))
        // Don't fail the booking if email fails, but log the error for debugging
      }
    } else {
      console.log('Email sending skipped - SMTP configuration check:')
      console.log('- SMTP_HOST:', process.env.SMTP_HOST ? 'configured' : 'missing')
      console.log('- SMTP_USER:', process.env.SMTP_USER ? 'configured' : 'missing')
      console.log('- SMTP_PASS:', process.env.SMTP_PASS ? 'configured' : 'missing')
      console.log('- Business exists:', business ? 'yes' : 'no')
    }

    return NextResponse.json(booking)

  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë krijimit të rezervimit' },
      { status: 500 }
    )
  }
}

