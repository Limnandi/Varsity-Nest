/**
 * Generate Subscription Management Link Endpoint
 * 
 * Generates a Paystack subscription management link that allows customers to:
 * - Change their payment card
 * - Cancel their subscription
 * 
 * Documentation: https://paystack.com/docs/api/subscription/#generate-update-subscription-link
 */

import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { secureDb } from "@/lib/database-secure"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { PaystackAPIClient } from "@/lib/paystack-api-client"
import { captureException, captureMessage } from "@/lib/logging/config"

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

    // Generate management link from Paystack
    const managementLinkData = await PaystackAPIClient.generateSubscriptionManagementLink(subscriptionToken)
    
    captureMessage('Subscription management link generated', {
      level: 'info',
      component: 'subscription-management',
      action: 'generateManagementLink',
      entityType,
      entityId: subscription.id
    })

    return NextResponse.json({
      success: true,
      link: managementLinkData.link || managementLinkData,
      message: 'Management link generated successfully'
    })
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), {
      component: 'subscription-management',
      action: 'generateManagementLink'
    })
    
    return NextResponse.json(
      { error: 'Failed to generate management link', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

