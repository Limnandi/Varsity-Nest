import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')

    if (!providerId) {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      )
    }

    // Get accommodation count for the provider
    const accommodationResult = await query`
      SELECT COUNT(*) as count FROM accommodations WHERE provider_id = ${providerId}
    `

    const totalAccommodations = Number.parseInt(accommodationResult.rows[0].count) || 0

    // Get additional stats (placeholder for now, can be expanded)
    const stats = {
      totalAccommodations,
      activeBookings: 0,
      totalRevenue: 0,
      averageRating: 0,
      pendingReviews: 0,
      upcomingMaintenance: 0
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error("Provider stats API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch provider stats" },
      { status: 500 }
    )
  }
}