import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { query } from "@/lib/database"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch reviews with student information
    const reviewsResult = await query`
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.is_verified,
        r.created_at,
        u.first_name,
        u.last_name,
        u.email
      FROM reviews r
      JOIN students s ON r.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE r.accommodation_id = ${id}
      ORDER BY r.created_at DESC
      LIMIT 50
    `

    // Calculate average rating
    const avgRatingResult = await query`
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as total_reviews
      FROM reviews 
      WHERE accommodation_id = ${id}
    `

    const reviews = reviewsResult.rows
    const avgRating = avgRatingResult.rows[0]?.average_rating || 0
    const totalReviews = avgRatingResult.rows[0]?.total_reviews || 0

    // Ensure avgRating is a number before calling toFixed
    const numericAvgRating = typeof avgRating === 'number' ? avgRating : parseFloat(avgRating) || 0

    return NextResponse.json({
      reviews,
      averageRating: parseFloat(numericAvgRating.toFixed(1)),
      totalReviews: parseInt(totalReviews)
    })

  } catch (error) {
    console.error("Reviews fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    if (user.role !== 'student') {
      return NextResponse.json(
        { error: "Only students can submit reviews" },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { rating, comment } = body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      )
    }

    // Get student ID, create if doesn't exist
    let studentResult = await query`
      SELECT id FROM students WHERE user_id = ${user.id}
    `

    let studentId: string
    if (studentResult.rows.length === 0) {
      // Student record doesn't exist, create it
      const insertResult = await query`
        INSERT INTO students (id, user_id, student_number, university)
        VALUES (gen_random_uuid()::text, ${user.id}, ${user.studentNumber || 'N/A'}, ${user.institution === 'UFS' ? 'UFS' : 'CUT'})
        RETURNING id
      `
      studentId = insertResult.rows[0].id
    } else {
      studentId = studentResult.rows[0].id
    }

    // Check if student has already reviewed this accommodation
    const existingReview = await query`
      SELECT id FROM reviews 
      WHERE student_id = ${studentId} AND accommodation_id = ${id}
    `

    if (existingReview.rows.length > 0) {
      return NextResponse.json(
        { error: "You have already reviewed this accommodation" },
        { status: 400 }
      )
    }

    // Insert new review
    const reviewResult = await query`
      INSERT INTO reviews (student_id, accommodation_id, rating, comment, is_verified)
      VALUES (${studentId}, ${id}, ${rating}, ${comment || ''}, false)
      RETURNING id, rating, comment, created_at
    `

    console.log(`[REVIEWS] Review inserted successfully for accommodation ${id}`)

    // Update accommodation's rating and review_count
    try {
      const statsResult = await query`
        SELECT 
          ROUND(AVG(rating)::numeric, 0) as avg_rating,
          COUNT(*) as total_reviews
        FROM reviews 
        WHERE accommodation_id = ${id}
      `

      const avgRating = statsResult.rows[0]?.avg_rating || 0
      const totalReviews = statsResult.rows[0]?.total_reviews || 0

      console.log(`[REVIEWS] Calculated stats for accommodation ${id}: rating=${avgRating}, count=${totalReviews}`)

      const updateResult = await query`
        UPDATE accommodations 
        SET 
          rating = ${avgRating},
          review_count = ${totalReviews},
          updated_at = NOW()
        WHERE id = ${id}
      `

      console.log(`[REVIEWS] Accommodation ${id} updated successfully. Rows affected: ${updateResult.rowCount}`)
    } catch (updateError) {
      console.error(`[REVIEWS] Failed to update accommodation stats for ${id}:`, updateError)
      // Don't fail the whole request if stats update fails
    }

    return NextResponse.json({
      success: true,
      review: reviewResult.rows[0]
    })

  } catch (error) {
    console.error("Review submission error:", error)
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    )
  }
}

