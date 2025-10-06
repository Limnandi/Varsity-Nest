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
          className={`w-6 h-6 ${
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
      <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-lg">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-white/20 bg-black/20 backdrop-blur-xl text-white rounded-xl font-medium hover:bg-white/5 transition-all duration-300 hover:scale-[1.02]"
        >
          <User className="w-4 h-4" />
          Write a Review
        </button>
      </div>
    )
  }

  return (
    <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-lg">
      <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        Write a Review
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating Section */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Your Rating *
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {renderStars()}
            </div>
            {rating > 0 && (
              <span className="text-sm text-neutral-400 ml-2">
                {getRatingText(rating)}
              </span>
            )}
          </div>
        </div>

        {/* Comment Section */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Your Review
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this accommodation..."
            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            maxLength={1000}
          />
          <div className="text-xs text-neutral-400 mt-1">
            {comment.length}/1000 characters
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={rating === 0 || isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
          
          <button
            type="button"
            onClick={() => {
              setIsExpanded(false)
              setRating(0)
              setComment("")
            }}
            className="px-6 py-3 border border-white/20 bg-black/20 backdrop-blur-xl text-white rounded-xl font-medium hover:bg-white/5 transition-all duration-300 hover:scale-[1.02]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

