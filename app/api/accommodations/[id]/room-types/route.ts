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
        room_types,
        total_rooms,
        available_rooms,
        has_single_rooms,
        has_sharing_rooms,
        single_room_price,
        sharing_room_price,
        single_rooms_total,
        single_rooms_available,
        sharing_rooms_total,
        sharing_rooms_available
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
    
    // Get accommodation-level room counts from database
    const accommodationTotalRooms = Number(accommodation.total_rooms) || 0
    const accommodationAvailableRooms = Number(accommodation.available_rooms) || 0

    // Parse room types from JSONB field
    let roomTypes = []
    if (accommodation.room_types && Array.isArray(accommodation.room_types) && accommodation.room_types.length > 0) {
      roomTypes = accommodation.room_types.map((rt: any, index: number) => {
        // Use room type specific counts if available, otherwise calculate from accommodation totals
        const rtAvailableCount = Number(rt.availableCount) || Number(rt.available_count) || 0
        const rtTotalCount = Number(rt.totalCount) || Number(rt.total_count) || 0
        
        return {
          id: rt.id || `room-${index}`,
          name: rt.name || 'Room',
          type: rt.type || 'single',
          price: parseFloat(rt.price) || 0,
          description: rt.description || '',
          amenities: rt.amenities || [],
          images: rt.images || [],
          availableCount: rtAvailableCount > 0 ? rtAvailableCount : 0,
          totalCount: rtTotalCount > 0 ? rtTotalCount : 0,
          isActive: rt.isActive !== false
        }
      })
      
      // If room types exist but don't have counts, validate against accommodation totals
      const roomTypesTotal = roomTypes.reduce((sum: number, rt: { totalCount: number }) => sum + rt.totalCount, 0)
      const roomTypesAvailable = roomTypes.reduce((sum: number, rt: { availableCount: number }) => sum + rt.availableCount, 0)
      
      // If totals don't match, ensure we're using accurate data
      // This ensures database values take precedence
      if (accommodationTotalRooms > 0 && roomTypesTotal !== accommodationTotalRooms) {
        // Adjust room types to match accommodation totals proportionally
        const ratio = accommodationTotalRooms / (roomTypesTotal || 1)
        roomTypes = roomTypes.map((rt: { totalCount: number; [key: string]: any }) => ({
          ...rt,
          totalCount: Math.round(rt.totalCount * ratio)
        }))
      }
      
      if (accommodationAvailableRooms > 0 && roomTypesAvailable !== accommodationAvailableRooms) {
        const availableRatio = accommodationAvailableRooms / (roomTypesAvailable || 1)
        roomTypes = roomTypes.map((rt: { availableCount: number; [key: string]: any }) => ({
          ...rt,
          availableCount: Math.round(rt.availableCount * availableRatio)
        }))
      }
    }

    // If no room types in JSONB, create default ones based on accommodation data
    if (roomTypes.length === 0) {
      const basePrice = parseFloat(accommodation.base_price) || 0
      const totalRooms = Number(accommodation.total_rooms) || 0
      const availableRooms = Number(accommodation.available_rooms) || 0
      const hasSingle = accommodation.has_single_rooms !== false
      const hasSharing = accommodation.has_sharing_rooms !== false
      const singlePrice = accommodation.single_room_price ? parseFloat(accommodation.single_room_price) : basePrice
      const sharingPrice = accommodation.sharing_room_price ? parseFloat(accommodation.sharing_room_price) : Math.round(basePrice * 0.6)

      // Use database columns for room counts (source of truth)
      // Fallback to calculated values if columns are not set
      let singleTotal = Number(accommodation.single_rooms_total) || 0
      let singleAvailable = Number(accommodation.single_rooms_available) || 0
      let sharingTotal = Number(accommodation.sharing_rooms_total) || 0
      let sharingAvailable = Number(accommodation.sharing_rooms_available) || 0

      // If database columns are not set, calculate based on accommodation totals
      // (This handles existing data before migration)
      if (singleTotal === 0 && sharingTotal === 0 && totalRooms > 0) {
        if (hasSingle && hasSharing) {
          // Split rooms 60% single, 40% sharing
          singleTotal = Math.round(totalRooms * 0.6)
          sharingTotal = totalRooms - singleTotal
          singleAvailable = Math.round(availableRooms * 0.6)
          sharingAvailable = availableRooms - singleAvailable
        } else if (hasSingle) {
          singleTotal = totalRooms
          singleAvailable = availableRooms
        } else if (hasSharing) {
          sharingTotal = totalRooms
          sharingAvailable = availableRooms
        }
      }

      // Add single room type if enabled
      if (hasSingle && singleTotal > 0) {
        roomTypes.push({
          id: 'single-default',
          name: 'Single Room',
          type: 'single',
          price: singlePrice,
          description: 'Private single occupancy room',
          amenities: ['wifi', 'ensuite'],
          images: [],
          availableCount: singleAvailable,
          totalCount: singleTotal,
          isActive: true
        })
      }

      // Add sharing room type if enabled
      if (hasSharing && sharingTotal > 0) {
        roomTypes.push({
          id: 'sharing-default',
          name: 'Sharing Room',
          type: 'sharing',
          price: sharingPrice,
          description: 'Shared room',
          amenities: ['wifi', 'ensuite'],
          images: [],
          availableCount: sharingAvailable,
          totalCount: sharingTotal,
          isActive: true
        })
      }
    }

    // Use accommodation totals from database columns as source of truth
    // Priority: main columns > room-type-specific columns > calculated from room types
    let finalTotalRooms = accommodationTotalRooms > 0 ? accommodationTotalRooms : 0
    let finalAvailableRooms = accommodationAvailableRooms > 0 ? accommodationAvailableRooms : 0
    
    // If main totals are missing, calculate from room type specific columns
    if (finalTotalRooms === 0) {
      const singleTotal = Number(accommodation.single_rooms_total) || 0
      const sharingTotal = Number(accommodation.sharing_rooms_total) || 0
      finalTotalRooms = singleTotal + sharingTotal
    }
    
    if (finalAvailableRooms === 0) {
      const singleAvailable = Number(accommodation.single_rooms_available) || 0
      const sharingAvailable = Number(accommodation.sharing_rooms_available) || 0
      finalAvailableRooms = singleAvailable + sharingAvailable
    }
    
    // Final fallback: calculate from room types array
    if (finalTotalRooms === 0) {
      const calculatedTotalRooms = roomTypes.reduce((sum: number, rt: { totalCount: number }) => sum + rt.totalCount, 0)
      finalTotalRooms = calculatedTotalRooms
    }
    
    if (finalAvailableRooms === 0) {
      const calculatedAvailableRooms = roomTypes.reduce((sum: number, rt: { availableCount: number }) => sum + rt.availableCount, 0)
      finalAvailableRooms = calculatedAvailableRooms
    }

    return NextResponse.json({
      accommodation: {
        id: accommodation.id,
        name: accommodation.name,
        address: accommodation.address,
        totalRooms: finalTotalRooms,
        availableRooms: finalAvailableRooms
      },
      roomTypes,
      totals: {
        totalRooms: finalTotalRooms,
        availableRooms: finalAvailableRooms
      }
    })

  } catch (error) {
    console.error("Room types fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch room types" },
      { status: 500 }
    )
  }
}
