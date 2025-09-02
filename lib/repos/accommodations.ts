import { query } from "@/lib/database"

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
}

export async function fetchFeaturedAccommodations(limit = 9): Promise<DbAccommodation[]> {
  const res = await query`
    SELECT id, name, description, address, price, images, amenities,
           area, distance, rating, review_count, is_open, featured,
           available_rooms, total_rooms, is_verified
    FROM accommodations
    WHERE is_active = true AND featured = true
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return res.rows
}

export async function fetchAccommodationsByStatus(status: string, limit = 200, offset = 0): Promise<DbAccommodation[]> {
  const res = await query`
    SELECT id, name, description, address, price, images, amenities,
           area, distance, rating, review_count, is_open, featured,
           available_rooms, total_rooms, is_verified
    FROM accommodations
    WHERE is_active = true AND accreditation_status = ${status}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `
  return res.rows
}

export async function fetchAccommodationByIdWithProvider(id: string) {
  const res = await query`
    SELECT a.id, a.name, a.description, a.address, a.price, a.images, a.amenities, a.provider_id,
           p.business_name as provider_name, p.contact_email as provider_email
    FROM accommodations a
    LEFT JOIN providers p ON p.id = a.provider_id
    WHERE a.id = ${id}
    LIMIT 1
  `
  return res.rows[0] || null
}

export async function fetchAccommodationsByProvider(providerId: string, limit = 200): Promise<DbAccommodation[]> {
  const res = await query`
    SELECT id, name, description, address, price, images, amenities,
           area, distance, rating, review_count, is_open, featured,
           available_rooms, total_rooms, is_verified
    FROM accommodations
    WHERE provider_id = ${providerId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return res.rows
}

export async function countAccommodationsByProvider(providerId: string): Promise<number> {
  const res = await query`SELECT COUNT(*) as count FROM accommodations WHERE provider_id = ${providerId}`
  return Number.parseInt(res.rows?.[0]?.count ?? '0', 10) || 0
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
}) {
  const res = await query`
    INSERT INTO accommodations (
      name, description, address, price, amenities, images,
      accreditation_status, provider_id, area, distance, featured,
      available_rooms, total_rooms, is_verified, is_active
    ) VALUES (
      ${payload.name},
      ${payload.description || null},
      ${payload.address},
      ${payload.price},
      ${JSON.stringify(payload.amenities || [])}::jsonb,
      ${JSON.stringify(payload.images || [])}::jsonb,
      ${payload.accreditation_status || 'accredited'},
      ${payload.provider_id || null},
      ${payload.area || null},
      ${payload.distance || null},
      ${payload.featured ?? false},
      ${payload.available_rooms ?? 0},
      ${payload.total_rooms ?? 0},
      ${payload.is_verified ?? false},
      true
    )
    RETURNING *
  `
  return res.rows?.[0]
}


