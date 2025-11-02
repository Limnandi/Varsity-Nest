"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { createPortal } from "react-dom"

export default function ImageCarousel({ images = [] as string[] }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [showFullscreenViewer, setShowFullscreenViewer] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const totalSlides = Math.max(images.length, 1)
  const displayImages = images.length > 0 ? images : ["/placeholder.jpg"]

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }

  const openGalleryModal = () => {
    setShowGalleryModal(true)
    document.body.style.overflow = "hidden"
  }

  const closeGalleryModal = useCallback(() => {
    setShowGalleryModal(false)
    document.body.style.overflow = "unset"
  }, [])

  const openFullscreenViewer = (index: number) => {
    setSelectedImageIndex(index)
    setShowFullscreenViewer(true)
  }

  const closeFullscreenViewer = useCallback(() => {
    setShowFullscreenViewer(false)
  }, [])

  const nextFullscreenSlide = useCallback(() => {
    setSelectedImageIndex((prev) => (prev + 1) % totalSlides)
  }, [totalSlides])

  const prevFullscreenSlide = useCallback(() => {
    setSelectedImageIndex((prev) => (prev - 1 + totalSlides) % totalSlides)
  }, [totalSlides])

  useEffect(() => {
    if (showGalleryModal || showFullscreenViewer) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [showGalleryModal, showFullscreenViewer])

  useEffect(() => {
    if (!showFullscreenViewer) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeFullscreenViewer()
      }
    }

    const handleArrowKeys = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        prevFullscreenSlide()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        nextFullscreenSlide()
      }
    }

    document.addEventListener("keydown", handleEscape)
    document.addEventListener("keydown", handleArrowKeys)

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.removeEventListener("keydown", handleArrowKeys)
    }
  }, [showFullscreenViewer, closeFullscreenViewer, nextFullscreenSlide, prevFullscreenSlide])

  return (
    <>
      <div className="relative w-full h-96 bg-gray-200 overflow-hidden rounded-xl cursor-pointer group" onClick={openGalleryModal}>
        <div
          className="flex transition-transform duration-300 ease-in-out h-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {displayImages.map((image, index) => (
            <div key={index} className="w-full h-full flex-shrink-0 relative">
              <Image 
                src={image || "/placeholder.jpg"} 
                alt={`Listing image ${index + 1}`} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-300" 
              />
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            prevSlide()
          }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            nextSlide()
          }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {displayImages.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentSlide(index)
              }}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? "bg-white" : "bg-white bg-opacity-50"
              }`}
            />
          ))}
        </div>

        {/* Click to expand hint */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1.5 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity z-10">
          Click to expand
        </div>
      </div>

      {/* Gallery Modal - Mini Popup showing all images */}
      {showGalleryModal && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={closeGalleryModal}
          aria-hidden={!showGalleryModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Photo Gallery"
            className="relative border border-white/10 bg-black/40 backdrop-blur-xl rounded-2xl p-6 text-white shadow-[0_10px_40px_rgba(59,130,246,0.25)] max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto transform transition-all duration-300 animate-in slide-in-from-bottom-4 sm:animate-in zoom-in-95"
          >
            {/* Close Button */}
            <button
              onClick={closeGalleryModal}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                Photo Gallery
              </h3>
              <p className="text-sm text-neutral-400">
                {totalSlides} {totalSlides === 1 ? "image" : "images"} available
              </p>
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {displayImages.map((image, index) => (
                <div
                  key={index}
                  onClick={() => openFullscreenViewer(index)}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-white/10 bg-black/20 cursor-pointer group hover:border-blue-500/50 transition-all hover:scale-105"
                >
                  <Image
                    src={image || "/placeholder.jpg"}
                    alt={`Gallery image ${index + 1}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium">
                      View Full
                    </div>
                  </div>
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-blue-500/80 text-white px-2 py-1 rounded text-xs font-medium">
                      Card Image
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Fullscreen Image Viewer - Portal to body for full screen */}
      {showFullscreenViewer && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeFullscreenViewer}
          aria-modal="true"
          role="dialog"
          aria-label="Full screen image viewer"
        >
          {/* Close Button */}
          <button
            onClick={closeFullscreenViewer}
            className="absolute top-4 right-4 z-50 p-3 bg-black bg-opacity-70 text-white rounded-full hover:bg-opacity-90 transition-opacity"
            aria-label="Close viewer"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Main Image Container */}
          <div 
            className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full">
              <Image
                src={displayImages[selectedImageIndex] || "/placeholder.jpg"}
                alt={`Listing image ${selectedImageIndex + 1}`}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Navigation Arrows */}
          {totalSlides > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  prevFullscreenSlide()
                }}
                className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white p-3 sm:p-4 rounded-full hover:bg-opacity-90 transition-opacity z-40"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextFullscreenSlide()
                }}
                className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white p-3 sm:p-4 rounded-full hover:bg-opacity-90 transition-opacity z-40"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm font-medium z-50">
            {selectedImageIndex + 1} of {totalSlides}
          </div>

          {/* Thumbnail Strip */}
          {totalSlides > 1 && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-4xl overflow-x-auto px-4 z-50">
              {displayImages.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImageIndex(index)
                  }}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    index === selectedImageIndex 
                      ? "border-white scale-110 opacity-100" 
                      : "border-white border-opacity-30 opacity-70 hover:opacity-100 hover:scale-105"
                  }`}
                >
                  <Image
                    src={image || "/placeholder.jpg"}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  )
}
