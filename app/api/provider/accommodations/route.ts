import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')
    const limit = searchParams.get('limit') || '200'

    if (!providerId) {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      )
    }

    // Fetch accommodations for the provider
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
        a.updated_at
      FROM accommodations a
      WHERE a.provider_id = ${providerId}
      ORDER BY a.created_at DESC
      LIMIT ${Number.parseInt(limit)}
    `

    const accommodations = accommodationsResult.rows.map(acc => ({
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
      updated_at: acc.updated_at
    }))

    return NextResponse.json({ accommodations })

  } catch (error) {
    console.error("Provider accommodations API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch accommodations" },
      { status: 500 }
    )
  }
}
