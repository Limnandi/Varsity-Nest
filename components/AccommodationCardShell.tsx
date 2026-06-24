import Image from "next/image"
import Link from "next/link"
import { MapPin, Shield, Star } from "lucide-react"
import { formatZar } from "@/lib/utils"

export interface AccommodationCardShellProps {
  id: string | number
  title: string
  address: string
  rating: number
  reviewCount: number
  price: number
  isOpen: boolean
  image: string
  verified: boolean
  featured: boolean
  availableRooms: number
  totalRooms: number
  priority?: boolean
  imageQuality?: number
}

export default function AccommodationCardShell({
  id,
  title,
  address,
  rating,
  reviewCount,
  price,
  isOpen,
  image,
  verified,
  featured,
  availableRooms,
  totalRooms,
  priority = false,
  imageQuality = priority ? 75 : 60,
}: AccommodationCardShellProps) {
  return (
    <div className="group relative border border-white/10 bg-black/40 md:bg-black/30 backdrop-blur-none md:backdrop-blur-2xl rounded-2xl overflow-hidden text-white shadow-lg md:shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/30 transition-all duration-500 md:hover:scale-[1.02] hover:border-blue-500/30 w-full">
      <div className="relative h-48 sm:h-56 overflow-hidden">
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          fill
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
          quality={imageQuality}
          loading={priority ? "eager" : "lazy"}
          className="object-cover transition-all duration-700 group-hover:scale-110"
          sizes="(max-width: 640px) 430px, (max-width: 1024px) 50vw, 380px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />

        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {featured && (
            <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-400/95 to-orange-500/95 text-white text-xs font-bold rounded-full border border-yellow-400/40">
              FEATURED
            </span>
          )}
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border ${
              isOpen
                ? "bg-green-500/30 text-green-200 border-green-400/60"
                : "bg-red-500/30 text-red-200 border-red-400/60"
            }`}
          >
            {isOpen ? "Available" : "Full"}
          </span>
        </div>

        {isOpen && (
          <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-semibold border border-white/30">
            {availableRooms}/{totalRooms} rooms
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3 gap-2 min-w-0">
          <h3 className="font-bold text-lg sm:text-xl text-white break-words flex-1 min-w-0 leading-tight">
            {title}
          </h3>
          {verified && (
            <div className="p-2 border border-green-500/50 bg-green-500/20 rounded-lg flex-shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            </div>
          )}
        </div>

        <div className="flex items-start text-neutral-300 text-xs sm:text-sm mb-4 min-w-0">
          <MapPin className="w-4 h-4 mr-2 text-blue-400 flex-shrink-0 mt-0.5" />
          <span className="break-words">{address}</span>
        </div>

        <div className="flex items-center mb-4 flex-wrap gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 ${
                  i < rating ? "text-yellow-400 fill-current" : "text-neutral-600"
                }`}
              />
            ))}
          </div>
          <span className="text-xs sm:text-sm text-neutral-400">
            ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
              {formatZar(price)}
            </span>
            <span className="text-neutral-400 text-xs sm:text-sm">/month</span>
          </div>
          <Link
            href={`/listing/${id}`}
            className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-blue-500/30 w-full sm:w-auto flex items-center justify-center"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}
