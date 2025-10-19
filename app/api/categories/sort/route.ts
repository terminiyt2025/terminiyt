import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-prisma'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { categories } = body

    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json(
        { error: 'Lista e kategorive është e detyrueshme' },
        { status: 400 }
      )
    }

    // Update sort order for each category
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i]
      await prisma.$queryRaw`
        UPDATE categories 
        SET sort_order = ${i + 1}, updated_at = NOW()
        WHERE id = ${parseInt(category.id)}
      `
    }

    return NextResponse.json({ message: 'Renditja e kategorive u përditësua me sukses' })
  } catch (error) {
    console.error('Error updating category sort order:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë përditësimit të renditjes së kategorive' },
      { status: 500 }
    )
  }
}
