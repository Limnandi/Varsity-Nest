"use client"

import { useState, useEffect } from "react"
import AccommodationCard from "@/components/AccommodationCard"
import SearchBar from "@/components/SearchBar"
import TabFilter from "@/components/TabFilter"
import AdvancedFilters from "@/components/AdvancedFilters"
import SkeletonCard from "@/components/SkeletonCard"
import { accommodations } from "@/lib/data"
import { SlidersHorizontal } from "lucide-react"

export default function AccreditedAccommodations() {
  const [filteredAccommodations, setFilteredAccommodations] = useState(accommodations)
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "rating" | "reviews">("price-desc")

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleSort = (accommodations: typeof filteredAccommodations) => {
    const sorted = [...accommodations].sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price
        case "price-desc":
          return b.price - a.price
        case "rating":
          return b.rating - a.rating
        case "reviews":
          return b.reviewCount - a.reviewCount
        default:
          return 0
      }
    })
    return sorted
  }

  const sortedAccommodations = handleSort(filteredAccommodations)

  return (
    <div className="pt-36 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Intro Banner */}
        <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl p-8 mb-8 shadow-lg">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Accredited Accommodations
          </h1>
          <p className="text-lg text-gray-700 mb-4">
            Discover our premium selection of fully accredited student accommodations in Bloemfontein. These properties
            meet the highest standards for safety, comfort, and student living.
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              {accommodations.filter((acc) => acc.isOpen).length} Available Now
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              {accommodations.filter((acc) => acc.verified).length} Verified Properties
            </span>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl p-6 mb-8 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <SearchBar accommodations={accommodations} onFilter={setFilteredAccommodations} />
            </div>
            <AdvancedFilters accommodations={accommodations} onFilter={setFilteredAccommodations} />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabFilter accommodations={accommodations} onFilter={setFilteredAccommodations} />

            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-gray-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="price-desc">Price: High to Low</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="rating">Highest Rated</option>
                <option value="reviews">Most Reviews</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-white drop-shadow-lg">
            Showing {sortedAccommodations.length} of {accommodations.length} accommodations
          </p>
        </div>

        {/* Accommodations Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedAccommodations.map((accommodation) => (
              <AccommodationCard key={accommodation.id} {...accommodation} />
            ))}
          </div>
        )}

        {!isLoading && sortedAccommodations.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl p-8">
              <h3 className="text-2xl font-semibold mb-4">No accommodations found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters</p>
              <button
                onClick={() => {
                  setFilteredAccommodations(accommodations)
                  setSortBy("price-desc")
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reset Search
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
