"use client"

import Image from "next/image"
import Link from "next/link"
import { Star, MapPin, Users, Shield, Heart } from "lucide-react"
import { useState, useEffect } from "react"
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

export default function AccommodationCard({
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
  amenities,
  distance,
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

  // Check if accommodation is in wishlist on component mount
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!isAuthenticated || !studentUser) return
      
      try {
        // Use a more efficient approach - check if this specific accommodation is in wishlist
        const response = await fetch(`/api/student/wishlist?accommodationId=${id}&limit=1`)
        if (response.ok) {
          const result = await response.json()
          // If accommodationId is provided, the API will only return items for that accommodation
          const isInWishlist = result.data?.items?.length > 0
          setIsFavorited(isInWishlist)
        }
      } catch (error) {
        console.error('Error checking wishlist status:', error)
      }
    }

    checkWishlistStatus()
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
    <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl overflow-hidden text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02] w-full">
      <div className="relative h-48 overflow-hidden">
        <Image
          src={image || "/placeholder.jpg"}
          alt={title}
          fill
          priority={priority}
          className={`object-cover transition-all duration-300 group-hover:scale-105 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {!imageLoaded && <div className="absolute inset-0 bg-gray-800/50 animate-pulse"></div>}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

        {/* Status Pills */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {featured && (
            <span className="px-3 py-1 bg-gradient-to-r from-yellow-400/90 to-orange-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-yellow-400/30">
              ⭐ FEATURED
            </span>
          )}
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border ${
              isOpen 
                ? "bg-green-500/20 text-green-300 border-green-500/50" 
                : "bg-red-500/20 text-red-300 border-red-500/50"
            }`}
          >
            {isOpen ? "Available" : "Full"}
          </span>
        </div>

        {/* Favorite Button (visible only for authenticated students) */}
        {isAuthenticated && studentUser && (
          <button
            onClick={handleWishlistToggle}
            disabled={isLoading}
            className={`absolute top-3 right-3 p-2 bg-black/20 backdrop-blur-sm border border-white/20 rounded-full hover:bg-white/10 transition-all duration-300 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? "text-red-400 fill-current" : "text-white/80"} ${
              isLoading ? 'animate-pulse' : ''
            }`} />
          </button>
        )}

        {/* Availability Badge */}
        {isOpen && (
          <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs border border-white/20">
            {availableRooms}/{totalRooms} rooms
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3 gap-2 min-w-0">
          <h3 className="font-bold text-lg sm:text-xl mb-1 group-hover:text-blue-300 transition-colors text-white break-words flex-1 min-w-0">{title}</h3>
          {verified && (
            <div className="p-2 border border-green-500/50 bg-green-500/10 rounded-lg flex-shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            </div>
          )}
        </div>

        <div className="flex items-start text-neutral-300 text-xs sm:text-sm mb-3 min-w-0">
          <MapPin className="w-4 h-4 mr-2 text-blue-400 flex-shrink-0 mt-0.5" />
          <span className="break-words">{address}</span>
        </div>

        <div className="flex items-center text-neutral-300 text-xs sm:text-sm mb-4 min-w-0">
          <Users className="w-4 h-4 mr-2 text-purple-400 flex-shrink-0" />
          <span className="break-words">{distance}</span>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2 mb-4">
          {amenities.slice(0, 3).map((amenity) => (
            <span key={amenity} className="px-2 sm:px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30 break-words">
              {amenity}
            </span>
          ))}
          {amenities.length > 3 && (
            <span className="px-2 sm:px-3 py-1 bg-neutral-500/20 text-neutral-400 text-xs rounded-full border border-neutral-500/30 break-words">
              +{amenities.length - 3} more
            </span>
          )}
        </div>

        <div className="flex items-center mb-4 flex-wrap gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 ${i < rating ? "text-yellow-400 fill-current" : "text-neutral-600"}`} />
            ))}
          </div>
          <span className="text-xs sm:text-sm text-neutral-400 break-words">({reviewCount} reviews)</span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            {priceRange ? (
              <div>
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent break-words">
                  {formatZar(priceRange.min)}
                  {priceRange.min !== priceRange.max && (
                    <span className="text-base sm:text-lg text-neutral-400"> - {formatZar(priceRange.max)}</span>
                  )}
                </div>
                <div className="text-xs text-neutral-400 break-words">per month</div>
              </div>
            ) : (
              <div>
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent break-words">{formatZar(price)}</span>
                <span className="text-neutral-400 text-xs sm:text-sm break-words">/month</span>
              </div>
            )}
          </div>
          <Link
            href={`/listing/${id}`}
            className="group/btn relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 w-full sm:w-auto flex items-center justify-center break-words"
          >
            <span className="relative z-10 break-words">View Details</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </div>
        
        {/* Room Types Preview */}
        {roomTypes && roomTypes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-xs text-neutral-400 mb-3 break-words">Room types available:</div>
            <div className="flex flex-wrap gap-2">
              {roomTypes.slice(0, 3).map((roomType, index) => (
                <span
                  key={index}
                  className="px-2 sm:px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full border border-indigo-500/30 break-words"
                >
                  {roomType.type} - {formatZar(roomType.price)}
                </span>
              ))}
              {roomTypes.length > 3 && (
                <span className="px-2 sm:px-3 py-1 bg-neutral-500/20 text-neutral-400 text-xs rounded-full border border-neutral-500/30 break-words">
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
