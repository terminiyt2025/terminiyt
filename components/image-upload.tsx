"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  maxSize?: number // in MB
}

export function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 5, 
  maxSize = 2 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    
    // Check if adding these files would exceed max images
    if (images.length + fileArray.length > maxImages) {
      toast({
        title: "Shumë imazhe",
        description: `Mund të ngarkoni maksimum ${maxImages} imazhe.`,
        variant: "destructive"
      })
      return
    }

    setUploading(true)

    try {
      const uploadPromises = fileArray.map(async (file) => {
        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
          throw new Error(`Imazhi "${file.name}" është shumë i madh. Madhësia maksimale: ${maxSize}MB`)
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`Imazhi "${file.name}" nuk është i vlefshëm. Lejohen vetëm JPEG, PNG dhe WebP.`)
        }

        // Upload to server
        const formData = new FormData()
        formData.append('image', file)

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Upload failed:', errorData)
          throw new Error(errorData.error || 'Gabim në ngarkimin e imazhit')
        }

        const data = await response.json()
        console.log('Upload response:', data)
        return data.imageUrl
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      onImagesChange([...images, ...uploadedUrls])

      toast({
        title: "Sukses!",
        description: `${uploadedUrls.length} imazh(e) u ngarkuan me sukses.`
      })

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Gabim në Ngarkim",
        description: error instanceof Error ? error.message : "Ndodhi një gabim gjatë ngarkimit të imazheve.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
            <p className="text-gray-600">Duke ngarkuar imazhet...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-gray-600 mb-2">
                Tërhiqni imazhet këtu ose klikoni për të zgjedhur
              </p>
              <p className="text-sm text-gray-500">
                PNG, JPG, WebP deri në {maxSize}MB (maksimum {maxImages} imazhe)
              </p>
            </div>
            <Button
              type="button"
              onClick={openFileDialog}
              className="bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white border-0"
              disabled={images.length >= maxImages}
            >
              <Upload className="w-4 h-4 mr-2" />
              Zgjidhni Imazhet
            </Button>
          </div>
        )}
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={imageUrl}
                  alt={`Business image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Image Count */}
      {images.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          {images.length} / {maxImages} imazhe të ngarkuar
        </p>
      )}
    </div>
  )
}
