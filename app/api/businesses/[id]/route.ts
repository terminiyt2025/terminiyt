import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-prisma'
import bcrypt from 'bcrypt'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const businessId = parseInt(id)

    if (isNaN(businessId)) {
      return NextResponse.json(
        { error: 'ID i biznesit nuk është i vlefshëm' },
        { status: 400 }
      )
    }

    // Use raw SQL to fetch business and avoid Prisma client issues
    const businessResult = await prisma.$queryRaw`
      SELECT 
        b.id, b.name, b.description, b.category_id, b.owner_name, b.phone, b.address, 
        b.city, b.state, b.website, b.instagram, b.facebook, b.logo, b.business_images,
 b.latitude, b.longitude, b.account_email, b.operating_hours,
        b.services, b.staff, b.is_verified, b.is_active, b.rating, b.total_reviews,
        b.created_at, b.updated_at,
        c.name as category_name, c.slug as category_slug
      FROM businesses b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = ${businessId}::integer AND b.is_active = true AND b.is_verified = true
    `
    
    const business = (businessResult as any[])[0]

    if (!business) {
      return NextResponse.json(
        { error: 'Biznesi nuk u gjet' },
        { status: 404 }
      )
    }

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

    return NextResponse.json(businessData)

  } catch (error) {
    console.error('Error fetching business:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë marrjes së të dhënave' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const businessId = parseInt(id)
    const body = await request.json()

    console.log('Received staff data in API:', body.staff)
    console.log('Full body received:', JSON.stringify(body, null, 2))

    if (isNaN(businessId)) {
      return NextResponse.json(
        { error: 'ID i biznesit nuk është i vlefshëm' },
        { status: 400 }
      )
    }

    // Check if business exists using raw SQL
    const existingBusinessResult = await prisma.$queryRaw`
      SELECT id FROM businesses WHERE id = ${businessId}::integer
    `

    if (!existingBusinessResult || (existingBusinessResult as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Biznesi nuk u gjet' },
        { status: 404 }
      )
    }

    // Hash password if provided
    let hashedPassword = null
    if (body.new_password && body.new_password.trim() !== '') {
      console.log('Password received for hashing:', body.new_password)
      hashedPassword = await bcrypt.hash(body.new_password, 10)
      console.log('Password hashed successfully')
    } else {
      console.log('No password provided for update')
    }

    // Build dynamic UPDATE query to avoid null constraint violations
    const updateFields = []
    const updateValues = []
    
    if (body.name !== undefined) {
      updateFields.push('name = $' + (updateValues.length + 1))
      updateValues.push(body.name)
    }
    if (body.slug !== undefined) {
      // Check if slug is unique (excluding current business)
      const existingSlug = await prisma.$queryRaw`
        SELECT id FROM businesses WHERE slug = ${body.slug} AND id != ${businessId}::integer
      `
      if (existingSlug && (existingSlug as any[]).length > 0) {
        return NextResponse.json(
          { error: 'Slug tashmë ekziston. Ju lutemi zgjidhni një slug tjetër.' },
          { status: 400 }
        )
      }
      updateFields.push('slug = $' + (updateValues.length + 1))
      updateValues.push(body.slug)
    }
    if (body.description !== undefined) {
      updateFields.push('description = $' + (updateValues.length + 1))
      updateValues.push(body.description)
    }
    if (body.owner_name !== undefined) {
      updateFields.push('owner_name = $' + (updateValues.length + 1))
      updateValues.push(body.owner_name)
    }
    if (body.phone !== undefined) {
      updateFields.push('phone = $' + (updateValues.length + 1))
      updateValues.push(body.phone)
    }
    if (body.address !== undefined) {
      updateFields.push('address = $' + (updateValues.length + 1))
      updateValues.push(body.address)
    }
    if (body.city !== undefined) {
      updateFields.push('city = $' + (updateValues.length + 1))
      updateValues.push(body.city)
    }
    if (body.state !== undefined) {
      updateFields.push('state = $' + (updateValues.length + 1))
      updateValues.push(body.state)
    }
    if (body.website !== undefined) {
      updateFields.push('website = $' + (updateValues.length + 1))
      updateValues.push(body.website)
    }
    if (body.instagram !== undefined) {
      updateFields.push('instagram = $' + (updateValues.length + 1))
      updateValues.push(body.instagram)
    }
    if (body.facebook !== undefined) {
      updateFields.push('facebook = $' + (updateValues.length + 1))
      updateValues.push(body.facebook)
    }
    if (body.logo !== undefined) {
      updateFields.push('logo = $' + (updateValues.length + 1))
      updateValues.push(body.logo)
    }
    if (body.businessImages !== undefined || body.business_images !== undefined) {
      updateFields.push('business_images = $' + (updateValues.length + 1))
      updateValues.push(body.businessImages || body.business_images || null)
    }
    if (body.latitude !== undefined) {
      updateFields.push('latitude = $' + (updateValues.length + 1))
      updateValues.push(body.latitude)
    }
    if (body.longitude !== undefined) {
      updateFields.push('longitude = $' + (updateValues.length + 1))
      updateValues.push(body.longitude)
    }
    if (body.account_email !== undefined) {
      updateFields.push('account_email = $' + (updateValues.length + 1))
      updateValues.push(body.account_email)
    }
    if (hashedPassword !== null) {
      updateFields.push('account_password = $' + (updateValues.length + 1))
      updateValues.push(hashedPassword)
    }
    if (body.operating_hours !== undefined) {
      updateFields.push('operating_hours = $' + (updateValues.length + 1) + '::jsonb')
      updateValues.push(JSON.stringify(body.operating_hours))
    }
    if (body.services !== undefined) {
      updateFields.push('services = $' + (updateValues.length + 1) + '::jsonb')
      updateValues.push(JSON.stringify(body.services))
    }
    if (body.staff !== undefined) {
      updateFields.push('staff = $' + (updateValues.length + 1) + '::jsonb')
      updateValues.push(JSON.stringify(body.staff))
    }
    if (body.rating !== undefined) {
      updateFields.push('rating = $' + (updateValues.length + 1))
      updateValues.push(body.rating)
    }
    if (body.total_reviews !== undefined) {
      updateFields.push('total_reviews = $' + (updateValues.length + 1))
      updateValues.push(body.total_reviews)
    }
    if (body.google_maps_link !== undefined) {
      updateFields.push('google_maps_link = $' + (updateValues.length + 1))
      updateValues.push(body.google_maps_link)
    }
    if (body.category_id !== undefined) {
      updateFields.push('category_id = $' + (updateValues.length + 1))
      updateValues.push(body.category_id)
    }
    if (body.is_active !== undefined) {
      updateFields.push('is_active = $' + (updateValues.length + 1))
      updateValues.push(body.is_active)
    }
    if (body.is_verified !== undefined) {
      updateFields.push('is_verified = $' + (updateValues.length + 1))
      updateValues.push(body.is_verified)
    }
    
    // Always update the updated_at timestamp
    updateFields.push('updated_at = NOW()')
    
    if (updateFields.length > 0) {
      updateValues.push(businessId)
      const updateQuery = `UPDATE businesses SET ${updateFields.join(', ')} WHERE id = $${updateValues.length}`
      await prisma.$executeRawUnsafe(updateQuery, ...updateValues)
    }

    // Fetch the updated business using raw SQL
    const updatedBusinessResult = await prisma.$queryRaw`
      SELECT 
        b.id, b.name, b.description, b.category_id, b.owner_name, b.phone, b.address, 
        b.city, b.state, b.website, b.instagram, b.facebook, b.logo, b.business_images,
 b.latitude, b.longitude, b.account_email, b.operating_hours,
        b.services, b.staff, b.is_verified, b.is_active, b.rating, b.total_reviews,
        b.created_at, b.updated_at,
        c.name as category_name, c.slug as category_slug
      FROM businesses b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = ${businessId}::integer
    `
    
    const updatedBusiness = (updatedBusinessResult as any[])[0]

    // Return updated business data (without password)
    const businessData = {
      id: updatedBusiness.id,
      name: updatedBusiness.name,
      description: updatedBusiness.description,
      category_id: updatedBusiness.category_id,
      owner_name: updatedBusiness.owner_name,
      phone: updatedBusiness.phone,
      address: updatedBusiness.address,
      city: updatedBusiness.city,
      state: updatedBusiness.state,
      website: updatedBusiness.website,
      instagram: updatedBusiness.instagram,
      facebook: updatedBusiness.facebook,
      logo: updatedBusiness.logo,
      businessImages: updatedBusiness.business_images,
      business_images: updatedBusiness.business_images,
      latitude: updatedBusiness.latitude,
      longitude: updatedBusiness.longitude,
      account_email: updatedBusiness.account_email,
      operating_hours: updatedBusiness.operating_hours,
      services: updatedBusiness.services,
      staff: updatedBusiness.staff,
      is_verified: updatedBusiness.is_verified,
      is_active: updatedBusiness.is_active,
      rating: updatedBusiness.rating,
      total_reviews: updatedBusiness.total_reviews,
      created_at: updatedBusiness.created_at,
      updated_at: updatedBusiness.updated_at,
      category: {
        id: updatedBusiness.category_id,
        name: updatedBusiness.category_name,
        slug: updatedBusiness.category_slug
      }
    }

    return NextResponse.json(businessData)

  } catch (error) {
    console.error('Error updating business:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë përditësimit' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const businessId = parseInt(id)

    if (isNaN(businessId)) {
      return NextResponse.json(
        { error: 'ID i biznesit nuk është i vlefshëm' },
        { status: 400 }
      )
    }

    // Check if business exists
    const existingBusinessResult = await prisma.$queryRaw`
      SELECT id FROM businesses WHERE id = ${businessId}::integer
    `

    if (!existingBusinessResult || (existingBusinessResult as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Biznesi nuk u gjet' },
        { status: 404 }
      )
    }

    // Delete the business
    await prisma.$executeRaw`
      DELETE FROM businesses WHERE id = ${businessId}::integer
    `

    return NextResponse.json({ 
      success: true, 
      message: 'Biznesi u fshi me sukses' 
    })

  } catch (error) {
    console.error('Error deleting business:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë fshirjes së biznesit' },
      { status: 500 }
    )
  }
}
