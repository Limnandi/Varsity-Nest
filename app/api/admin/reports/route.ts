import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { query } from "@/lib/database"
import { CacheManager } from "@/lib/cache"

const CACHE_TTL = 60 // 60 seconds cache for reports

export async function GET(request: NextRequest) {
  try {
    let user = await getCurrentUserFromRequest(request)
    if (!user) {
      user = await getCurrentUserFromStackAuth()
    }
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const limit = Number.parseInt(searchParams.get('limit') || '20')
    const offset = Number.parseInt(searchParams.get('offset') || '0')

    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed', 'all']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const cacheKey = `admin:reports:${status}:${limit}:${offset}`
    
    // Try cache first
    const cached = await CacheManager.get(cacheKey)
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true
      })
    }

    const reportsResult =
      status === "all"
        ? await query`
            SELECT *
            FROM (
              SELECT 
                rr.id,
                'review'::text AS item_type,
                rr.review_id,
                NULL::text AS reply_id,
                rr.reason,
                rr.description,
                rr.status,
                rr.admin_id,
                rr.admin_notes,
                rr.created_at,
                rr.updated_at,
                r.comment AS content,
                r.rating AS rating,
                s.id AS reporter_student_id,
                s.first_name || ' ' || s.last_name AS reporter_name,
                s.email AS reporter_email,
                review_author.first_name || ' ' || review_author.last_name AS content_author_name,
                review_author.email AS content_author_email
              FROM review_reports rr
              JOIN reviews r ON rr.review_id = r.id
              JOIN students s ON rr.reporter_id = s.id
              JOIN students review_author ON r.student_id = review_author.id

              UNION ALL

              SELECT
                rp.id,
                'reply'::text AS item_type,
                rrep.review_id,
                rp.reply_id,
                rp.reason,
                rp.description,
                rp.status,
                rp.admin_id,
                rp.admin_notes,
                rp.created_at,
                rp.updated_at,
                rrep.comment AS content,
                parent_review.rating AS rating,
                reporter.id AS reporter_student_id,
                reporter.first_name || ' ' || reporter.last_name AS reporter_name,
                reporter.email AS reporter_email,
                reply_author.first_name || ' ' || reply_author.last_name AS content_author_name,
                reply_author.email AS content_author_email
              FROM reply_reports rp
              JOIN review_replies rrep ON rp.reply_id = rrep.id
              JOIN reviews parent_review ON rrep.review_id = parent_review.id
              JOIN students reporter ON rp.reporter_id = reporter.id
              JOIN students reply_author ON rrep.student_id = reply_author.id
            ) t
            ORDER BY created_at DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `
        : await query`
            SELECT *
            FROM (
              SELECT 
                rr.id,
                'review'::text AS item_type,
                rr.review_id,
                NULL::text AS reply_id,
                rr.reason,
                rr.description,
                rr.status,
                rr.admin_id,
                rr.admin_notes,
                rr.created_at,
                rr.updated_at,
                r.comment AS content,
                r.rating AS rating,
                s.id AS reporter_student_id,
                s.first_name || ' ' || s.last_name AS reporter_name,
                s.email AS reporter_email,
                review_author.first_name || ' ' || review_author.last_name AS content_author_name,
                review_author.email AS content_author_email
              FROM review_reports rr
              JOIN reviews r ON rr.review_id = r.id
              JOIN students s ON rr.reporter_id = s.id
              JOIN students review_author ON r.student_id = review_author.id
              WHERE rr.status = ${status}

              UNION ALL

              SELECT
                rp.id,
                'reply'::text AS item_type,
                rrep.review_id,
                rp.reply_id,
                rp.reason,
                rp.description,
                rp.status,
                rp.admin_id,
                rp.admin_notes,
                rp.created_at,
                rp.updated_at,
                rrep.comment AS content,
                parent_review.rating AS rating,
                reporter.id AS reporter_student_id,
                reporter.first_name || ' ' || reporter.last_name AS reporter_name,
                reporter.email AS reporter_email,
                reply_author.first_name || ' ' || reply_author.last_name AS content_author_name,
                reply_author.email AS content_author_email
              FROM reply_reports rp
              JOIN review_replies rrep ON rp.reply_id = rrep.id
              JOIN reviews parent_review ON rrep.review_id = parent_review.id
              JOIN students reporter ON rp.reporter_id = reporter.id
              JOIN students reply_author ON rrep.student_id = reply_author.id
              WHERE rp.status = ${status}
            ) t
            ORDER BY created_at DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `
    const reports = reportsResult.rows.map((row: any) => ({
      id: row.id,
      type: row.item_type,
      reviewId: row.review_id,
      replyId: row.reply_id,
      reason: row.reason,
      description: row.description,
      status: row.status,
      adminId: row.admin_id,
      adminNotes: row.admin_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      review: {
        content: row.content,
        rating: row.rating
      },
      reporter: {
        id: row.reporter_student_id,
        name: row.reporter_name,
        email: row.reporter_email
      },
      reviewAuthor: {
        name: row.content_author_name,
        email: row.content_author_email
      }
    }))

    // Cache the results
    await CacheManager.set(cacheKey, reports, CACHE_TTL)

    return NextResponse.json({
      success: true,
      data: reports,
      cached: false
    })
  } catch (error) {
    console.error("Admin reports fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    let user = await getCurrentUserFromRequest(request)
    if (!user) {
      user = await getCurrentUserFromStackAuth()
    }
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reportId, status, adminNotes, type } = body

    if (!reportId || !status) {
      return NextResponse.json(
        { error: 'reportId and status are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      )
    }

    const updateReviewReport = () => query`
      UPDATE review_reports
      SET 
        status = ${status},
        admin_id = ${user.id},
        admin_notes = ${adminNotes || null},
        updated_at = NOW()
      WHERE id = ${reportId}
      RETURNING id, status, admin_notes, updated_at
    `

    const updateReplyReport = () => query`
      UPDATE reply_reports
      SET 
        status = ${status},
        admin_id = ${user.id},
        admin_notes = ${adminNotes || null},
        updated_at = NOW()
      WHERE id = ${reportId}
      RETURNING id, status, admin_notes, updated_at
    `

    // Update report (review or reply)
    let updateResult
    if (type === "reply") {
      updateResult = await updateReplyReport()
    } else if (type === "review") {
      updateResult = await updateReviewReport()
    } else {
      // Backward-compatible: try review_reports first, then reply_reports
      updateResult = await updateReviewReport()
      if (updateResult.rows.length === 0) {
        updateResult = await updateReplyReport()
      }
    }

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Invalidate cache - clear all report caches
    const cacheKeys = [
      'admin:reports:all:20:0',
      'admin:reports:all:50:0',
      'admin:reports:pending:20:0',
      'admin:reports:pending:50:0',
      'admin:reports:reviewed:20:0',
      'admin:reports:reviewed:50:0',
      'admin:reports:resolved:20:0',
      'admin:reports:resolved:50:0',
      'admin:reports:dismissed:20:0',
      'admin:reports:dismissed:50:0'
    ]
    await Promise.all(cacheKeys.map(key => CacheManager.del(key)))

    return NextResponse.json({
      success: true,
      data: updateResult.rows[0]
    })
  } catch (error) {
    console.error("Admin report update error:", error)
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    )
  }
}

