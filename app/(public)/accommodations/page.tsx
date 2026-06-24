"use client"

import { useState, useEffect, useMemo, useCallback, lazy, Suspense, useRef } from "react"
import { SlidersHorizontal, ChevronDown } from "lucide-react"
import SkeletonCard from "@/components/SkeletonCard"
import AccommodationCard from "@/components/AccommodationCard"
import { CacheManager } from "@/lib/cache"

// Lazy load heavy components
const SearchBar = lazy(() => import("@/components/SearchBar"))
const TabFilter = lazy(() => import("@/components/TabFilter"))
const AdvancedFilters = lazy(() => import("@/components/AdvancedFilters"))
const VirtualizedAccommodationList = lazy(() => import("@/components/VirtualizedAccommodationList"))

export default function Accommodations() {
  const [allAccs, setAllAccs] = useState<any[]>([])
  const [filteredAccommodations, setFilteredAccommodations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "rating" | "reviews">("price-desc")
  const [useVirtualization, setUseVirtualization] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)
  const ratingsMapRef = useRef<Record<string, { rating: number, review_count: number }>>({})

  const sortOptions = [
    { value: "price-desc" as const, label: "Price: High to Low" },
    { value: "price-asc" as const, label: "Price: Low to High" },
    { value: "rating" as const, label: "Highest Rated" },
    { value: "reviews" as const, label: "Most Reviews" },
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false)
      }
    }

    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSortOpen])

  // Fetch ratings/review counts in real-time
  const fetchRatings = useCallback(async (accommodationIds: string[]) => {
    if (accommodationIds.length === 0) return

    try {
      const idsParam = accommodationIds.join(',')
      const response = await fetch(`/api/accommodations/ratings?ids=${idsParam}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const freshData = result.data
          ratingsMapRef.current = freshData
          
          // Update accommodations with fresh ratings - force update even if values are 0
          setAllAccs(prev => {
            const updated = prev.map(acc => {
              const fresh = freshData[acc.id]
              if (fresh !== undefined) {
                const newRating = fresh.rating ?? 0
                const newReviewCount = fresh.review_count ?? 0
                
                // Only update if values actually changed (avoid unnecessary re-renders)
                if (acc.rating !== newRating || acc.review_count !== newReviewCount) {
                  return { 
                    ...acc, 
                    rating: newRating, 
                    review_count: newReviewCount 
                  }
                }
              }
              return acc
            })
            return updated
          })
          
          setFilteredAccommodations(prev => {
            const updated = prev.map(acc => {
              const fresh = freshData[acc.id]
              if (fresh !== undefined) {
                const newRating = fresh.rating ?? 0
                const newReviewCount = fresh.review_count ?? 0
                
                // Only update if values actually changed (avoid unnecessary re-renders)
                if (acc.rating !== newRating || acc.review_count !== newReviewCount) {
                  return { 
                    ...acc, 
                    rating: newRating, 
                    review_count: newReviewCount 
                  }
                }
              }
              return acc
            })
            return updated
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch ratings:', error)
      // Don't throw - this is a background update
    }
  }, [])

  // Listen for review change events to trigger immediate refresh
  useEffect(() => {
    const handleReviewChange = (event: Event) => {
      const customEvent = event as CustomEvent
      const accommodationId = customEvent.detail?.accommodationId
      const optimisticRating = customEvent.detail?.rating
      const optimisticReviewCount = customEvent.detail?.review_count
      
      // Trigger immediate ratings refresh only for the affected listing.
      // Refreshing *all* listings on every review change is expensive and causes scroll jank.
      if (accommodationId) {
        // Apply optimistic update immediately (if provided) for instant UI feedback
        if (typeof optimisticRating === "number" || typeof optimisticReviewCount === "number") {
          setAllAccs((prev) =>
            prev.map((acc) =>
              acc.id === accommodationId
                ? {
                    ...acc,
                    rating: typeof optimisticRating === "number" ? optimisticRating : acc.rating,
                    review_count:
                      typeof optimisticReviewCount === "number" ? optimisticReviewCount : acc.review_count,
                  }
                : acc,
            ),
          )
          setFilteredAccommodations((prev) =>
            prev.map((acc) =>
              acc.id === accommodationId
                ? {
                    ...acc,
                    rating: typeof optimisticRating === "number" ? optimisticRating : acc.rating,
                    review_count:
                      typeof optimisticReviewCount === "number" ? optimisticReviewCount : acc.review_count,
                  }
                : acc,
            ),
          )
        }
        fetchRatings([accommodationId])
      }
    }

    window.addEventListener('reviewDeleted', handleReviewChange)
    window.addEventListener('reviewAdded', handleReviewChange)

    return () => {
      window.removeEventListener('reviewDeleted', handleReviewChange)
      window.removeEventListener('reviewAdded', handleReviewChange)
    }
  }, [allAccs, fetchRatings])

  useEffect(() => {
    const load = async () => {
      try {
        // Try client-side cache first using a dedicated key
        let accommodations = CacheManager.getCachedAccommodationsByStatusClient('published', 100, 0) as any[] | null

        if (!accommodations || !Array.isArray(accommodations) || accommodations.length === 0) {
          // Fetch only published & active accommodations (default API behavior without accreditation filter)
          const response = await fetch('/api/accommodations?limit=100&offset=0', {
            cache: 'no-store'
          })

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
          console.log('[ACCOMMODATIONS] API Response:', { 
            hasSuccess: !!result?.success, 
            hasData: !!result?.data,
            isArray: Array.isArray(result),
            resultKeys: result ? Object.keys(result) : [],
            dataLength: result?.data?.length || (Array.isArray(result) ? result.length : 0)
          })

          // Extract data from API response structure
          let data: any[] = []
          if (result && result.success && result.data) {
            data = result.data
          } else if (Array.isArray(result)) {
            data = result
          } else if (result && Array.isArray(result.data)) {
            data = result.data
          }

          // Ensure data is an array
          accommodations = Array.isArray(data) ? data : []
          
          console.log(`[ACCOMMODATIONS] Loaded ${accommodations.length} accommodations`)
          
          if (accommodations.length === 0) {
            console.warn('[ACCOMMODATIONS] No accommodations found. Raw result:', result)
          }

          // Cache the result under the 'published' key
          if (accommodations && accommodations.length > 0) {
            CacheManager.cacheAccommodationsByStatusClient('published', 100, 0, accommodations)
          }
        }

        const accommodationsList = Array.isArray(accommodations) ? accommodations : []
        setAllAccs(accommodationsList as any[])
        setFilteredAccommodations(accommodationsList as any[])

        if (accommodationsList.length > 50) {
          setUseVirtualization(true)
        }

        // Fetch initial ratings after accommodations are loaded (don't await - let it run in background)
        if (accommodationsList.length > 0) {
          const ids = accommodationsList.map(acc => acc.id).filter(Boolean)
          if (ids.length > 0) {
            // Don't await - let ratings load in background so accommodations show immediately
            fetchRatings(ids).catch(err => {
              console.error('Background ratings fetch failed:', err)
            })
          }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Poll ratings periodically (keep light to avoid scroll jank)
  useEffect(() => {
    if (allAccs.length === 0) return

    const POLL_INTERVAL = 60 * 1000 // 60 seconds

    const pollRatings = () => {
      const ids = allAccs.map(acc => acc.id).filter(Boolean)
      if (ids.length > 0) {
        fetchRatings(ids).catch(err => {
          console.error('Polling ratings failed:', err)
        })
      }
    }

    // Start polling after a short delay to let initial load complete
    const initialTimeout = setTimeout(pollRatings, 3000)
    let interval: ReturnType<typeof setInterval> | undefined
    const start = () => {
      if (!interval) interval = setInterval(pollRatings, POLL_INTERVAL)
    }
    const stop = () => {
      if (interval) {
        clearInterval(interval)
        interval = undefined
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible") start()
      else stop()
    }

    document.addEventListener("visibilitychange", onVisibility)
    start()

    return () => {
      clearTimeout(initialTimeout)
      stop()
      document.removeEventListener("visibilitychange", onVisibility)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAccs.length]) // Only depend on length, not the array itself

  const handleSort = useCallback((accommodations: typeof filteredAccommodations) => {
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
    <div className="pt-36 pb-20 px-2 sm:px-4 bg-gradient-to-b from-[#040945] to-[#02042b] min-h-screen overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full">
        {/* Intro Banner */}
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-2xl tracking-tight break-words">
            Accommodations
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-neutral-300 drop-shadow-lg mb-8 max-w-3xl mx-auto leading-relaxed px-4 break-words">
            Browse all published student accommodations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-neutral-300 px-4">
            <span className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
              <span className="break-words">{allAccs.filter((acc) => acc.is_open).length} Available Now</span>
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
              <span className="break-words">{allAccs.filter((acc) => acc.is_verified).length} Verified Properties</span>
            </span>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="relative border border-white/10 bg-black/25 md:bg-black/20 backdrop-blur-none md:backdrop-blur-xl rounded-2xl p-4 sm:p-6 mb-8 text-white shadow-lg md:shadow-2xl shadow-blue-500/10 overflow-visible">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 min-w-0">
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

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <SlidersHorizontal className="w-4 h-4 text-neutral-300 flex-shrink-0" />
              <div className="relative w-full sm:w-auto" ref={sortRef}>
                <button
                  type="button"
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg hover:bg-white/10 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white backdrop-blur-none md:backdrop-blur-sm w-full sm:w-auto min-w-[180px] flex items-center justify-between transition-all duration-300"
                >
                  <span className="text-sm">{sortOptions.find(opt => opt.value === sortBy)?.label || "Price: High to Low"}</span>
                  <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isSortOpen ? 'rotate-180' : ''}`} />
                </button>
                {isSortOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-black/40 md:bg-black/30 border border-white/20 backdrop-blur-none md:backdrop-blur-xl rounded-xl shadow-lg md:shadow-2xl shadow-blue-500/10 overflow-hidden min-w-[180px]">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          handleSortChange(option.value)
                          setIsSortOpen(false)
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition-all duration-200 hover:bg-white/10 ${
                          sortBy === option.value
                            ? "bg-blue-600/30 text-white border-l-2 border-blue-500"
                            : "text-neutral-300 hover:text-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6 px-4">
          <p className="text-white drop-shadow-lg text-base sm:text-lg break-words">
            Showing {sortedAccommodations.length} of {allAccs.length} accommodations
          </p>
        </div>

        {/* Accommodations Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-8">
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
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-8">
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
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/10">
              <h3 className="text-2xl font-semibold mb-4 text-white">No accommodations found</h3>
              <p className="text-neutral-300 mb-6">Try adjusting your search criteria or filters</p>
              <button
                onClick={() => {
                  setFilteredAccommodations(Array.isArray(allAccs) ? allAccs : [])
                  setSortBy("price-desc")
                }}
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white transition-all duration-300 ease-in-out bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] hover:shadow-blue-500/40 active:scale-[0.98]"
              >
                <span className="relative z-10">Reset Search</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


