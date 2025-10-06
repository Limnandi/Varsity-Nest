import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    // Try secure JWT session first
    let user = await getCurrentUserFromRequest(request)
    
    // Fallback to StackAuth if no JWT session
    if (!user) {
      user = await getCurrentUserFromStackAuth()
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }
    
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account deactivated" },
        { status: 403 }
      )
    }
    
    if (user.role !== 'provider') {
      return NextResponse.json(
        { error: "Access denied. Provider role required." },
        { status: 403 }
      )
    }

    // Get provider ID
    const providerResult = await query`
      SELECT id FROM providers WHERE user_id = ${user.id} LIMIT 1
    `

    if (providerResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Provider profile not found" },
        { status: 404 }
      )
    }

    const providerId = providerResult.rows[0].id

    // Fetch accommodation stats
    const accommodationsResult = await query`
      SELECT 
        COUNT(*) as total_accommodations,
        COUNT(CASE WHEN is_open = true THEN 1 END) as active_accommodations,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN featured = true THEN 1 END) as featured_count
      FROM accommodations 
      WHERE provider_id = ${providerId}
    `

    // Fetch booking stats (with error handling)
    let bookingStats = {
      total_bookings: 0,
      active_bookings: 0,
      pending_bookings: 0,
      total_revenue: 0
    }
    
    try {
      const bookingsResult = await query`
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as active_bookings,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
          COALESCE(SUM(CASE WHEN status = 'confirmed' THEN total_amount ELSE 0 END), 0) as total_revenue
        FROM bookings b
        JOIN accommodations a ON b.accommodation_id = a.id
        WHERE a.provider_id = ${providerId}
      `
      bookingStats = bookingsResult.rows[0] || bookingStats
    } catch (bookingError) {
      console.warn("Bookings table query failed:", bookingError)
    }

    // Fetch review stats (with error handling)
    let reviewStats = {
      total_reviews: 0,
      average_review_rating: 0
    }
    
    try {
      const reviewsResult = await query`
        SELECT 
          COUNT(*) as total_reviews,
          COALESCE(AVG(r.rating), 0) as average_review_rating
        FROM reviews r
        JOIN accommodations a ON r.accommodation_id = a.id
        WHERE a.provider_id = ${providerId}
      `
      reviewStats = reviewsResult.rows[0] || reviewStats
    } catch (reviewError) {
      console.warn("Reviews table query failed:", reviewError)
    }

    const accommodationStats = accommodationsResult.rows[0]

    const stats = {
      totalAccommodations: Number(accommodationStats.total_accommodations) || 0,
      activeAccommodations: Number(accommodationStats.active_accommodations) || 0,
      averageRating: Number(accommodationStats.average_rating) || 0,
      featuredCount: Number(accommodationStats.featured_count) || 0,
      totalBookings: Number(bookingStats.total_bookings) || 0,
      activeBookings: Number(bookingStats.active_bookings) || 0,
      pendingBookings: Number(bookingStats.pending_bookings) || 0,
      totalRevenue: Number(bookingStats.total_revenue) || 0,
      totalReviews: Number(reviewStats.total_reviews) || 0,
      averageReviewRating: Number(reviewStats.average_review_rating) || 0,
      // Maintenance stats - placeholder until table is created
      pendingMaintenance: 0,
      scheduledMaintenance: 0,
      upcomingMaintenance: 0
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error("Provider stats fetch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch provider stats" },
      { status: 500 }
    )
  }
}