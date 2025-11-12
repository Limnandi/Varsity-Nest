"use client"

import { useState } from "react"
import { Star, Send, User } from "lucide-react"

interface ReviewFormProps {
  accommodationId: string
  onSubmit: (rating: number, comment: string) => Promise<void>
  isSubmitting?: boolean
}

export default function ReviewForm({ onSubmit, isSubmitting = false }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return

    try {
      await onSubmit(rating, comment)
      setRating(0)
      setComment("")
      setIsExpanded(false)
    } catch (error) {
      console.error('Review submission failed:', error)
    }
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => setRating(i + 1)}
        onMouseEnter={() => setHoveredRating(i + 1)}
        onMouseLeave={() => setHoveredRating(0)}
        className="transition-colors duration-200"
      >
        <Star
          className={`w-4 h-4 ${
            i < (hoveredRating || rating)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-400 hover:text-yellow-300'
          }`}
        />
      </button>
    ))
  }

  const getRatingText = (rating: number) => {
    const texts = {
      1: "Poor",
      2: "Fair", 
      3: "Good",
      4: "Very Good",
      5: "Excellent"
    }
    return texts[rating as keyof typeof texts] || ""
  }

  if (!isExpanded) {
    return (
      <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl p-3 text-white shadow-lg h-full flex items-center">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-white/20 bg-black/20 backdrop-blur-xl text-white rounded-lg text-sm font-medium hover:bg-white/5 transition-all duration-300"
        >
          <User className="w-4 h-4" />
          Write Review
        </button>
      </div>
    )
  }

  return (
    <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl p-4 text-white shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Write a Review
        </h3>
        <button
          type="button"
          onClick={() => {
            setIsExpanded(false)
            setRating(0)
            setComment("")
          }}
          className="text-neutral-400 hover:text-white text-sm"
        >
          ✕
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Rating Section */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Rating *
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {renderStars()}
            </div>
            {rating > 0 && (
              <span className="text-xs text-neutral-400">
                {getRatingText(rating)}
              </span>
            )}
          </div>
        </div>

        {/* Comment Section */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Review
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            maxLength={1000}
          />
          <div className="text-xs text-neutral-400 mt-1">
            {comment.length}/1000
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={rating === 0 || isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-3.5 h-3.5" />
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  )
}



