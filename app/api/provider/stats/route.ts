import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_accommodations,
        COALESCE(SUM(view_count), 0) as total_views,
        COALESCE(SUM(booking_count), 0) as total_bookings,
        COALESCE(SUM(revenue), 0) as total_revenue
      FROM accommodations
      WHERE provider_id = $1
    `, [request.headers.get('x-user-id')])
    
    return NextResponse.json({
      totalAccommodations: result.rows[0]?.total_accommodations ?? 0,
      totalViews: result.rows[0]?.total_views ?? 0,
      totalBookings: result.rows[0]?.total_bookings ?? 0,
      totalRevenue: result.rows[0]?.total_revenue ?? 0
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch provider stats" },
      { status: 500 }
    )
  }
}