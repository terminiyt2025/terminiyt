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

    // Find business by account email using raw SQL
    const businessResult = await prisma.$queryRaw`
      SELECT 
        b.id, b.name, b.description, b.category_id, b.owner_name, b.phone, b.address, 
        b.city, b.state, b.website, b.instagram, b.facebook, b.logo, b.business_images,
        b.google_maps_link, b.latitude, b.longitude, b.account_email, b.account_password,
        b.operating_hours, b.services, b.staff, b.is_verified, b.is_active, b.rating, 
        b.total_reviews, b.created_at, b.updated_at,
        c.name as category_name, c.slug as category_slug
      FROM businesses b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.account_email = ${email}
    `
    
    const business = (businessResult as any[])[0]

    if (!business) {
      // Don't record failed attempt if email doesn't exist in business system
      // (it might exist in admin or staff system)
      return NextResponse.json(
        { error: 'Email ose fjalëkalimi i gabuar' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, business.account_password)
    
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

    // Return business data (without password)
    const businessData = {
      id: business.id,
      name: business.name,
      description: business.description,
      category_id: business.category_id,
      owner_name: business.owner_name,
      phone: business.phone,
      address: business.address,
      city: business.city,
      state: business.state,
      website: business.website,
      instagram: business.instagram,
      facebook: business.facebook,
      logo: business.logo,
      businessImages: business.business_images,
      business_images: business.business_images,
      google_maps_link: business.google_maps_link,
      latitude: business.latitude,
      longitude: business.longitude,
      account_email: business.account_email,
      operating_hours: business.operating_hours,
      services: business.services,
      staff: business.staff,
      is_verified: business.is_verified,
      is_active: business.is_active,
      rating: business.rating,
      total_reviews: business.total_reviews,
      created_at: business.created_at,
      updated_at: business.updated_at,
      category: {
        id: business.category_id,
        name: business.category_name,
        slug: business.category_slug
      }
    }

    return NextResponse.json({ business: businessData })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë kyçjes' },
      { status: 500 }
    )
  }
}
