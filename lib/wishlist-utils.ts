"use client"

interface WishlistItem {
  id: string
  accommodationId: string
  name: string
  address: string
  price: number
  image: string
  rating: number
  reviewCount: number
  accreditationStatus: 'accredited' | 'provisionally_accredited' | 'non_accredited'
  addedAt: string
  contactEmail?: string
  contactPhone?: string
  websiteUrl?: string
}

export class WishlistUtils {
  static async addToWishlist(accommodationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/student/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accommodationId }),
      })

      if (response.ok) {
        const result = await response.json()
        return { success: true, message: result.message || "Added to wishlist successfully" }
      } else {
        const error = await response.json()
        return { success: false, message: error.message || "Failed to add to wishlist" }
      }
    } catch (error) {
      console.error('Add to wishlist error:', error)
      return { success: false, message: "Failed to add to wishlist" }
    }
  }

  static async removeFromWishlist(accommodationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`/api/student/wishlist?accommodationId=${accommodationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const result = await response.json()
        return { success: true, message: result.message || "Removed from wishlist successfully" }
      } else {
        const error = await response.json()
        return { success: false, message: error.message || "Failed to remove from wishlist" }
      }
    } catch (error) {
      console.error('Remove from wishlist error:', error)
      return { success: false, message: "Failed to remove from wishlist" }
    }
  }

  static async isInWishlist(accommodationId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/student/wishlist?accommodationId=${accommodationId}`)
      return response.ok
    } catch (error) {
      console.error('Check wishlist error:', error)
      return false
    }
  }

  static async getWishlistItems(): Promise<WishlistItem[]> {
    try {
      const response = await fetch('/api/student/wishlist')
      
      if (response.ok) {
        const result = await response.json()
        return result.data.items.map((item: any) => ({
          id: item.id,
          accommodationId: item.accommodationId,
          name: item.accommodation.name,
          address: item.accommodation.address,
          price: parseFloat(item.accommodation.price),
          image: Array.isArray(item.accommodation.images) && item.accommodation.images.length > 0 
            ? item.accommodation.images[0] 
            : "/placeholder.svg",
          rating: item.accommodation.rating || 0,
          reviewCount: item.accommodation.reviewCount || 0,
          accreditationStatus: item.accommodation.accreditationStatus,
          addedAt: item.addedAt,
          contactEmail: item.accommodation.contactEmail,
          contactPhone: item.accommodation.contactPhone,
          websiteUrl: item.accommodation.websiteUrl
        }))
      }
      return []
    } catch (error) {
      console.error('Get wishlist error:', error)
      return []
    }
  }
}
