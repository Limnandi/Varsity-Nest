import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/stackauth"
import { secureDb } from "@/lib/database-secure"
import * as schema from "@/lib/schema"
import { eq, desc } from "drizzle-orm"
import { inferPlanFromAmount, SubscriptionPlanId } from "@/lib/subscription-plans"

/**
 * Extract planId from payment transaction's gatewayResponse or customData
 * Falls back to inferring from amount if not found
 */
function extractPlanIdFromPayment(
  gatewayResponse: any,
  amount: number
): SubscriptionPlanId | null {
  // Try to get planId from gatewayResponse.customData
  const customData = gatewayResponse?.customData || gatewayResponse?.custom_data
  if (customData?.planId) {
    const planId = customData.planId as string
    if (planId === 'starter' || planId === 'growth' || planId === 'scale') {
      return planId as SubscriptionPlanId
    }
  }

  // Try to get from metadata
  if (gatewayResponse?.metadata?.planId) {
    const planId = gatewayResponse.metadata.planId as string
    if (planId === 'starter' || planId === 'growth' || planId === 'scale') {
      return planId as SubscriptionPlanId
    }
  }

  // Fallback: infer from amount
  const inferredPlan = inferPlanFromAmount(amount)
  return inferredPlan.id
}

/**
 * Fallback endpoint to activate subscription if webhook hasn't been called yet
 * This ensures subscription is always activated after successful payment
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get agent ID from database based on user ID
    const userId = session.user.id
    
    const [agent] = await secureDb.db
      .select({ id: schema.agents.id })
      .from(schema.agents)
      .where(eq(schema.agents.userId, userId))
      .limit(1)

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const agentId = agent.id

    // Find the most recent payment transaction (pending or completed)
    // If user was redirected from Paystack success page, payment is likely successful but webhook hasn't been called yet
    const [latestPayment] = await secureDb.db
      .select({
        id: schema.paymentTransactions.id,
        amount: schema.paymentTransactions.amount,
        status: schema.paymentTransactions.status,
        paymentDate: schema.paymentTransactions.paymentDate,
        createdAt: schema.paymentTransactions.createdAt,
        pfPaymentId: schema.paymentTransactions.pfPaymentId,
        mPaymentId: schema.paymentTransactions.mPaymentId,
      })
      .from(schema.paymentTransactions)
      .where(
        eq(schema.paymentTransactions.agentId, agentId)
      )
      .orderBy(desc(schema.paymentTransactions.createdAt))
      .limit(1)

    if (!latestPayment) {
      return NextResponse.json({ 
        error: "No payment found",
        message: "No payment transactions found"
      }, { status: 404 })
    }

    // If payment is still pending but user was redirected from Paystack success page, mark it as completed
    // This handles the case where webhook hasn't been called yet
    if (latestPayment.status === 'pending') {
      const paymentDate = latestPayment.paymentDate || latestPayment.createdAt || new Date()
      
      await secureDb.db
        .update(schema.paymentTransactions)
        .set({
          status: 'completed',
          paymentDate: paymentDate,
        })
        .where(eq(schema.paymentTransactions.id, latestPayment.id))
      
      // Update the local reference to reflect the change
      latestPayment.status = 'completed' as const
      latestPayment.paymentDate = paymentDate
    }

    // Ensure we have a completed payment for subscription activation
    if (latestPayment.status !== 'completed') {
      return NextResponse.json({ 
        error: "Payment not completed",
        message: "Payment is still processing. Please wait a moment and refresh."
      }, { status: 400 })
    }

    const completedPayment = latestPayment

    // Check if subscription is already active
    const [currentAgent] = await secureDb.db
      .select({
        subscriptionStatus: schema.agents.subscriptionStatus,
        nextPaymentDate: schema.agents.nextPaymentDate,
      })
      .from(schema.agents)
      .where(eq(schema.agents.id, agentId))
      .limit(1)

    if (currentAgent?.subscriptionStatus === 'active') {
      return NextResponse.json({ 
        message: "Subscription already active",
        subscriptionStatus: 'active'
      })
    }

    // Fetch stored gatewayResponse for this payment to determine if this was a tokenization (trial) flow
    const [txnRow] = await secureDb.db
      .select({ gatewayResponse: schema.paymentTransactions.gatewayResponse })
      .from(schema.paymentTransactions)
      .where(eq(schema.paymentTransactions.id, latestPayment.id))
      .limit(1)

    const gw = (txnRow?.gatewayResponse || {}) as Record<string, any>
    const isTokenization = gw.isTokenization === true || gw.is_tokenization === true || gw.trialPaymentSetup === true || gw.trialActivated === true
    const trialEndISO = gw.trialEndDate || gw.trial_end_date || gw.trialEnd || gw.trialEndDate || null

    // Extract planId from payment transaction
    const amount = Number(completedPayment.amount)
    const extractedPlanId = extractPlanIdFromPayment(gw, amount)

    // Determine update behavior: if tokenization/trial flow, set agent to 'trial' and schedule nextPaymentDate; otherwise activate subscription as paid
    let updatedAgent
    if (isTokenization && trialEndISO) {
      // Persist trial dates and keep subscription status as 'trial'
      const trialStart = gw.trialStartDate ? new Date(gw.trialStartDate) : new Date()
      const trialEnd = new Date(trialEndISO)
      const subscriptionTokenFromGateway = gw.subscriptionCreation?.response?.subscription_code || gw.subscriptionCreation?.response?.subscriptionCode || gw.authorization_code || gw.authorization?.authorization_code || gw.subscriptionCode || undefined

      ;[updatedAgent] = await secureDb.db
        .update(schema.agents)
        .set({
          subscriptionStatus: 'trial',
          trialStartDate: trialStart,
          trialEndDate: trialEnd,
          nextPaymentDate: trialEnd,
          subscriptionToken: subscriptionTokenFromGateway || undefined,
          planId: 'starter' // Trial is always Starter plan
        })
        .where(eq(schema.agents.id, agentId))
        .returning({ 
          id: schema.agents.id,
          subscriptionStatus: schema.agents.subscriptionStatus,
          nextPaymentDate: schema.agents.nextPaymentDate,
          lastPaymentDate: schema.agents.lastPaymentDate
        })
    } else {
      // Activate subscription based on completed payment (paid customer)
      const paymentDate = completedPayment.paymentDate || completedPayment.createdAt
      const nextPaymentDate = new Date(paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from payment
      
      const agentUpdates: any = {
        subscriptionStatus: 'active',
        lastPaymentDate: paymentDate,
        nextPaymentDate: nextPaymentDate,
      }
      
      // Set plan_id if extracted
      if (extractedPlanId) {
        agentUpdates.planId = extractedPlanId
      }
      
      ;[updatedAgent] = await secureDb.db
        .update(schema.agents)
        .set(agentUpdates)
        .where(eq(schema.agents.id, agentId))
        .returning({ 
          id: schema.agents.id,
          subscriptionStatus: schema.agents.subscriptionStatus,
          nextPaymentDate: schema.agents.nextPaymentDate,
          lastPaymentDate: schema.agents.lastPaymentDate
        })
    }

    if (!updatedAgent) {
      return NextResponse.json({ error: "Failed to activate subscription" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: isTokenization ? "Subscription scheduled as trial" : "Subscription activated successfully",
      subscriptionStatus: updatedAgent.subscriptionStatus,
      nextPaymentDate: updatedAgent.nextPaymentDate?.toISOString(),
      lastPaymentDate: updatedAgent.lastPaymentDate?.toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to activate subscription", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

