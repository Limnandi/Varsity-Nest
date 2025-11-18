"use client"

import Image from "next/image"
import Link from "next/link"
import { Star, MapPin, Shield, Heart } from "lucide-react"
import { useState, useEffect, memo } from "react"
import { formatZar } from "@/lib/utils"
import { useStudentAuth } from "@/hooks/useStudentAuth"
import { toast } from "sonner"

interface AccommodationCardProps {
  id: string | number
  title: string
  address: string
  rating: number
  reviewCount: number
  price: number
  priceRange?: { min: number; max: number }
  roomTypes?: Array<{
    type: 'single' | 'sharing'
    price: number
    availableCount: number
  }>
  isOpen: boolean
  image: string
  amenities: string[]
  distance: string
  verified: boolean
  featured: boolean
  availableRooms: number
  totalRooms: number
  priority?: boolean
}

function AccommodationCard({
  id,
  title,
  address,
  rating,
  reviewCount,
  price,
  priceRange,
  roomTypes,
  isOpen,
  image,
  amenities: _amenities,
  distance: _distance,
  verified,
  featured,
  availableRooms,
  totalRooms,
  priority = false,
}: AccommodationCardProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { user: studentUser, isAuthenticated } = useStudentAuth()

  // Check if accommodation is in wishlist on component mount - optimized to prevent blocking
  useEffect(() => {
    if (!isAuthenticated || !studentUser) return
    
    let cancelled = false
    
    const checkWishlistStatus = async () => {
      try {
        const response = await fetch(`/api/student/wishlist?accommodationId=${id}&limit=1`)
        if (cancelled) return
        
        if (response.ok) {
          const result = await response.json()
          if (cancelled) return
          const isInWishlist = result.data?.items?.length > 0
          setIsFavorited(isInWishlist)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error checking wishlist status:', error)
        }
      }
    }

    // Defer wishlist check to prevent blocking initial render
    const timeoutId = setTimeout(checkWishlistStatus, 0)
    
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [id, isAuthenticated, studentUser])

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated || !studentUser) {
      toast.error("Sign in as student", {
        duration: 4000,
      })
      return
    }

    if (isLoading) return

    setIsLoading(true)
    
    try {
      if (isFavorited) {
        // Remove from wishlist
        const response = await fetch(`/api/student/wishlist?accommodationId=${id}`, {
          method: 'DELETE',
        })
        
        if (response.ok) {
          setIsFavorited(false)
          toast.success("Removed from wishlist")
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to remove from wishlist')
        }
      } else {
        // Add to wishlist
        const response = await fetch('/api/student/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accommodationId: String(id) }),
        })
        
        if (response.ok) {
          setIsFavorited(true)
          toast.success("Added to wishlist")
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to add to wishlist')
        }
      }
    } catch (error: any) {
      console.error('Wishlist operation failed:', error)
      toast.error(error.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="group relative border border-white/10 bg-black/30 backdrop-blur-2xl rounded-2xl overflow-hidden text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/30 transition-all duration-500 hover:scale-[1.02] hover:border-blue-500/30 w-full">
        <div className="relative h-48 sm:h-56 overflow-hidden">
          <Image
            src={image || "/placeholder.jpg"}
            alt={title}
            fill
            priority={priority}
            className={`object-cover transition-all duration-700 group-hover:scale-110 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800/80 via-gray-700/60 to-gray-800/80 animate-pulse">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
            </div>
          )}

          {/* Enhanced Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 opacity-0 group-hover:opacity-100"></div>

        {/* Status Pills */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {featured && (
            <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-400/95 to-orange-500/95 backdrop-blur-md text-white text-xs font-bold rounded-full border border-yellow-400/40 shadow-lg shadow-yellow-500/30 animate-pulse">
              ⭐ FEATURED
            </span>
          )}
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border shadow-lg transition-all duration-300 ${
              isOpen 
                ? "bg-green-500/30 text-green-200 border-green-400/60 shadow-green-500/30" 
                : "bg-red-500/30 text-red-200 border-red-400/60 shadow-red-500/30"
            }`}
          >
            {isOpen ? "✓ Available" : "✗ Full"}
          </span>
        </div>

        {/* Favorite Button (visible only for authenticated students) */}
        {isAuthenticated && studentUser && (
          <button
            onClick={handleWishlistToggle}
            disabled={isLoading}
            className={`absolute top-3 right-3 p-2.5 bg-black/40 backdrop-blur-md border border-white/30 rounded-full hover:bg-white/20 transition-all duration-300 z-10 group/heart ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 hover:shadow-lg'
            } ${isFavorited ? 'bg-red-500/20 border-red-400/50 shadow-lg shadow-red-500/30' : ''}`}
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${
              isFavorited 
                ? "text-red-400 fill-current scale-110" 
                : "text-white/80 group-hover/heart:text-red-300"
            } ${isLoading ? 'animate-pulse' : ''}`} />
          </button>
        )}

        {/* Availability Badge */}
        {isOpen && (
          <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-semibold border border-white/30 shadow-lg">
            <span className="text-green-400 font-bold">{availableRooms}</span>
            <span className="text-white/70">/{totalRooms}</span>
            <span className="text-white/60 ml-1">rooms</span>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 relative">
        <div className="flex items-start justify-between mb-3 gap-2 min-w-0">
          <h3 className="font-bold text-lg sm:text-xl mb-1 group-hover:text-blue-300 transition-colors duration-300 text-white break-words flex-1 min-w-0 leading-tight">{title}</h3>
          {verified && (
            <div className="p-2 border border-green-500/50 bg-green-500/20 backdrop-blur-sm rounded-lg flex-shrink-0 shadow-lg shadow-green-500/20 group-hover:shadow-green-500/30 transition-all duration-300 group-hover:scale-110">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            </div>
          )}
        </div>

        <div className="flex items-start text-neutral-300 text-xs sm:text-sm mb-4 min-w-0 group/location">
          <MapPin className="w-4 h-4 mr-2 text-blue-400 flex-shrink-0 mt-0.5 group-hover/location:text-blue-300 transition-colors duration-300" />
          <span className="break-words group-hover/location:text-neutral-200 transition-colors duration-300">{address}</span>
        </div>

        <div className="flex items-center mb-4 flex-wrap gap-2 group/rating">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 transition-all duration-300 ${
                  i < rating 
                    ? "text-yellow-400 fill-current group-hover/rating:scale-110" 
                    : "text-neutral-600"
                }`} 
              />
            ))}
          </div>
          <span className="text-xs sm:text-sm text-neutral-400 break-words group-hover/rating:text-neutral-300 transition-colors duration-300">
            ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1 group/price">
            {priceRange ? (
              <div>
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-emerald-500 bg-clip-text text-transparent break-words group-hover/price:from-green-300 group-hover/price:via-emerald-300 group-hover/price:to-emerald-400 transition-all duration-300">
                  {formatZar(priceRange.min)}
                  {priceRange.min !== priceRange.max && (
                    <span className="text-base sm:text-lg text-neutral-400"> - {formatZar(priceRange.max)}</span>
                  )}
                </div>
                <div className="text-xs text-neutral-400 break-words group-hover/price:text-neutral-300 transition-colors duration-300">per month</div>
              </div>
            ) : (
              <div>
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-emerald-500 bg-clip-text text-transparent break-words group-hover/price:from-green-300 group-hover/price:via-emerald-300 group-hover/price:to-emerald-400 transition-all duration-300">{formatZar(price)}</span>
                <span className="text-neutral-400 text-xs sm:text-sm break-words group-hover/price:text-neutral-300 transition-colors duration-300">/month</span>
              </div>
            )}
          </div>
          <Link
            href={`/listing/${id}`}
            className="group/btn relative bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium hover:from-blue-500 hover:via-purple-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 w-full sm:w-auto flex items-center justify-center break-words overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></span>
            <span className="relative z-10 flex items-center gap-2 break-words">
              View Details
              <span className="opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all duration-300">→</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
          </Link>
        </div>
        
        {/* Room Types Preview */}
        {roomTypes && roomTypes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-xs text-neutral-400 mb-3 break-words font-medium">Room types available:</div>
            <div className="flex flex-wrap gap-2">
              {roomTypes.slice(0, 3).map((roomType, index) => (
                <span
                  key={index}
                  className="px-2 sm:px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full border border-indigo-500/40 break-words backdrop-blur-sm hover:bg-indigo-500/30 hover:border-indigo-400/60 transition-all duration-300 hover:scale-105"
                >
                  {roomType.type} - {formatZar(roomType.price)}
                </span>
              ))}
              {roomTypes.length > 3 && (
                <span className="px-2 sm:px-3 py-1 bg-neutral-500/20 text-neutral-400 text-xs rounded-full border border-neutral-500/30 break-words backdrop-blur-sm hover:bg-neutral-500/30 transition-all duration-300">
                  +{roomTypes.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(AccommodationCard)
