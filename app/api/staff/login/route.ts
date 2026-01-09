import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-prisma'
import { verifyPassword } from '@/lib/password'
import { checkLoginLockout, recordFailedAttempt, clearFailedAttempts } from '@/lib/login-attempts'

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

    // Check if account is locked
    const lockoutCheck = await checkLoginLockout(email)
    if (lockoutCheck.isLocked) {
      return NextResponse.json(
        { 
          error: `Llogaria juaj është e bllokuar për ${lockoutCheck.remainingMinutes} minuta për shkak të tentativave të shumta të dështuara. Ju lutemi provoni më vonë.` 
        },
        { status: 423 } // 423 Locked
      )
    }

    // Special case: if password is a marker for recording attempt only (from frontend)
    // This happens when email doesn't exist in any system
    if (password === 'INVALID_TO_RECORD_ATTEMPT') {
      const failedAttempt = await recordFailedAttempt(email)
      if (failedAttempt.isLocked) {
        return NextResponse.json(
          { 
            error: `Llogaria juaj është e bllokuar për ${failedAttempt.remainingMinutes} minuta për shkak të tentativave të shumta të dështuara.` 
          },
          { status: 423 }
        )
      }
      const attemptsRemaining = failedAttempt.attemptsRemaining || 0
      return NextResponse.json(
        { 
          error: `Email ose fjalëkalimi i gabuar. ${attemptsRemaining > 0 ? `Tentativa të mbetura: ${attemptsRemaining}` : ''}` 
        },
        { status: 401 }
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
        } else {
          // Email exists but password is wrong - record failed attempt
          const failedAttempt = await recordFailedAttempt(email)
          if (failedAttempt.isLocked) {
            return NextResponse.json(
              { 
                error: `Llogaria juaj është e bllokuar për ${failedAttempt.remainingMinutes} minuta për shkak të tentativave të shumta të dështuara.` 
              },
              { status: 423 }
            )
          }
          const attemptsRemaining = failedAttempt.attemptsRemaining || 0
          return NextResponse.json(
            { 
              error: `Email ose fjalëkalimi i gabuar. ${attemptsRemaining > 0 ? `Tentativa të mbetura: ${attemptsRemaining}` : ''}` 
            },
            { status: 401 }
          )
        }
      }
    }

    // Email doesn't exist in staff system
    // Don't record attempt here - it might exist in admin/business and they already recorded it
    // Or it doesn't exist anywhere, in which case we'll record it once in the frontend
    return NextResponse.json(
      { error: 'Email ose fjalëkalimi i gabuar' },
      { status: 401 }
    )

    // Clear failed attempts on successful login
    await clearFailedAttempts(email)

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

