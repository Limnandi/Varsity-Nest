"use client"

import { useState, useEffect, useCallback } from "react"
import RoomTypeCard from "./RoomTypeCard"
import { Bed, TrendingUp, Filter } from "lucide-react"

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
  const [filter, setFilter] = useState<'all' | 'single' | 'sharing'>('all')
  const [sortBy, setSortBy] = useState<'price' | 'availability' | 'name'>('price')

  const loadRoomTypes = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/accommodations/${accommodationId}/room-types`)
      
      if (response.ok) {
        const data = await response.json()
        setRoomTypes(data.roomTypes || [])
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

  const filteredRoomTypes = roomTypes.filter(roomType => {
    if (filter === 'all') return true
    return roomType.type === filter
  })

  const sortedRoomTypes = [...filteredRoomTypes].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price
      case 'availability':
        return b.availableCount - a.availableCount
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  const getRoomTypeStats = () => {
    const totalRooms = roomTypes.reduce((sum, rt) => sum + rt.totalCount, 0)
    const availableRooms = roomTypes.reduce((sum, rt) => sum + rt.availableCount, 0)
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
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (roomTypes.length === 0) {
    return (
      <div className="text-center py-12">
        <Bed className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Room Types Available</h3>
        <p className="text-neutral-400">This accommodation doesn&apos;t have any room types configured yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
            <Bed className="w-6 h-6 text-blue-400" />
            Room Types & Pricing
          </h2>
          <p className="text-neutral-400">
            Choose from {roomTypes.length} room type{roomTypes.length !== 1 ? 's' : ''} starting from R{stats.priceRange.min}
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <TrendingUp className="w-4 h-4" />
          <span>{stats.availableRooms} of {stats.totalRooms} rooms available</span>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <span className="text-sm text-neutral-400">Filter:</span>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-auto min-w-[120px]"
          >
            <option value="all">All Types</option>
            <option value="single">Single</option>
            <option value="sharing">Sharing</option>
          </select>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <span className="text-sm text-neutral-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-auto min-w-[120px]"
          >
            <option value="price">Price</option>
            <option value="availability">Availability</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* Price Range Display */}
      {stats.priceRange.min !== stats.priceRange.max && (
        <div className="p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="text-center flex-1">
                <p className="text-sm text-neutral-400">Starting from</p>
                <p className="text-xl lg:text-2xl font-bold text-white">R{stats.priceRange.min}</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-sm text-neutral-400">Up to</p>
                <p className="text-xl lg:text-2xl font-bold text-white">R{stats.priceRange.max}</p>
              </div>
            </div>
            <div className="text-left lg:text-right flex-shrink-0">
              <p className="text-sm text-neutral-400">Price Range</p>
              <p className="text-lg font-semibold text-white">
                R{stats.priceRange.min} - R{stats.priceRange.max}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Room Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {sortedRoomTypes.map((roomType) => (
          <RoomTypeCard
            key={roomType.id}
            roomType={roomType}
            onSelect={showSelection ? onRoomTypeSelect : undefined}
            isSelected={showSelection && selectedRoomType?.id === roomType.id}
            showAvailability={true}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-sm text-neutral-400">Total Room Types</p>
              <p className="text-xl font-bold text-white">{roomTypes.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-neutral-400">Available Rooms</p>
              <p className="text-xl font-bold text-green-400">{stats.availableRooms}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-neutral-400">Total Rooms</p>
              <p className="text-xl font-bold text-white">{stats.totalRooms}</p>
            </div>
          </div>
          
          {showSelection && selectedRoomType && (
            <div className="text-left lg:text-right">
              <p className="text-sm text-neutral-400">Selected Room</p>
              <p className="text-lg font-semibold text-white">{selectedRoomType.name}</p>
              <p className="text-sm text-green-400">R{selectedRoomType.price}/month</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
