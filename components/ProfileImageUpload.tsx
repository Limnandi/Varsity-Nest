"use client"

import { useState, useRef } from "react"
import { Camera, X, Upload, Loader2 } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

interface ProfileImageUploadProps {
  currentImageUrl?: string
  userName: string
  onImageUpdate: (imageUrl: string) => void
  onImageRemove: () => void
}

export default function ProfileImageUpload({ 
  currentImageUrl, 
  userName, 
  onImageUpdate, 
  onImageRemove 
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB")
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload image
    uploadImage(file)
  }

  const uploadImage = async (file: File) => {
    setIsUploading(true)
    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        const base64Data = base64.split(',')[1] // Remove data:image/jpeg;base64, prefix

        const response = await fetch('/api/student/profile-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64Data,
            fileName: file.name,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          onImageUpdate(result.data.imageUrl)
          toast.success("Profile image updated successfully!")
          setPreviewUrl(null)
        } else {
          const error = await response.json()
          toast.error(error.message || "Failed to upload image")
          setPreviewUrl(null)
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Image upload error:', error)
      toast.error("Failed to upload image")
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    try {
      const response = await fetch('/api/student/profile-image', {
        method: 'DELETE',
      })

      if (response.ok) {
        onImageRemove()
        toast.success("Profile image removed successfully!")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to remove image")
      }
    } catch (error) {
      console.error('Image removal error:', error)
      toast.error("Failed to remove image")
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const displayImage = previewUrl || currentImageUrl
  const displayName = userName || 'Student'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Image Display */}
      <div className="relative group">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-4xl shadow-lg">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={`${displayName}'s profile`}
              fill
              className="object-cover"
              sizes="128px"
            />
          ) : (
            initial
          )}
        </div>

        {/* Upload Overlay */}
        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleClick}
            disabled={isUploading}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        {/* Remove Button */}
        {currentImageUrl && !previewUrl && (
          <button
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex space-x-2">
        <button
          onClick={handleClick}
          disabled={isUploading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span>{isUploading ? "Uploading..." : "Upload Image"}</span>
        </button>

        {currentImageUrl && !previewUrl && (
          <button
            onClick={handleRemoveImage}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Remove</span>
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Help Text */}
      <p className="text-sm text-neutral-400 text-center max-w-xs">
        Click the camera icon or upload button to change your profile picture. 
        Maximum file size: 5MB. Supported formats: JPG, PNG, GIF.
      </p>
    </div>
  )
}
