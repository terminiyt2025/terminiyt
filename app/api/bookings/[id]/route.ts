import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-prisma'

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
        createdAt: true
      }
    })

    return NextResponse.json(updatedBooking)

  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë përditësimit të rezervimit' },
      { status: 500 }
    )
  }
}
