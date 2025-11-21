import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { query } from "@/lib/database"
import { calculateProviderSubscriptionPrice } from "@/lib/payments"
import { getProviderSubscriptionSummary } from "@/lib/subscription"
import { determinePlanForPropertyCount } from "@/lib/subscription-plans"

export async function GET(request: NextRequest) {
  try {
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

    const entityType: 'provider' | 'agent' = user.role
    let entityId: string
    let subscriptionStatus: string
    let accommodationsCount = 0
    let isEligibleForTrial = false
    let hasUsedTrial = false
    let trialStartDate: Date | null = null
    let trialEndDate: Date | null = null

    if (entityType === 'provider') {
      const providerRow = await query`
        SELECT id
        FROM providers
        WHERE user_id = ${user.id}
        LIMIT 1
      `

      if (providerRow.rows.length === 0) {
        return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 })
      }

      entityId = providerRow.rows[0].id

      const summary = await getProviderSubscriptionSummary(entityId)
      subscriptionStatus = summary.status
      isEligibleForTrial = summary.isEligibleForTrial && summary.nextPlan.id === "starter"
      hasUsedTrial = !summary.isEligibleForTrial
      accommodationsCount = summary.publishedCount
      trialEndDate = summary.trialEndsAt ? new Date(summary.trialEndsAt) : null
      trialStartDate = hasUsedTrial && summary.trialEndsAt ? new Date(summary.trialEndsAt) : null

      const hasActiveSubscription = summary.status === "active" || summary.isInTrial
      const currentPlan = summary.plan ?? determinePlanForPropertyCount(summary.publishedCount || 1)
      const requiredPlan = determinePlanForPropertyCount(summary.publishedCount + 1)

      return NextResponse.json({
        hasActiveSubscription,
        subscriptionStatus: summary.status,
        accommodationsCount: summary.publishedCount,
        totalProperties: summary.totalCount,
        subscriptionAmount: currentPlan.price,
        entityId,
        entityType,
        planId: currentPlan.id,
        planLimit: currentPlan.maxProperties,
        requiredPlanId: requiredPlan.id,
        requiredPlanLimit: requiredPlan.maxProperties,
        requiredPlanAmount: requiredPlan.price,
        canCreateMore: summary.canCreateMore,
        canPublishMore: summary.canPublishMore,
        isEligibleForTrial,
        hasUsedTrial,
        trialStartDate: trialStartDate ? trialStartDate.toISOString() : null,
        trialEndDate: trialEndDate ? trialEndDate.toISOString() : null,
        isInTrial: summary.isInTrial
      })
    } else {
      const agentResult = await query`
        SELECT 
          a.id
        FROM agents a
        WHERE a.user_id = ${user.id}
        LIMIT 1
      `
      
      if (agentResult.rows.length === 0) {
        return NextResponse.json({ error: 'Agent profile not found' }, { status: 404 })
      }
      
      entityId = agentResult.rows[0].id
      subscriptionStatus = 'inactive'
      
      // Count only PUBLISHED accommodations (not all active ones)
      const publishedCountResult = await query`
        SELECT COUNT(*) as count
        FROM accommodations
        WHERE agent_id = ${entityId}
          AND is_active = true
          AND is_published = true
      `
      accommodationsCount = Number(publishedCountResult.rows[0]?.count || 0)
      
      // For agents, check for completed payment
      const paymentResult = await query`
        SELECT 
          pt.id,
          pt.amount,
          pt.status,
          pt.created_at
        FROM payment_transactions pt
        WHERE pt.agent_id = ${entityId}
          AND pt.status = 'completed'
        ORDER BY pt.created_at DESC
        LIMIT 1
      `
      const hasActiveSubscription = paymentResult.rows.length > 0 && 
        paymentResult.rows[0].status === 'completed'

      return NextResponse.json({
        hasActiveSubscription,
        subscriptionStatus,
        accommodationsCount,
        subscriptionAmount: calculateProviderSubscriptionPrice({ accommodationsCount: accommodationsCount + 1 }),
        entityId,
        entityType,
      })
    }
  } catch (error) {
    console.error('Error checking subscription:', error)
    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    )
  }
}

