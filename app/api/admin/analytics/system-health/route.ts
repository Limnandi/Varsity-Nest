import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    let databaseStatus: "online" | "degraded" | "offline" = "offline"
    try {
      await query`SELECT 1`
      databaseStatus = "online"
    } catch (error) {
      console.error("Database connection test failed:", error)
      databaseStatus = "offline"
    }

    // Simulate API latency (in a real app, you'd measure actual API response times)
    const apiLatency = Math.floor(Math.random() * 50) + 10 // 10-60ms
    const latencyStatus = apiLatency < 30 ? "good" : apiLatency < 50 ? "average" : "poor"

    // Calculate error rate (simulated - in real app, track actual errors)
    const errorRate = Math.random() * 5 // 0-5% error rate
    const errorStatus = errorRate < 1 ? "good" : errorRate < 3 ? "average" : "poor"

    // Calculate uptime (simulated - in real app, track actual uptime)
    const uptimePercentage = 99.5 + (Math.random() * 0.5) // 99.5-100%
    const uptimeStatus = uptimePercentage >= 99.9 ? "good" : uptimePercentage >= 99.5 ? "average" : "poor"

    const systemHealth = {
      apiLatency: {
        average: apiLatency,
        status: latencyStatus,
      },
      errorRate: {
        rate: Number(errorRate.toFixed(2)),
        status: errorStatus,
      },
      database: {
        status: databaseStatus,
      },
      uptime: {
        percentage: Number(uptimePercentage.toFixed(2)),
        status: uptimeStatus,
      },
    }

    return NextResponse.json(systemHealth)
  } catch (error) {
    console.error("System health error:", error)
    return NextResponse.json(
      { error: "Failed to fetch system health data" },
      { status: 500 }
    )
  }
}
