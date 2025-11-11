"use client"

import { useState, useEffect, useRef } from "react"
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
  const filterRef = useRef<HTMLDivElement>(null)

  const allAmenities = Array.from(new Set(accommodations.flatMap((acc) => acc.amenities)))

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

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
    <div className="relative z-[9999] w-full sm:w-auto" ref={filterRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center sm:justify-start space-x-2 px-3 sm:px-4 py-2 bg-black/20 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300 text-white backdrop-blur-sm w-full sm:w-auto text-sm sm:text-base"
      >
        <Filter className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
        <span className="break-words">Filters</span>
        {(filters.amenities.length > 0 || filters.verified || filters.available) && (
          <span className="bg-blue-600 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0">
            {filters.amenities.length + (filters.verified ? 1 : 0) + (filters.available ? 1 : 0)}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 bg-black/50 z-[9998] sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed sm:absolute top-auto sm:top-full left-0 sm:left-0 right-0 sm:right-auto bottom-0 sm:bottom-auto mt-0 sm:mt-2 w-full sm:w-80 max-w-full sm:max-w-none bg-black/20 border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-blue-500/10 z-[9999] p-4 sm:p-6 backdrop-blur-xl max-h-[80vh] sm:max-h-none overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white text-base sm:text-lg break-words">Filters</h3>
            <button onClick={() => setIsOpen(false)} className="text-neutral-300 hover:text-white transition-colors flex-shrink-0 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Price Range */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium mb-2 text-neutral-300 break-words">Price Range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={filters.priceRange[0]}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priceRange: [Number(e.target.value), prev.priceRange[1]],
                  }))
                }
                className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 sm:py-2 border border-white/10 rounded text-xs sm:text-sm bg-black/20 text-white placeholder-neutral-400"
                placeholder="Min"
              />
              <span className="text-neutral-300 flex-shrink-0">-</span>
              <input
                type="number"
                value={filters.priceRange[1]}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priceRange: [prev.priceRange[0], Number(e.target.value)],
                  }))
                }
                className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 sm:py-2 border border-white/10 rounded text-xs sm:text-sm bg-black/20 text-white placeholder-neutral-400"
                placeholder="Max"
              />
            </div>
          </div>

          {/* Amenities */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium mb-2 text-neutral-300 break-words">Amenities</label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {allAmenities.map((amenity) => (
                <button
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm transition-all duration-300 break-words ${
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
          <div className="mb-4 sm:mb-6 space-y-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.verified}
                onChange={(e) => setFilters((prev) => ({ ...prev, verified: e.target.checked }))}
                className="mr-2 accent-blue-500 flex-shrink-0"
              />
              <span className="text-xs sm:text-sm text-neutral-300 break-words">Verified properties only</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.available}
                onChange={(e) => setFilters((prev) => ({ ...prev, available: e.target.checked }))}
                className="mr-2 accent-blue-500 flex-shrink-0"
              />
              <span className="text-xs sm:text-sm text-neutral-300 break-words">Available now</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={applyFilters}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 sm:py-2.5 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 text-sm sm:text-base break-words"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 sm:py-2.5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300 text-neutral-300 hover:text-white text-sm sm:text-base break-words"
            >
              Clear
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  )
}
