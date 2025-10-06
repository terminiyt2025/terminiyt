import { NextRequest, NextResponse } from 'next/server'
import { uploadImage } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called')
    
    const formData = await request.formData()
    const file = formData.get('image') as File

    console.log('File received:', file?.name, file?.size, file?.type)

    if (!file) {
      console.log('No file provided')
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // Check file size (2MB limit)
    const maxSize = 2 * 1024 * 1024 // 2MB in bytes
    if (file.size > maxSize) {
      console.log('File too large:', file.size, 'max:', maxSize)
      return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 })
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.log('Invalid file type:', file.type)
      return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed' }, { status: 400 })
    }

    console.log('Starting Cloudinary upload...')
    // Upload to Cloudinary
    const imageUrl = await uploadImage(file)
    console.log('Upload completed:', imageUrl)

    return NextResponse.json({ 
      success: true, 
      imageUrl,
      message: 'Image uploaded successfully' 
    })

  } catch (error) {
    console.error('Upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: `Failed to upload image: ${errorMessage}` }, 
      { status: 500 }
    )
  }
}
