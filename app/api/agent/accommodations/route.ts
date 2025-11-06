import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    let user = await getCurrentUserFromRequest(request)
    if (!user) {
      user = await getCurrentUserFromStackAuth()
    }
    if (!user || user.role !== 'agent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account deactivated' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '200'

    const agentResult = await query`
      SELECT id FROM agents WHERE user_id = ${user.id} LIMIT 1
    `

    if (agentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Agent profile not found' }, { status: 404 })
    }

    const agentId = agentResult.rows[0].id

    const accommodationsResult = await query`
      SELECT 
        a.id,
        a.name,
        a.description,
        a.address,
        a.city,
        a.province,
        a.postal_code,
        a.accommodation_type,
        a.total_rooms,
        a.available_rooms,
        a.price_per_month,
        a.amenities,
        a.images,
        a.is_active,
        a.featured,
        a.rating,
        a.review_count,
        a.is_open,
        a.created_at,
        a.updated_at,
        a.accreditation_status,
        a.is_published,
        a.listing_status,
        a.has_single_rooms,
        a.has_sharing_rooms,
        a.single_room_price,
        a.sharing_room_price,
        a.published_at,
        a.unpublished_at,
        a.provider_id,
        a.agent_id,
        CASE 
          WHEN a.provider_id IS NOT NULL THEN p.business_name
          ELSE NULL
        END as managed_by_provider_name
      FROM accommodations a
      LEFT JOIN providers p ON a.provider_id = p.id
      WHERE a.agent_id = ${agentId}
      ORDER BY a.created_at DESC
      LIMIT ${Number.parseInt(limit)}
    `

    const accommodations = accommodationsResult.rows.map((acc: any) => ({
      id: acc.id,
      name: acc.name,
      description: acc.description,
      address: acc.address,
      city: acc.city,
      province: acc.province,
      postal_code: acc.postal_code,
      accommodation_type: acc.accommodation_type,
      total_rooms: acc.total_rooms,
      available_rooms: acc.available_rooms,
      price: acc.price_per_month,
      amenities: acc.amenities,
      images: acc.images,
      is_active: acc.is_active,
      featured: acc.featured,
      rating: acc.rating,
      review_count: acc.review_count,
      is_open: acc.is_open,
      created_at: acc.created_at,
      updated_at: acc.updated_at,
      accreditation_status: acc.accreditation_status,
      is_published: acc.is_published,
      listing_status: acc.listing_status,
      has_single_rooms: acc.has_single_rooms,
      has_sharing_rooms: acc.has_sharing_rooms,
      single_room_price: acc.single_room_price,
      sharing_room_price: acc.sharing_room_price,
      published_at: acc.published_at,
      unpublished_at: acc.unpublished_at,
      provider_id: acc.provider_id,
      agent_id: acc.agent_id,
      managed_by_provider_name: acc.managed_by_provider_name
    }))

    return NextResponse.json({ accommodations })

  } catch (error) {
    console.error("Agent accommodations API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch accommodations" },
      { status: 500 }
    )
  }
}

