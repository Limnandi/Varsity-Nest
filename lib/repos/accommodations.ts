import { secureDb } from "@/lib/database-secure"
import { eq, and, desc, count, sql } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { randomUUID } from "crypto"

export interface DbAccommodation {
  id: string
  name: string
  description: string | null
  address: string
  price: string | number
  images: string[]
  amenities: string[]
  accreditation_status: string
  provider_id: string | null
  contact_email?: string | null
  contact_phone?: string | null
  website_url?: string | null
  area?: string | null
  distance?: string | null
  rating?: number | null
  review_count?: number | null
  is_open?: boolean | null
  featured?: boolean | null
  available_rooms?: number | null
  total_rooms?: number | null
  is_verified?: boolean | null
  is_published?: boolean | null
  listing_status?: string | null
  has_single_rooms?: boolean | null
  has_sharing_rooms?: boolean | null
  single_room_price?: number | null
  sharing_room_price?: number | null
  published_at?: string | null
  unpublished_at?: string | null
}

export async function fetchFeaturedAccommodations(limit = 9): Promise<DbAccommodation[]> {
  const accommodations = await secureDb.db
    .select({
      id: schema.accommodations.id,
      name: schema.accommodations.name,
      address: schema.accommodations.address,
      price: schema.accommodations.price,
      images: schema.accommodations.images,
      featured: schema.accommodations.featured,
    })
    .from(schema.accommodations)
    .where(and(
      eq(schema.accommodations.isActive, true),
      eq(schema.accommodations.featured, true),
      sql`accommodations.is_published = true`
    ))
    .orderBy(desc(schema.accommodations.createdAt))
    .limit(limit)
  
  return accommodations.map((acc: any) => ({
    id: acc.id,
    name: acc.name,
    description: undefined,
    address: acc.address,
    price: acc.price,
    images: acc.images || [],
    amenities: [],
    accreditation_status: 'accredited',
    provider_id: null,
    area: undefined,
    distance: undefined,
    rating: undefined,
    review_count: undefined,
    is_open: undefined,
    featured: acc.featured,
    available_rooms: undefined,
    total_rooms: undefined,
    is_verified: undefined
  }))
}

export async function fetchAccommodationsByStatus(status: string, limit = 200, offset = 0): Promise<DbAccommodation[]> {
  const accommodations = await secureDb.db
    .select({
      id: schema.accommodations.id,
      name: schema.accommodations.name,
      address: schema.accommodations.address,
      price: schema.accommodations.price,
      images: schema.accommodations.images,
      accreditationStatus: schema.accommodations.accreditationStatus,
    })
    .from(schema.accommodations)
    .where(and(
      eq(schema.accommodations.isActive, true),
      eq(schema.accommodations.accreditationStatus, status as any),
      sql`accommodations.is_published = true`
    ))
    .orderBy(desc(schema.accommodations.createdAt))
    .limit(limit)
    .offset(offset)
  
  return accommodations.map((acc: any) => ({
    id: acc.id,
    name: acc.name,
    description: undefined,
    address: acc.address,
    price: acc.price,
    images: acc.images || [],
    amenities: [],
    accreditation_status: acc.accreditationStatus,
    provider_id: null,
    area: undefined,
    distance: undefined,
    rating: undefined,
    review_count: undefined,
    is_open: undefined,
    featured: undefined,
    available_rooms: undefined,
    total_rooms: undefined,
    is_verified: undefined
  }))
}

export async function fetchAccommodationByIdWithProvider(id: string) {
  const [accommodation] = await secureDb.db
    .select({
      id: schema.accommodations.id,
      name: schema.accommodations.name,
      description: schema.accommodations.description,
      address: schema.accommodations.address,
      price: schema.accommodations.price,
      images: schema.accommodations.images,
      amenities: schema.accommodations.amenities,
      providerId: schema.accommodations.providerId,
      providerName: schema.providers.businessName,
      providerEmail: schema.providers.contactEmail
    })
    .from(schema.accommodations)
    .leftJoin(schema.providers, eq(schema.accommodations.providerId, schema.providers.id))
    .where(eq(schema.accommodations.id, id))
    .limit(1)
  
  return accommodation || null
}

export async function fetchAccommodationsByProvider(providerId: string, limit = 200): Promise<DbAccommodation[]> {
  const accommodations = await secureDb.db
    .select({
      id: schema.accommodations.id,
      name: schema.accommodations.name,
      description: schema.accommodations.description,
      address: schema.accommodations.address,
      price: schema.accommodations.price,
      images: schema.accommodations.images,
      amenities: schema.accommodations.amenities,
      area: schema.accommodations.area,
      distance: schema.accommodations.distance,
      rating: schema.accommodations.rating,
      reviewCount: schema.accommodations.reviewCount,
      isOpen: schema.accommodations.isOpen,
      featured: schema.accommodations.featured,
      availableRooms: schema.accommodations.availableRooms,
      totalRooms: schema.accommodations.totalRooms,
      isVerified: schema.accommodations.isVerified,
      accreditationStatus: schema.accommodations.accreditationStatus,
      providerId: schema.accommodations.providerId
    })
    .from(schema.accommodations)
    .where(eq(schema.accommodations.providerId, providerId))
    .orderBy(desc(schema.accommodations.createdAt))
    .limit(limit)
  
  return accommodations.map((acc: any) => ({
    id: acc.id,
    name: acc.name,
    description: acc.description,
    address: acc.address,
    price: acc.price,
    images: acc.images || [],
    amenities: acc.amenities || [],
    accreditation_status: acc.accreditationStatus,
    provider_id: acc.providerId,
    area: acc.area,
    distance: acc.distance,
    rating: acc.rating,
    review_count: acc.reviewCount,
    is_open: acc.isOpen,
    featured: acc.featured,
    available_rooms: acc.availableRooms,
    total_rooms: acc.totalRooms,
    is_verified: acc.isVerified
  }))
}

export async function countAccommodationsByProvider(providerId: string): Promise<number> {
  const [result] = await secureDb.db
    .select({ count: count(schema.accommodations.id) })
    .from(schema.accommodations)
    .where(eq(schema.accommodations.providerId, providerId))
  
  return Number(result?.count || 0)
}

export async function insertAccommodation(payload: {
  name: string
  description?: string
  address: string
  price: number
  amenities?: string[]
  images?: string[]
  accreditation_status?: string
  provider_id?: string
  area?: string | null
  distance?: string | null
  featured?: boolean
  available_rooms?: number
  total_rooms?: number
  is_verified?: boolean
  has_single_rooms?: boolean
  has_sharing_rooms?: boolean
  single_room_price?: number
  sharing_room_price?: number
  listing_status?: string
  is_published?: boolean
  contact_email?: string
  contact_phone?: string
  website_url?: string
  city?: string
  province?: string
  postal_code?: string
  accommodation_type?: string
  max_occupancy?: number
}) {
  const [accommodation] = await secureDb.db
    .insert(schema.accommodations)
    .values({
      id: randomUUID(),
      name: payload.name,
      description: payload.description || null,
      address: payload.address,
      price: payload.price,
      amenities: payload.amenities || [],
      images: payload.images || [],
      accreditationStatus: (payload.accreditation_status as any) || 'accredited',
      providerId: payload.provider_id || null,
      area: payload.area || null,
      distance: payload.distance || null,
      featured: payload.featured ?? false,
      availableRooms: payload.available_rooms ?? 0,
      totalRooms: payload.total_rooms ?? 0,
      isVerified: payload.is_verified ?? false,
      hasSingleRooms: payload.has_single_rooms ?? false,
      hasSharingRooms: payload.has_sharing_rooms ?? false,
      singleRoomPrice: payload.single_room_price ?? 0,
      sharingRoomPrice: payload.sharing_room_price ?? 0,
      listingStatus: payload.listing_status ?? 'draft',
      isPublished: payload.is_published ?? false,
      isActive: true,
      contactEmail: payload.contact_email || null,
      contactPhone: payload.contact_phone || null,
      websiteUrl: payload.website_url || null,
      city: payload.city || null,
      province: payload.province || null,
      postalCode: payload.postal_code || null,
      accommodationType: payload.accommodation_type || null,
      maxOccupancy: payload.max_occupancy || null
    })
    .returning()
  
  return accommodation
}


