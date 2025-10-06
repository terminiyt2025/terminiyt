import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received request data:', body)
    
    const { business_id, business_name, requested_google_maps_link, reason } = body

    // Validate required fields
    if (!business_id || !business_name || !requested_google_maps_link || !reason) {
      console.log('Validation failed:', { business_id, business_name, requested_google_maps_link, reason })
      return NextResponse.json(
        { error: 'Të gjitha fushat janë të detyrueshme' },
        { status: 400 }
      )
    }

    // Insert the location request using raw SQL
    const result = await prisma.$queryRaw`
      INSERT INTO kerkesat (business_id, business_name, requested_google_maps_link, reason, created_at, updated_at)
      VALUES (${business_id}, ${business_name}, ${requested_google_maps_link}, ${reason}, NOW(), NOW())
      RETURNING *
    `

    console.log('Successfully inserted data:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Kërkesa u ruajt me sukses',
      data: Array.isArray(result) ? result[0] : result
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: `Gabim i brendshëm i serverit: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get all location requests using raw SQL
    const result = await prisma.$queryRaw`
      SELECT * FROM kerkesat 
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: `Gabim i brendshëm i serverit: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
