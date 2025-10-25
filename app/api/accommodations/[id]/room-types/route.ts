import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accommodationId } = await params
    
    // Get accommodation basic info
    const accommodationResult = await query`
      SELECT 
        id,
        name,
        address,
        price as base_price,
        room_types
      FROM accommodations 
      WHERE id = ${accommodationId} AND is_active = true
    `

    if (accommodationResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Accommodation not found" },
        { status: 404 }
      )
    }

    const accommodation = accommodationResult.rows[0]
    
    // Parse room types from JSONB field
    let roomTypes = []
    if (accommodation.room_types && Array.isArray(accommodation.room_types)) {
      roomTypes = accommodation.room_types.map((rt: any, index: number) => ({
        id: rt.id || `room-${index}`,
        name: rt.name || 'Room',
        type: rt.type || 'single',
        price: parseFloat(rt.price) || 0,
        description: rt.description || '',
        amenities: rt.amenities || [],
        images: rt.images || [],
        availableCount: rt.availableCount || 0,
        totalCount: rt.totalCount || 0,
        isActive: rt.isActive !== false
      }))
    }

    // If no room types in JSONB, create default ones based on base price
    if (roomTypes.length === 0) {
      const basePrice = parseFloat(accommodation.base_price) || 0
      roomTypes = [
        {
          id: 'single-default',
          name: 'Single Room',
          type: 'single',
          price: basePrice,
          description: 'Private single occupancy room',
          amenities: ['wifi', 'ensuite'],
          images: [],
          availableCount: 5,
          totalCount: 10,
          isActive: true
        },
        {
          id: 'sharing-default',
          name: 'Sharing Room',
          type: 'sharing',
          price: Math.round(basePrice * 0.6),
          description: 'Shared room',
          amenities: ['wifi', 'ensuite'],
          images: [],
          availableCount: 8,
          totalCount: 15,
          isActive: true
        }
      ]
    }

    return NextResponse.json({
      accommodation: {
        id: accommodation.id,
        name: accommodation.name,
        address: accommodation.address
      },
      roomTypes
    })

  } catch (error) {
    console.error("Room types fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch room types" },
      { status: 500 }
    )
  }
}
