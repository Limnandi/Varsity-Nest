"use client"

import { Loader2, CheckCircle } from "lucide-react"

interface DeletionLoadingOverlayProps {
  isDeleting: boolean
  isComplete: boolean
}

export default function DeletionLoadingOverlay({ isDeleting, isComplete }: DeletionLoadingOverlayProps) {
  if (!isDeleting && !isComplete) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-b from-[#02042b] to-[#040945]">
      <div className="text-center space-y-6 p-8">
        {!isComplete ? (
          <>
            <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Deleting Account...</h2>
              <p className="text-neutral-400">Please wait while we process your request</p>
            </div>
          </>
        ) : (
          <>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Account Successfully Deleted</h2>
              <p className="text-neutral-400">Redirecting to homepage...</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

