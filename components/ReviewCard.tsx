"use client"

import { useState } from "react"
import { Star, ThumbsUp, ThumbsDown, Calendar, MessageCircle, Flag, MoreVertical, Trash2 } from "lucide-react"
import Image from "next/image"
import ReplyCard from "./ReplyCard"
import ConfirmDialog from "./ConfirmDialog"
import StudentDetailsModal from "./StudentDetailsModal"

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
  user_id?: string
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

interface ReviewCardProps {
  review: Review
  onVote?: (reviewId: string, isHelpful: boolean) => void
  onReply?: (reviewId: string, comment: string) => Promise<void>
  onReplyVote?: (replyId: string, isHelpful: boolean) => void
  onReport?: (reviewId: string, reviewAuthor: string) => void
  onReplyReport?: (replyId: string, replyAuthor: string) => void
  onDelete?: (reviewId: string) => Promise<void>
  userVote?: boolean | null
  replies?: Reply[]
  userReplyVotes?: Record<string, boolean | null>
  currentUserEmail?: string
  currentUserRole?: string
  isAuthenticated?: boolean
}

export default function ReviewCard({ 
  review, 
  onVote, 
  onReply, 
  onReplyVote, 
  onReport, 
  onReplyReport, 
  onDelete,
  userVote, 
  replies = [], 
  userReplyVotes = {},
  currentUserEmail,
  currentUserRole,
  isAuthenticated
}: ReviewCardProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [showReplyButton, setShowReplyButton] = useState(false)
  const [showDeleteMenu, setShowDeleteMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showStudentDetails, setShowStudentDetails] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [localVotes, setLocalVotes] = useState({
    helpful: review.helpful_votes || 0,
    notHelpful: (review.total_votes || 0) - (review.helpful_votes || 0), // Calculate initially from total
    total: review.total_votes || 0
  })

  const handleVote = async (isHelpful: boolean) => {
    if (isVoting || !onVote) return

    setIsVoting(true)
    try {
      await onVote(review.id, isHelpful)
      
      // Optimistic update - if clicking the same vote, it's being removed
      if (userVote === isHelpful) {
        // Removing vote
        setLocalVotes(prev => ({
          helpful: isHelpful ? Math.max(0, prev.helpful - 1) : prev.helpful,
          notHelpful: !isHelpful ? Math.max(0, prev.notHelpful - 1) : prev.notHelpful,
          total: Math.max(0, prev.total - 1)
        }))
      } else if (userVote === null || userVote === undefined) {
        // Adding new vote
        setLocalVotes(prev => ({
          helpful: isHelpful ? prev.helpful + 1 : prev.helpful,
          notHelpful: !isHelpful ? prev.notHelpful + 1 : prev.notHelpful,
          total: prev.total + 1
        }))
      } else {
        // Changing vote from one to another
        setLocalVotes(prev => ({
          helpful: isHelpful ? prev.helpful + 1 : Math.max(0, prev.helpful - 1),
          notHelpful: !isHelpful ? prev.notHelpful + 1 : Math.max(0, prev.notHelpful - 1),
          total: prev.total // total stays the same when changing vote
        }))
      }
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

  const handleDeleteClick = () => {
    setShowDeleteMenu(false)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!onDelete || isDeleting) return

    setIsDeleting(true)
    try {
      await onDelete(review.id)
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Delete failed:', error)
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const isReviewAuthor = currentUserEmail && review.email === currentUserEmail

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

  const helpfulPercentage = (localVotes.total || 0) > 0 
    ? Math.round(((localVotes.helpful || 0) / (localVotes.total || 1)) * 100) 
    : 0

  return (
    <div 
      className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setShowReplyButton(true)}
      onMouseLeave={() => setShowReplyButton(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setShowStudentDetails(true)}
        >
          {review.profile_image_url ? (
            <Image
              src={review.profile_image_url}
              alt={`${review.first_name} ${review.last_name}`}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/20 group-hover:border-blue-500/50 transition-all"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold group-hover:ring-2 group-hover:ring-blue-500/50 transition-all">
              {getInitials(review.first_name, review.last_name)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                {review.first_name}{review.university ? `, ${review.university}` : ''}
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
          
          {/* Three-dot menu for review author OR Report button for others */}
          {showReplyButton && (
            <>
              {isReviewAuthor && onDelete ? (
                <div className="relative">
                  <button
                    onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                    className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                    title="More options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {/* Delete dropdown menu */}
                  {showDeleteMenu && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl z-10">
                      <button
                        onClick={handleDeleteClick}
                        className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Review</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                onReport && (
                  <button
                    onClick={() => handleReport(review.id, `${review.first_name} ${review.last_name}`)}
                    className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300"
                    title="Report this review"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                )
              )}
            </>
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
           Facts?
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVote(true)}
              disabled={isVoting}
              className={`group flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                userVote === true
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50 shadow-lg shadow-green-500/20'
                  : 'bg-white/5 text-neutral-400 border border-white/10 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/30 hover:text-green-400'
              } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ThumbsUp className={`w-5 h-5 transition-all duration-300 ${
                userVote === true 
                  ? 'drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]' 
                  : 'group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]'
              }`} />
              <span className="text-xs font-bold">{localVotes.helpful || 0}</span>
            </button>
            <button
              onClick={() => handleVote(false)}
              disabled={isVoting}
              className={`group flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                userVote === false
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-lg shadow-red-500/20'
                  : 'bg-white/5 text-neutral-400 border border-white/10 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/30 hover:text-red-400'
              } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ThumbsDown className={`w-5 h-5 transition-all duration-300 ${
                userVote === false 
                  ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' 
                  : 'group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]'
              }`} />
              <span className="text-xs font-bold">{localVotes.notHelpful || 0}</span>
            </button>
          </div>
        </div>
        
        {(localVotes.total || 0) > 0 && (
          <div className="text-sm text-neutral-400">
            <span className="text-green-300 font-medium">{helpfulPercentage}%</span> found this helpful
          </div>
        )}
      </div>

      {/* Reply Section */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            {/* Only show reply button for authenticated students */}
            {isAuthenticated && currentUserRole === 'student' && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Reply
              </button>
            )}
            {replies.length > 0 && (
              <button
                type="button"
                onClick={() => setShowReplies(!showReplies)}
                className="text-sm text-neutral-400 hover:text-white transition-colors underline underline-offset-4"
                aria-expanded={showReplies}
                aria-controls={`replies-${review.id}`}
              >
                {showReplies ? 'Hide replies' : `View replies (${replies.length})`}
              </button>
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
        {replies.length > 0 && showReplies && (
          <div id={`replies-${review.id}`} className="space-y-3">
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone and will permanently remove your review from the accommodation listing."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        variant="danger"
      />

      {/* Student Details Modal */}
      <StudentDetailsModal
        isOpen={showStudentDetails}
        onClose={() => setShowStudentDetails(false)}
        studentName={`${review.first_name} ${review.last_name}`}
        studentEmail={review.email}
        profileImageUrl={review.profile_image_url}
        createdAt={review.created_at}
      />
    </div>
  )
}
