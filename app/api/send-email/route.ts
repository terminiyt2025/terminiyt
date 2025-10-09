import { sendEmail } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text } = await request.json()
    
    // Validate required fields
    if (!to || !subject) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject' },
        { status: 400 }
      )
    }
    
    const result = await sendEmail({ to, subject, html, text })
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        messageId: result.messageId 
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
