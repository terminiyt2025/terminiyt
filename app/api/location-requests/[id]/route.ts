import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = parseInt(params.id)
    const body = await request.json()
    
    const { admin_notes } = body

    // Update the request using raw SQL
    const result = await prisma.$queryRaw`
      UPDATE kerkesat 
      SET admin_notes = ${admin_notes}, updated_at = NOW()
      WHERE id = ${requestId}
      RETURNING *
    `

    if (!result || (Array.isArray(result) && result.length === 0)) {
      return NextResponse.json(
        { error: 'Kërkesa nuk u gjet' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Kërkesa u përditësua me sukses',
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = parseInt(params.id)

    // Delete the request using raw SQL
    const result = await prisma.$queryRaw`
      DELETE FROM kerkesat 
      WHERE id = ${requestId}
      RETURNING *
    `

    if (!result || (Array.isArray(result) && result.length === 0)) {
      return NextResponse.json(
        { error: 'Kërkesa nuk u gjet' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Kërkesa u fshi me sukses'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: `Gabim i brendshëm i serverit: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
