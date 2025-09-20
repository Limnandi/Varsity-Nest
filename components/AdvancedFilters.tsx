"use client"

import { useState } from "react"
import { Filter, X } from "lucide-react"
import type { Accommodation } from "@/lib/types"

interface AdvancedFiltersProps {
  accommodations: Accommodation[]
  onFilter: (filtered: Accommodation[]) => void
}

export default function AdvancedFilters({ accommodations, onFilter }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState({
    priceRange: [0, 5000],
    amenities: [] as string[],
    verified: false,
    available: false,
  })

  const allAmenities = Array.from(new Set(accommodations.flatMap((acc) => acc.amenities)))

  const applyFilters = () => {
    const filtered = accommodations.filter((acc) => {
      const priceMatch = acc.price >= filters.priceRange[0] && acc.price <= filters.priceRange[1]
      const amenityMatch =
        filters.amenities.length === 0 || filters.amenities.every((amenity) => acc.amenities.includes(amenity))
      const verifiedMatch = !filters.verified || acc.isVerified
      const availableMatch = !filters.available || acc.isOpen

      return priceMatch && amenityMatch && verifiedMatch && availableMatch
    })

    onFilter(filtered)
    setIsOpen(false)
  }

  const clearFilters = () => {
    setFilters({
      priceRange: [0, 5000],
      amenities: [],
      verified: false,
      available: false,
    })
    onFilter(accommodations)
  }

  const toggleAmenity = (amenity: string) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }))
  }

  return (
    <div className="relative z-[9999]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-black/20 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300 text-white backdrop-blur-sm"
      >
        <Filter className="w-5 h-5" />
        <span>Filters</span>
        {(filters.amenities.length > 0 || filters.verified || filters.available) && (
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
            {filters.amenities.length + (filters.verified ? 1 : 0) + (filters.available ? 1 : 0)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-black/20 border border-white/10 rounded-2xl shadow-2xl shadow-blue-500/10 z-[9999] p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Filters</h3>
            <button onClick={() => setIsOpen(false)} className="text-neutral-300 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Price Range */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-neutral-300">Price Range</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={filters.priceRange[0]}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priceRange: [Number(e.target.value), prev.priceRange[1]],
                  }))
                }
                className="w-20 px-2 py-1 border border-white/10 rounded text-sm bg-black/20 text-white placeholder-neutral-400"
                placeholder="Min"
              />
              <span className="text-neutral-300">-</span>
              <input
                type="number"
                value={filters.priceRange[1]}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priceRange: [prev.priceRange[0], Number(e.target.value)],
                  }))
                }
                className="w-20 px-2 py-1 border border-white/10 rounded text-sm bg-black/20 text-white placeholder-neutral-400"
                placeholder="Max"
              />
            </div>
          </div>

          {/* Amenities */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-neutral-300">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {allAmenities.map((amenity) => (
                <button
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                    filters.amenities.includes(amenity)
                      ? "bg-blue-600 text-white"
                      : "bg-white/10 text-neutral-300 hover:bg-white/20 hover:text-white border border-white/10"
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="mb-6 space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.verified}
                onChange={(e) => setFilters((prev) => ({ ...prev, verified: e.target.checked }))}
                className="mr-2 accent-blue-500"
              />
              <span className="text-sm text-neutral-300">Verified properties only</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.available}
                onChange={(e) => setFilters((prev) => ({ ...prev, available: e.target.checked }))}
                className="mr-2 accent-blue-500"
              />
              <span className="text-sm text-neutral-300">Available now</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={applyFilters}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300 text-neutral-300 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
