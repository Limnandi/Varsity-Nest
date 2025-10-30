import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { query } from "@/lib/database"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params
    
    // Fetch replies with student information
    const repliesResult = await query`
      SELECT 
        rr.id,
        rr.comment,
        rr.helpful_votes,
        rr.total_votes,
        rr.created_at,
        u.first_name,
        u.last_name,
        u.email,
        u.profile_image_url,
        s.university
      FROM review_replies rr
      JOIN students s ON rr.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE rr.review_id = ${reviewId}
      ORDER BY rr.created_at ASC
    `

    return NextResponse.json({
      replies: repliesResult.rows
    })

  } catch (error) {
    console.error("Replies fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch replies" },
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
        { error: "Only students can reply to reviews" },
        { status: 403 }
      )
    }

    const { id: reviewId } = await params
    const body = await request.json()
    const { comment } = body

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment is required" },
        { status: 400 }
      )
    }

    if (comment.length > 1000) {
      return NextResponse.json(
        { error: "Comment too long (max 1000 characters)" },
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

    // Insert new reply
    const replyResult = await query`
      INSERT INTO review_replies (review_id, student_id, comment)
      VALUES (${reviewId}, ${studentId}, ${comment.trim()})
      RETURNING id, comment, created_at
    `

    return NextResponse.json({
      success: true,
      reply: replyResult.rows[0]
    })

  } catch (error) {
    console.error("Reply submission error:", error)
    return NextResponse.json(
      { error: "Failed to submit reply" },
      { status: 500 }
    )
  }
}

