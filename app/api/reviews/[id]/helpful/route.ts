import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { query } from "@/lib/database"

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
        { error: "Only students can vote on reviews" },
        { status: 403 }
      )
    }

    const { id: reviewId } = await params
    const body = await request.json()
    const { isHelpful } = body

    if (typeof isHelpful !== 'boolean') {
      return NextResponse.json(
        { error: "isHelpful must be a boolean" },
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

    // Check if student has already voted on this review
    const existingVote = await query`
      SELECT id, is_helpful FROM review_helpfulness 
      WHERE review_id = ${reviewId} AND student_id = ${studentId}
    `

    if (existingVote.rows.length > 0) {
      // Update existing vote
      await query`
        UPDATE review_helpfulness 
        SET is_helpful = ${isHelpful}
        WHERE review_id = ${reviewId} AND student_id = ${studentId}
      `
    } else {
      // Insert new vote
      await query`
        INSERT INTO review_helpfulness (review_id, student_id, is_helpful)
        VALUES (${reviewId}, ${studentId}, ${isHelpful})
      `
    }

    // Update review vote counts
    const voteCounts = await query`
      SELECT 
        COUNT(*) as total_votes,
        COUNT(CASE WHEN is_helpful = true THEN 1 END) as helpful_votes
      FROM review_helpfulness 
      WHERE review_id = ${reviewId}
    `

    const { total_votes, helpful_votes } = voteCounts.rows[0]

    await query`
      UPDATE reviews 
      SET helpful_votes = ${helpful_votes}, total_votes = ${total_votes}
      WHERE id = ${reviewId}
    `

    return NextResponse.json({
      success: true,
      helpfulVotes: parseInt(helpful_votes),
      totalVotes: parseInt(total_votes)
    })

  } catch (error) {
    console.error("Helpfulness vote error:", error)
    return NextResponse.json(
      { error: "Failed to submit vote" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Try secure JWT session first
    let user = await getCurrentUserFromRequest(request)
    
    // Fallback to StackAuth if no JWT session
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const { id: reviewId } = await params

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

    // Get user's vote for this review
    const userVote = await query`
      SELECT is_helpful FROM review_helpfulness 
      WHERE review_id = ${reviewId} AND student_id = ${studentId}
    `

    return NextResponse.json({
      userVote: userVote.rows.length > 0 ? userVote.rows[0].is_helpful : null
    })

  } catch (error) {
    console.error("Get user vote error:", error)
    return NextResponse.json(
      { error: "Failed to get user vote" },
      { status: 500 }
    )
  }
}

