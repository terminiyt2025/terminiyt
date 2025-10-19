import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-prisma'
import { generateSlug } from '@/lib/slug'

export async function GET() {
  try {
    const categories = await prisma.$queryRaw`
      SELECT id, name, slug, icon, COALESCE(sort_order, 0) as sort_order, created_at, updated_at
      FROM categories 
      ORDER BY COALESCE(sort_order, 0) ASC, name ASC
    `

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë marrjes së kategorive' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, icon, sort_order } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Emri i kategorisë është i detyrueshëm' },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = generateSlug(name)

    // Check if category with same name or slug already exists
    const existingCategory = await prisma.$queryRaw`
      SELECT id FROM categories WHERE name = ${name} OR slug = ${slug}
    `

    if (existingCategory && (existingCategory as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Kategoria me këtë emër tashmë ekziston' },
        { status: 400 }
      )
    }

    // Get the next sort order if not provided
    let nextSortOrder = sort_order
    if (nextSortOrder === undefined || nextSortOrder === null) {
      const maxSortResult = await prisma.$queryRaw`
        SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM categories
      `
      nextSortOrder = (maxSortResult as any[])[0]?.next_order || 1
    }

    // Create new category
    const newCategory = await prisma.$queryRaw`
      INSERT INTO categories (name, slug, icon, sort_order, created_at, updated_at)
      VALUES (${name}, ${slug}, ${icon || null}, ${nextSortOrder}, NOW(), NOW())
      RETURNING id, name, slug, icon, sort_order, created_at, updated_at
    `

    return NextResponse.json((newCategory as any[])[0])
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë krijimit të kategorisë' },
      { status: 500 }
    )
  }
}