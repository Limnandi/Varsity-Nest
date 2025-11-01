"use client"

import { useState } from "react"
import { Users, Bed, Wifi, Car, Bath, DollarSign, CheckCircle } from "lucide-react"

interface RoomType {
  id: string
  name: string
  type: 'single' | 'sharing'
  price: number
  description?: string
  amenities?: string[]
  images?: string[]
  availableCount: number
  totalCount: number
  isActive: boolean
}

interface RoomTypeCardProps {
  roomType: RoomType
  onSelect?: (roomType: RoomType) => void
  isSelected?: boolean
  showAvailability?: boolean
}

export default function RoomTypeCard({
  roomType,
  onSelect,
  isSelected = false,
  showAvailability = true,
}: RoomTypeCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getRoomTypeIcon = (type: string) => {
    switch (type) {
      case "single":
        return <Bed className="w-6 h-6 text-blue-400" />
      case "sharing":
        return <Users className="w-6 h-6 text-green-400" />
      default:
        return <Bed className="w-6 h-6 text-gray-400" />
    }
  }

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case "single":
        return "border-blue-500/50 bg-blue-500/10 text-blue-300"
      case "sharing":
        return "border-green-500/50 bg-green-500/10 text-green-300"
      default:
        return "border-gray-500/50 bg-gray-500/10 text-gray-300"
    }
  }

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi":
      case "wi-fi":
        return <Wifi className="w-4 h-4 text-blue-400" />
      case "parking":
        return <Car className="w-4 h-4 text-green-400" />
      case "ensuite":
      case "bathroom":
        return <Bath className="w-4 h-4 text-purple-400" />
      default:
        return <CheckCircle className="w-4 h-4 text-green-400" />
    }
  }

  const getAvailabilityStatus = () => {
    if (roomType.availableCount === 0) {
      return {
        text: "Fully Booked",
        color: "text-red-400",
        bg: "bg-red-500/10 border-red-500/50",
      }
    } else if (roomType.availableCount <= 2) {
      return {
        text: "Limited Availability",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10 border-yellow-500/50",
      }
    } else {
      return {
        text: "Available",
        color: "text-green-400",
        bg: "bg-green-500/10 border-green-500/50",
      }
    }
  }

  const availability = getAvailabilityStatus()

  return (
    <div
      className={`relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-lg hover:shadow-xl hover:shadow-[0_0_25px_#00FF99]/30 transition-all duration-300 cursor-pointer ${
        isSelected ? "ring-2 ring-blue-500/50 bg-blue-500/10" : ""
      } ${!roomType.isActive ? "opacity-50" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect && onSelect(roomType)}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center z-10">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Hover Overlay */}
      {isHovered && !isSelected && (
        <div className="absolute inset-0 rounded-2xl bg-white/5 pointer-events-none"></div>
      )}

      {/* Card Content */}
      <div className="relative z-0 space-y-4">
        {/* Header: Icon and Title */}
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl border ${getRoomTypeColor(roomType.type)} flex-shrink-0`}>
            {getRoomTypeIcon(roomType.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white mb-2 leading-tight">
              {roomType.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-neutral-400 capitalize">
                {roomType.type} room
              </span>
              {showAvailability && (
                <>
                  <span className="text-neutral-500">•</span>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${availability.bg} ${availability.color}`}>
                    {availability.text}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Price Section */}
        <div className="flex items-baseline gap-2 pt-2 border-t border-white/10">
          <DollarSign className="w-5 h-5 text-green-400 flex-shrink-0" />
          <span className="text-3xl font-bold text-white">
            R{roomType.price}
          </span>
          <span className="text-sm text-neutral-400 ml-1">per month</span>
        </div>

        {/* Description */}
        {roomType.description && (
          <p className="text-neutral-300 text-sm leading-relaxed">
            {roomType.description}
          </p>
        )}

        {/* Amenities */}
        {roomType.amenities && roomType.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {roomType.amenities.slice(0, 3).map((amenity, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs"
              >
                {getAmenityIcon(amenity)}
                <span className="text-neutral-300 capitalize">{amenity}</span>
              </div>
            ))}
            {roomType.amenities.length > 3 && (
              <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-neutral-400">
                +{roomType.amenities.length - 3} more
              </div>
            )}
          </div>
        )}

        {/* Availability and Book Now */}
        {showAvailability && (
          <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-sm text-neutral-400">
              <span className="font-semibold text-white">{roomType.availableCount}</span> of{" "}
              <span className="font-semibold text-white">{roomType.totalCount}</span> rooms available
            </div>
            
            {roomType.availableCount > 0 && (
              <div className="flex items-center gap-1.5 text-green-400 font-medium">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Book Now</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
