import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { query } from "@/lib/database"
import { calculateProviderSubscriptionPrice } from "@/lib/payments"

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

    const entityType = user.role
    let entityId: string
    let subscriptionStatus: string
    let accommodationsCount: number = 0

    if (entityType === 'provider') {
      const providerResult = await query`
        SELECT 
          p.id,
          p.subscription_status
        FROM providers p
        WHERE p.user_id = ${user.id}
        LIMIT 1
      `
      
      if (providerResult.rows.length === 0) {
        return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 })
      }
      
      entityId = providerResult.rows[0].id
      subscriptionStatus = providerResult.rows[0].subscription_status || 'inactive'
      
      // Count only PUBLISHED accommodations (not all active ones)
      const publishedCountResult = await query`
        SELECT COUNT(*) as count
        FROM accommodations
        WHERE provider_id = ${entityId}
          AND is_active = true
          AND is_published = true
      `
      accommodationsCount = Number(publishedCountResult.rows[0]?.count || 0)
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
    }

    // Check for active subscription - must have completed payment AND active status AND not expired
    let hasActiveSubscription = false
    
    if (entityType === 'provider') {
      const subscriptionCheck = await query`
        SELECT 
          p.subscription_status,
          p.next_payment_date,
          pt.id,
          pt.amount,
          pt.status,
          pt.created_at
        FROM providers p
        LEFT JOIN payment_transactions pt ON pt.provider_id = p.id
          AND pt.status = 'completed'
        WHERE p.id = ${entityId}
        ORDER BY pt.created_at DESC
        LIMIT 1
      `
      
      if (subscriptionCheck.rows.length > 0) {
        const row = subscriptionCheck.rows[0]
        const subscriptionStatus = row.subscription_status
        const nextPaymentDate = row.next_payment_date ? new Date(row.next_payment_date) : null
        const hasCompletedPayment = row.status === 'completed'
        const isNotExpired = !nextPaymentDate || nextPaymentDate > new Date()
        
        hasActiveSubscription = hasCompletedPayment && 
                                subscriptionStatus === 'active' && 
                                isNotExpired
      }
    } else {
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
      hasActiveSubscription = paymentResult.rows.length > 0 && 
        paymentResult.rows[0].status === 'completed'
    }

    // Calculate subscription price
    const subscriptionAmount = calculateProviderSubscriptionPrice({
      accommodationsCount: accommodationsCount + 1,
      wantsFeatured: false
    })

    return NextResponse.json({
      hasActiveSubscription,
      subscriptionStatus,
      accommodationsCount,
      subscriptionAmount,
      entityId,
      entityType
    })
  } catch (error) {
    console.error('Error checking subscription:', error)
    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    )
  }
}

