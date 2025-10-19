import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-prisma'
import { generateSlug } from '@/lib/slug'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Check if category with same name or slug already exists (excluding current category)
    const existingCategory = await prisma.$queryRaw`
      SELECT id FROM categories WHERE (name = ${name} OR slug = ${slug}) AND id != ${parseInt(id)}
    `

    if (existingCategory && (existingCategory as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Kategoria me këtë emër tashmë ekziston' },
        { status: 400 }
      )
    }

    // Update category
    const updatedCategory = await prisma.$queryRaw`
      UPDATE categories 
      SET name = ${name}, slug = ${slug}, icon = ${icon || null}, sort_order = ${sort_order || 0}, updated_at = NOW()
      WHERE id = ${parseInt(id)}
      RETURNING id, name, slug, icon, sort_order, created_at, updated_at
    `

    if (!updatedCategory || (updatedCategory as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Kategoria nuk u gjet' },
        { status: 404 }
      )
    }

    return NextResponse.json((updatedCategory as any[])[0])
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë përditësimit të kategorisë' },
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

    // Check if category has associated businesses
    const businessesWithCategory = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM businesses WHERE category_id = ${parseInt(id)}
    `

    const businessCount = (businessesWithCategory as any[])[0]?.count || 0
    if (businessCount > 0) {
      return NextResponse.json(
        { error: `Nuk mund të fshini këtë kategori sepse ka ${businessCount} biznese të lidhura me të` },
        { status: 400 }
      )
    }

    // Delete category
    const deletedCategory = await prisma.$queryRaw`
      DELETE FROM categories WHERE id = ${parseInt(id)}
      RETURNING id, name, slug
    `

    if (!deletedCategory || (deletedCategory as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Kategoria nuk u gjet' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Kategoria u fshi me sukses' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë fshirjes së kategorisë' },
      { status: 500 }
    )
  }
}
