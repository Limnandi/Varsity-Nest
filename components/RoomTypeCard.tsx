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
        return <Bed className="w-4 h-4 text-blue-400" />
      case "sharing":
        return <Users className="w-4 h-4 text-green-400" />
      default:
        return <Bed className="w-4 h-4 text-gray-400" />
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
      className={`relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl p-4 text-white shadow-lg hover:shadow-xl hover:shadow-[0_0_25px_#00FF99]/30 transition-all duration-300 cursor-pointer ${
        isSelected ? "ring-2 ring-blue-500/50 bg-blue-500/10" : ""
      } ${!roomType.isActive ? "opacity-50" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect && onSelect(roomType)}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center z-10">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Hover Overlay */}
      {isHovered && !isSelected && (
        <div className="absolute inset-0 rounded-xl bg-white/5 pointer-events-none"></div>
      )}

      {/* Card Content */}
      <div className="relative z-0 space-y-3">
        {/* Header: Icon, Title, and Price */}
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg border ${getRoomTypeColor(roomType.type)} flex-shrink-0`}>
            {getRoomTypeIcon(roomType.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-base font-bold text-white leading-tight">
                {roomType.name}
              </h3>
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <DollarSign className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xl font-bold text-white">R{roomType.price}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-neutral-400 capitalize">
                {roomType.type}
              </span>
              {showAvailability && (
                <>
                  <span className="text-neutral-500">•</span>
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${availability.bg} ${availability.color}`}>
                    {availability.text}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {roomType.description && (
          <p className="text-xs text-neutral-300 leading-relaxed line-clamp-2">
            {roomType.description}
          </p>
        )}

        {/* Amenities */}
        {roomType.amenities && roomType.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {roomType.amenities.slice(0, 3).map((amenity, index) => (
              <div
                key={index}
                className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px]"
              >
                {getAmenityIcon(amenity)}
                <span className="text-neutral-300 capitalize">{amenity}</span>
              </div>
            ))}
            {roomType.amenities.length > 3 && (
              <div className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-neutral-400">
                +{roomType.amenities.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Availability Footer */}
        {showAvailability && (
          <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between">
            <div className="text-xs text-neutral-400">
              <span className="font-semibold text-white">{roomType.availableCount}</span>/{roomType.totalCount} available
            </div>
            
            {roomType.availableCount > 0 && (
              <div className="flex items-center gap-1 text-green-400 font-medium">
                <CheckCircle className="w-3 h-3" />
                <span className="text-xs">Book Now</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
