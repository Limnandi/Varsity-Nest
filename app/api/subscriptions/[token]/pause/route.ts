/**
 * Pause Subscription Endpoint
 * 
 * Allows providers and agents to pause their PayFast recurring subscriptions
 * Documentation: https://developers.payfast.co.za/documentation/#recurring-billing
 */

import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { secureDb } from "@/lib/database-secure"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { PayFastAPIClient } from "@/lib/payfast-api-client"
import { captureException, captureMessage } from "@/lib/logging/config"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Authenticate user
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

    const { token } = await params
    const subscriptionToken = token
    if (!subscriptionToken) {
      return NextResponse.json({ error: 'Subscription token required' }, { status: 400 })
    }

    // Verify subscription belongs to user
    const entityType = user.role
    let subscription: any = null

    if (entityType === 'provider') {
      const [provider] = await secureDb.db
        .select({ id: schema.providers.id, subscriptionToken: schema.providers.subscriptionToken })
        .from(schema.providers)
        .where(eq(schema.providers.userId, user.id))
        .limit(1)

      if (!provider || provider.subscriptionToken !== subscriptionToken) {
        return NextResponse.json({ error: 'Subscription not found or access denied' }, { status: 404 })
      }

      subscription = provider
    } else { // agent
      const [agent] = await secureDb.db
        .select({ id: schema.agents.id, subscriptionToken: schema.agents.subscriptionToken })
        .from(schema.agents)
        .where(eq(schema.agents.userId, user.id))
        .limit(1)

      if (!agent || agent.subscriptionToken !== subscriptionToken) {
        return NextResponse.json({ error: 'Subscription not found or access denied' }, { status: 404 })
      }

      subscription = agent
    }

    // Parse request body for optional cycles parameter
    const body = await request.json().catch(() => ({}))
    const cycles = body.cycles || 0 // 0 = indefinite pause

    // Pause subscription via PayFast API
    const updatedSubscription = await PayFastAPIClient.pauseSubscription(subscriptionToken, cycles)

    // Update database
    if (entityType === 'provider') {
      await secureDb.db
        .update(schema.providers)
        .set({
          subscriptionStatus: 'inactive' // Paused subscriptions are considered inactive
        })
        .where(eq(schema.providers.id, subscription.id))
    } else {
      // For agents, we can add subscription status tracking if needed
    }

    captureMessage('Subscription paused', {
      level: 'info',
      component: 'subscription-management',
      subscriptionToken,
      entityType,
      cycles
    })

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription
    })
  } catch (error) {
    captureException(
      error instanceof Error ? error : new Error(String(error)),
      { component: 'subscription-management', action: 'pause' }
    )
    
    return NextResponse.json(
      { error: 'Failed to pause subscription', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

