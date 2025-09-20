import { NextResponse } from "next/server"
import { query } from "@/lib/database"
import { redis } from "@/lib/redis"

export async function GET() {
  const startedAt = Date.now()

  // App status
  const app = {
    status: "healthy" as const,
    timestamp: new Date().toISOString(),
  }

  // DB check
  let dbStatus: "healthy" | "unhealthy" = "unhealthy"
  let dbDuration = 0
  try {
    const dbStart = Date.now()
    await query`SELECT 1`
    dbDuration = Date.now() - dbStart
    dbStatus = "healthy"
  } catch {
    dbStatus = "unhealthy"
  }

  // Redis check
  let redisStatus: "healthy" | "unhealthy" = "unhealthy"
  let redisDuration = 0
  try {
    const rStart = Date.now()
    const pong = await (redis as any).ping?.()
    if (pong === "PONG" || typeof pong === "string") {
      redisStatus = "healthy"
    } else {
      // Some Redis clients return void; treat success if no error was thrown
      redisStatus = "healthy"
    }
    redisDuration = Date.now() - rStart
  } catch {
    redisStatus = "unhealthy"
  }

  const durationMs = Date.now() - startedAt

  const body = {
    app,
    db: {
      status: dbStatus,
      responseTimeMs: dbDuration,
    },
    redis: {
      status: redisStatus,
      responseTimeMs: redisDuration,
    },
    durationMs,
  }

  const status = dbStatus === "healthy" && redisStatus === "healthy" ? 200 : 503
  const res = NextResponse.json(body, { status })
  res.headers.set("Cache-Control", "no-store")
  res.headers.set("Server-Timing", `total;dur=${durationMs}`)
  res.headers.set("X-Response-Time", `${durationMs}ms`)
  return res
}


