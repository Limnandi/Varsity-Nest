import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { ApiMiddleware } from '@/lib/api-middleware'

/**
 * Lightweight endpoint to fetch ratings and review counts for multiple accommodations
 * Used for real-time updates without fetching full accommodation data
 */
export const GET = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      const idsParam = searchParams.get('ids')
      
      if (!idsParam) {
        return NextResponse.json(
          { error: 'ids parameter required (comma-separated accommodation IDs)' },
          { status: 400 }
        )
      }

      const ids = idsParam.split(',').filter(id => id.trim()).map(id => id.trim())
      
      if (ids.length === 0) {
        return NextResponse.json({ data: [] })
      }

      if (ids.length > 100) {
        return NextResponse.json(
          { error: 'Maximum 100 accommodation IDs allowed per request' },
          { status: 400 }
        )
      }

      // Calculate ratings and review counts directly from reviews table for real-time accuracy
      // This ensures we always get the current state, not cached values
      const reviewsStats = await query`
        SELECT 
          accommodation_id,
          ROUND(COALESCE(AVG(rating), 0)::numeric, 0)::int as avg_rating,
          COUNT(*)::int as total_reviews
        FROM reviews
        WHERE accommodation_id = ANY(${ids}::text[])
        GROUP BY accommodation_id
      `

      // Build map from reviews stats
      const ratingsMap: Record<string, { rating: number, review_count: number }> = {}
      reviewsStats.rows.forEach((row: any) => {
        ratingsMap[row.accommodation_id] = {
          rating: row.avg_rating ?? 0,
          review_count: row.total_reviews ?? 0
        }
      })
      
      // Ensure all requested IDs are in the response (even if they have 0 reviews)
      // This handles cases where accommodations exist but have no reviews
      ids.forEach(id => {
        if (!(id in ratingsMap)) {
          ratingsMap[id] = { rating: 0, review_count: 0 }
        }
      })
      
      // Also update the accommodations table with these fresh values (async, don't wait)
      // This keeps the table in sync for other queries
      Promise.all(
        Object.entries(ratingsMap).map(([accId, stats]) =>
          query`
            UPDATE accommodations 
            SET 
              rating = ${stats.rating},
              review_count = ${stats.review_count},
              updated_at = NOW()
            WHERE id = ${accId}
          `.catch(err => {
            console.error(`Failed to sync ratings for ${accId}:`, err)
          })
        )
      ).catch(() => {
        // Ignore errors in background sync
      })

      const response = ApiMiddleware.createResponse(
        ratingsMap,
        "Ratings retrieved successfully"
      )
      
      // Short cache for real-time updates
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      
      return response
    } catch (error) {
      console.error('Error fetching ratings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch ratings', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      )
    }
  },
  {
    rateLimit: {
      windowMs: 60 * 1000, // 1 minute
      max: 200 // 200 requests per minute (for polling)
    },
    cors: true,
    requestSizeCheck: false
  }
)
