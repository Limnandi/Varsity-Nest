/**
 * Get Subscription Details Endpoint
 * 
 * Retrieves subscription details from Paystack for providers and agents
 * Documentation: https://paystack.com/docs/api/#subscription
 */

import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { secureDb } from "@/lib/database-secure"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { PaystackAPIClient } from "@/lib/paystack-api-client"
import { captureException } from "@/lib/logging/config"

export async function GET(
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

    if (entityType === 'provider') {
      const [provider] = await secureDb.db
        .select({ id: schema.providers.id, subscriptionToken: schema.providers.subscriptionToken })
        .from(schema.providers)
        .where(eq(schema.providers.userId, user.id))
        .limit(1)

      if (!provider || provider.subscriptionToken !== subscriptionToken) {
        return NextResponse.json({ error: 'Subscription not found or access denied' }, { status: 404 })
      }
    } else { // agent
      const [agent] = await secureDb.db
        .select({ id: schema.agents.id, subscriptionToken: schema.agents.subscriptionToken })
        .from(schema.agents)
        .where(eq(schema.agents.userId, user.id))
        .limit(1)

      if (!agent || agent.subscriptionToken !== subscriptionToken) {
        return NextResponse.json({ error: 'Subscription not found or access denied' }, { status: 404 })
      }
    }

    // Get subscription details from Paystack API
    try {
      const subscription = await PaystackAPIClient.getSubscription(subscriptionToken)

      if (!subscription) {
        return NextResponse.json(
          { 
            error: 'Subscription not found in Paystack', 
            details: 'The subscription may not be available yet. Please try again in a few moments.',
            subscriptionToken 
          },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        subscription
      })
    } catch (paystackError) {
      // If subscription doesn't exist in Paystack yet (e.g., just created), return a more helpful error
      const errorMessage = paystackError instanceof Error ? paystackError.message : String(paystackError)
      
      // Check if it's a 404 or "not found" error
      if (errorMessage.includes('not found') || errorMessage.includes('404') || errorMessage.includes('does not exist') || errorMessage.includes('No subscription')) {
        return NextResponse.json(
          { 
            error: 'Subscription not found in Paystack', 
            details: 'The subscription may not be available yet. Please try again in a few moments.',
            subscriptionToken 
          },
          { status: 404 }
        )
      }
      
      // Re-throw other errors to be caught by outer catch
      throw paystackError
    }
  } catch (error) {
    captureException(
      error instanceof Error ? error : new Error(String(error)),
      { component: 'subscription-management', action: 'get' }
    )
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { error: 'Failed to get subscription details', details: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * Update Subscription Endpoint
 * 
 * Allows providers and agents to update their Paystack recurring subscriptions
 * Note: Paystack doesn't support direct subscription updates. Updates must be made to the plan.
 * Documentation: https://paystack.com/docs/api/#plan
 */
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

    // Parse request body
    const body = await request.json()
    const { amount, interval, name, description } = body

    // Validate at least one update parameter is provided
    if (!amount && !interval && !name && !description) {
      return NextResponse.json({ error: 'At least one update parameter is required' }, { status: 400 })
    }

    // Verify subscription belongs to user
    const entityType = user.role

    if (entityType === 'provider') {
      const [provider] = await secureDb.db
        .select({ id: schema.providers.id, subscriptionToken: schema.providers.subscriptionToken })
        .from(schema.providers)
        .where(eq(schema.providers.userId, user.id))
        .limit(1)

      if (!provider || provider.subscriptionToken !== subscriptionToken) {
        return NextResponse.json({ error: 'Subscription not found or access denied' }, { status: 404 })
      }
    } else { // agent
      const [agent] = await secureDb.db
        .select({ id: schema.agents.id, subscriptionToken: schema.agents.subscriptionToken })
        .from(schema.agents)
        .where(eq(schema.agents.userId, user.id))
        .limit(1)

      if (!agent || agent.subscriptionToken !== subscriptionToken) {
        return NextResponse.json({ error: 'Subscription not found or access denied' }, { status: 404 })
      }
    }

    // Get subscription to find plan code
    const subscription = await PaystackAPIClient.getSubscription(subscriptionToken)
    const planCode = subscription.plan?.plan_code

    if (!planCode) {
      return NextResponse.json({ error: 'Plan code not found for subscription' }, { status: 404 })
    }

    // Build update object for plan
    const planUpdates: any = {}
    if (amount !== undefined) planUpdates.amount = amount // Amount in ZAR (will be converted to kobo)
    if (interval !== undefined) {
      const validIntervals = ["hourly", "daily", "weekly", "monthly", "quarterly", "biannually", "annually"]
      if (validIntervals.includes(interval)) {
        planUpdates.interval = interval
      }
    }
    if (name !== undefined) planUpdates.name = name
    if (description !== undefined) planUpdates.description = description
    planUpdates.update_existing_subscriptions = true // Update all subscriptions using this plan

    // Update plan via Paystack API (this updates all subscriptions using the plan)
    await PaystackAPIClient.updatePlan(planCode, planUpdates)

    // Get updated subscription details
    const updatedSubscription = await PaystackAPIClient.getSubscription(subscriptionToken)

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription
    })
  } catch (error) {
    captureException(
      error instanceof Error ? error : new Error(String(error)),
      { component: 'subscription-management', action: 'update' }
    )
    
    return NextResponse.json(
      { error: 'Failed to update subscription', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

