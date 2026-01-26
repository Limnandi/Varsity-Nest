import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { query } from "@/lib/database"
import { redis } from "@/lib/redis"
import { CacheManager } from "@/lib/cache"

const VALID_REASONS = ["location", "images", "pricing", "owner", "safety", "other"] as const

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim()
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  // NextRequest.ip can be undefined depending on runtime / proxy
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (request as any).ip || null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: accommodationId } = await params
    const body = await request.json().catch(() => ({}))
    const reason = String(body?.reason || "")
    const description = typeof body?.description === "string" ? body.description : ""
    const reporter = body?.reporter || {}

    if (!VALID_REASONS.includes(reason as (typeof VALID_REASONS)[number])) {
      return NextResponse.json(
        { error: "Invalid reason. Must be one of: " + VALID_REASONS.join(", ") },
        { status: 400 },
      )
    }

    if (description && description.length > 1000) {
      return NextResponse.json({ error: "Description is too long (max 1000)." }, { status: 400 })
    }

    const reporterName = typeof reporter?.name === "string" ? reporter.name.trim() : ""
    const reporterEmail = typeof reporter?.email === "string" ? reporter.email.trim() : ""
    const reporterPhone = typeof reporter?.phone === "string" ? reporter.phone.trim() : ""

    if (reporterName.length > 120) {
      return NextResponse.json({ error: "Reporter name is too long (max 120)." }, { status: 400 })
    }
    if (reporterEmail.length > 254) {
      return NextResponse.json({ error: "Reporter email is too long (max 254)." }, { status: 400 })
    }
    if (reporterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)) {
      return NextResponse.json({ error: "Invalid reporter email address." }, { status: 400 })
    }
    if (reporterPhone.length > 50) {
      return NextResponse.json({ error: "Reporter phone is too long (max 50)." }, { status: 400 })
    }

    // Optional auth (anyone can report)
    let user = await getCurrentUserFromRequest(request)
    if (!user) user = await getCurrentUserFromStackAuth()

    const ip = getClientIp(request)
    const identity = user?.id ? `user:${user.id}` : ip ? `ip:${ip}` : "anon"

    // Rate limit: 20 listing reports per hour per identity (best-effort)
    const rateLimitKey = `listing_report:rate_limit:${identity}`
    const dupKey = `listing_report:dup:${identity}:${accommodationId}`
    try {
      const recent = await redis.get(rateLimitKey)
      const count = recent ? Number.parseInt(recent as string) : 0
      if (count >= 20) {
        return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
      }

      // Duplicate prevention (fast)
      const already = await redis.get(dupKey)
      if (already) {
        return NextResponse.json({ error: "You have already reported this listing recently." }, { status: 400 })
      }
    } catch (redisError) {
      console.error("Listing report rate-limit/dup check failed (continuing):", redisError)
    }

    // Ensure listing exists
    const exists = await query`
      SELECT id FROM accommodations WHERE id = ${accommodationId} LIMIT 1
    `
    if (exists.rows.length === 0) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    const insert = await query`
      INSERT INTO reports (
        reporter_id,
        reported_accommodation_id,
        report_type,
        description,
        reporter_name,
        reporter_email,
        reporter_phone
      )
      VALUES (
        ${user?.id || null},
        ${accommodationId},
        ${reason},
        ${description || ""},
        ${reporterName || null},
        ${reporterEmail || null},
        ${reporterPhone || null}
      )
      RETURNING id, report_type, status, created_at
    `

    // Update rate limit + duplicate marker (best-effort)
    try {
      await redis.incr(rateLimitKey)
      await redis.expire(rateLimitKey, 3600)
      await redis.set(dupKey, "1", { ex: 7 * 24 * 60 * 60 })
    } catch (redisError) {
      console.error("Listing report rate-limit/dup set failed (continuing):", redisError)
    }

    // Invalidate listing reports admin cache
    const cacheKeys = [
      "admin:listing_reports:all:50:0",
      "admin:listing_reports:pending:50:0",
      "admin:listing_reports:investigating:50:0",
      "admin:listing_reports:resolved:50:0",
      "admin:listing_reports:dismissed:50:0",
    ]
    await Promise.all(cacheKeys.map((k) => CacheManager.del(k)))

    return NextResponse.json({ success: true, report: insert.rows[0] })
  } catch (error) {
    console.error("Listing report error:", error)
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 })
  }
}

