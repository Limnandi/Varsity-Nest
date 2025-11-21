"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { enqueueWishlistStatusFetch, primeWishlistStatusCache } from "@/lib/wishlist-status-batcher"

export function useWishlistStatus(accommodationId?: string | number, enabled = true) {
  const id = accommodationId != null ? String(accommodationId) : undefined

  return useQuery({
    queryKey: ["wishlist-status", id],
    queryFn: () => enqueueWishlistStatusFetch(id!),
    enabled: Boolean(enabled && id),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useWishlistStatusUpdater() {
  const queryClient = useQueryClient()

  return (accommodationId: string | number, value: boolean) => {
    const id = String(accommodationId)
    primeWishlistStatusCache(id, value)
    queryClient.setQueryData(["wishlist-status", id], value)
  }
}


