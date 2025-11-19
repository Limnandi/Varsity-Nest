/**
 * Find Subscription by Email Endpoint
 * 
 * Finds a Paystack subscription for a customer by their email address
 * This is useful when subscriptionToken isn't set yet (e.g., after trial payment)
 */

import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { secureDb } from "@/lib/database-secure"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { PaystackAPIClient } from "@/lib/paystack-api-client"
import { captureException, captureMessage } from "@/lib/logging/config"

export async function GET(request: NextRequest) {
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

    // Get provider or agent email
    const entityType = user.role
    let customerEmail: string | null = null

    if (entityType === 'provider') {
      const [provider] = await secureDb.db
        .select({ contactEmail: schema.providers.contactEmail })
        .from(schema.providers)
        .where(eq(schema.providers.userId, user.id))
        .limit(1)

      if (!provider) {
        return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
      }

      customerEmail = provider.contactEmail
    } else { // agent
      const [agent] = await secureDb.db
        .select({ contactEmail: schema.agents.contactEmail })
        .from(schema.agents)
        .where(eq(schema.agents.userId, user.id))
        .limit(1)

      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
      }

      customerEmail = agent.contactEmail
    }

    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer email not found' }, { status: 404 })
    }

    // List subscriptions for this customer email
    // Note: Paystack listSubscriptions requires customer ID, not email
    // We need to find customer first, or use a different approach
    // For now, try to list all subscriptions and filter by customer email
    try {
      const subscriptions = await PaystackAPIClient.listSubscriptions({
        perPage: 50,
        page: 1
      })

      // Find subscription matching the customer email
      const matchingSubscription = subscriptions.find((sub: any) => 
        sub.customer?.email === customerEmail
      )

      if (matchingSubscription) {
        captureMessage('Subscription found by email', {
          level: 'info',
          component: 'subscription-finder',
          entityType,
          subscriptionCode: matchingSubscription.subscription_code
        })

        return NextResponse.json({
          success: true,
          subscriptionCode: matchingSubscription.subscription_code,
          subscription: matchingSubscription
        })
      }

      return NextResponse.json({
        success: false,
        message: 'No subscription found for this email'
      })
    } catch (listError) {
      // If listing fails, return error
      captureException(listError instanceof Error ? listError : new Error(String(listError)), {
        component: 'subscription-finder',
        action: 'listSubscriptions',
        customerEmail
      })
      
      return NextResponse.json({
        success: false,
        error: 'Failed to search for subscription',
        details: listError instanceof Error ? listError.message : String(listError)
      }, { status: 500 })
    }
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), {
      component: 'subscription-finder',
      action: 'findByEmail'
    })
    
    return NextResponse.json(
      { error: 'Failed to find subscription', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

