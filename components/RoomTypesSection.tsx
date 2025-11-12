"use client"

import { useState, useEffect, useCallback } from "react"
import RoomTypeCard from "./RoomTypeCard"
import { Bed } from "lucide-react"

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

interface RoomTypesSectionProps {
  accommodationId: string
  onRoomTypeSelect?: (roomType: RoomType) => void
  selectedRoomType?: RoomType | null
  showSelection?: boolean
}

export default function RoomTypesSection({ 
  accommodationId, 
  onRoomTypeSelect, 
  selectedRoomType,
  showSelection = false 
}: RoomTypesSectionProps) {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [accommodationTotals, setAccommodationTotals] = useState<{
    totalRooms: number
    availableRooms: number
  } | null>(null)

  const loadRoomTypes = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/accommodations/${accommodationId}/room-types`)
      
      if (response.ok) {
        const data = await response.json()
        setRoomTypes(data.roomTypes || [])
        // Use database totals from API response as source of truth
        if (data.totals) {
          setAccommodationTotals({
            totalRooms: Number(data.totals.totalRooms) || 0,
            availableRooms: Number(data.totals.availableRooms) || 0
          })
        } else if (data.accommodation) {
          setAccommodationTotals({
            totalRooms: Number(data.accommodation.totalRooms) || 0,
            availableRooms: Number(data.accommodation.availableRooms) || 0
          })
        }
      }
    } catch (error) {
      console.error('Failed to load room types:', error)
    } finally {
      setIsLoading(false)
    }
  }, [accommodationId])

  useEffect(() => {
    loadRoomTypes()
  }, [loadRoomTypes])

  // Show all room types as-is (no filtering or sorting)
  const displayRoomTypes = roomTypes

  const getRoomTypeStats = () => {
    // Use database totals as source of truth, fallback to calculating from room types
    const totalRooms = accommodationTotals?.totalRooms || roomTypes.reduce((sum, rt) => sum + rt.totalCount, 0)
    const availableRooms = accommodationTotals?.availableRooms || roomTypes.reduce((sum, rt) => sum + rt.availableCount, 0)
    const priceRange = roomTypes.length > 0 
      ? {
          min: Math.min(...roomTypes.map(rt => rt.price)),
          max: Math.max(...roomTypes.map(rt => rt.price))
        }
      : { min: 0, max: 0 }
    
    return { totalRooms, availableRooms, priceRange }
  }

  const stats = getRoomTypeStats()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300/10 dark:bg-gray-700/10 rounded w-1/3 mb-3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200/10 dark:bg-gray-700/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (roomTypes.length === 0) {
    return (
      <div className="text-center py-8 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
        <Bed className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-white mb-1">No Room Types Available</h3>
        <p className="text-sm text-neutral-400">This accommodation doesn&apos;t have any room types configured yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
            <Bed className="w-5 h-5 text-blue-400" />
            Room Types & Pricing
          </h2>
          <span className="text-xs text-neutral-400">
            {roomTypes.length} type{roomTypes.length !== 1 ? 's' : ''} • {stats.availableRooms}/{stats.totalRooms} available
          </span>
        </div>
        
        {/* Compact Price Range */}
        {stats.priceRange.min !== stats.priceRange.max && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-400">From</span>
            <span className="text-lg font-bold text-white">R{stats.priceRange.min}</span>
            <span className="text-neutral-400">-</span>
            <span className="text-lg font-bold text-white">R{stats.priceRange.max}</span>
          </div>
        )}
      </div>

      {/* Room Types Grid - More Compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        {displayRoomTypes.map((roomType) => (
          <RoomTypeCard
            key={roomType.id}
            roomType={roomType}
            onSelect={showSelection ? onRoomTypeSelect : undefined}
            isSelected={showSelection && selectedRoomType?.id === roomType.id}
            showAvailability={true}
          />
        ))}
      </div>

      {/* Compact Summary */}
      {showSelection && selectedRoomType && (
        <div className="p-3 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-400 mb-1">Selected Room</p>
              <p className="text-sm font-semibold text-white">{selectedRoomType.name}</p>
            </div>
            <p className="text-base font-bold text-green-400">R{selectedRoomType.price}/month</p>
          </div>
        </div>
      )}
    </div>
  )
}
