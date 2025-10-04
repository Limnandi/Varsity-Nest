"use client"

import { useState, useMemo, memo } from "react"
import { FixedSizeList as List } from "react-window"
import AccommodationCard from "./AccommodationCard"

interface Accommodation {
  id: string
  name: string
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

interface VirtualizedAccommodationListProps {
  accommodations: Accommodation[]
  height?: number
  itemHeight?: number
}

const AccommodationItem = memo(({ index, style, data }: {
  index: number
  style: React.CSSProperties
  data: Accommodation[]
}) => {
  const accommodation = data[index]
  
  return (
    <div style={style} className="px-2">
      <AccommodationCard
        key={accommodation.id}
        id={accommodation.id}
        title={accommodation.name}
        address={accommodation.address}
        rating={accommodation.rating}
        reviewCount={accommodation.reviewCount}
        price={accommodation.price}
        isOpen={accommodation.isOpen}
        image={accommodation.image}
        amenities={accommodation.amenities}
        distance={accommodation.distance}
        verified={accommodation.verified}
        featured={accommodation.featured}
        availableRooms={accommodation.availableRooms}
        totalRooms={accommodation.totalRooms}
      />
    </div>
  )
})

AccommodationItem.displayName = "AccommodationItem"

export default function VirtualizedAccommodationList({
  accommodations,
  height = 600,
  itemHeight = 400
}: VirtualizedAccommodationListProps) {
  const [containerHeight] = useState(height)

  const itemData = useMemo(() => accommodations, [accommodations])

  return (
    <div className="w-full">
      <List
        height={containerHeight}
        itemCount={accommodations.length}
        itemSize={itemHeight}
        itemData={itemData}
        width="100%"
        className="accommodation-list"
      >
        {AccommodationItem}
      </List>
    </div>
  )
}
