"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { Plus, Edit, Eye, Trash2, MapPin, Users, Star, Globe, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Building } from "lucide-react"
import { formatZar } from "@/lib/utils"
import PlanSelectionModal from "@/components/PlanSelectionModal"
import { toast } from "sonner"

interface AgentAccommodation {
  id: string
  name: string
  description?: string
  address: string
  city?: string
  province?: string
  postal_code?: string
  accommodation_type?: string
  total_rooms: number
  available_rooms: number
  price: number
  amenities: string[]
  images: string[]
  is_active: boolean
  featured: boolean
  rating: number
  review_count: number
  is_open: boolean
  created_at: string | Date
  updated_at: string | Date
  accreditation_status: string
  is_published: boolean
  listing_status?: string
  has_single_rooms: boolean
  has_sharing_rooms: boolean
  single_room_price?: number
  sharing_room_price?: number
  published_at?: string | Date
  unpublished_at?: string | Date
}

export default function AgentAccommodations() {
  const [userAccommodations, setUserAccommodations] = useState<AgentAccommodation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [publishingId, setPublishingId] = useState<string | number | null>(null)
  const [showPlanSelectionModal, setShowPlanSelectionModal] = useState(false)
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null)
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true)

  const fetchSubscriptionInfo = async () => {
    try {
      setIsSubscriptionLoading(true)
      const response = await fetch('/api/subscription/check', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setSubscriptionInfo(data)
        return data
      }
      setSubscriptionInfo(null)
      return null
    } catch (error) {
      console.error('Error fetching subscription info:', error)
      setSubscriptionInfo(null)
      return null
    } finally {
      setIsSubscriptionLoading(false)
    }
  }

  useEffect(() => {
    async function loadUser() {
      try {
        // Get current user from secure session API
        const response = await fetch('/api/auth/session')
        
        if (response.ok) {
          // Fetch accommodations from server-side API
          const accommodationsResponse = await fetch(`/api/agent/accommodations?limit=200`, {
            credentials: 'include'
          })
          
          if (accommodationsResponse.ok) {
            const data = await accommodationsResponse.json()
            setUserAccommodations(data.accommodations || [])
          } else {
            console.error('Failed to fetch accommodations:', accommodationsResponse.statusText)
            setUserAccommodations([])
          }

          await fetchSubscriptionInfo()
        } else {
          // No valid session, redirect to login
          window.location.href = '/auth/login'
          return
        }
      } catch (error) {
        console.error('Error loading user:', error)
        window.location.href = '/auth/login'
        return
      } finally {
        setIsLoading(false)
      }
    }
    loadUser()
  }, [])

  const handleDelete = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this accommodation? This action cannot be undone.")) return
    try {
      const res = await fetch(`/api/accommodations/${id}`, { 
        method: 'DELETE',
        credentials: 'include'
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Delete failed')
      }
      setUserAccommodations((prev) => prev.filter((acc) => acc.id !== id))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete accommodation')
    }
  }

  const handleToggleFeatured = async (id: string | number, next: boolean) => {
    try {
      const res = await fetch(`/api/accommodations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ featured: next })
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Update failed')
      }
      const updated = await res.json()
      setUserAccommodations((prev) => prev.map((a) => (a.id === id ? { ...a, featured: updated.featured !== undefined ? updated.featured : next } : a)))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update featured flag')
    }
  }

  const handleUpdateRooms = async (id: string | number, available: number, total: number) => {
    try {
      const res = await fetch(`/api/accommodations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ available_rooms: available, total_rooms: total })
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Update failed')
      }
      const updated = await res.json()
      setUserAccommodations((prev) => prev.map((a) => (a.id === id ? { ...a, available_rooms: updated.available_rooms !== undefined ? updated.available_rooms : available, total_rooms: updated.total_rooms !== undefined ? updated.total_rooms : total } : a)))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update rooms')
    }
  }

  const handlePublishToggle = async (id: string | number, currentStatus: boolean) => {
    // When button says "Publish" (currentStatus = false), set to true
    // When button says "Unpublish" (currentStatus = true), set to false
    const newStatus = !currentStatus
    
    // If unpublishing, no subscription check needed
    if (!newStatus) {
      setPublishingId(id)
      try {
        const res = await fetch(`/api/accommodations/${id}/publish`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ is_published: newStatus })
        })
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || 'Publish toggle failed')
        }
        const updated = await res.json()
        
        const finalStatus = updated.is_published === true || updated.is_published === false 
          ? updated.is_published 
          : newStatus
        
        setUserAccommodations((prev) => prev.map((a) => (a.id === id ? { 
          ...a, 
          is_published: finalStatus,
          listing_status: updated.listing_status,
          published_at: updated.published_at,
          unpublished_at: updated.unpublished_at
        } : a)))
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to update publication status')
      } finally {
        setPublishingId(null)
      }
      return
    }
    
    // If publishing, check subscription first
    setPublishingId(id)
    
    try {
      const res = await fetch(`/api/accommodations/${id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_published: newStatus })
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        
        if (res.status === 402 && (errorData.error === 'SUBSCRIPTION_REQUIRED' || errorData.error === 'SUBSCRIPTION_PLAN_LIMIT')) {
          await fetchSubscriptionInfo()
          openPlanSelectionModal()
          setPublishingId(null)
          return
        }
        
        throw new Error(errorData.error || 'Publish toggle failed')
      }
      
      const updated = await res.json()
      
      // Ensure we use the returned value from API (database value is source of truth)
      const finalStatus = updated.is_published === true || updated.is_published === false 
        ? updated.is_published 
        : newStatus
      
      setUserAccommodations((prev) => prev.map((a) => (a.id === id ? { 
        ...a, 
        is_published: finalStatus,
        listing_status: updated.listing_status,
        published_at: updated.published_at,
        unpublished_at: updated.unpublished_at
      } : a)))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update publication status')
    } finally {
      // Clear loading state
      setPublishingId(null)
    }
  }

  const canAddProperty = subscriptionInfo
    ? subscriptionInfo.hasActiveSubscription && subscriptionInfo.canCreateMore !== false
    : false

  const openPlanSelectionModal = () => {
    setShowPlanSelectionModal(true)
  }

  return (
    <AuthGuard requiredRole="agent">
      <DashboardLayout userRole="agent">
        <PlanSelectionModal
          isOpen={showPlanSelectionModal}
          onClose={() => setShowPlanSelectionModal(false)}
          entityType="agent"
          subscriptionSummary={subscriptionInfo ? {
            isEligibleForTrial: subscriptionInfo.isEligibleForTrial ?? false,
            isInTrial: subscriptionInfo.isInTrial ?? false,
            publishedCount: subscriptionInfo.accommodationsCount ?? 0,
            totalCount: subscriptionInfo.accommodationsCount ?? 0,
          } : null}
        />
        <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 text-white overflow-x-hidden">
          {/* Header */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl shadow-blue-500/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent break-words">
                  My Accommodations
                </h1>
                <p className="text-neutral-300 text-base sm:text-lg break-words">Manage your property listings</p>
              </div>
              {canAddProperty ? (
                <Link
                  href="/agent/accommodations/new"
                  className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] text-sm sm:text-base w-full sm:w-auto justify-center break-words"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="break-words">Add New Property</span>
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={isSubscriptionLoading}
                  onClick={() => openPlanSelectionModal()}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-gray-500/20 hover:shadow-gray-500/40 text-sm sm:text-base w-full sm:w-auto justify-center break-words disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="break-words">
                    {isSubscriptionLoading ? "Checking subscription..." : "Manage Subscription"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl shadow-xl overflow-hidden animate-pulse">
                  <div className="relative h-36 bg-gray-700/30"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-gray-700/30 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700/30 rounded w-full"></div>
                    <div className="h-3 bg-gray-700/30 rounded w-2/3"></div>
                    <div className="flex gap-2">
                      <div className="h-4 bg-gray-700/30 rounded w-20"></div>
                      <div className="h-4 bg-gray-700/30 rounded w-20"></div>
                    </div>
                    <div className="h-4 bg-gray-700/30 rounded w-24"></div>
                    <div className="h-6 bg-gray-700/30 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-700/30 rounded"></div>
                    <div className="h-8 bg-gray-700/30 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : userAccommodations.length === 0 ? (
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 sm:p-12 text-center shadow-2xl shadow-blue-500/10">
              <div className="mx-auto mb-4 sm:mb-6 w-16 h-16 sm:w-20 sm:h-20 border border-blue-500/30 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Building className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 break-words">No accommodations yet</h3>
              <p className="text-neutral-300 mb-6 sm:mb-8 text-base sm:text-lg break-words">Start by adding your first property listing</p>
              {canAddProperty ? (
                <Link
                  href="/agent/accommodations/new"
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] text-sm sm:text-base break-words"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="break-words">Add Your First Property</span>
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={isSubscriptionLoading}
                  onClick={() => openPlanSelectionModal()}
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-gray-500/20 hover:shadow-gray-500/40 hover:scale-[1.02] text-sm sm:text-base break-words disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="break-words">
                    {isSubscriptionLoading ? "Checking subscription..." : "Manage Subscription"}
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userAccommodations.map((accommodation) => (
                <div key={accommodation.id} className={`relative border border-white/10 rounded-xl shadow-xl overflow-hidden hover:shadow-blue-500/20 transition-all duration-300 ${
                  accommodation.is_active ? 'bg-black/20' : 'bg-black/10 grayscale opacity-70'
                }`}>
                  <div className="relative h-36">
                    <Image 
                      src={(accommodation.images && accommodation.images[0]) || "/placeholder.jpg"} 
                      alt="Property" 
                      fill
                      className="object-cover" 
                    />
                    <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                          accommodation.is_open ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        }`}
                      >
                        {accommodation.is_open ? "Available" : "Full"}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                          accommodation.is_published ? "bg-blue-500 text-white" : "bg-gray-500 text-white"
                        }`}
                      >
                        {accommodation.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>

                  {!accommodation.is_active && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                      <div className="text-center text-white bg-red-500/20 border border-red-500/40 rounded-xl p-3 sm:p-4 max-w-sm">
                        <p className="text-xs sm:text-sm font-semibold break-words">this property has been suspended by platform team. Please see the email we sent for more details. You can reply to it for any queries or email us at query@varsitynest.space.</p>
                      </div>
                    </div>
                  )}
                  <div className="p-3 sm:p-4 text-white relative">
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-white break-words line-clamp-2">{accommodation.name}</h3>

                    <div className="flex items-start text-neutral-300 text-xs mb-2 min-w-0">
                      <MapPin className="w-3.5 h-3.5 mr-2 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span className="break-words">{accommodation.address}</span>
                    </div>

                    <div className="flex items-center text-neutral-300 text-xs mb-2 min-w-0">
                      <Users className="w-3.5 h-3.5 mr-2 text-green-400 flex-shrink-0" />
                      <span className="break-words">
                        {accommodation.available_rooms ?? 0}/{accommodation.total_rooms ?? 0} rooms available
                      </span>
                    </div>

                    {/* Room Types */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {accommodation.has_single_rooms && (
                        <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] rounded-full border border-indigo-500/30 break-words">
                          Single: {formatZar(Number(accommodation.single_room_price) || 0)}/month
                        </span>
                      )}
                      {accommodation.has_sharing_rooms && (
                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] rounded-full border border-purple-500/30 break-words">
                          Sharing: {formatZar(Number(accommodation.sharing_room_price) || 0)}/month
                        </span>
                      )}
                    </div>

                    {/* Accreditation Status */}
                    <div className="flex items-center text-xs mb-3">
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold break-words ${
                        accommodation.accreditation_status === 'accredited' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                        accommodation.accreditation_status === 'provisionally_accredited' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {accommodation.accreditation_status === 'accredited' ? 'Accredited' :
                         accommodation.accreditation_status === 'provisionally_accredited' ? 'Provisionally Accredited' :
                         'Non-Accredited'}
                      </span>
                    </div>

                    <div className="flex items-center mb-3 min-w-0">
                      <div className="flex items-center flex-shrink-0">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < (accommodation.rating ?? 0) ? "text-yellow-400 fill-current" : "text-neutral-600"}`} />
                        ))}
                      </div>
                      <span className="ml-2 text-xs text-neutral-400 break-words">({accommodation.review_count ?? 0} reviews)</span>
                    </div>

                    <div className="flex items-center justify-between mb-4 min-w-0">
                      <span className="text-xl sm:text-2xl font-bold text-green-400 break-words">{formatZar(Number(accommodation.price) || 0)}</span>
                      <span className="text-neutral-400 text-xs sm:text-sm break-words">/month</span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <label className="flex items-center gap-2 text-xs sm:text-sm text-neutral-300 min-w-0">
                          <input 
                            type="checkbox" 
                            checked={Boolean(accommodation.featured)} 
                            onChange={(e) => handleToggleFeatured(accommodation.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-black/20 border-white/20 rounded focus:ring-blue-500 flex-shrink-0"
                          />
                          <span className="break-words">Featured</span>
                        </label>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                        <span className="text-xs sm:text-sm text-neutral-300 break-words">Rooms:</span>
                        <input 
                          type="number" 
                          className="w-16 sm:w-20 px-2 sm:px-3 py-1.5 sm:py-2 bg-black/20 border border-white/20 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          defaultValue={accommodation.available_rooms ?? 0} 
                          onBlur={(e) => handleUpdateRooms(accommodation.id, Number(e.target.value) || 0, Number(accommodation.total_rooms) || 0)} 
                        />
                        <span className="text-neutral-400">/</span>
                        <input 
                          type="number" 
                          className="w-16 sm:w-20 px-2 sm:px-3 py-1.5 sm:py-2 bg-black/20 border border-white/20 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          defaultValue={accommodation.total_rooms ?? 0} 
                          onBlur={(e) => handleUpdateRooms(accommodation.id, Number(accommodation.available_rooms) || 0, Number(e.target.value) || 0)} 
                        />
                        <span className="text-xs sm:text-sm text-neutral-400 break-words">available</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handlePublishToggle(accommodation.id, accommodation.is_published)}
                        disabled={publishingId === accommodation.id}
                        className={`w-full px-3 py-2 rounded-lg transition-all duration-300 text-center flex items-center justify-center gap-2 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm ${
                          accommodation.is_published
                            ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg shadow-orange-500/20 disabled:hover:from-orange-600 disabled:hover:to-red-600'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/20 disabled:hover:from-green-600 disabled:hover:to-emerald-600'
                        }`}
                      >
                        {publishingId === accommodation.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                            <span className="break-words">{accommodation.is_published ? 'Unpublishing...' : 'Publishing...'}</span>
                          </>
                        ) : accommodation.is_published ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="break-words">Unpublish</span>
                          </>
                        ) : (
                          <>
                            <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="break-words">Publish</span>
                          </>
                        )}
                      </button>

                      <div className="flex flex-wrap gap-2">
                        {accommodation.is_published && (
                          <Link
                            href={`/listing/${accommodation.id}`}
                            className="flex-1 min-w-[80px] bg-white/10 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-white/20 transition-all duration-300 text-center flex items-center justify-center gap-2 border border-white/20 text-xs sm:text-sm"
                          >
                            <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="break-words">View</span>
                          </Link>
                        )}
                        <Link
                          href={`/agent/accommodations/edit/${accommodation.id}`}
                          className="flex-1 min-w-[80px] bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 sm:px-3 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-center flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 text-xs sm:text-sm"
                        >
                          <Edit className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="break-words">Edit</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(accommodation.id)}
                          className="flex-1 min-w-[80px] bg-gradient-to-r from-red-600 to-red-700 text-white px-2 sm:px-3 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 text-xs sm:text-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="break-words">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
