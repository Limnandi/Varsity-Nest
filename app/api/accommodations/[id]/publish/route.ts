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
    if (!user || (user.role !== 'provider' && user.role !== 'agent')) {
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

    // Get provider or agent ID
    let entityId: string
    let entityType: 'provider' | 'agent'
    
    if (user.role === 'provider') {
      const providerResult = await query`
        SELECT id FROM providers WHERE user_id = ${user.id} LIMIT 1
      `
      
      if (providerResult.rows.length === 0) {
        return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 })
      }
      
      entityId = providerResult.rows[0].id
      entityType = 'provider'
    } else {
      const agentResult = await query`
        SELECT id FROM agents WHERE user_id = ${user.id} LIMIT 1
      `
      
      if (agentResult.rows.length === 0) {
        return NextResponse.json({ error: 'Agent profile not found' }, { status: 404 })
      }
      
      entityId = agentResult.rows[0].id
      entityType = 'agent'
    }

    // Verify the accommodation belongs to the provider or agent
    const accommodationResult = entityType === 'provider'
      ? await query`
          SELECT id, provider_id, agent_id, is_published, listing_status, published_at, unpublished_at
          FROM accommodations 
          WHERE id = ${id} 
            AND provider_id = ${entityId} 
            AND is_active = true
          LIMIT 1
        `
      : await query`
          SELECT id, provider_id, agent_id, is_published, listing_status, published_at, unpublished_at
          FROM accommodations 
          WHERE id = ${id} 
            AND agent_id = ${entityId} 
            AND is_active = true
          LIMIT 1
        `

    if (accommodationResult.rows.length === 0) {
      return NextResponse.json({ error: 'Accommodation not found or not owned by you' }, { status: 404 })
    }

    // Check subscription status before allowing publish
    if (publishStatus === true) {
      // Check for active subscription - must have completed payment AND active status AND not expired
      let hasActiveSubscription = false
      
      if (entityType === 'provider') {
        // Check subscription status directly from providers table
        // The webhook sets subscription_status = 'active' and next_payment_date when payment succeeds
        const subscriptionCheck = await query`
          SELECT 
            p.subscription_status,
            p.next_payment_date,
            p.last_payment_date
          FROM providers p
          WHERE p.id = ${entityId}
          LIMIT 1
        `
        
        if (subscriptionCheck.rows.length > 0) {
          const row = subscriptionCheck.rows[0]
          const subscriptionStatus = row.subscription_status
          const nextPaymentDate = row.next_payment_date ? new Date(row.next_payment_date) : null
          const lastPaymentDate = row.last_payment_date ? new Date(row.last_payment_date) : null
          
          // Subscription is active if:
          // 1. subscription_status = 'active'
          // 2. next_payment_date is in the future (not expired)
          // 3. last_payment_date exists (payment was made)
          const isNotExpired = !nextPaymentDate || nextPaymentDate > new Date()
          const hasPayment = !!lastPaymentDate
          
          hasActiveSubscription = subscriptionStatus === 'active' && 
                                  isNotExpired && 
                                  hasPayment
          
          console.log(`[PUBLISH] Subscription check for provider ${entityId}:`, {
            subscriptionStatus,
            nextPaymentDate: nextPaymentDate?.toISOString(),
            lastPaymentDate: lastPaymentDate?.toISOString(),
            isNotExpired,
            hasPayment,
            hasActiveSubscription
          })
        }
      } else {
        // For agents, check for completed payment
        const paymentCheck = await query`
          SELECT 
            pt.id,
            pt.status,
            pt.created_at
          FROM payment_transactions pt
          WHERE pt.agent_id = ${entityId}
            AND pt.status = 'completed'
          ORDER BY pt.created_at DESC
          LIMIT 1
        `
        hasActiveSubscription = paymentCheck.rows.length > 0
      }

      if (!hasActiveSubscription) {
        // Count only PUBLISHED accommodations (excluding the one being published)
        // This ensures accurate pricing - we only count what's already published
        const accommodationCountResult = entityType === 'provider'
          ? await query`
              SELECT COUNT(*) as count
              FROM accommodations
              WHERE provider_id = ${entityId}
                AND is_active = true
                AND is_published = true
                AND id != ${id}
            `
          : await query`
              SELECT COUNT(*) as count
              FROM accommodations
              WHERE agent_id = ${entityId}
                AND is_active = true
                AND is_published = true
                AND id != ${id}
            `
        const publishedCount = Number(accommodationCountResult.rows[0]?.count || 0)
        
        // Add 1 for the current accommodation being published
        const totalAccommodationCount = publishedCount + 1
        
        return NextResponse.json({ 
          error: 'SUBSCRIPTION_REQUIRED',
          message: 'An active subscription is required to publish properties',
          accommodationCount: totalAccommodationCount
        }, { status: 402 })
      }
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
