"use client"

import { useState } from "react"
import { ThumbsUp, ThumbsDown, Flag } from "lucide-react"
import Image from "next/image"
import StudentDetailsModal from "./StudentDetailsModal"

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
  university?: string
  show_email?: boolean
}

interface ReplyCardProps {
  reply: Reply
  onVote?: (replyId: string, isHelpful: boolean) => void
  onReport?: (replyId: string, replyAuthor: string) => void
  userVote?: boolean | null
}

export default function ReplyCard({ reply, onVote, onReport, userVote }: ReplyCardProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [showReportButton, setShowReportButton] = useState(false)
  const [localVotes, setLocalVotes] = useState({
    helpful: reply.helpful_votes,
    total: reply.total_votes
  })
  const [showStudentDetails, setShowStudentDetails] = useState(false)

  const handleVote = async (isHelpful: boolean) => {
    if (isVoting || !onVote) return

    setIsVoting(true)
    try {
      await onVote(reply.id, isHelpful)
      
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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const helpfulPercentage = localVotes.total > 0 
    ? Math.round((localVotes.helpful / localVotes.total) * 100) 
    : 0

  return (
    <>
    <div 
      className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl p-4 ml-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setShowReportButton(true)}
      onMouseLeave={() => setShowReportButton(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowStudentDetails(true)}>
          {reply.profile_image_url ? (
            <Image
              src={reply.profile_image_url}
              alt={`${reply.first_name} ${reply.last_name}`}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover border-2 border-white/20 group-hover:border-blue-500/50 transition-all"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm group-hover:ring-2 group-hover:ring-blue-500/50 transition-all">
              {getInitials(reply.first_name, reply.last_name)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white text-sm group-hover:text-blue-400 transition-colors">
                {reply.first_name}{reply.university ? `, ${reply.university}` : ''}
              </span>
              <span className="text-xs text-neutral-400">
                {formatDate(reply.created_at)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Report Button - Shows on hover */}
        {showReportButton && onReport && (
          <button
            onClick={() => onReport(reply.id, `${reply.first_name} ${reply.last_name}`)}
            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300"
            title="Report this reply"
          >
            <Flag className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Comment */}
      <div className="mb-3">
        <p className="text-neutral-300 text-sm leading-relaxed">{reply.comment}</p>
      </div>

      {/* Helpfulness Section */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400">
            Facts?
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleVote(true)}
              disabled={isVoting}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
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
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
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
          <div className="text-xs text-neutral-400">
            <span className="text-green-300 font-medium">{helpfulPercentage}%</span> helpful
            <span className="text-neutral-500 ml-1">
              ({localVotes.helpful}/{localVotes.total})
            </span>
          </div>
        )}
      </div>
    </div>
    <StudentDetailsModal
      isOpen={showStudentDetails}
      onClose={() => setShowStudentDetails(false)}
      studentName={`${reply.first_name} ${reply.last_name}`}
      studentEmail={reply.email}
      profileImageUrl={reply.profile_image_url}
      createdAt={reply.created_at}
      showEmail={reply.show_email ?? true}
    />
    </>
  )
}

