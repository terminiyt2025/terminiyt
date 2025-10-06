import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get all bookings for admin dashboard
    const bookings = await prisma.$queryRaw`
      SELECT 
        b.id,
        b.business_id,
        b.service_name,
        b.appointment_date,
        b.appointment_time,
        b.customer_name,
        b.customer_email,
        b.customer_phone,
        b.notes,
        b.status,
        b.total_price,
        b.created_at,
        bus.name as business_name
      FROM "bookings" b
      LEFT JOIN "businesses" bus ON b.business_id = bus.id
      ORDER BY b.appointment_date DESC, b.appointment_time DESC
    `

    return NextResponse.json(bookings)

  } catch (error) {
    console.error('Error fetching admin bookings:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Return empty array instead of error for now
    return NextResponse.json([])
  }
}
