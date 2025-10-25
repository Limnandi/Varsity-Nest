import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { query } from "@/lib/database"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    let user = await getCurrentUserFromRequest(request)
    
    if (!user) {
      user = await getCurrentUserFromStackAuth()
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }
    
    if (user.role !== 'student') {
      return NextResponse.json(
        { error: "Only students can delete reviews" },
        { status: 403 }
      )
    }

    const { id: reviewId } = await params

    // Get the review to check ownership
    const reviewResult = await query`
      SELECT r.id, r.accommodation_id, s.user_id
      FROM reviews r
      JOIN students s ON r.student_id = s.id
      WHERE r.id = ${reviewId}
    `

    if (reviewResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    const review = reviewResult.rows[0]

    // Check if the current user is the review author
    if (review.user_id !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own reviews" },
        { status: 403 }
      )
    }

    const accommodationId = review.accommodation_id

    // Delete the review (this will cascade delete replies, votes, etc. if foreign keys are set up)
    await query`
      DELETE FROM reviews 
      WHERE id = ${reviewId}
    `

    console.log(`[REVIEWS] Review ${reviewId} deleted successfully`)

    // Update accommodation's rating and review_count
    try {
      const statsResult = await query`
        SELECT 
          COALESCE(ROUND(AVG(rating)::numeric, 0), 0) as avg_rating,
          COUNT(*) as total_reviews
        FROM reviews 
        WHERE accommodation_id = ${accommodationId}
      `

      const avgRating = statsResult.rows[0]?.avg_rating || 0
      const totalReviews = statsResult.rows[0]?.total_reviews || 0

      console.log(`[REVIEWS] Calculated stats for accommodation ${accommodationId}: rating=${avgRating}, count=${totalReviews}`)

      await query`
        UPDATE accommodations 
        SET 
          rating = ${avgRating},
          review_count = ${totalReviews},
          updated_at = NOW()
        WHERE id = ${accommodationId}
      `

      console.log(`[REVIEWS] Accommodation ${accommodationId} updated successfully after review deletion`)
    } catch (updateError) {
      console.error(`[REVIEWS] Failed to update accommodation stats for ${accommodationId}:`, updateError)
      // Don't fail the whole request if stats update fails
    }

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully"
    })

  } catch (error) {
    console.error("Review deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    )
  }
}

