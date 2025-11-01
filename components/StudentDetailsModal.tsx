"use client"

import { X, Eye, Mail, Calendar, GraduationCap } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"

interface StudentDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  studentName: string
  studentEmail: string
  profileImageUrl?: string
  createdAt?: string
}

export default function StudentDetailsModal({
  isOpen,
  onClose,
  studentName,
  studentEmail,
  profileImageUrl,
  createdAt
}: StudentDetailsModalProps) {
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!isOpen) return null

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <>
      {/* Main Modal (portal to body for true page overlay) */}
      {mounted && createPortal(
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={onClose}
          aria-hidden={!isOpen}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Reviewer details"
            className="relative border border-white/10 bg-black/40 backdrop-blur-xl rounded-2xl p-6 text-white shadow-[0_10px_40px_rgba(59,130,246,0.25)] max-w-md w-full mx-4 transform transition-all duration-300 animate-in slide-in-from-bottom-4 sm:animate-in zoom-in-95"
          >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            {/* Profile Image */}
            <div className="relative mb-4">
              <div
                onClick={() => profileImageUrl && setShowImageViewer(true)}
                className={`w-28 h-28 rounded-full overflow-hidden ring-4 ring-white/10 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-2xl shadow-xl ${profileImageUrl ? 'cursor-pointer hover:ring-blue-500/40 transition-all' : ''}`}
              >
                {profileImageUrl ? (
                  <Image
                    src={profileImageUrl}
                    alt={`${studentName}'s profile`}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                ) : (
                  getInitials(studentName)
                )}
              </div>

              {/* View Image Button Overlay */}
              {profileImageUrl && (
                <button
                  onClick={() => setShowImageViewer(true)}
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300"
                >
                  <div className="flex flex-col items-center gap-1">
                    <Eye className="w-6 h-6 text-white" />
                    <span className="text-xs text-white font-medium">View Image</span>
                  </div>
                </button>
              )}
            </div>

            {/* Student Name */}
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">
              {studentName}
            </h3>
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <GraduationCap className="w-4 h-4" />
              <span>Student</span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <Mail className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-neutral-400 mb-1">Email</p>
                <p className="text-sm text-white break-all">{studentEmail}</p>
              </div>
            </div>

            {/* Member Since */}
            {createdAt && (
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <Calendar className="w-5 h-5 text-purple-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-neutral-400 mb-1">Member Since</p>
                  <p className="text-sm text-white">{formatDate(createdAt)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-xs text-neutral-500 text-center">
              This is a verified student account
            </p>
          </div>
          </div>
        </div>,
        document.body
      )}

      {/* Image Viewer Modal - Portal to body for full screen */}
      {showImageViewer && profileImageUrl && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowImageViewer(false)}
          aria-modal="true"
          role="dialog"
          aria-label="Profile picture"
        >
          <button
            onClick={() => setShowImageViewer(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="relative w-[min(88vw,28rem)] h-[min(88vw,28rem)]">
            <div className="absolute inset-0 rounded-full overflow-hidden ring-8 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <Image
                src={profileImageUrl}
                alt={`${studentName}'s profile`}
                fill
                className="object-cover"
                sizes="(max-width: 480px) 90vw, 448px"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

