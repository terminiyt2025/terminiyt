import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

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

    // Find admin by email
    const admin = await prisma.$queryRaw`
      SELECT id, email, password FROM "admin" WHERE email = ${email}
    `

    if (!admin || (admin as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Email ose fjalëkalimi i gabuar' },
        { status: 401 }
      )
    }

    const adminData = (admin as any[])[0]

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, adminData.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email ose fjalëkalimi i gabuar' },
        { status: 401 }
      )
    }

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
