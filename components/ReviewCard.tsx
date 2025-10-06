"use client"

import { useState } from "react"
import { Star, ThumbsUp, ThumbsDown, Calendar, MessageCircle, Flag } from "lucide-react"
import ReplyCard from "./ReplyCard"

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
}

interface ReviewCardProps {
  review: Review
  onVote?: (reviewId: string, isHelpful: boolean) => void
  onReply?: (reviewId: string, comment: string) => Promise<void>
  onReplyVote?: (replyId: string, isHelpful: boolean) => void
  onReport?: (reviewId: string, reviewAuthor: string) => void
  onReplyReport?: (replyId: string, replyAuthor: string) => void
  userVote?: boolean | null
  replies?: Reply[]
  userReplyVotes?: Record<string, boolean | null>
}

export default function ReviewCard({ 
  review, 
  onVote, 
  onReply, 
  onReplyVote, 
  onReport, 
  onReplyReport, 
  userVote, 
  replies = [], 
  userReplyVotes = {} 
}: ReviewCardProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [showReplyButton, setShowReplyButton] = useState(false)
  const [localVotes, setLocalVotes] = useState({
    helpful: review.helpful_votes,
    total: review.total_votes
  })

  const handleVote = async (isHelpful: boolean) => {
    if (isVoting || !onVote) return

    setIsVoting(true)
    try {
      await onVote(review.id, isHelpful)
      
      // Optimistic update
      setLocalVotes(prev => ({
        helpful: isHelpful ? prev.helpful + 1 : prev.helpful,
        total: prev.total + 1
      }))
    } catch (error) {
      console.error('Vote failed:', error)
    } finally {
      setIsVoting(false)
    }
  }

  const handleReply = async () => {
    if (!replyText.trim() || !onReply) return

    setIsSubmittingReply(true)
    try {
      await onReply(review.id, replyText.trim())
      setReplyText("")
      setIsReplying(false)
    } catch (error) {
      console.error('Reply failed:', error)
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleReport = (reviewId: string, reviewAuthor: string) => {
    if (onReport) {
      onReport(reviewId, reviewAuthor)
    }
  }

  const handleReplyReport = (replyId: string, replyAuthor: string) => {
    if (onReplyReport) {
      onReplyReport(replyId, replyAuthor)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating 
            ? 'text-yellow-400 fill-yellow-400' 
            : 'text-gray-400'
        }`}
      />
    ))
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const helpfulPercentage = localVotes.total > 0 
    ? Math.round((localVotes.helpful / localVotes.total) * 100) 
    : 0

  return (
    <div 
      className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setShowReplyButton(true)}
      onMouseLeave={() => setShowReplyButton(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
            {getInitials(review.first_name, review.last_name)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {review.first_name} {review.last_name}
              </span>
              {review.is_verified && (
                <span className="px-2 py-1 text-xs font-medium rounded-full border border-green-500/50 bg-green-500/10 text-green-300">
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(review.created_at)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {renderStars(review.rating)}
          </div>
          
          {/* Report Button - Shows on hover */}
          {showReplyButton && onReport && (
            <button
              onClick={() => handleReport(review.id, `${review.first_name} ${review.last_name}`)}
              className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300"
              title="Report this review"
            >
              <Flag className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <div className="mb-4">
          <p className="text-neutral-300 leading-relaxed">{review.comment}</p>
        </div>
      )}

      {/* Helpfulness Section */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-400">
            Was this review helpful?
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVote(true)}
              disabled={isVoting}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                userVote === true
                  ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                  : 'bg-white/10 text-neutral-300 hover:bg-green-500/10 hover:text-green-300'
              } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ThumbsUp className="w-3 h-3" />
              Yes
            </button>
            <button
              onClick={() => handleVote(false)}
              disabled={isVoting}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                userVote === false
                  ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                  : 'bg-white/10 text-neutral-300 hover:bg-red-500/10 hover:text-red-300'
              } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ThumbsDown className="w-3 h-3" />
              No
            </button>
          </div>
        </div>
        
        {localVotes.total > 0 && (
          <div className="text-sm text-neutral-400">
            <span className="text-green-300 font-medium">{helpfulPercentage}%</span> found this helpful
            <span className="text-neutral-500 ml-1">
              ({localVotes.helpful} of {localVotes.total})
            </span>
          </div>
        )}
      </div>

      {/* Reply Section */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Reply
            </button>
            {replies.length > 0 && (
              <span className="text-sm text-neutral-500">
                {replies.length} repl{replies.length !== 1 ? 'ies' : 'y'}
              </span>
            )}
          </div>
        </div>

        {/* Reply Form */}
        {isReplying && (
          <div className="mb-4 p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-neutral-400">
                {replyText.length}/500 characters
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsReplying(false)
                    setReplyText("")
                  }}
                  className="px-3 py-1 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || isSubmittingReply}
                  className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isSubmittingReply ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Replies */}
        {replies.length > 0 && (
          <div className="space-y-3">
            {replies.map((reply) => (
              <ReplyCard
                key={reply.id}
                reply={reply}
                onVote={onReplyVote}
                onReport={handleReplyReport}
                userVote={userReplyVotes[reply.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
