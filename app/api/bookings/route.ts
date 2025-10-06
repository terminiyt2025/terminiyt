import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-prisma'

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

    // Validate required fields
    const requiredFields = ['businessId', 'serviceName', 'appointmentDate', 'appointmentTime', 'customerName', 'customerEmail', 'customerPhone']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        businessId: parseInt(body.businessId),
        serviceName: body.serviceName,
        staffName: body.staffName || null,
        appointmentDate: new Date(body.appointmentDate + 'T' + body.appointmentTime + ':00'),
        appointmentTime: body.appointmentTime,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        notes: body.notes || null,
        totalPrice: body.totalPrice || null,
        serviceDuration: body.serviceDuration || 30, // Default 30 minutes if not specified
        status: 'CONFIRMED'
      }
    })

    return NextResponse.json(booking)

  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë krijimit të rezervimit' },
      { status: 500 }
    )
  }
}

