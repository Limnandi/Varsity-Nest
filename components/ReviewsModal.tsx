"use client"

import { X, MessageSquare, Filter, ArrowUpDown } from "lucide-react"
import Image from "next/image"
import { useRef, useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import ReviewCard from "./ReviewCard"
import { useModalA11y } from "@/hooks/useModalA11y"

interface Review {
  id: string
  rating: number
  comment: string
  is_verified: boolean
  helpful_votes: number
  total_votes: number
  created_at: string
  first_name: string
  last_name: string
  email: string
  profile_image_url?: string
  university?: string
}

interface ReviewsModalProps {
  isOpen: boolean
  onClose: () => void
  accommodationName: string
  accommodationImage: string
  reviews: Review[]
  averageRating: number
  totalReviews: number
  accommodationId: string
  currentUserEmail?: string
  currentUserRole?: string
  isAuthenticated?: boolean
  onVote?: (reviewId: string, isHelpful: boolean) => void
  onReply?: (reviewId: string, comment: string) => Promise<void>
  onReplyVote?: (replyId: string, isHelpful: boolean) => void
  onReport?: (reviewId: string, reviewAuthor: string) => void
  onReplyReport?: (replyId: string, replyAuthor: string) => void
  onDelete?: (reviewId: string) => Promise<void>
  onLoadReplies?: (reviewId: string) => Promise<void>
  userVotes?: Record<string, boolean | null>
  replies?: Record<string, any[]>
  userReplyVotes?: Record<string, boolean | null>
}

export default function ReviewsModal({
  isOpen,
  onClose,
  accommodationName,
  accommodationImage,
  reviews,
  averageRating: _averageRating,
  totalReviews: _totalReviews,
  accommodationId: _accommodationId,
  currentUserEmail,
  currentUserRole,
  isAuthenticated,
  onVote,
  onReply,
  onReplyVote,
  onReport,
  onReplyReport,
  onDelete,
  onLoadReplies,
  userVotes = {},
  replies = {},
  userReplyVotes = {}
}: ReviewsModalProps) {
  const [mounted, setMounted] = useState(false)
  const [orderFilter, setOrderFilter] = useState<'most-relevant' | 'newest' | 'oldest'>('most-relevant')
  const [starFilter, setStarFilter] = useState<number | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Prevent body scroll when modal is open and reset filters when closing
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      // Reset filters when modal closes
      setOrderFilter('most-relevant')
      setStarFilter(null)
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Filter and sort reviews (must be called before early return to follow Rules of Hooks)
  const filteredAndSortedReviews = useMemo(() => {
    if (!isOpen) return []
    let filtered = [...reviews]

    // Apply star rating filter
    if (starFilter !== null) {
      filtered = filtered.filter(review => Math.round(review.rating) === starFilter)
    }

    // Apply order filter
    switch (orderFilter) {
      case 'most-relevant':
        // Sort by reaction counts (helpful_votes) descending
        filtered.sort((a, b) => (b.helpful_votes || 0) - (a.helpful_votes || 0))
        break
      case 'newest':
        // Sort by created_at descending (newest first)
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        // Sort by created_at ascending (oldest first)
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
    }

    return filtered
  }, [reviews, orderFilter, starFilter, isOpen])

  useModalA11y({ isOpen, containerRef: dialogRef, onClose })

  if (!isOpen) return null

  return (
    <>
      {mounted && createPortal(
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto"
          onClick={onClose}
          aria-hidden={!isOpen}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="All reviews"
            ref={dialogRef}
            tabIndex={-1}
            className="relative border border-white/10 bg-black/40 backdrop-blur-xl rounded-2xl text-white shadow-[0_10px_40px_rgba(59,130,246,0.25)] max-w-4xl w-full mx-4 my-8 transform transition-all duration-300 animate-in slide-in-from-bottom-4 sm:animate-in zoom-in-95 max-h-[90vh] flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close reviews modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-start gap-4 mb-4">
                {/* Property Image */}
                <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 border-white/20">
                  <Image
                    src={accommodationImage || "/placeholder.svg"}
                    alt={accommodationName}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                
                {/* Property Name */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent break-words">
                    {accommodationName}
                  </h2>
                </div>
              </div>
              
              {/* Ratings and Reviews Title */}
              <div className="mt-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  <span>Ratings and Reviews</span>
                </h3>
              </div>
            </div>

            {/* Filters */}
            <div className="px-6 py-4 border-b border-white/10 bg-black/20">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Order Filter */}
                <div className="flex-1">
                  <label className="block text-xs text-neutral-400 mb-2 flex items-center gap-2">
                    <ArrowUpDown className="w-3 h-3" />
                    Order
                  </label>
                  <select
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value as 'most-relevant' | 'newest' | 'oldest')}
                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="most-relevant" className="bg-gray-800 text-white">Most Relevant</option>
                    <option value="newest" className="bg-gray-800 text-white">Newest</option>
                    <option value="oldest" className="bg-gray-800 text-white">Oldest</option>
                  </select>
                </div>

                {/* Star Rating Filter */}
                <div className="flex-1">
                  <label className="block text-xs text-neutral-400 mb-2 flex items-center gap-2">
                    <Filter className="w-3 h-3" />
                    Star Rating
                  </label>
                  <select
                    value={starFilter === null ? 'all' : starFilter}
                    onChange={(e) => setStarFilter(e.target.value === 'all' ? null : parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all" className="bg-gray-800 text-white">All Ratings</option>
                    <option value="5" className="bg-gray-800 text-white">5 Stars</option>
                    <option value="4" className="bg-gray-800 text-white">4 Stars</option>
                    <option value="3" className="bg-gray-800 text-white">3 Stars</option>
                    <option value="2" className="bg-gray-800 text-white">2 Stars</option>
                    <option value="1" className="bg-gray-800 text-white">1 Star</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reviews List - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {filteredAndSortedReviews.length > 0 ? (
                <div className="space-y-4">
                  {filteredAndSortedReviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      onVote={onVote}
                      onReply={onReply}
                      onLoadReplies={onLoadReplies}
                      onReplyVote={onReplyVote}
                      onReport={onReport}
                      onReplyReport={onReplyReport}
                      onDelete={onDelete}
                      userVote={userVotes[review.id]}
                      replies={replies[review.id] || []}
                      userReplyVotes={userReplyVotes}
                      currentUserEmail={currentUserEmail}
                      currentUserRole={currentUserRole}
                      isAuthenticated={isAuthenticated}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-400">
                    {starFilter !== null 
                      ? `No ${starFilter}-star reviews found` 
                      : 'No reviews yet'}
                  </p>
                  <p className="text-sm text-neutral-500 mt-2">
                    {starFilter !== null 
                      ? 'Try selecting a different rating filter' 
                      : 'Be the first to share your experience!'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
