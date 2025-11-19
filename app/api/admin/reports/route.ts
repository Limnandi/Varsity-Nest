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

    // Build query
    let reportsQuery
    if (status === 'all') {
      reportsQuery = query`
        SELECT 
          rr.id,
          rr.review_id,
          rr.reason,
          rr.description,
          rr.status,
          rr.admin_id,
          rr.admin_notes,
          rr.created_at,
          rr.updated_at,
          r.comment AS review_content,
          r.rating AS review_rating,
          s.id AS reporter_student_id,
          s.first_name || ' ' || s.last_name AS reporter_name,
          s.email AS reporter_email,
          review_author.first_name || ' ' || review_author.last_name AS review_author_name,
          review_author.email AS review_author_email
        FROM review_reports rr
        JOIN reviews r ON rr.review_id = r.id
        JOIN students s ON rr.reporter_id = s.id
        JOIN students review_author ON r.student_id = review_author.id
        ORDER BY rr.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    } else {
      reportsQuery = query`
        SELECT 
          rr.id,
          rr.review_id,
          rr.reason,
          rr.description,
          rr.status,
          rr.admin_id,
          rr.admin_notes,
          rr.created_at,
          rr.updated_at,
          r.comment AS review_content,
          r.rating AS review_rating,
          s.id AS reporter_student_id,
          s.first_name || ' ' || s.last_name AS reporter_name,
          s.email AS reporter_email,
          review_author.first_name || ' ' || review_author.last_name AS review_author_name,
          review_author.email AS review_author_email
        FROM review_reports rr
        JOIN reviews r ON rr.review_id = r.id
        JOIN students s ON rr.reporter_id = s.id
        JOIN students review_author ON r.student_id = review_author.id
        WHERE rr.status = ${status}
        ORDER BY rr.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    }

    const reportsResult = await reportsQuery
    const reports = reportsResult.rows.map((row: any) => ({
      id: row.id,
      reviewId: row.review_id,
      reason: row.reason,
      description: row.description,
      status: row.status,
      adminId: row.admin_id,
      adminNotes: row.admin_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      review: {
        content: row.review_content,
        rating: row.review_rating
      },
      reporter: {
        id: row.reporter_student_id,
        name: row.reporter_name,
        email: row.reporter_email
      },
      reviewAuthor: {
        name: row.review_author_name,
        email: row.review_author_email
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
    const { reportId, status, adminNotes } = body

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

    // Update report
    const updateResult = await query`
      UPDATE review_reports
      SET 
        status = ${status},
        admin_id = ${user.id},
        admin_notes = ${adminNotes || null},
        updated_at = NOW()
      WHERE id = ${reportId}
      RETURNING id, status, admin_notes, updated_at
    `

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

