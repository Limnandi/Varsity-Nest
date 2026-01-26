"use client"

import { useState } from "react"
import { Flag } from "lucide-react"
import ListingReportModal from "@/components/ListingReportModal"
import WishlistButton from "@/components/WishlistButton"

interface ListingQuickActionsProps {
  accommodationId: string
  accommodationName: string
  currentUserRole?: string
}

export default function ListingQuickActions({
  accommodationId,
  accommodationName,
  currentUserRole,
}: ListingQuickActionsProps) {
  const [isReportOpen, setIsReportOpen] = useState(false)

  return (
    <div className="space-y-3">
      {currentUserRole === "student" && <WishlistButton accommodationId={accommodationId} />}

      <button
        type="button"
        onClick={() => setIsReportOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-500/40 bg-red-500/10 text-red-200 rounded-xl font-medium hover:bg-red-500/15 transition-all duration-300"
        aria-label="Report this listing"
      >
        <Flag className="w-4 h-4" />
        Report listing
      </button>

      <ListingReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        accommodationId={accommodationId}
        accommodationName={accommodationName}
      />
    </div>
  )
}

