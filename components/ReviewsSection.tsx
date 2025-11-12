"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import ReviewCard from "./ReviewCard"
import ReviewForm from "./ReviewForm"
import ReportModal from "./ReportModal"
import ReviewsModal from "./ReviewsModal"
import { Star, MessageSquare, ChevronRight } from "lucide-react"
import { toast } from "sonner"

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

interface Reply {
  id: string
  comment: string
  helpful_votes: number
  total_votes: number
  created_at: string
  first_name: string
  last_name: string
  email: string
  profile_image_url?: string
}

interface ReviewsData {
  reviews: Review[]
  averageRating: number
  totalReviews: number
}

interface ReviewsSectionProps {
  accommodationId: string
  accommodationName?: string
  accommodationImage?: string
  currentUserEmail?: string
  currentUserRole?: string
  isAuthenticated?: boolean
}

export default function ReviewsSection({ accommodationId, accommodationName, accommodationImage, currentUserEmail, currentUserRole, isAuthenticated }: ReviewsSectionProps) {
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userVotes, setUserVotes] = useState<Record<string, boolean | null>>({})
  const [userReplyVotes, setUserReplyVotes] = useState<Record<string, boolean | null>>({})
  const [replies, setReplies] = useState<Record<string, Reply[]>>({})
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportingItem, setReportingItem] = useState<{id: string, author: string, type: 'review' | 'reply'} | null>(null)
  const [showReviewsModal, setShowReviewsModal] = useState(false)

  const loadReviews = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/accommodations/${accommodationId}/reviews`)
      
      if (response.ok) {
        const data = await response.json()
        setReviewsData(data)
        
        // Load user votes for each review
        const votes: Record<string, boolean | null> = {}
        for (const review of data.reviews) {
          try {
            const voteResponse = await fetch(`/api/reviews/${review.id}/helpful`)
            if (voteResponse.ok) {
              const voteData = await voteResponse.json()
              votes[review.id] = voteData.userVote
            }
          } catch (error) {
            console.error('Failed to load vote for review:', review.id, error)
          }
        }
        setUserVotes(votes)

        // Load replies for each review
        const repliesData: Record<string, Reply[]> = {}
        for (const review of data.reviews) {
          try {
            const repliesResponse = await fetch(`/api/reviews/${review.id}/replies`)
            if (repliesResponse.ok) {
              const repliesData_result = await repliesResponse.json()
              repliesData[review.id] = repliesData_result.replies || []
            }
          } catch (error) {
            console.error('Failed to load replies for review:', review.id, error)
            repliesData[review.id] = []
          }
        }
        setReplies(repliesData)
      }
    } catch (error) {
      console.error('Failed to load reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }, [accommodationId])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  const handleReviewSubmit = async (rating: number, comment: string) => {
    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/accommodations/${accommodationId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, comment }),
      })

      if (response.ok) {
        await response.json()
        toast.success("Review submitted successfully!", {
          description: "Your review has been added and is now visible.",
        })
        
        // Reload reviews to get the updated list with the new review
        await loadReviews()
        
        // Scroll to reviews section after a brief delay to ensure DOM is updated
        setTimeout(() => {
          const reviewsSection = document.querySelector('[role="listbox"]')
          if (reviewsSection) {
            reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Failed to submit review'
        toast.error("Failed to submit review", {
          description: errorMessage,
        })
        throw new Error(errorMessage)
      }
    } catch (error: any) {
      console.error('Review submission failed:', error)
      if (!error.message || !error.message.includes('Failed to submit review')) {
        toast.error("An error occurred", {
          description: error.message || "Please try again later.",
        })
      }
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVote = async (reviewId: string, isHelpful: boolean) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isHelpful }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // If clicking the same vote, it's being removed (set to null)
        const currentVote = userVotes[reviewId]
        const newVote = currentVote === isHelpful ? null : isHelpful
        
        setUserVotes(prev => ({
          ...prev,
          [reviewId]: newVote
        }))
        
        // Update the review in the list with new counts from API
        setReviewsData(prev => {
          if (!prev) return null
          return {
            ...prev,
            reviews: prev.reviews.map(review => 
              review.id === reviewId 
                ? { ...review, helpful_votes: data.helpfulVotes, total_votes: data.totalVotes }
                : review
            )
          }
        })
      }
    } catch (error) {
      console.error('Vote failed:', error)
      throw error
    }
  }

  const handleReply = async (reviewId: string, comment: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      })

      if (response.ok) {
        // Reload replies for this review
        const repliesResponse = await fetch(`/api/reviews/${reviewId}/replies`)
        if (repliesResponse.ok) {
          const repliesData = await repliesResponse.json()
          setReplies(prev => ({
            ...prev,
            [reviewId]: repliesData.replies || []
          }))
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit reply')
      }
    } catch (error) {
      console.error('Reply failed:', error)
      throw error
    }
  }

  const handleReplyVote = async (replyId: string, isHelpful: boolean) => {
    try {
      const response = await fetch(`/api/replies/${replyId}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isHelpful }),
      })

      if (response.ok) {
        setUserReplyVotes(prev => ({
          ...prev,
          [replyId]: isHelpful
        }))
      }
    } catch (error) {
      console.error('Reply vote failed:', error)
      throw error
    }
  }

  const handleReport = (itemId: string, itemAuthor: string, type: 'review' | 'reply') => {
    setReportingItem({ id: itemId, author: itemAuthor, type })
    setShowReportModal(true)
  }

  const handleReportSubmit = async (reason: string, description: string) => {
    if (!reportingItem) return

    try {
      const endpoint = reportingItem.type === 'review' 
        ? `/api/reviews/${reportingItem.id}/report`
        : `/api/replies/${reportingItem.id}/report`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason, description }),
      })

      if (response.ok) {
        setShowReportModal(false)
        setReportingItem(null)
        // You could show a success message here
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit report')
      }
    } catch (error) {
      console.error('Report failed:', error)
      throw error
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove the review from the local state
        setReviewsData(prev => {
          if (!prev) return null
          return {
            ...prev,
            reviews: prev.reviews.filter(review => review.id !== reviewId),
            totalReviews: prev.totalReviews - 1
          }
        })
        // Reload reviews to get updated average rating
        await loadReviews()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete review')
      }
    } catch (error) {
      console.error('Delete review failed:', error)
      throw error
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4', 
      lg: 'w-6 h-6'
    }
    
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${sizeClasses[size]} ${
          i < rating 
            ? 'text-yellow-400 fill-yellow-400' 
            : 'text-gray-400'
        }`}
      />
    ))
  }

  // Calculate rating distribution (must be before early returns)
  const ratingDistribution = useMemo(() => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    if (reviewsData?.reviews) {
      reviewsData.reviews.forEach(review => {
        const rating = Math.round(review.rating) as keyof typeof distribution
        if (rating >= 1 && rating <= 5) {
          distribution[rating]++
        }
      })
    }
    return distribution
  }, [reviewsData])

  const getRatingPercentage = (rating: number) => {
    if (!reviewsData || reviewsData.totalReviews === 0) return 0
    return (ratingDistribution[rating as keyof typeof ratingDistribution] / reviewsData.totalReviews) * 100
  }

  // Check if current user has already left a review
  const hasUserReviewed = useMemo(() => {
    if (!reviewsData || !currentUserEmail || !isAuthenticated) return false
    return reviewsData.reviews.some(review => review.email === currentUserEmail)
  }, [reviewsData, currentUserEmail, isAuthenticated])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="h-20 bg-gray-300/10 dark:bg-gray-700/10 rounded-xl"></div>
            <div className="sm:col-span-2 h-20 bg-gray-300/10 dark:bg-gray-700/10 rounded-xl"></div>
          </div>
          <div className="space-y-3 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200/10 dark:bg-gray-700/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!reviewsData) {
    return (
      <div className="text-center py-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
        <MessageSquare className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
        <p className="text-sm text-neutral-400">Failed to load reviews</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Rating Summary with Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Average Rating & Distribution Chart */}
        <div className="lg:col-span-2 relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average Rating (Left) */}
            <div className="flex flex-col justify-center">
              <div className="text-5xl font-bold text-white mb-3">
              {reviewsData.averageRating.toFixed(1)}
            </div>
              <div className="flex items-center gap-1 mb-3">
                {renderStars(Math.round(reviewsData.averageRating), 'lg')}
            </div>
              <div className="text-base text-neutral-400">
                {reviewsData.totalReviews.toLocaleString()} review{reviewsData.totalReviews !== 1 ? 's' : ''}
          </div>
        </div>
        
            {/* Rating Distribution Chart (Right) */}
            <div className="flex flex-col justify-center gap-2.5">
              {[5, 4, 3, 2, 1].map((rating) => {
                const percentage = getRatingPercentage(rating)
                const count = ratingDistribution[rating as keyof typeof ratingDistribution]
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm text-neutral-300 w-5 text-right font-medium">{rating}</span>
                    <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-700 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-neutral-400 w-10 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
        </div>
      </div>

        {/* Review Form - Compact */}
        <div>
      {!isAuthenticated ? (
            <div className="border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl p-4 h-full flex items-center justify-center">
          <a
            href="/auth/login"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20"
          >
                <MessageSquare className="w-4 h-4" />
                Sign In to Review
          </a>
        </div>
          ) : currentUserRole === 'student' && !hasUserReviewed ? (
        <ReviewForm
          accommodationId={accommodationId}
          onSubmit={handleReviewSubmit}
          isSubmitting={isSubmitting}
        />
          ) : currentUserRole === 'student' && hasUserReviewed ? (
            <div className="border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl p-4 h-full flex items-center justify-center">
              <p className="text-sm text-neutral-400">You have already reviewed this accommodation</p>
            </div>
          ) : (
            <div className="border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl p-4 h-full flex items-center justify-center">
              <p className="text-sm text-neutral-400">Only verified students can leave reviews</p>
        </div>
      )}
        </div>
      </div>

      {/* Reviews List (more compact) - Show only first 2 */}
      {reviewsData.reviews.length > 0 ? (
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl overflow-hidden">
          <div
            className="max-h-[24rem] overflow-y-auto overscroll-contain p-3 flex flex-col gap-3"
            role="listbox"
            aria-label="Accommodation reviews"
          >
            {reviewsData.reviews.slice(0, 2).map((review) => (
              <div key={review.id} role="option" aria-selected="false">
                <ReviewCard
                  review={review}
                  onVote={handleVote}
                  onReply={handleReply}
                  onReplyVote={handleReplyVote}
                  onReport={(reviewId, reviewAuthor) => handleReport(reviewId, reviewAuthor, 'review')}
                  onReplyReport={(replyId, replyAuthor) => handleReport(replyId, replyAuthor, 'reply')}
                  onDelete={handleDeleteReview}
                  userVote={userVotes[review.id]}
                  replies={replies[review.id] || []}
                  userReplyVotes={userReplyVotes}
                  currentUserEmail={currentUserEmail}
                  currentUserRole={currentUserRole}
                  isAuthenticated={isAuthenticated}
                />
              </div>
            ))}
          </div>
          
          {/* View More Link - Show if more than 2 reviews */}
          {reviewsData.reviews.length > 2 && (
            <div className="border-t border-white/10 p-3 bg-black/10">
              <button
                onClick={() => setShowReviewsModal(true)}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>View More Reviews</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
          <MessageSquare className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <p className="text-sm text-neutral-400">No reviews yet</p>
          <p className="text-xs text-neutral-500 mt-1">Be the first to share your experience!</p>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && reportingItem && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false)
            setReportingItem(null)
          }}
          onSubmit={handleReportSubmit}
          itemType={reportingItem.type}
          itemAuthor={reportingItem.author}
        />
      )}

      {/* Reviews Modal */}
      {reviewsData && (
        <ReviewsModal
          isOpen={showReviewsModal}
          onClose={() => setShowReviewsModal(false)}
          accommodationName={accommodationName || "Accommodation"}
          accommodationImage={accommodationImage || "/placeholder.jpg"}
          reviews={reviewsData.reviews}
          averageRating={reviewsData.averageRating}
          totalReviews={reviewsData.totalReviews}
          accommodationId={accommodationId}
          currentUserEmail={currentUserEmail}
          currentUserRole={currentUserRole}
          isAuthenticated={isAuthenticated}
          onVote={handleVote}
          onReply={handleReply}
          onReplyVote={handleReplyVote}
          onReport={(reviewId, reviewAuthor) => handleReport(reviewId, reviewAuthor, 'review')}
          onReplyReport={(replyId, replyAuthor) => handleReport(replyId, replyAuthor, 'reply')}
          onDelete={handleDeleteReview}
          userVotes={userVotes}
          replies={replies}
          userReplyVotes={userReplyVotes}
        />
      )}
    </div>
  )
}
