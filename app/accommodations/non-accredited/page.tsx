"use client"

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react"
import { SlidersHorizontal } from "lucide-react"
import SkeletonCard from "@/components/SkeletonCard"
import AccommodationCard from "@/components/AccommodationCard"
import { CacheManager } from "@/lib/cache"

// Lazy load heavy components
const SearchBar = lazy(() => import("@/components/SearchBar"))
const TabFilter = lazy(() => import("@/components/TabFilter"))
const AdvancedFilters = lazy(() => import("@/components/AdvancedFilters"))
const VirtualizedAccommodationList = lazy(() => import("@/components/VirtualizedAccommodationList"))

export default function NonAccreditedAccommodations() {
  const [allAccs, setAllAccs] = useState<any[]>([])
  const [filteredAccommodations, setFilteredAccommodations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "rating" | "reviews">("price-desc")
  const [useVirtualization, setUseVirtualization] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        // Try client-side cache first
        let accommodations = CacheManager.getCachedAccommodationsByStatusClient('non-accredited', 100, 0)
        
        if (!accommodations || !Array.isArray(accommodations)) {
          // Fetch from existing API endpoint
          const response = await fetch('/api/accommodations?status=non-accredited&limit=100&offset=0')
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('API Error:', {
              status: response.status,
              statusText: response.statusText,
              error: errorData
            })
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || response.statusText}`)
          }
          
          const result = await response.json()
          
          // Extract data from API response structure
          const data = result.success && result.data ? result.data : result
          
          // Ensure data is an array
          accommodations = Array.isArray(data) ? data : []
          
          // Cache the result
          if (accommodations && accommodations.length > 0) {
            CacheManager.cacheAccommodationsByStatusClient('non-accredited', 100, 0, accommodations)
          }
        }
        
        // Ensure we always have an array
        const accommodationsList = Array.isArray(accommodations) ? accommodations : []
        setAllAccs(accommodationsList as any[])
        setFilteredAccommodations(accommodationsList as any[])
        
        // Enable virtualization for large lists
        if (accommodationsList.length > 50) {
          setUseVirtualization(true)
        }
      } catch (error) {
        console.error('Failed to load accommodations:', error)
        setAllAccs([])
        setFilteredAccommodations([])
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const handleSort = useCallback((accommodations: typeof filteredAccommodations) => {
    // Ensure accommodations is an array
    if (!Array.isArray(accommodations)) {
      console.warn('handleSort received non-array:', accommodations)
      return []
    }
    
    const sorted = [...accommodations].sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return Number(a.price) - Number(b.price)
        case "price-desc":
          return Number(b.price) - Number(a.price)
        case "rating":
          return (b.rating ?? 0) - (a.rating ?? 0)
        case "reviews":
          return (b.review_count ?? 0) - (a.review_count ?? 0)
        default:
          return 0
      }
    })
    return sorted
  }, [sortBy])

  const sortedAccommodations = useMemo(() => 
    handleSort(filteredAccommodations), 
    [handleSort, filteredAccommodations]
  )

  const handleFilterChange = useCallback((newFiltered: any[]) => {
    // Ensure newFiltered is an array
    if (Array.isArray(newFiltered)) {
      setFilteredAccommodations(newFiltered)
    } else {
      console.warn('handleFilterChange received non-array:', newFiltered)
      setFilteredAccommodations([])
    }
  }, [])

  const handleSortChange = useCallback((newSortBy: typeof sortBy) => {
    setSortBy(newSortBy)
  }, [])

  return (
    <div className="pt-36 pb-20 px-4 bg-gradient-to-b from-[#040945] to-[#02042b] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Intro Banner */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-2xl tracking-tight">
            Non-Accredited Accommodations
          </h1>
          <p className="text-xl text-neutral-300 drop-shadow-lg mb-8 max-w-3xl mx-auto leading-relaxed">
            Browse our selection of non-accredited student accommodations in Bloemfontein. These properties
            offer alternative housing options for students seeking budget-friendly living arrangements.
          </p>
          <div className="flex items-center justify-center space-x-8 text-sm text-neutral-300">
            <span className="flex items-center">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
              {allAccs.filter((acc) => acc.is_open).length} Available Now
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 bg-gray-500 rounded-full mr-2"></span>
              {allAccs.filter((acc) => acc.is_verified).length} Verified Properties
            </span>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 mb-8 text-white shadow-2xl shadow-red-500/10">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Suspense fallback={<div className="h-12 bg-black/20 border border-white/10 rounded-lg animate-pulse"></div>}>
                <SearchBar accommodations={allAccs} onFilter={handleFilterChange} />
              </Suspense>
            </div>
            <Suspense fallback={<div className="h-12 bg-black/20 border border-white/10 rounded-lg animate-pulse"></div>}>
              <AdvancedFilters accommodations={allAccs} onFilter={handleFilterChange} />
            </Suspense>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Suspense fallback={<div className="h-8 bg-black/20 border border-white/10 rounded-lg animate-pulse"></div>}>
              <TabFilter accommodations={allAccs} onFilter={handleFilterChange} />
            </Suspense>

            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-neutral-300" />
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
                className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-neutral-300 backdrop-blur-sm"
              >
                <option value="price-desc" className="bg-gray-800 text-white">Price: High to Low</option>
                <option value="price-asc" className="bg-gray-800 text-white">Price: Low to High</option>
                <option value="rating" className="bg-gray-800 text-white">Highest Rated</option>
                <option value="reviews" className="bg-gray-800 text-white">Most Reviews</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-white drop-shadow-lg text-lg">
            Showing {sortedAccommodations.length} of {allAccs.length} accommodations
          </p>
        </div>

        {/* Accommodations Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : useVirtualization ? (
          <Suspense fallback={<div className="h-96 bg-gray-200 rounded animate-pulse"></div>}>
            <VirtualizedAccommodationList
              accommodations={sortedAccommodations.map(acc => ({
                id: acc.id,
                name: acc.name,
                address: acc.address,
                rating: acc.rating ?? 0,
                reviewCount: acc.review_count ?? 0,
                price: Number(acc.price) || 0,
                isOpen: acc.is_open ?? true,
                image: (acc.images && acc.images[0]) || "/placeholder.svg",
                amenities: acc.amenities || [],
                distance: acc.distance || "",
                verified: acc.is_verified ?? false,
                featured: acc.featured ?? false,
                availableRooms: acc.available_rooms ?? 0,
                totalRooms: acc.total_rooms ?? 0,
              }))}
              height={600}
              itemHeight={400}
            />
          </Suspense>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedAccommodations.map((acc) => (
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

        {!isLoading && sortedAccommodations.length === 0 && (
          <div className="text-center py-12">
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-red-500/10">
              <h3 className="text-2xl font-semibold mb-4 text-white">No accommodations found</h3>
              <p className="text-neutral-300 mb-6">Try adjusting your search criteria or filters</p>
              <button
                onClick={() => {
                  setFilteredAccommodations(Array.isArray(allAccs) ? allAccs : [])
                  setSortBy("price-desc")
                }}
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white transition-all duration-300 ease-in-out bg-gradient-to-r from-red-600 to-pink-600 rounded-xl shadow-lg shadow-red-500/20 hover:scale-[1.02] hover:shadow-red-500/40 active:scale-[0.98]"
              >
                <span className="relative z-10">Reset Search</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
