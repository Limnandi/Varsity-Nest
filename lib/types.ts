// Production types for accommodations and reviews
export interface Accommodation {
  id: string
  name: string
  description: string
  address: string
  price: number
  images: string[]
  amenities: string[]
  accreditationStatus: "accredited" | "provisionally_accredited" | "non_accredited"
  providerId: string
  contactEmail?: string
  contactPhone?: string
  websiteUrl?: string
  latitude?: number
  longitude?: number
  roomTypes: string[]
  maxOccupancy?: number
  availableFrom?: Date
  availableUntil?: Date
  isActive: boolean
  viewCount: number
  area?: string
  distance?: string
  rating: number
  reviewCount: number
  isOpen: boolean
  featured: boolean
  availableRooms: number
  totalRooms: number
  isVerified: boolean
  city?: string
  province?: string
  postalCode?: string
  accommodationType?: string
  pricePerMonth?: number
  createdAt: Date
  updatedAt: Date
}

export interface ReviewReply {
  id: string
  reviewId: string
  author: string
  university: "UFS" | "CUT"
  comment: string
  createdAt: Date
  likes: number
  liked: boolean
}

export interface Review {
  id: string
  author: string
  university: "UFS" | "CUT"
  rating: number
  comment: string
  likes: number
  liked: boolean
  createdAt: Date
  replies?: ReviewReply[]
}
