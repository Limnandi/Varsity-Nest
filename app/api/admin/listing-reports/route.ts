import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { query } from "@/lib/database"
import { CacheManager } from "@/lib/cache"

const CACHE_TTL = 60

const VALID_STATUSES = ["pending", "investigating", "resolved", "dismissed", "all"] as const

export async function GET(request: NextRequest) {
  try {
    let user = await getCurrentUserFromRequest(request)
    if (!user) user = await getCurrentUserFromStackAuth()

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = (searchParams.get("status") || "pending") as (typeof VALID_STATUSES)[number]
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const cacheKey = `admin:listing_reports:${status}:${limit}:${offset}`
    const cached = await CacheManager.get(cacheKey)
    if (cached) {
      return NextResponse.json({ success: true, data: cached, cached: true })
    }

    const result =
      status === "all"
        ? await query`
            SELECT
              rp.id,
              rp.reported_accommodation_id,
              rp.report_type,
              rp.description,
              rp.status,
              rp.admin_id,
              rp.admin_notes,
              rp.created_at,
              rp.updated_at,
              a.name AS accommodation_name,
              a.address AS accommodation_address,
              COALESCE(rp.reporter_name, u.first_name || ' ' || u.last_name) AS reporter_name,
              COALESCE(rp.reporter_email, u.email) AS reporter_email,
              COALESCE(rp.reporter_phone, u.phone) AS reporter_phone,
              u.id AS reporter_user_id,
              u.role AS reporter_role
            FROM reports rp
            JOIN accommodations a ON rp.reported_accommodation_id = a.id
            LEFT JOIN users u ON rp.reporter_id = u.id
            ORDER BY rp.created_at DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `
        : await query`
            SELECT
              rp.id,
              rp.reported_accommodation_id,
              rp.report_type,
              rp.description,
              rp.status,
              rp.admin_id,
              rp.admin_notes,
              rp.created_at,
              rp.updated_at,
              a.name AS accommodation_name,
              a.address AS accommodation_address,
              COALESCE(rp.reporter_name, u.first_name || ' ' || u.last_name) AS reporter_name,
              COALESCE(rp.reporter_email, u.email) AS reporter_email,
              COALESCE(rp.reporter_phone, u.phone) AS reporter_phone,
              u.id AS reporter_user_id,
              u.role AS reporter_role
            FROM reports rp
            JOIN accommodations a ON rp.reported_accommodation_id = a.id
            LEFT JOIN users u ON rp.reporter_id = u.id
            WHERE rp.status = ${status}
            ORDER BY rp.created_at DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `

    const data = result.rows.map((row: any) => ({
      id: row.id,
      accommodationId: row.reported_accommodation_id,
      accommodationName: row.accommodation_name,
      accommodationAddress: row.accommodation_address,
      reportType: row.report_type,
      description: row.description,
      status: row.status,
      adminId: row.admin_id,
      adminNotes: row.admin_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      reporter: {
        userId: row.reporter_user_id,
        role: row.reporter_role,
        name: row.reporter_name,
        email: row.reporter_email,
        phone: row.reporter_phone,
      },
    }))

    await CacheManager.set(cacheKey, data, CACHE_TTL)
    return NextResponse.json({ success: true, data, cached: false })
  } catch (error) {
    console.error("Admin listing reports fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch listing reports" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    let user = await getCurrentUserFromRequest(request)
    if (!user) user = await getCurrentUserFromStackAuth()

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reportId, status, adminNotes } = body || {}

    if (!reportId || !status) {
      return NextResponse.json({ error: "reportId and status are required" }, { status: 400 })
    }

    const validStatuses = ["pending", "investigating", "resolved", "dismissed"] as const
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: " + validStatuses.join(", ") },
        { status: 400 },
      )
    }

    const update = await query`
      UPDATE reports
      SET
        status = ${status},
        admin_id = ${user.id},
        admin_notes = ${adminNotes || null},
        updated_at = NOW()
      WHERE id = ${reportId}
      RETURNING id, status, admin_notes, updated_at
    `

    if (update.rows.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Invalidate cache (common keys)
    const cacheKeys = [
      "admin:listing_reports:all:50:0",
      "admin:listing_reports:pending:50:0",
      "admin:listing_reports:investigating:50:0",
      "admin:listing_reports:resolved:50:0",
      "admin:listing_reports:dismissed:50:0",
    ]
    await Promise.all(cacheKeys.map((k) => CacheManager.del(k)))

    return NextResponse.json({ success: true, data: update.rows[0] })
  } catch (error) {
    console.error("Admin listing report update error:", error)
    return NextResponse.json({ error: "Failed to update listing report" }, { status: 500 })
  }
}

