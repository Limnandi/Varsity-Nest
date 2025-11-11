import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/stackauth"
import { getPoolStats, checkPoolHealth } from "@/lib/database/connection"

/**
 * Admin endpoint to check database connection pool statistics
 * GET /api/admin/pool-stats
 */
export async function GET(_request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const stats = getPoolStats()
    const health = await checkPoolHealth()

    return NextResponse.json({
      success: true,
      poolStats: stats,
      health,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[ADMIN] Error fetching pool stats:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch pool stats',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

