import { NextRequest, NextResponse } from 'next/server'
import { db, prisma } from '@/lib/database-prisma'
import { hashPassword } from '@/lib/password'
import { generateUniqueSlug, generateSlug } from '@/lib/slug'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const includeUnverified = searchParams.get('includeUnverified') === 'true'
    
    // Fetch businesses with category information (optionally including inactive/unverified ones for admin)
    let businesses
    if (includeInactive || includeUnverified) {
      // Admin access - include all businesses (active/inactive, verified/unverified)
      if (includeInactive && includeUnverified) {
        // Include all businesses
        businesses = await prisma.$queryRaw`
          SELECT 
            b.id, b.name, COALESCE(b.slug, '') as slug, b.description, b.category_id, b.owner_name, b.phone, b.address, b.city, b.state,
            b.google_maps_link, b.latitude, b.longitude, b.website, b.instagram, b.facebook,
            b.account_email, b.logo, b.business_images,
            b.operating_hours, b.services, b.staff, b.is_verified, b.is_active, b.rating, b.total_reviews,
            b.created_at, b.updated_at,
            c.name as category_name, c.slug as category_slug
          FROM businesses b
          LEFT JOIN categories c ON b.category_id = c.id
          ORDER BY b.created_at DESC
        `
      } else if (includeInactive) {
        // Include inactive but only verified
        businesses = await prisma.$queryRaw`
          SELECT 
            b.id, b.name, COALESCE(b.slug, '') as slug, b.description, b.category_id, b.owner_name, b.phone, b.address, b.city, b.state,
            b.google_maps_link, b.latitude, b.longitude, b.website, b.instagram, b.facebook,
            b.account_email, b.logo, b.business_images,
            b.operating_hours, b.services, b.staff, b.is_verified, b.is_active, b.rating, b.total_reviews,
            b.created_at, b.updated_at,
            c.name as category_name, c.slug as category_slug
          FROM businesses b
          LEFT JOIN categories c ON b.category_id = c.id
          WHERE b.is_verified = true
          ORDER BY b.created_at DESC
        `
      } else if (includeUnverified) {
        // Include unverified but only active
        businesses = await prisma.$queryRaw`
          SELECT 
            b.id, b.name, COALESCE(b.slug, '') as slug, b.description, b.category_id, b.owner_name, b.phone, b.address, b.city, b.state,
            b.google_maps_link, b.latitude, b.longitude, b.website, b.instagram, b.facebook,
            b.account_email, b.logo, b.business_images,
            b.operating_hours, b.services, b.staff, b.is_verified, b.is_active, b.rating, b.total_reviews,
            b.created_at, b.updated_at,
            c.name as category_name, c.slug as category_slug
          FROM businesses b
          LEFT JOIN categories c ON b.category_id = c.id
          WHERE b.is_active = true
          ORDER BY b.created_at DESC
        `
      }
    } else {
      // Regular access - only active and verified businesses
      businesses = await prisma.$queryRaw`
        SELECT 
          b.id, b.name, COALESCE(b.slug, '') as slug, b.description, b.category_id, b.owner_name, b.phone, b.address, b.city, b.state,
          b.google_maps_link, b.latitude, b.longitude, b.website, b.instagram, b.facebook,
          b.account_email, b.logo, b.business_images,
          b.operating_hours, b.services, b.staff, b.is_verified, b.is_active, b.rating, b.total_reviews,
          b.created_at, b.updated_at,
          c.name as category_name, c.slug as category_slug
        FROM businesses b
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.is_active = true AND b.is_verified = true
        ORDER BY b.created_at DESC
      `
    }

    return NextResponse.json(businesses)

  } catch (error) {
    console.error('Error fetching businesses:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë marrjes së bizneseve' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Creating business with data:', body)

    // Validate required fields
    const requiredFields = ['name', 'description', 'category_id', 'owner_name', 'phone', 'address', 'city', 'state', 'accountEmail', 'accountPassword']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Hash the password before storing
    const hashedPassword = await hashPassword(body.accountPassword || '')

    // Generate unique slug for the business
    let slug = ''
    try {
      const existingSlugs = await prisma.$queryRaw`
        SELECT slug FROM businesses WHERE slug IS NOT NULL
      `
      slug = generateUniqueSlug(body.name, (existingSlugs as any[]).map(b => b.slug))
    } catch (error) {
      // If slug column doesn't exist yet, generate a basic slug
      console.log('Slug column not found, generating basic slug')
      slug = generateSlug(body.name)
    }

    // Process services data for JSON storage
    const servicesData = body.services && Array.isArray(body.services) 
      ? body.services
          .filter((service: any) => service.name && service.cost && service.duration)
          .map((service: any) => ({
            name: service.name,
            description: service.description || '',
            price: parseFloat(service.cost) || 0,
            duration: service.duration,
            durationMinutes: parseDurationToMinutes(service.duration),
            isActive: true
          }))
      : []

    // Process staff data for JSON storage
    const staffData = body.team_members && Array.isArray(body.team_members)
      ? body.team_members
          .filter((member: any) => member.name && member.email && member.phone)
          .map((member: any) => {
            // Convert service indices to service names
            const serviceNames = (member.services || []).map((serviceIndex: number) => {
              if (typeof serviceIndex === 'number' && body.services && body.services[serviceIndex]) {
                return body.services[serviceIndex].name
              }
              return serviceIndex // If it's already a string, keep it
            }).filter(Boolean) // Remove any undefined values
            
            return {
              name: member.name,
              email: member.email,
              phone: member.phone,
              services: serviceNames, // Use service names instead of indices
              isActive: true
            }
          })
      : []

    // Create business object
    const businessData = {
      name: body.name,
      slug: slug,
      description: body.description,
      category_id: body.category_id,
      owner_name: body.owner_name,
      phone: body.phone,
      address: body.address,
      city: body.city,
      state: body.state,
      google_maps_link: body.google_maps_link || '',
      latitude: body.latitude || 0,
      longitude: body.longitude || 0,
      account_email: body.accountEmail || '',
      account_password: hashedPassword,
      logo: body.logo || null,
      businessImages: body.business_images || null,
      operating_hours: body.operating_hours || null,
      // Temporarily comment out until Prisma client is regenerated
      // services: servicesData.length > 0 ? servicesData : null,
      // staff: staffData.length > 0 ? staffData : null,
      is_active: body.is_active !== undefined ? body.is_active : true,
    }

    // Create the business using raw SQL to avoid Prisma client issues
    let businessResult
    if (slug) {
      // If slug column exists, include it
      businessResult = await prisma.$queryRaw`
        INSERT INTO businesses (
          name, slug, description, category_id, owner_name, phone, address, city, state,
          latitude, longitude, account_email, account_password,
          logo, business_images, operating_hours, services, staff, is_active,
          is_verified, rating, total_reviews, created_at, updated_at
        ) VALUES (
          ${businessData.name}, ${businessData.slug}, ${businessData.description}, ${businessData.category_id},
          ${businessData.owner_name}, ${businessData.phone}, ${businessData.address},
          ${businessData.city}, ${businessData.state},
          ${businessData.latitude}, ${businessData.longitude}, ${businessData.account_email},
          ${businessData.account_password}, ${businessData.logo}, ${businessData.businessImages || null},
          ${JSON.stringify(businessData.operating_hours || null)}::jsonb,
          ${JSON.stringify(servicesData)}::jsonb, ${JSON.stringify(staffData)}::jsonb,
          ${businessData.is_active}, false, 0, 0, NOW(), NOW()
        ) RETURNING id, name, slug, description, category_id, owner_name, phone, address, city, state,
          latitude, longitude, account_email, logo, business_images,
          operating_hours, services, staff, is_verified, is_active, rating, total_reviews,
          created_at, updated_at
      `
    } else {
      // If slug column doesn't exist, exclude it
      businessResult = await prisma.$queryRaw`
        INSERT INTO businesses (
          name, description, category_id, owner_name, phone, address, city, state,
          latitude, longitude, account_email, account_password,
          logo, business_images, operating_hours, services, staff, is_active,
          is_verified, rating, total_reviews, created_at, updated_at
        ) VALUES (
          ${businessData.name}, ${businessData.description}, ${businessData.category_id},
          ${businessData.owner_name}, ${businessData.phone}, ${businessData.address},
          ${businessData.city}, ${businessData.state},
          ${businessData.latitude}, ${businessData.longitude}, ${businessData.account_email},
          ${businessData.account_password}, ${businessData.logo}, ${businessData.businessImages || null},
          ${JSON.stringify(businessData.operating_hours || null)}::jsonb,
          ${JSON.stringify(servicesData)}::jsonb, ${JSON.stringify(staffData)}::jsonb,
          ${businessData.is_active}, false, 0, 0, NOW(), NOW()
        ) RETURNING id, name, description, category_id, owner_name, phone, address, city, state,
          latitude, longitude, account_email, logo, business_images,
          operating_hours, services, staff, is_verified, is_active, rating, total_reviews,
          created_at, updated_at
      `
    }
    
    const business = (businessResult as any[])[0]

    console.log('Business created successfully:', business.id)
    return NextResponse.json(business)

  } catch (error) {
    console.error('Error creating business:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { 
        error: 'Failed to create business',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to convert duration string to minutes
function parseDurationToMinutes(duration: string): number {
  const durationMap: { [key: string]: number } = {
    '15 min': 15,
    '30 min': 30,
    '45 min': 45,
    '1 orë': 60,
    '1 orë 15 min': 75,
    '1 orë 30 min': 90,
    '1 orë 45 min': 105,
    '2 orë': 120,
    '2 orë 15 min': 135,
    '2 orë 30 min': 150,
    '2 orë 45 min': 165,
    '3 orë': 180,
    '3 orë 15 min': 195,
    '3 orë 30 min': 210,
    '3 orë 45 min': 225,
    '4 orë': 240,
    '5 orë': 300,
    '6 orë': 360,
    '8 orë': 480,
    '1 ditë': 1440,
  }
  
  return durationMap[duration] || 60 // Default to 1 hour
}
