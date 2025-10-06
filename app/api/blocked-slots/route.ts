import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const date = searchParams.get('date')
    const staffName = searchParams.get('staffName')

    if (!businessId) {
      return NextResponse.json(
        { error: 'ID i biznesit është i detyrueshëm' },
        { status: 400 }
      )
    }

    // First, clean up old blocked slots (older than today)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of today
    
    await (prisma as any).blockedSlot.deleteMany({
      where: {
        businessId: parseInt(businessId),
        date: {
          lt: today
        }
      }
    })

    const where: any = {
      businessId: parseInt(businessId)
    }

    if (date) {
      where.date = new Date(date)
    }

    if (staffName && staffName !== 'all') {
      where.staffName = staffName
    }

    const blockedSlots = await (prisma as any).blockedSlot.findMany({
      where,
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(blockedSlots)

  } catch (error) {
    console.error('Error fetching blocked slots:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë marrjes së slotave të bllokuara' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Creating blocked slot with data:', body)

    // Validate required fields
    const requiredFields = ['businessId', 'date', 'startTime', 'endTime']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Create the blocked slot
    const blockedSlot = await (prisma as any).blockedSlot.create({
      data: {
        businessId: parseInt(body.businessId),
        staffName: body.staffName || null,
        date: new Date(body.date),
        startTime: body.startTime,
        endTime: body.endTime,
        reason: body.reason || 'Bllokuar nga biznesi',
        isRecurring: body.isRecurring || false,
        recurringPattern: body.recurringPattern || null
      }
    })

    return NextResponse.json(blockedSlot)

  } catch (error) {
    console.error('Error creating blocked slot:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë krijimit të slotit të bllokuar' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID i slotit është i detyrueshëm' },
        { status: 400 }
      )
    }

    await (prisma as any).blockedSlot.delete({
      where: {
        id: parseInt(id)
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting blocked slot:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë fshirjes së slotit të bllokuar' },
      { status: 500 }
    )
  }
}
