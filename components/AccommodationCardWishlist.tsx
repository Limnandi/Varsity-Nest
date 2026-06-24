"use client"

import { Heart } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useWishlistStatus, useWishlistStatusUpdater } from "@/hooks/use-wishlist-status"

export default function AccommodationCardWishlist({ id }: { id: string | number }) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [isStudent, setIsStudent] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const updateWishlistStatus = useWishlistStatusUpdater()
  const { data: wishlistStatus, isPending: isStatusPending } = useWishlistStatus(
    id,
    isStudent && sessionReady,
  )

  useEffect(() => {
    let cancelled = false

    fetch("/api/auth/session", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => {
        if (cancelled) return
        setIsStudent(Boolean(result?.success && result?.data?.role === "student"))
      })
      .catch(() => {
        if (!cancelled) setIsStudent(false)
      })
      .finally(() => {
        if (!cancelled) setSessionReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (typeof wishlistStatus === "boolean") {
      setIsFavorited(wishlistStatus)
    }
  }, [wishlistStatus])

  if (!sessionReady || !isStudent) {
    return null
  }

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isMutating || isStatusPending) return

    setIsMutating(true)

    try {
      if (isFavorited) {
        const response = await fetch(`/api/student/wishlist?accommodationId=${id}`, {
          method: "DELETE",
        })

        if (response.ok) {
          setIsFavorited(false)
          updateWishlistStatus(id, false)
          toast.success("Removed from wishlist")
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to remove from wishlist")
        }
      } else {
        const response = await fetch("/api/student/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accommodationId: String(id) }),
        })

        if (response.ok) {
          setIsFavorited(true)
          updateWishlistStatus(id, true)
          toast.success("Added to wishlist")
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to add to wishlist")
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong"
      toast.error(message)
    } finally {
      setIsMutating(false)
    }
  }

  return (
    <button
      onClick={handleWishlistToggle}
      disabled={isMutating || isStatusPending}
      className={`absolute top-3 right-3 p-2.5 bg-black/40 backdrop-blur-md border border-white/30 rounded-full hover:bg-white/20 transition-all duration-300 z-10 ${
        isMutating || isStatusPending ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
      } ${isFavorited ? "bg-red-500/20 border-red-400/50" : ""}`}
      aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${
          isFavorited ? "text-red-400 fill-current scale-110" : "text-white/80"
        } ${isMutating || isStatusPending ? "animate-pulse" : ""}`}
      />
    </button>
  )
}
