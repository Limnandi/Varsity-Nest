import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from '@/lib/auth-server'
import { query } from '@/lib/database'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user from session (JWT) or fallback to StackAuth
    let user = await getCurrentUserFromRequest(request)
    if (!user) {
      user = await getCurrentUserFromStackAuth()
    }
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!user.isActive) {
      return NextResponse.json({ error: 'Account deactivated' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { is_published } = body

    // Ensure is_published is a boolean
    if (typeof is_published !== 'boolean') {
      return NextResponse.json({ error: 'Invalid is_published value. Must be true or false' }, { status: 400 })
    }
    
    // Explicitly convert to boolean to ensure it's true or false
    const publishStatus = Boolean(is_published)

    // Get provider ID
    const providerResult = await query`
      SELECT id FROM providers WHERE user_id = ${user.id} LIMIT 1
    `
    
    if (providerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 })
    }
    
    const providerId = providerResult.rows[0].id

    // Verify the accommodation belongs to the provider
    const accommodationResult = await query`
      SELECT id, provider_id, is_published, listing_status, published_at, unpublished_at
      FROM accommodations 
      WHERE id = ${id} AND provider_id = ${providerId} AND is_active = true
      LIMIT 1
    `

    if (accommodationResult.rows.length === 0) {
      return NextResponse.json({ error: 'Accommodation not found or not owned by provider' }, { status: 404 })
    }

    // Update the is_published column directly using SQL
    const now = new Date().toISOString()
    const listingStatus = publishStatus ? 'published' : 'unpublished'
    
    await query`
      UPDATE accommodations 
      SET 
        is_published = ${publishStatus},
        listing_status = ${listingStatus},
        published_at = ${publishStatus ? now : null},
        unpublished_at = ${!publishStatus ? now : null},
        updated_at = ${now}
      WHERE id = ${id}
    `

    // Fetch updated accommodation
    const updatedResult = await query`
      SELECT 
        id,
        is_published,
        listing_status,
        published_at,
        unpublished_at
      FROM accommodations 
      WHERE id = ${id}
      LIMIT 1
    `

    if (updatedResult.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to fetch updated accommodation' }, { status: 500 })
    }

    const updated = updatedResult.rows[0]

    // Ensure is_published is returned as a boolean
    const isPublished = Boolean(updated.is_published)

    return NextResponse.json({
      id: updated.id,
      is_published: isPublished,
      listing_status: updated.listing_status,
      published_at: updated.published_at,
      unpublished_at: updated.unpublished_at
    })
  } catch (error) {
    console.error('Error updating accommodation publication status:', error)
    return NextResponse.json(
      { error: 'Failed to update accommodation publication status' },
      { status: 500 }
    )
  }
}
