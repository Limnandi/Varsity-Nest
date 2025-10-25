"use client"

import { useState, useEffect, useCallback } from "react"
import ReviewCard from "./ReviewCard"
import ReviewForm from "./ReviewForm"
import ReportModal from "./ReportModal"
import { Star, TrendingUp, MessageSquare } from "lucide-react"

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
  currentUserEmail?: string
  currentUserRole?: string
  isAuthenticated?: boolean
}

export default function ReviewsSection({ accommodationId, currentUserEmail, currentUserRole, isAuthenticated }: ReviewsSectionProps) {
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userVotes, setUserVotes] = useState<Record<string, boolean | null>>({})
  const [userReplyVotes, setUserReplyVotes] = useState<Record<string, boolean | null>>({})
  const [replies, setReplies] = useState<Record<string, Reply[]>>({})
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportingItem, setReportingItem] = useState<{id: string, author: string, type: 'review' | 'reply'} | null>(null)

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
        await loadReviews() // Reload reviews
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Review submission failed:', error)
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!reviewsData) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
        <p className="text-neutral-400">Failed to load reviews</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="flex items-center justify-between p-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-1">
              {reviewsData.averageRating.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 mb-2">
              {renderStars(Math.round(reviewsData.averageRating), 'md')}
            </div>
            <div className="text-sm text-neutral-400">
              {reviewsData.totalReviews} review{reviewsData.totalReviews !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-neutral-300">
          <TrendingUp className="w-4 h-4" />
          <span>Based on student feedback</span>
        </div>
      </div>

      {/* Review Form - Only for students */}
      {!isAuthenticated ? (
        <div className="border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-center">
          <MessageSquare className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Want to leave a review?</h3>
          <p className="text-neutral-400 mb-6">Sign in as a student to share your experience</p>
          <a
            href="/auth/signin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20"
          >
            Sign In as Student
          </a>
        </div>
      ) : currentUserRole === 'student' ? (
        <ReviewForm
          accommodationId={accommodationId}
          onSubmit={handleReviewSubmit}
          isSubmitting={isSubmitting}
        />
      ) : (
        <div className="border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-center">
          <MessageSquare className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Students Only</h3>
          <p className="text-neutral-400">Only verified students can leave reviews for accommodations</p>
        </div>
      )}

      {/* Reviews List */}
      {reviewsData.reviews.length > 0 ? (
        <div className="space-y-4">
          {reviewsData.reviews.map((review) => (
            <ReviewCard
              key={review.id}
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
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-400">No reviews yet</p>
          <p className="text-sm text-neutral-500 mt-2">Be the first to share your experience!</p>
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
    </div>
  )
}
