"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Upload, Loader2, Eye, Trash2 } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { publicEnv } from "@/lib/env.client"
import CustomImageCrop from "./CustomImageCrop"
import ConfirmDialog from "./ConfirmDialog"

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
  const [showMenu, setShowMenu] = useState(false)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file")
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5000000) {
      toast.error("Image size must be less than 5MB")
      return
    }

    // Create object URL for cropping
    const reader = new FileReader()
    reader.onload = () => {
      setSelectedImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadToCloudinary = async (blob: Blob): Promise<{ imageUrl: string; cloudinaryId: string }> => {
    const formData = new FormData()
    formData.append("file", blob, "profile-image.jpg")
    formData.append("upload_preset", publicEnv.CLOUDINARY_UPLOAD_PRESET)
    formData.append("cloud_name", publicEnv.CLOUDINARY_CLOUD_NAME)
    formData.append("folder", "student-profiles")

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${publicEnv.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error("Failed to upload to Cloudinary")
    }

    const data = await response.json()
    return {
      imageUrl: data.secure_url,
      cloudinaryId: data.public_id,
    }
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      setIsUploading(true)

      // Upload to Cloudinary
      const { imageUrl, cloudinaryId } = await uploadToCloudinary(croppedBlob)

      // Save to database
      const response = await fetch("/api/student/profile-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          imageUrl,
          cloudinaryId,
        }),
      })

      if (response.ok) {
        onImageUpdate(imageUrl)
        toast.success("Profile image updated successfully!")
        setSelectedImage(null)
      } else {
        const error = await response.json()
        console.error("API error:", error)
        toast.error(error.message || "Failed to save image")
      }
    } catch (error) {
      console.error("Image upload error:", error)
      toast.error("Failed to upload image")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveImage = async () => {
    try {
      const response = await fetch("/api/student/profile-image", {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        onImageRemove()
        toast.success("Profile image removed successfully!")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to remove image")
      }
    } catch (error) {
      console.error("Remove image error:", error)
      toast.error("Failed to remove image")
    }
  }

  const handleCancelCrop = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const displayImage = currentImageUrl
  const displayName = userName || "Student"
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <>
      <div className="flex flex-col items-center space-y-4">
        {/* Image Display with Click Menu */}
        <div className="relative group">
          <div 
            ref={buttonRef}
            onClick={() => currentImageUrl && setShowMenu(!showMenu)}
            className={`relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-4xl shadow-lg shadow-blue-500/30 ${currentImageUrl ? 'cursor-pointer hover:ring-4 hover:ring-blue-500/50 hover:scale-105 transition-all duration-300' : ''}`}
          >
            {/* Shimmer effect on hover */}
            {currentImageUrl && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            )}
            {displayImage ? (
              <div className="relative w-full h-full">
                <Image
                  src={displayImage}
                  alt={`${displayName}'s profile`}
                  fill
                  className="object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                  sizes="128px"
                />
              </div>
            ) : (
              <span className="relative z-10">{initial}</span>
            )}
          </div>

          {/* Popup Menu */}
          {showMenu && currentImageUrl && (
            <div
              ref={menuRef}
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-black/50 backdrop-blur-2xl border border-white/20 rounded-xl shadow-2xl shadow-blue-500/30 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-300"
            >
              {/* Decorative corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500/30 rounded-tl-xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-purple-500/30 rounded-br-xl"></div>
              <button
                onClick={() => {
                  setShowImageViewer(true)
                  setShowMenu(false)
                }}
                className="group relative w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-blue-500/20 transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
                <Eye className="w-5 h-5 text-blue-400 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <span className="relative z-10">View Image</span>
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(true)
                  setShowMenu(false)
                }}
                className="group relative w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-red-500/20 transition-all duration-300 hover:scale-105 border-t border-white/10 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-orange-500/0 group-hover:from-red-500/10 group-hover:to-orange-500/10 transition-all duration-300"></div>
                <Trash2 className="w-5 h-5 text-red-400 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <span className="relative z-10">Remove Image</span>
              </button>
            </div>
          )}
        </div>

        {/* Upload Button - Only show when no image */}
        {!currentImageUrl && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="group relative flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-semibold overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-white/0 to-purple-500/0 group-hover:from-blue-500/20 group-hover:via-white/10 group-hover:to-purple-500/20 animate-shimmer"></div>
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                  <span className="relative z-10">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                  <span className="relative z-10">Upload Image</span>
                </>
              )}
            </button>

            {/* Help Text */}
            <p className="text-sm text-neutral-400 text-center max-w-xs">
              Upload your profile picture. Maximum file size: 5MB.
            </p>
          </>
        )}

        {/* Help Text when image exists */}
        {currentImageUrl && (
          <p className="text-sm text-neutral-400 text-center max-w-xs">
            Click your image to view or remove it.
          </p>
        )}
      </div>

      {/* Custom Crop Interface */}
      {selectedImage && (
        <CustomImageCrop
          imageSrc={selectedImage}
          onComplete={handleCropComplete}
          onCancel={handleCancelCrop}
        />
      )}

      {/* Image Viewer Modal - Portal to body for full screen */}
      {showImageViewer && currentImageUrl && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={() => setShowImageViewer(false)}
          />
          
          {/* Modal - Full Screen */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1e] flex items-center justify-center overflow-hidden animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowImageViewer(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <div className="relative w-4/5 h-4/5 max-w-5xl max-h-[80vh]">
              <Image
                src={currentImageUrl}
                alt={`${displayName}'s profile`}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleRemoveImage}
        title="Remove Profile Image?"
        message="Are you sure you want to remove your profile image? You can always upload a new one later."
        confirmText="Remove Image"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  )
}
