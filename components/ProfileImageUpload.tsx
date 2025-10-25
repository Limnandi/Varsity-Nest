"use client"

import { useState, useRef, useEffect } from "react"
import { X, Upload, Loader2, Eye, Trash2 } from "lucide-react"
import { CldUploadButton } from "next-cloudinary"
import { publicEnv } from "@/lib/env.client"
import Image from "next/image"
import { toast } from "sonner"
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
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)

  const handleUploadSuccess = async (result: any) => {
    console.log('Upload success result:', result)
    try {
      if (typeof result.info === "object" && "secure_url" in result.info) {
        const imageUrl = result.info.secure_url
        const cloudinaryId = result.info.public_id

        console.log('Saving to database:', { imageUrl, cloudinaryId })

        // Save to our database
        const response = await fetch('/api/student/profile-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl,
            cloudinaryId,
          }),
        })

        if (response.ok) {
          onImageUpdate(imageUrl)
          toast.success("Profile image updated successfully!")
        } else {
          const error = await response.json()
          console.error('API error:', error)
          toast.error(error.message || "Failed to save image")
        }
      } else {
        console.error('Invalid result structure:', result)
        toast.error("Invalid upload response")
      }
    } catch (error) {
      console.error('Image save error:', error)
      toast.error("Failed to save image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleUploadError = (error: any) => {
    console.error('Upload error:', error)
    console.error('Error type:', typeof error)
    console.error('Error keys:', error ? Object.keys(error) : 'null')
    console.error('Error status:', error?.status)
    console.error('Error statusText:', error?.statusText)
    
    let errorMessage = "Failed to upload image"
    
    if (error?.status === 404) {
      errorMessage = "Upload preset 'student_profile_unsigned' not found. Please check your Cloudinary console."
    } else if (error?.status === 401 || error?.status === 403) {
      errorMessage = "Upload not authorized. Please ensure your preset is set to 'Unsigned' mode."
    } else if (error?.statusText) {
      errorMessage = `Upload failed: ${error.statusText}`
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    toast.error(errorMessage)
    setIsUploading(false)
  }

  const handleRemoveImage = async () => {
    try {
      const response = await fetch('/api/student/profile-image', {
        method: 'DELETE',
      })

      if (response.ok) {
        onImageRemove()
        toast.success("Profile image removed successfully!")
        setShowDeleteConfirm(false)
        setShowMenu(false)
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to remove image")
      }
    } catch (error) {
      console.error('Image removal error:', error)
      toast.error("Failed to remove image")
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const displayImage = currentImageUrl
  const displayName = userName || 'Student'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <>
      <div className="flex flex-col items-center space-y-4">
        {/* Image Display with Click Menu */}
        <div className="relative">
          <div 
            ref={buttonRef}
            onClick={() => currentImageUrl && setShowMenu(!showMenu)}
            className={`w-32 h-32 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-4xl shadow-lg ${currentImageUrl ? 'cursor-pointer hover:ring-4 hover:ring-blue-500/50 transition-all' : ''}`}
          >
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

          {/* Popup Menu */}
          {showMenu && currentImageUrl && (
            <div
              ref={menuRef}
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-black/40 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl shadow-blue-500/25 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-300"
            >
              <button
                onClick={() => {
                  setShowImageViewer(true)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-blue-500/20 transition-colors"
              >
                <Eye className="w-5 h-5 text-blue-400" />
                <span>View Image</span>
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(true)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-red-500/20 transition-colors border-t border-white/10"
              >
                <Trash2 className="w-5 h-5 text-red-400" />
                <span>Remove Image</span>
              </button>
            </div>
          )}
        </div>

        {/* Upload Button - Only show when no image */}
        {!currentImageUrl && (
          <>
            <CldUploadButton
              uploadPreset={publicEnv.CLOUDINARY_UPLOAD_PRESET}
              onUpload={() => {
                console.log('Upload started')
                setIsUploading(true)
              }}
              onSuccess={handleUploadSuccess}
              onError={handleUploadError}
              options={{
                cloudName: publicEnv.CLOUDINARY_CLOUD_NAME,
                uploadPreset: publicEnv.CLOUDINARY_UPLOAD_PRESET,
                multiple: false,
                maxFiles: 1,
                clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
                maxFileSize: 5000000,
                cropping: true,
                croppingAspectRatio: 1,
                croppingShowDimensions: true,
                sources: ["local", "url", "camera"],
                showSkipCropButton: false,
                styles: {
                  palette: {
                    window: "#1a1a1a",
                    windowBorder: "#3b82f6",
                    tabIcon: "#3b82f6",
                    menuIcons: "#ffffff",
                    textDark: "#000000",
                    textLight: "#ffffff",
                    link: "#3b82f6",
                    action: "#3b82f6",
                    inactiveTabIcon: "#555555",
                    error: "#ef4444",
                    inProgress: "#3b82f6",
                    complete: "#10b981",
                    sourceBg: "#1a1a1a"
                  }
                }
              }}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload Image</span>
                </>
              )}
            </CldUploadButton>

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

      {/* Image Viewer Modal */}
      {showImageViewer && currentImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowImageViewer(false)}
        >
          <button
            onClick={() => setShowImageViewer(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full p-4">
            <Image
              src={currentImageUrl}
              alt={`${displayName}'s profile`}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>
        </div>
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
