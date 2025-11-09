import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-prisma'
import { verifyPassword } from '@/lib/password'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, staffEmail, currentPassword, newPassword } = body

    if (!businessId || !staffEmail || !currentPassword || !newPassword) {
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

    // Fetch business data
    const businessResult = await prisma.$queryRaw`
      SELECT id, staff
      FROM businesses
      WHERE id = ${businessId}::integer
    `

    const business = (businessResult as any[])[0]

    if (!business) {
      return NextResponse.json(
        { error: 'Biznesi nuk u gjet' },
        { status: 404 }
      )
    }

    // Find staff member
    const staffArray = business.staff || []
    const staffMemberIndex = staffArray.findIndex((s: any) => s.email === staffEmail)

    if (staffMemberIndex === -1) {
      return NextResponse.json(
        { error: 'Stafi nuk u gjet' },
        { status: 404 }
      )
    }

    const currentStaffMember = staffArray[staffMemberIndex]

    if (!currentStaffMember.password) {
      return NextResponse.json(
        { error: 'Stafi nuk ka fjalëkalim të vendosur' },
        { status: 400 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      currentStaffMember.password
    )

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Fjalëkalimi aktual është i gabuar' },
        { status: 401 }
      )
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Update staff member password
    const updatedStaffArray = [...staffArray]
    updatedStaffArray[staffMemberIndex] = {
      ...currentStaffMember,
      password: hashedNewPassword
    }

    // Update business with new staff array
    await prisma.$executeRaw`
      UPDATE businesses
      SET staff = ${JSON.stringify(updatedStaffArray)}::jsonb
      WHERE id = ${businessId}::integer
    `

    return NextResponse.json({
      success: true,
      message: 'Fjalëkalimi u ndryshua me sukses'
    })

  } catch (error) {
    console.error('Error changing staff password:', error)
    return NextResponse.json(
      { error: 'Ndodhi një gabim gjatë ndryshimit të fjalëkalimit' },
      { status: 500 }
    )
  }
}

