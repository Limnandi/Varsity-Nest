/**
 * Pause Subscription Endpoint
 * 
 * Allows providers and agents to pause their Paystack recurring subscriptions
 * Note: Paystack doesn't have a direct pause method. We disable the subscription instead.
 * Documentation: https://paystack.com/docs/api/#subscription
 */

import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { secureDb } from "@/lib/database-secure"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { PaystackAPIClient } from "@/lib/paystack-api-client"
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
    let entityRecord: { id: string } | null = null

    if (entityType === 'provider') {
      const [provider] = await secureDb.db
        .select({ id: schema.providers.id, subscriptionToken: schema.providers.subscriptionToken })
        .from(schema.providers)
        .where(eq(schema.providers.userId, user.id))
        .limit(1)

      if (!provider || provider.subscriptionToken !== subscriptionToken) {
        return NextResponse.json({ error: 'Subscription not found or access denied' }, { status: 404 })
      }

      entityRecord = provider
    } else { // agent
      const [agent] = await secureDb.db
        .select({ id: schema.agents.id, subscriptionToken: schema.agents.subscriptionToken })
        .from(schema.agents)
        .where(eq(schema.agents.userId, user.id))
        .limit(1)

      if (!agent || agent.subscriptionToken !== subscriptionToken) {
        return NextResponse.json({ error: 'Subscription not found or access denied' }, { status: 404 })
      }

      entityRecord = agent
    }

    // Get subscription to retrieve email token
    const subscription = await PaystackAPIClient.getSubscription(subscriptionToken)
    const emailToken = subscription.email_token

    if (!emailToken) {
      return NextResponse.json({ error: 'Email token not found for subscription' }, { status: 404 })
    }

    // Disable subscription via Paystack API (Paystack doesn't have pause, so we disable)
    // Note: This will prevent future charges but won't cancel immediately
    await PaystackAPIClient.disableSubscription(subscriptionToken, emailToken)
    
    // Get updated subscription details
    const updatedSubscription = await PaystackAPIClient.getSubscription(subscriptionToken)

    // Update database
    if (entityType === 'provider' && entityRecord) {
      await secureDb.db
        .update(schema.providers)
        .set({
          subscriptionStatus: 'inactive' // Paused subscriptions are considered inactive
        })
        .where(eq(schema.providers.id, entityRecord.id))
    } else {
      // For agents, we can add subscription status tracking if needed
    }

    captureMessage('Subscription paused', {
      level: 'info',
      component: 'subscription-management',
      subscriptionToken,
      entityType
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

