import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { countAccommodationsByProvider, fetchAccommodationsByProvider } from "@/lib/repos/accommodations"

export async function GET(request: NextRequest) {
  try {
    const providerId = request.headers.get('x-user-id') || ''
    const [totalAccommodations, accommodations] = await Promise.all([
      countAccommodationsByProvider(providerId),
      fetchAccommodationsByProvider(providerId, 1000)
    ])

    const totalViews = 0
    // booking_count and revenue may not exist on accommodations; default to 0 aggregates
    const totalBookings = 0
    const totalRevenue = 0

    return NextResponse.json({
      totalAccommodations,
      totalViews,
      totalBookings,
      totalRevenue
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch provider stats" },
      { status: 500 }
    )
  }
}