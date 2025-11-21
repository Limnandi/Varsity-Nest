"use client"

import { useCallback, useEffect, useState } from "react"
import { Star } from "lucide-react"
import { useStudentAuth } from "@/hooks/useStudentAuth"
import { toast } from "sonner"
import { useWishlistStatus, useWishlistStatusUpdater } from "@/hooks/use-wishlist-status"

interface WishlistButtonProps {
  accommodationId: string
}

export default function WishlistButton({ accommodationId }: WishlistButtonProps) {
  const { user: studentUser, isAuthenticated } = useStudentAuth()
  const [isFavorited, setIsFavorited] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const { data: wishlistStatus, isPending: isStatusPending } = useWishlistStatus(
    accommodationId,
    isAuthenticated && !!studentUser
  )
  const updateWishlistStatus = useWishlistStatusUpdater()

  useEffect(() => {
    if (typeof wishlistStatus === "boolean") {
      setIsFavorited(wishlistStatus)
    }
  }, [wishlistStatus])

  const handleClick = useCallback(async () => {
    if (!isAuthenticated || !studentUser) {
      toast.error("Sign in as student", { duration: 4000 })
      return
    }

    if (isMutating || isStatusPending) return
    setIsMutating(true)
    try {
      if (isFavorited) {
        const response = await fetch(`/api/student/wishlist?accommodationId=${accommodationId}`, {
          method: "DELETE",
        })
        if (response.ok) {
          setIsFavorited(false)
          updateWishlistStatus(accommodationId, false)
          toast.success("Removed from wishlist")
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to remove from wishlist")
        }
      } else {
        const response = await fetch("/api/student/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accommodationId }),
        })
        if (response.ok) {
          setIsFavorited(true)
          updateWishlistStatus(accommodationId, true)
          toast.success("Added to wishlist")
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to add to wishlist")
        }
      }
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong")
    } finally {
      setIsMutating(false)
    }
  }, [accommodationId, isAuthenticated, studentUser, isFavorited, isMutating, isStatusPending, updateWishlistStatus])

  return (
    <button
      onClick={handleClick}
      disabled={isMutating || isStatusPending}
      className={
        isFavorited
          ? "w-full bg-gradient-to-r from-pink-600 to-red-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-pink-700 hover:to-red-700 transition-all duration-300 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center disabled:opacity-60"
          : "w-full border border-white/20 bg-black/20 backdrop-blur-xl text-white py-3 px-4 rounded-xl font-medium hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center disabled:opacity-60"
      }
      aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Star className="w-4 h-4 mr-2" />
      {isFavorited ? "In wishlist" : "Add to wishlist"}
    </button>
  )
}


