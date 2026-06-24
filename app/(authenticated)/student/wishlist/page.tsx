"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Heart, MapPin, Star, Phone, ExternalLink, Trash2, Search, Filter } from "lucide-react"
import { useStudentAuth } from "@/hooks/useStudentAuth"
import { Toaster, toast } from "sonner"
import Image from "next/image"

interface WishlistItem {
  id: string
  accommodationId: string
  name: string
  address: string
  price: number
  image: string
  rating: number
  reviewCount: number
  accreditationStatus: 'accredited' | 'provisionally_accredited' | 'non_accredited'
  addedAt: string
  contactEmail?: string
  contactPhone?: string
  websiteUrl?: string
}

export default function StudentWishlistPage() {
  const { user: studentUser, isLoading } = useStudentAuth()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "accredited" | "provisionally_accredited" | "non_accredited">("all")
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !studentUser) {
      router.push('/auth/login')
    }
  }, [isLoading, studentUser, router])

  // Load wishlist items
  useEffect(() => {
    const loadWishlist = async () => {
      setIsLoadingWishlist(true)
      try {
        const params = new URLSearchParams({
          search: searchTerm,
          status: filterStatus,
          page: "1",
          limit: "50"
        })

        const response = await fetch(`/api/student/wishlist?${params}`)
        
        if (response.ok) {
          const result = await response.json()
          const items = result.data.items.map((item: any) => ({
            id: item.id,
            accommodationId: item.accommodationId,
            name: item.accommodation.name,
            address: item.accommodation.address,
            price: parseFloat(item.accommodation.price),
            image: Array.isArray(item.accommodation.images) && item.accommodation.images.length > 0 
              ? item.accommodation.images[0] 
              : "/placeholder.svg",
            rating: item.accommodation.rating || 0,
            reviewCount: item.accommodation.reviewCount || 0,
            accreditationStatus: item.accommodation.accreditationStatus,
            addedAt: item.addedAt,
            contactEmail: item.accommodation.contactEmail,
            contactPhone: item.accommodation.contactPhone,
            websiteUrl: item.accommodation.websiteUrl
          }))
          setWishlistItems(items)
        } else {
          const error = await response.json()
          console.error('Wishlist API error:', error)
          toast.error(error.error || error.message || "Failed to load wishlist")
        }
      } catch (error) {
        console.error('Error loading wishlist:', error)
        toast.error("Failed to load wishlist")
      } finally {
        setIsLoadingWishlist(false)
      }
    }

    if (studentUser) {
      loadWishlist()
    }
  }, [studentUser, searchTerm, filterStatus])

  const handleRemoveFromWishlist = async (itemId: string) => {
    try {
      const item = wishlistItems.find(item => item.id === itemId)
      if (!item) return

      const response = await fetch(`/api/student/wishlist?accommodationId=${item.accommodationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setWishlistItems(prev => prev.filter(item => item.id !== itemId))
        toast.success("Removed from wishlist")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to remove from wishlist")
      }
    } catch (error) {
      console.error('Remove from wishlist error:', error)
      toast.error("Failed to remove from wishlist")
    }
  }

  const handleViewAccommodation = (accommodationId: string) => {
    router.push(`/listing/${accommodationId}`)
  }

  const filteredItems = wishlistItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || item.accreditationStatus === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accredited':
        return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'provisionally_accredited':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'non_accredited':
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accredited':
        return 'Accredited'
      case 'provisionally_accredited':
        return 'Provisionally Accredited'
      case 'non_accredited':
        return 'Non-Accredited'
      default:
        return 'Unknown'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!studentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] p-8">
      <div className="max-w-6xl mx-auto">
        <Toaster richColors position="top-center" />
        
        {/* Header */}
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-8 text-white mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                <Heart className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">
                  My Wishlist
                </h1>
                <p className="text-neutral-300">Your saved accommodations</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{wishlistItems.length}</p>
              <p className="text-sm text-neutral-400">Saved items</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search your wishlist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="pl-10 pr-8 py-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 appearance-none"
              >
                <option value="all">All Status</option>
                <option value="accredited">Accredited</option>
                <option value="provisionally_accredited">Provisionally Accredited</option>
                <option value="non_accredited">Non-Accredited</option>
              </select>
            </div>
          </div>
        </div>

        {/* Wishlist Items */}
        {isLoadingWishlist ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-6 animate-pulse">
                <div className="w-full h-48 bg-white/10 rounded-xl mb-4"></div>
                <div className="h-4 bg-white/10 rounded mb-2"></div>
                <div className="h-3 bg-white/5 rounded mb-4"></div>
                <div className="h-6 bg-white/10 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm || filterStatus !== "all" ? "No matching items" : "Your wishlist is empty"}
            </h3>
            <p className="text-neutral-400 mb-6">
              {searchTerm || filterStatus !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "Start exploring accommodations and save your favorites"}
            </p>
            <button
              onClick={() => router.push('/accommodations')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95"
            >
              Browse Accommodations
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-6 text-white group hover:shadow-blue-500/30 transition-all duration-300">
                {/* Image */}
                <div className="relative w-full h-48 mb-4 rounded-xl overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(item.accreditationStatus)}`}>
                      {getStatusText(item.accreditationStatus)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveFromWishlist(item.id)}
                    className="absolute top-3 left-3 p-2 bg-black/50 rounded-full text-white hover:bg-red-500/80 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-sm text-neutral-400 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {item.address}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-white">{item.rating}</span>
                      <span className="text-sm text-neutral-400">({item.reviewCount})</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">R{item.price.toLocaleString()}</p>
                      <p className="text-xs text-neutral-400">per month</p>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => handleViewAccommodation(item.accommodationId)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                  </div>

                  {/* Contact Info */}
                  {(item.contactEmail || item.contactPhone) && (
                    <div className="pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs text-neutral-400">
                        {item.contactPhone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{item.contactPhone}</span>
                          </div>
                        )}
                        {item.websiteUrl && (
                          <a
                            href={item.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 hover:text-blue-300 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Website</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
