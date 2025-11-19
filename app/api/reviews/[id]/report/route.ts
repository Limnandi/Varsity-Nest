import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { query } from "@/lib/database"
import { redis } from "@/lib/redis"
import { CacheManager } from "@/lib/cache"

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
        { error: "Only students can report reviews" },
        { status: 403 }
      )
    }

    const { id: reviewId } = await params
    const body = await request.json()
    const { reason, description } = body

    const validReasons = ['spam', 'inappropriate', 'fake', 'harassment', 'other']
    if (!reason || !validReasons.includes(reason)) {
      return NextResponse.json(
        { error: "Invalid reason. Must be one of: " + validReasons.join(', ') },
        { status: 400 }
      )
    }

    // Get student ID
    const studentResult = await query`
      SELECT id FROM students WHERE user_id = ${user.id}
    `

    if (studentResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      )
    }

    const studentId = studentResult.rows[0].id

    // Rate limiting: Check Redis for recent reports from this user
    const rateLimitKey = `report:rate_limit:${studentId}`
    const recentReports = await redis.get(rateLimitKey)
    const reportCount = recentReports ? Number.parseInt(recentReports as string) : 0
    
    if (reportCount >= 10) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      )
    }

    // Check if student has already reported this review (using Redis for fast lookup)
    const reportKey = `user:${studentId}:reported:${reviewId}`
    const alreadyReported = await redis.get(reportKey)
    
    if (alreadyReported) {
      return NextResponse.json(
        { error: "You have already reported this review" },
        { status: 400 }
      )
    }

    // Double-check in database
    const existingReport = await query`
      SELECT id FROM review_reports 
      WHERE review_id = ${reviewId} AND reporter_id = ${studentId}
    `

    if (existingReport.rows.length > 0) {
      // Cache the fact that they've reported this
      await redis.set(reportKey, '1', { ex: 24 * 60 * 60 }) // 24 hours
      return NextResponse.json(
        { error: "You have already reported this review" },
        { status: 400 }
      )
    }

    // Insert new report
    const reportResult = await query`
      INSERT INTO review_reports (review_id, reporter_id, reason, description)
      VALUES (${reviewId}, ${studentId}, ${reason}, ${description || ''})
      RETURNING id, reason, status, created_at
    `

    // Cache the report to prevent duplicate submissions
    await redis.set(reportKey, '1', { ex: 24 * 60 * 60 }) // 24 hours
    
    // Update rate limit counter
    await redis.incr(rateLimitKey)
    await redis.expire(rateLimitKey, 3600) // 1 hour window

    // Invalidate admin reports cache
    const cacheKeys = [
      'admin:reports:all:20:0',
      'admin:reports:all:50:0',
      'admin:reports:pending:20:0',
      'admin:reports:pending:50:0'
    ]
    await Promise.all(cacheKeys.map(key => CacheManager.del(key)))

    return NextResponse.json({
      success: true,
      report: reportResult.rows[0]
    })

  } catch (error) {
    console.error("Review report error:", error)
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    )
  }
}

