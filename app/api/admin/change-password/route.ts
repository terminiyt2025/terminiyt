import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyPassword } from '@/lib/password'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, currentPassword, newPassword } = body

    if (!adminId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Të gjitha fushat janë të detyrueshme' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Fjalëkalimi i ri duhet të jetë të paktën 8 karaktere' },
        { status: 400 }
      )
    }

    // Fetch admin data
    const adminResult = await prisma.$queryRaw`
      SELECT id, email, password FROM "admin" WHERE id = ${adminId}::integer
    `

    if (!adminResult || (adminResult as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Admini nuk u gjet' },
        { status: 404 }
      )
    }

    const adminData = (adminResult as any[])[0]

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      adminData.password
    )

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Fjalëkalimi aktual është i gabuar' },
        { status: 401 }
      )
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Update admin password
    await prisma.$executeRaw`
      UPDATE "admin"
      SET password = ${hashedNewPassword}
      WHERE id = ${adminId}::integer
    `

    return NextResponse.json({
      success: true,
      message: 'Fjalëkalimi u ndryshua me sukses'
    })

  } catch (error) {
    console.error('Error changing admin password:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë ndryshimit të fjalëkalimit' },
      { status: 500 }
    )
  }
}

