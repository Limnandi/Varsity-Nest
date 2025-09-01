import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { postgrest } from "@/lib/postgrest"

export async function GET(request: NextRequest) {
  try {
    const providerId = request.headers.get('x-user-id') || ''
    const [totalAccommodations, accommodations] = await Promise.all([
      postgrest.count('accommodations', { provider_id: providerId }),
      postgrest.get<any>('accommodations', { select: 'view_count', filter: { provider_id: providerId }, limit: 1000 })
    ])

    const totalViews = (accommodations || []).reduce((sum: number, a: any) => sum + (Number(a.view_count) || 0), 0)
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