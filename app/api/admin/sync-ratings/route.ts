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
    
    // Get all accommodations
    const accommodationsResult = await query`
      SELECT id, name FROM accommodations WHERE is_active = true
    `
    
    const totalAccommodations = accommodationsResult.rows.length
    let updated = 0
    let skipped = 0
    const results = []
    
    for (const accommodation of accommodationsResult.rows) {
      const { id, name } = accommodation
      
      // Calculate stats for this accommodation
      const statsResult = await query`
        SELECT 
          ROUND(AVG(rating)::numeric, 0) as avg_rating,
          COUNT(*) as total_reviews
        FROM reviews 
        WHERE accommodation_id = ${id}
      `
      
      const avgRating = statsResult.rows[0]?.avg_rating || 0
      const totalReviews = statsResult.rows[0]?.total_reviews || 0
      
      // Update accommodation
      await query`
        UPDATE accommodations 
        SET 
          rating = ${avgRating},
          review_count = ${totalReviews},
          updated_at = NOW()
        WHERE id = ${id}
      `
      
      if (totalReviews > 0) {
        results.push({
          name,
          rating: avgRating,
          reviewCount: totalReviews,
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

