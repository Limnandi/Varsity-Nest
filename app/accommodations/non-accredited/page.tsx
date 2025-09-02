"use client"

import { useEffect, useState } from "react"
import AccommodationCard from "@/components/AccommodationCard"
import SkeletonCard from "@/components/SkeletonCard"
import { fetchAccommodationsByStatus } from "@/lib/repos/accommodations"

export default function NonAccreditedAccommodations() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const accs = await fetchAccommodationsByStatus('non_accredited', 200)
        setItems(accs as any[])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="pt-36 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6 drop-shadow">Non-Accredited Accommodations</h1>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((acc) => (
              <AccommodationCard
                key={acc.id}
                id={acc.id}
                title={acc.name}
                address={acc.address}
                rating={acc.rating ?? 0}
                reviewCount={acc.review_count ?? 0}
                price={Number(acc.price) || 0}
                isOpen={acc.is_open ?? true}
                image={(acc.images && acc.images[0]) || "/placeholder.svg"}
                amenities={acc.amenities || []}
                distance={acc.distance || ""}
                verified={acc.is_verified ?? false}
                featured={acc.featured ?? false}
                availableRooms={acc.available_rooms ?? 0}
                totalRooms={acc.total_rooms ?? 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
