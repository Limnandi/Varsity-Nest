import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { query } from "@/lib/database"
import { redis } from "@/lib/redis"
import { CacheManager } from "@/lib/cache"

export const revalidate = 120

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limitParam = Number.parseInt(searchParams.get("limit") || "50", 10)
    const pageParam = Number.parseInt(searchParams.get("page") || "1", 10)
    const limit = Number.isNaN(limitParam) ? 50 : Math.min(Math.max(limitParam, 1), 100)
    const page = Number.isNaN(pageParam) ? 1 : Math.max(pageParam, 1)
    const offset = (page - 1) * limit

    const reviewsResult = await query`
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.is_verified,
        r.helpful_votes,
        r.total_votes,
        r.created_at,
        u.first_name,
        u.last_name,
        u.email,
        u.profile_image_url,
        s.university,
        COALESCE(sp.show_email, true) as show_email
      FROM reviews r
      JOIN students s ON r.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN student_preferences sp ON sp.student_id = s.id
      WHERE r.accommodation_id = ${id}
      ORDER BY r.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    const statsResult = await query`
      SELECT 
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as average_rating,
        COUNT(*) as total_reviews
      FROM reviews 
      WHERE accommodation_id = ${id}
    `

    const totalReviews = Number(statsResult.rows[0]?.total_reviews || 0)
    const avgRatingRaw = Number(statsResult.rows[0]?.average_rating || 0)

    const reviews = reviewsResult.rows.map((row: any) => ({
      id: row.id,
      rating: row.rating,
      comment: row.comment,
      is_verified: row.is_verified,
      helpful_votes: row.helpful_votes,
      total_votes: row.total_votes,
      created_at: row.created_at,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      profile_image_url: row.profile_image_url,
      university: row.university,
      show_email: row.show_email ?? true
    }))

    const hasMore = offset + reviews.length < totalReviews

    const response = NextResponse.json({
      reviews,
      averageRating: Number(avgRatingRaw.toFixed(1)),
      totalReviews,
      pagination: {
        page,
        limit,
        hasMore,
      }
    })
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60')
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=120')
    response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60')

    return response

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

    // Rate limit reviews per student to prevent abuse (5 reviews/hour)
    try {
      const rateLimitKey = `reviews:rate:${user.id}`
      const currentCount = await redis.incr(rateLimitKey)
      if (currentCount === 1) {
        await redis.expire(rateLimitKey, 60 * 60)
      }
      const MAX_REVIEWS_PER_HOUR = 5
      if (currentCount > MAX_REVIEWS_PER_HOUR) {
        return NextResponse.json(
          { error: "Review rate limit exceeded. Please try again later." },
          { status: 429 }
        )
      }
    } catch (rateError) {
      console.warn("Review rate limit check failed:", rateError)
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
      const updateResult = await query`
        WITH stats AS (
          SELECT 
            ROUND(COALESCE(AVG(rating), 0)::numeric, 0) as avg_rating,
            COUNT(*) as total_reviews
          FROM reviews 
          WHERE accommodation_id = ${id}
        )
        UPDATE accommodations 
        SET 
          rating = stats.avg_rating::int,
          review_count = stats.total_reviews,
          updated_at = NOW()
        FROM stats
        WHERE accommodations.id = ${id}
      `

      console.log(`[REVIEWS] Accommodation ${id} updated successfully. Rows affected: ${updateResult.rowCount}`)
      
      // Invalidate cache to force fresh data on next fetch
      await CacheManager.del(CacheManager.getAccommodationKey(id))
      await CacheManager.del(CacheManager.getAccommodationsByStatusKey('published', 100, 0))
      await CacheManager.del(CacheManager.getAccommodationsByStatusKey('published', 24, 0))
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

