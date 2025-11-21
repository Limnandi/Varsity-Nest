import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from '@/lib/auth-server'
import { query } from '@/lib/database'
import { getProviderSubscriptionSummary } from '@/lib/subscription'

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
      if (entityType === 'provider') {
        const summary = await getProviderSubscriptionSummary(entityId)
        const isCurrentlyPublished = Boolean(accommodationResult.rows[0].is_published)
        const projectedPublishedCount = summary.publishedCount + (isCurrentlyPublished ? 0 : 1)
        const hasActiveSubscription = summary.status === 'active' || summary.isInTrial

        if (!summary.plan || !hasActiveSubscription) {
          return NextResponse.json({
            error: 'SUBSCRIPTION_REQUIRED',
            message: 'An active subscription is required to publish properties.',
            accommodationCount: projectedPublishedCount,
            requiredPlanId: summary.nextPlan.id,
            requiredPlanLimit: summary.nextPlan.maxProperties,
            requiredPlanAmount: summary.nextPlan.price,
          }, { status: 402 })
        }

        if (summary.plan.maxProperties !== null && projectedPublishedCount > summary.plan.maxProperties) {
          return NextResponse.json({
            error: 'SUBSCRIPTION_PLAN_LIMIT',
            message: `Your current plan allows up to ${summary.plan.maxProperties} published properties.`,
            planId: summary.plan.id,
            planLimit: summary.plan.maxProperties,
            requiredPlanId: summary.nextPlan.id,
            requiredPlanLimit: summary.nextPlan.maxProperties,
            requiredPlanAmount: summary.nextPlan.price,
            currentPublishedCount: summary.publishedCount,
          }, { status: 402 })
        }
      } else {
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
        const hasActiveSubscription = paymentCheck.rows.length > 0

        if (!hasActiveSubscription) {
          const accommodationCountResult = await query`
            SELECT COUNT(*) as count
            FROM accommodations
            WHERE agent_id = ${entityId}
              AND is_active = true
              AND is_published = true
              AND id != ${id}
          `
          const publishedCount = Number(accommodationCountResult.rows[0]?.count || 0)
          const totalAccommodationCount = publishedCount + 1
          
          return NextResponse.json({ 
            error: 'SUBSCRIPTION_REQUIRED',
            message: 'An active subscription is required to publish properties',
            accommodationCount: totalAccommodationCount
          }, { status: 402 })
        }
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
