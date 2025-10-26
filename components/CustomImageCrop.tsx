"use client"

import { useState, useCallback, useEffect } from "react"
import { createPortal } from "react-dom"
import Cropper from "react-easy-crop"
import { Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface CustomImageCropProps {
  imageSrc: string
  onComplete: (croppedImageBlob: Blob) => void
  onCancel: () => void
}

export default function CustomImageCrop({
  imageSrc,
  onComplete,
  onCancel,
}: CustomImageCropProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const createCroppedImage = async (): Promise<Blob> => {
    if (!croppedAreaPixels) {
      throw new Error("No crop area defined")
    }

    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }

        // Set canvas size to max 960x960 while maintaining aspect ratio
        const maxSize = 960
        const aspectRatio = croppedAreaPixels.width / croppedAreaPixels.height

        let outputWidth = maxSize
        let outputHeight = maxSize

        if (aspectRatio > 1) {
          outputHeight = maxSize / aspectRatio
        } else if (aspectRatio < 1) {
          outputWidth = maxSize * aspectRatio
        }

        canvas.width = outputWidth
        canvas.height = outputHeight

        // Draw cropped image
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          outputWidth,
          outputHeight
        )

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Failed to create blob"))
            }
          },
          "image/jpeg",
          0.95
        )
      }

      image.onerror = () => {
        reject(new Error("Failed to load image"))
      }

      image.src = imageSrc
    })
  }

  const handleUpload = async () => {
    try {
      setIsProcessing(true)
      const croppedBlob = await createCroppedImage()
      onComplete(croppedBlob)
    } catch (error) {
      console.error("Error cropping image:", error)
      toast.error("Failed to process image")
      setIsProcessing(false)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[9999] animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" />
      
      {/* Modal Container - Full Screen */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#02042b] to-[#040945] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-[#02042b] to-[#040945]">
          <h2 className="text-xl font-bold text-white">Crop Your Profile Image</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="flex-1 relative bg-black/80">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            cropShape="round"
            showGrid={false}
            style={{
              containerStyle: {
                background: "rgba(0, 0, 0, 0.8)",
              },
              cropAreaStyle: {
                border: "2px solid #3b82f6",
              },
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-6 bg-gradient-to-r from-[#02042b] to-[#040945] border-t border-white/10">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Zoom Slider */}
          <div className="space-y-2">
            <label className="text-sm text-neutral-300 font-medium">
              Zoom
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-purple-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-blue-500/50 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-blue-500 [&::-moz-range-thumb]:to-purple-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-blue-500/50 disabled:[&::-webkit-slider-thumb]:opacity-50 disabled:[&::-webkit-slider-thumb]:cursor-not-allowed disabled:[&::-moz-range-thumb]:opacity-50 disabled:[&::-moz-range-thumb]:cursor-not-allowed"
              disabled={isProcessing}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-semibold border border-white/20"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload Image</span>
                </>
              )}
            </button>
          </div>

          <p className="text-sm text-neutral-400 text-center">
            Image will be optimized to maximum 960x960 pixels
          </p>
        </div>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null

  return createPortal(modalContent, document.body)
}

