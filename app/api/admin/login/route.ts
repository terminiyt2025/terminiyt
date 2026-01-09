import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import { checkLoginLockout, recordFailedAttempt, clearFailedAttempts } from '@/lib/login-attempts'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

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

    // Find admin by email
    const admin = await prisma.$queryRaw`
      SELECT id, email, password FROM "admin" WHERE email = ${email}
    `

    if (!admin || (admin as any[]).length === 0) {
      // Don't record failed attempt if email doesn't exist in admin system
      // (it might exist in business or staff system)
      return NextResponse.json(
        { error: 'Email ose fjalëkalimi i gabuar' },
        { status: 401 }
      )
    }

    const adminData = (admin as any[])[0]

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, adminData.password)

    if (!isPasswordValid) {
      // Record failed attempt
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

    // Clear failed attempts on successful login
    await clearFailedAttempts(email)

    // Return admin data (without password)
    return NextResponse.json({
      admin: {
        id: adminData.id,
        email: adminData.email
      }
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë kyçjes' },
      { status: 500 }
    )
  }
}
