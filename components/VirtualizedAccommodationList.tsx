"use client"

import { useMemo } from "react"
import { Virtuoso } from "react-virtuoso"
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

export default function VirtualizedAccommodationList({
  accommodations,
  height = 600,
  }: VirtualizedAccommodationListProps) {
  const itemData = useMemo(() => accommodations, [accommodations])

  return (
    <div className="w-full">
      <div className="flex flex-wrap md:block">
        {/* Desktop virtualized list */}
        <div className="hidden md:block">
          <Virtuoso
            style={{ height }}
            totalCount={itemData.length}
            itemContent={(index) => {
              const acc = itemData[index]
              return (
                <div
                  className="px-1 md:px-2 w-1/2 md:w-full"
                  role="listitem"
                  aria-posinset={index + 1}
                  aria-setsize={itemData.length}
                >
                  <AccommodationCard
                    key={acc.id}
                    id={acc.id}
                    title={acc.name}
                    address={acc.address}
                    rating={acc.rating}
                    reviewCount={acc.reviewCount}
                    price={acc.price}
                    isOpen={acc.isOpen}
                    image={acc.image}
                    amenities={acc.amenities}
                    distance={acc.distance}
                    verified={acc.verified}
                    featured={acc.featured}
                    availableRooms={acc.availableRooms}
                    totalRooms={acc.totalRooms}
                  />
                </div>
              )
            }}
            overscan={3}
          />
        </div>

        {/* Mobile: simple grid, no virtualization */}
        <div className="grid grid-cols-2 md:hidden gap-2 w-full">
          {accommodations.map((acc) => (
            <AccommodationCard
              key={acc.id}
              id={acc.id}
              title={acc.name}
              address={acc.address}
              rating={acc.rating}
              reviewCount={acc.reviewCount}
              price={acc.price}
              isOpen={acc.isOpen}
              image={acc.image}
              amenities={acc.amenities}
              distance={acc.distance}
              verified={acc.verified}
              featured={acc.featured}
              availableRooms={acc.availableRooms}
              totalRooms={acc.totalRooms}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
