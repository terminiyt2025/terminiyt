import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      )
    }

    // Fetch business by slug with category information
    const businessResult = await prisma.$queryRaw`
      SELECT 
        b.id, b.name, b.slug, b.description, b.category_id, b.owner_name, b.phone, b.address, b.city, b.state,
        b.google_maps_link, b.latitude, b.longitude, b.website, b.instagram, b.facebook,
        b.account_email, b.logo, b.business_images,
        b.operating_hours, b.services, b.staff, b.is_verified, b.is_active, b.rating, b.total_reviews,
        b.created_at, b.updated_at,
        c.name as category_name, c.slug as category_slug
      FROM businesses b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.slug = ${slug} AND b.is_active = true AND b.is_verified = true
    `

    const businesses = businessResult as any[]

    if (businesses.length === 0) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const business = businesses[0]

    return NextResponse.json(business)

  } catch (error) {
    console.error('Error fetching business by slug:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë marrjes së biznesit' },
      { status: 500 }
    )
  }
}

