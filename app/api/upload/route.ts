import { NextRequest, NextResponse } from 'next/server'
import { cloudinary } from '@/lib/cloudinary'

// Test Cloudinary configuration
async function testCloudinaryConfig() {
  try {
    // Try to get account info to test the connection
    const result = await cloudinary.api.ping()
    console.log('Cloudinary ping result:', result)
    return true
  } catch (error) {
    console.error('Cloudinary configuration test failed:', error)
    return false
  }
}

export async function GET() {
  // Health check endpoint to test Cloudinary configuration
  try {
    const hasCloudName = !!process.env.CLOUDINARY_CLOUD_NAME
    const hasApiKey = !!process.env.CLOUDINARY_API_KEY
    const hasApiSecret = !!process.env.CLOUDINARY_API_SECRET
    
    const cloudinaryWorking = await testCloudinaryConfig()
    
    return NextResponse.json({
      cloudinary: {
        configured: hasCloudName && hasApiKey && hasApiSecret,
        working: cloudinaryWorking,
        cloudName: hasCloudName ? 'Set' : 'Missing',
        apiKey: hasApiKey ? 'Set' : 'Missing',
        apiSecret: hasApiSecret ? 'Set' : 'Missing'
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called')
    
    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Missing Cloudinary environment variables')
      return NextResponse.json({ 
        error: 'Cloudinary configuration missing. Please check environment variables.' 
      }, { status: 500 })
    }
    
    // Test Cloudinary connection
    const cloudinaryWorking = await testCloudinaryConfig()
    if (!cloudinaryWorking) {
      return NextResponse.json({ 
        error: 'Cloudinary connection failed. Please check your configuration.' 
      }, { status: 500 })
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'logo' or 'business_image'
    
    console.log('File received:', { name: file?.name, size: file?.size, type: file?.type })
    console.log('Upload type:', type)
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size based on type
    const maxSize = type === 'logo' ? 1024 * 1024 : 2 * 1024 * 1024 // 1MB for logo, 2MB for business images
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: type === 'logo' 
          ? 'Logo duhet të jetë më pak se 1MB' 
          : 'Imazhi duhet të jetë më pak se 2MB' 
      }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Vetëm imazhet lejohen' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    console.log('Uploading to Cloudinary...')
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: type === 'logo' ? 'business-logos' : 'business-images',
          transformation: type === 'logo' ? [
            { width: 300, height: 300, crop: 'limit', quality: 'auto' }
          ] : [
            { width: 800, height: 600, crop: 'limit', quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            reject(error)
          } else {
            console.log('Cloudinary upload success:', result)
            resolve(result)
          }
        }
      ).end(buffer)
    })

    console.log('Upload completed successfully')
    return NextResponse.json({ 
      success: true, 
      url: (result as any).secure_url,
      public_id: (result as any).public_id
    })

  } catch (error) {
    console.error('Upload error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Gabim gjatë ngarkimit'
    if (error instanceof Error) {
      if (error.message.includes('Cloudinary')) {
        errorMessage = 'Gabim në konfigurimin e Cloudinary'
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Gabim në lidhjen me serverin'
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
