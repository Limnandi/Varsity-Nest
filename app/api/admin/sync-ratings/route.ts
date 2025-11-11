import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/stackauth"
import { query } from "@/lib/database"

/**
 * Admin endpoint to sync accommodation ratings and review counts
 * POST /api/admin/sync-ratings
 */
export async function POST(_request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    console.log('[ADMIN] Starting accommodation ratings sync...')
    
    // Optimized: Get all accommodations and their stats in batch queries (prevents N+1)
    const accommodationsResult = await query`
      SELECT id, name FROM accommodations WHERE is_active = true
    `
    
    const totalAccommodations = accommodationsResult.rows.length
    
    if (totalAccommodations === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active accommodations found',
        total: 0,
        updated: 0,
        skipped: 0,
        results: []
      })
    }
    
    const accommodationIds = accommodationsResult.rows.map((row: { id: string }) => row.id)
    
    // Batch query: Get all stats for all accommodations in one query
    // For empty array, return empty result
    if (accommodationIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No accommodations to sync',
        stats: { total: 0, updated: 0, skipped: 0 },
        results: []
      })
    }
    
    // Use unnest to convert array to rows for IN clause
    const statsResult = await query`
      SELECT 
        accommodation_id,
        ROUND(AVG(rating)::numeric, 0) as avg_rating,
        COUNT(*) as total_reviews
      FROM reviews 
      WHERE accommodation_id IN (
        SELECT unnest(${accommodationIds}::text[])
      )
      GROUP BY accommodation_id
    `
    
    // Create a map of accommodation_id -> stats for quick lookup
    const statsMap = new Map(
      statsResult.rows.map((row: { accommodation_id: string; avg_rating: number | null; total_reviews: string | number }) => [
        row.accommodation_id,
        {
          avgRating: row.avg_rating || 0,
          totalReviews: parseInt(String(row.total_reviews)) || 0
        }
      ])
    )
    
    // Batch update: Update all accommodations in one query using CASE statements
    const accommodationUpdates = accommodationsResult.rows.map((acc: { id: string; name: string }) => ({
      id: acc.id,
      name: acc.name,
      stats: statsMap.get(acc.id) || { avgRating: 0, totalReviews: 0 }
    }))
    
    // Update all accommodations in a single query using array aggregation
    if (accommodationUpdates.length > 0) {
      // Use a more efficient approach: update in batches or use a single query with CASE
      // For large datasets, we'll batch update in chunks of 100
      const BATCH_SIZE = 100
      for (let i = 0; i < accommodationUpdates.length; i += BATCH_SIZE) {
        const batch = accommodationUpdates.slice(i, i + BATCH_SIZE)
        
        // Build dynamic UPDATE query for batch
        const updateQueries = batch.map((acc: { id: string; stats: { avgRating: number; totalReviews: number } }) => 
          query`
            UPDATE accommodations 
            SET 
              rating = ${acc.stats.avgRating},
              review_count = ${acc.stats.totalReviews},
              updated_at = NOW()
            WHERE id = ${acc.id}
          `
        )
        
        await Promise.all(updateQueries)
      }
    }
    
    let updated = 0
    let skipped = 0
    const results = []
    
    for (const acc of accommodationUpdates) {
      if (acc.stats.totalReviews > 0) {
        results.push({
          name: acc.name,
          rating: acc.stats.avgRating,
          reviewCount: acc.stats.totalReviews,
          status: 'updated'
        })
        updated++
      } else {
        skipped++
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Ratings sync completed',
      stats: {
        total: totalAccommodations,
        updated,
        skipped
      },
      results: results.slice(0, 20) // Return first 20 for display
    })
    
  } catch (error) {
    console.error('[ADMIN] Error syncing ratings:', error)
    return NextResponse.json(
      { 
        error: 'Failed to sync ratings',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// Also allow GET to check sync status
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Get accommodations with mismatched ratings
    const mismatchResult = await query`
      SELECT 
        a.id,
        a.name,
        a.rating as stored_rating,
        a.review_count as stored_count,
        COALESCE(ROUND(AVG(r.rating)::numeric, 0), 0) as calculated_rating,
        COUNT(r.id) as calculated_count
      FROM accommodations a
      LEFT JOIN reviews r ON a.id = r.accommodation_id
      WHERE a.is_active = true
      GROUP BY a.id, a.name, a.rating, a.review_count
      HAVING 
        a.rating != COALESCE(ROUND(AVG(r.rating)::numeric, 0), 0)
        OR a.review_count != COUNT(r.id)
      LIMIT 50
    `

    return NextResponse.json({
      needsSync: mismatchResult.rows.length > 0,
      mismatchedAccommodations: mismatchResult.rows,
      count: mismatchResult.rows.length
    })
    
  } catch (error) {
    console.error('[ADMIN] Error checking sync status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check sync status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

