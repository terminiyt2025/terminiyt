import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-prisma'
import { verifyPassword } from '@/lib/password'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dhe fjalëkalimi janë të detyrueshëm' },
        { status: 400 }
      )
    }

    // Gjej të gjitha bizneset që kanë staff me këtë email
    const businessesResult = await prisma.$queryRaw`
      SELECT 
        b.id, b.name, b.staff, b.is_active, b.is_verified
      FROM businesses b
      WHERE b.is_active = true
    `
    
    // Kërko në staff JSON për email
    let foundStaff = null
    let foundBusiness = null
    
    for (const business of businessesResult as any[]) {
      if (!business.staff || !Array.isArray(business.staff)) continue
      
      const staffMember = business.staff.find((s: any) => 
        s.email === email && 
        s.isActive !== false &&
        s.password !== null &&
        s.password !== undefined &&
        s.password !== ''
      )
      
      if (staffMember && staffMember.password) {
        // Verifiko password
        const isPasswordValid = await verifyPassword(
          password, 
          staffMember.password
        )
        
        if (isPasswordValid) {
          foundStaff = staffMember
          foundBusiness = business
          break
        }
      }
    }

    if (!foundStaff || !foundBusiness) {
      return NextResponse.json(
        { error: 'Email ose fjalëkalimi i gabuar' },
        { status: 401 }
      )
    }

    // Kthej staff dhe business data
    return NextResponse.json({
      staff: {
        name: foundStaff.name,
        email: foundStaff.email,
        phone: foundStaff.phone || null,
        services: foundStaff.services || [],
        role: foundStaff.role || 'STAFF',
        operatingHours: foundStaff.operatingHours || null,
        breakTimes: foundStaff.breakTimes || []
      },
      business: {
        id: foundBusiness.id,
        name: foundBusiness.name
      }
    })

  } catch (error) {
    console.error('Staff login error:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë kyçjes' },
      { status: 500 }
    )
  }
}

