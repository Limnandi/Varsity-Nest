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
    <div style={style} className="px-1 md:px-2 w-1/2 md:w-full">
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
      <div className="flex flex-wrap md:block">
        <List
          height={containerHeight}
          itemCount={accommodations.length}
          itemSize={itemHeight}
          itemData={itemData}
          width="100%"
          className="accommodation-list hidden md:block"
        >
          {AccommodationItem}
        </List>
        {/* Mobile grid view */}
        <div className="grid grid-cols-2 md:hidden gap-2 w-full">
          {accommodations.map((accommodation) => (
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
          ))}
        </div>
      </div>
    </div>
  )
}
