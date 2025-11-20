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

    // Defensive: ensure the token we have is a Paystack subscription code
    // If the stored token is an authorization code (AUTH_...), the subscription hasn't been created yet
    if (!subscriptionToken || typeof subscriptionToken !== 'string') {
      return NextResponse.json({ error: 'Subscription token required' }, { status: 400 })
    }

    if (subscriptionToken.startsWith('AUTH_')) {
      console.debug('[SUBSCRIPTION] Found authorization_code instead of subscription code for token:', subscriptionToken)
      return NextResponse.json({
        error: 'Subscription not created yet',
        details: 'Found authorization code (tokenization) instead of a subscription code. Subscription creation may be pending. Check payment_transactions.gatewayResponse for subscriptionCreation status.'
      }, { status: 404 })
    }

    // Get subscription details from Paystack API
    try {
      let subscription
      try {
        subscription = await PaystackAPIClient.getSubscription(subscriptionToken)
      } catch (paystackError) {
        // Log and capture full error for debugging
        console.error('[SUBSCRIPTION] Error calling Paystack.getSubscription:', paystackError instanceof Error ? paystackError.stack || paystackError.message : String(paystackError))
        captureException(paystackError instanceof Error ? paystackError : new Error(String(paystackError)), { component: 'subscription-management', action: 'getSubscription' })

        const errorMessage = paystackError instanceof Error ? (paystackError.message || '') : String(paystackError)

        // Normalize common "not found" cases from Paystack and return 404 to client
        if (errorMessage.toLowerCase().includes('not found') || errorMessage.includes('404') || errorMessage.toLowerCase().includes('does not exist') || errorMessage.toLowerCase().includes('no subscription')) {
          return NextResponse.json(
            { 
              error: 'Subscription not found in Paystack', 
              details: 'The subscription may not be available yet. Please try again in a few moments.',
              subscriptionToken 
            },
            { status: 404 }
          )
        }

        // Upstream error from Paystack (gateway), return 502 with message for debugging
        return NextResponse.json({ error: 'Upstream Paystack error', details: errorMessage }, { status: 502 })
      }

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

      // Normalize subscription dates to avoid 'Invalid Date' in the UI
      const normalizeDate = (val: any): string | null => {
        if (!val && val !== 0) return null
        // If timestamp (seconds) provided as number
        if (typeof val === 'number') {
          const d = new Date(val * 1000)
          if (!isNaN(d.getTime())) return d.toISOString()
          return null
        }
        // If string, try to parse
        if (typeof val === 'string') {
          const d = new Date(val)
          if (!isNaN(d.getTime())) return d.toISOString()
          // Try numeric string (unix seconds)
          const n = Number(val)
          if (!isNaN(n)) {
            const d2 = new Date(n * 1000)
            if (!isNaN(d2.getTime())) return d2.toISOString()
          }
          return null
        }

        return null
      }

      // Paystack may provide different fields depending on SDK/version
      const rawNextRun = (subscription as any).next_run_date ?? (subscription as any).next_payment_date ?? (subscription as any).next_charge_date ?? null
      const rawStartDate = (subscription as any).start_date ?? (subscription as any).billing_date ?? null

      const normalizedSubscription = {
        ...subscription,
        // keep original keys but ensure canonical ISO strings or null
        next_run_date: normalizeDate(rawNextRun) ?? normalizeDate(rawStartDate) ?? null,
        start_date: normalizeDate(rawStartDate) ?? null
      }

      return NextResponse.json({
        success: true,
        subscription: normalizedSubscription
      })
    } catch (err) {
      // This should be rare - log and escalate
      console.error('[SUBSCRIPTION] Unexpected error while fetching subscription:', err instanceof Error ? err.stack || err.message : String(err))
      captureException(err instanceof Error ? err : new Error(String(err)), { component: 'subscription-management', action: 'get' })
      return NextResponse.json({ error: 'Failed to get subscription details', details: err instanceof Error ? err.message : String(err) }, { status: 500 })
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

