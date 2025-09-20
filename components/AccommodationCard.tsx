"use client"

import Image from "next/image"
import Link from "next/link"
import { Star, MapPin, Users, Shield, Heart } from "lucide-react"
import { useState } from "react"
import { formatZar } from "@/lib/utils"

interface AccommodationCardProps {
  id: string | number
  title: string
  address: string
  rating: number
  reviewCount: number
  price: number
  isOpen: boolean
  image: string
  amenities: string[]
  distance: string
  verified: boolean
  featured: boolean
  availableRooms: number
  totalRooms: number
}

export default function AccommodationCard({
  id,
  title,
  address,
  rating,
  reviewCount,
  price,
  isOpen,
  image,
  amenities,
  distance,
  verified,
  featured,
  availableRooms,
  totalRooms,
}: AccommodationCardProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
      <div className="relative h-48 overflow-hidden">
        <Image
          src={image || "/placeholder.jpg"}
          alt={title}
          fill
          className={`object-cover transition-all duration-300 group-hover:scale-105 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
        />
        {!imageLoaded && <div className="absolute inset-0 bg-gray-300 animate-pulse"></div>}

        {/* Status Pills */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {featured && (
            <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">
              ⭐ FEATURED
            </span>
          )}
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              isOpen ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {isOpen ? "Available" : "Full"}
          </span>
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            setIsFavorited(!isFavorited)
          }}
          className="absolute top-3 right-3 p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
        >
          <Heart className={`w-4 h-4 ${isFavorited ? "text-red-500 fill-current" : "text-gray-600"}`} />
        </button>

        {/* Availability Badge */}
        {isOpen && (
          <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
            {availableRooms}/{totalRooms} rooms
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-lg mb-1 group-hover:text-blue-600 transition-colors">{title}</h3>
          {verified && <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />}
        </div>

        <div className="flex items-center text-gray-600 text-sm mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="truncate">{address}</span>
        </div>

        <div className="flex items-center text-gray-600 text-sm mb-3">
          <Users className="w-4 h-4 mr-1" />
          <span>{distance}</span>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1 mb-3">
          {amenities.slice(0, 3).map((amenity) => (
            <span key={amenity} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
              {amenity}
            </span>
          ))}
          {amenities.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{amenities.length - 3} more
            </span>
          )}
        </div>

        <div className="flex items-center mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
            ))}
          </div>
          <span className="ml-2 text-sm text-gray-600">({reviewCount} reviews)</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-green-600">{formatZar(price)}</span>
            <span className="text-gray-500 text-sm">/month</span>
          </div>
          <Link
            href={`/listing/${id}`}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-md"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}
