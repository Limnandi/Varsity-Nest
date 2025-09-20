"use client"

import { useState, useEffect } from "react"
import { X, Star, ThumbsUp, MessageCircle, MoreHorizontal, ReplyIcon, Send } from "lucide-react"
import { StudentAuthService } from "@/lib/student-auth"
import StudentAuthModal from "./StudentAuthModal"
import ReportModal from "./ReportModal"

interface Review {
  id: number
  author: string
  university: "UFS" | "CUT"
  rating: number
  comment: string
  date: string
  likes: number
  likedBy: string[]
  replies: any[]
}

interface ReviewsModalProps {
  isOpen: boolean
  onClose: () => void
  accommodationName: string
  reviews: Review[]
  onAddReview: (review: Omit<Review, "id" | "likes" | "likedBy" | "replies">) => void
  onUpdateReviews: (reviews: Review[]) => void
}

export default function ReviewsModal({
  isOpen,
  onClose,
  accommodationName,
  reviews,
  onAddReview,
  onUpdateReviews,
}: ReviewsModalProps) {
  const [currentStudent, setCurrentStudent] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportingReviewId, setReportingReviewId] = useState<number | null>(null)
  const [reportingReviewAuthor, setReportingReviewAuthor] = useState("")
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" })
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState("")
  const [hoveredReview, setHoveredReview] = useState<number | null>(null)
  const [hoveredReply, setHoveredReply] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen) {
      const student = StudentAuthService.getCurrentStudent()
      setCurrentStudent(student)
    }
  }, [isOpen])

  const handleLike = (reviewId: number, isReply = false, replyId?: number) => {
    if (!currentStudent) {
      setShowAuthModal(true)
      return
    }

    const updatedReviews = reviews.map((review) => {
      if (review.id === reviewId) {
        if (isReply && replyId) {
          // Like a reply
          const updatedReplies = review.replies.map((reply) => {
            if (reply.id === replyId) {
              const hasLiked = reply.likedBy.includes(currentStudent.id)
              return {
                ...reply,
                likes: hasLiked ? reply.likes - 1 : reply.likes + 1,
                likedBy: hasLiked
                  ? reply.likedBy.filter((id: string) => id !== currentStudent.id)
                  : [...reply.likedBy, currentStudent.id],
              }
            }
            return reply
          })
          return { ...review, replies: updatedReplies }
        } else {
          // Like a review
          const hasLiked = review.likedBy.includes(currentStudent.id)
          return {
            ...review,
            likes: hasLiked ? review.likes - 1 : review.likes + 1,
            likedBy: hasLiked
              ? review.likedBy.filter((id) => id !== currentStudent.id)
              : [...review.likedBy, currentStudent.id],
          }
        }
      }
      return review
    })

    onUpdateReviews(updatedReviews)
  }

  const handleAddReview = () => {
    if (!currentStudent) {
      setShowAuthModal(true)
      return
    }

    if (newReview.comment.trim()) {
      onAddReview({
        author: currentStudent.name,
        university: currentStudent.university,
        rating: newReview.rating,
        comment: newReview.comment.trim(),
        date: new Date().toLocaleDateString(),
      })
      setNewReview({ rating: 5, comment: "" })
    }
  }

  const handleAddReply = (reviewId: number) => {
    if (!currentStudent) {
      setShowAuthModal(true)
      return
    }

    if (replyText.trim()) {
      const updatedReviews = reviews.map((review) => {
        if (review.id === reviewId) {
          const newReply = {
            id: Date.now(),
            author: currentStudent.name,
            university: currentStudent.university,
            comment: replyText.trim(),
            date: new Date().toLocaleDateString(),
            likes: 0,
            likedBy: [],
          }
          return {
            ...review,
            replies: [...review.replies, newReply],
          }
        }
        return review
      })

      onUpdateReviews(updatedReviews)
      setReplyText("")
      setReplyingTo(null)
    }
  }

  const handleReport = (reviewId: number, reviewAuthor: string) => {
    if (!currentStudent) {
      setShowAuthModal(true)
      return
    }

    setReportingReviewId(reviewId)
    setReportingReviewAuthor(reviewAuthor)
    setShowReportModal(true)
  }

  const handleAuthSuccess = (student: any) => {
    setCurrentStudent(student)
    setShowAuthModal(false)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold">Reviews for {accommodationName}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)]">
            {/* Reviews List */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-gray-200 pb-6 last:border-b-0"
                    onMouseEnter={() => setHoveredReview(review.id)}
                    onMouseLeave={() => setHoveredReview(null)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-900">{review.author}</span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {review.university}
                          </span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">{review.date}</span>
                        </div>
                        <p className="text-gray-700 mb-3">{review.comment}</p>
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleLike(review.id)}
                            className={`flex items-center space-x-1 text-sm transition-colors ${
                              currentStudent && review.likedBy.includes(currentStudent.id)
                                ? "text-blue-600"
                                : "text-gray-500 hover:text-blue-600"
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span>{review.likes}</span>
                          </button>
                          <button
                            onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Reply</span>
                          </button>
                        </div>
                      </div>

                      {/* Report Button - Shows on hover */}
                      {hoveredReview === review.id && (
                        <button
                          onClick={() => handleReport(review.id, review.author)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Report this review"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Reply Form */}
                    {replyingTo === review.id && (
                      <div className="mt-4 ml-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex space-x-3">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={2}
                          />
                          <button
                            onClick={() => handleAddReply(review.id)}
                            disabled={!replyText.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {review.replies.length > 0 && (
                      <div className="mt-4 ml-6 space-y-4">
                        {review.replies.map((reply) => (
                          <div
                            key={reply.id}
                            className="p-4 bg-gray-50 rounded-lg"
                            onMouseEnter={() => setHoveredReply(reply.id)}
                            onMouseLeave={() => setHoveredReply(null)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <ReplyIcon className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-gray-900">{reply.author}</span>
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    {reply.university}
                                  </span>
                                  <span className="text-sm text-gray-500">{reply.date}</span>
                                </div>
                                <p className="text-gray-700 mb-2">{reply.comment}</p>
                                <button
                                  onClick={() => handleLike(review.id, true, reply.id)}
                                  className={`flex items-center space-x-1 text-sm transition-colors ${
                                    currentStudent && reply.likedBy.includes(currentStudent.id)
                                      ? "text-blue-600"
                                      : "text-gray-500 hover:text-blue-600"
                                  }`}
                                >
                                  <ThumbsUp className="w-4 h-4" />
                                  <span>{reply.likes}</span>
                                </button>
                              </div>

                              {/* Report Button for Reply - Shows on hover */}
                              {hoveredReply === reply.id && (
                                <button
                                  onClick={() => handleReport(reply.id, reply.author)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                  title="Report this reply"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {reviews.length === 0 && (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                    <p className="text-gray-500">Be the first to share your experience!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Add Review Form */}
            <div className="lg:w-96 border-l border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Add Your Review</h3>

              {currentStudent ? (
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Signed in as:</strong> {currentStudent.name}
                    </p>
                    <p className="text-xs text-green-600">{currentStudent.university} Student</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= newReview.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Share your experience with this accommodation..."
                    />
                  </div>

                  <button
                    onClick={handleAddReview}
                    disabled={!newReview.comment.trim()}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Review
                  </button>

                  <button
                    onClick={() => {
                      StudentAuthService.logoutStudent()
                      setCurrentStudent(null)
                    }}
                    className="w-full text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Student Verification Required</h4>
                  <p className="text-gray-600 mb-4">Only verified students can write reviews to ensure authenticity.</p>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sign In / Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Student Auth Modal */}
      <StudentAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false)
          setReportingReviewId(null)
          setReportingReviewAuthor("")
        }}
        reviewId={reportingReviewId!}
        reviewAuthor={reportingReviewAuthor}
        reporterType="student"
        reporterName={currentStudent?.name || ""}
        reporterId={currentStudent?.id || ""}
      />
    </>
  )
}
