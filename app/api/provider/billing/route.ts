import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { query } from "@/lib/database"
import { PaystackAPIClient } from "@/lib/paystack-api-client"
import { secureDb } from "@/lib/database-secure"
import * as schema from "@/lib/schema"
import { eq } from "drizzle-orm"
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans"
import { getProviderSubscriptionSummary } from "@/lib/subscription"

export async function GET(request: NextRequest) {
  try {
    // Try secure JWT session first
    let user = await getCurrentUserFromRequest(request)
    
    // Fallback to StackAuth if no JWT session
    if (!user) {
      user = await getCurrentUserFromStackAuth()
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }
    
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account deactivated" },
        { status: 403 }
      )
    }
    
    if (user.role !== 'provider') {
      return NextResponse.json(
        { error: "Access denied. Provider role required." },
        { status: 403 }
      )
    }

    // Fetch provider details including subscription token and trial dates
    const providerResult = await query`
      SELECT 
        p.id,
        p.business_name,
        p.contact_person,
        p.contact_email,
        p.subscription_token,
        p.subscription_status,
        p.trial_start_date,
        p.trial_end_date,
        p.last_payment_date,
        p.next_payment_date,
        u.email,
        p.created_at
      FROM providers p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ${user.id}
      LIMIT 1
    `

    if (providerResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Provider profile not found. Please complete your provider registration." },
        { status: 404 }
      )
    }

    const providerData = providerResult.rows[0]
    
    // Calculate billing info
    const subscriptionStartDate = new Date(providerData.created_at)
    const nextPaymentDate = providerData.next_payment_date 
      ? new Date(providerData.next_payment_date)
      : new Date()
    
    // Check trial status
    const trialStartDate = providerData.trial_start_date ? new Date(providerData.trial_start_date) : null
    const trialEndDate = providerData.trial_end_date ? new Date(providerData.trial_end_date) : null
    
    const subscriptionSummary = await getProviderSubscriptionSummary(providerData.id)
    const activePlan = subscriptionSummary.plan ?? subscriptionSummary.nextPlan

    // Fetch payment history from payment_transactions table
    // Only show completed payments and the most recent pending payment (if any)
    // Filter out failed/cancelled attempts to avoid confusion
    const paymentsResult = await query`
      SELECT 
        pt.id, 
        pt.amount, 
        pt.status, 
        pt.created_at, 
        pt.m_payment_id,
        pt.pf_payment_id
      FROM payment_transactions pt
      WHERE pt.provider_id = ${providerData.id}
        AND (pt.status = 'completed' OR pt.status = 'pending')
      ORDER BY pt.created_at DESC
      LIMIT 50
    `

    // Verify pending transactions with Paystack to ensure status is accurate
    // This handles cases where webhook hasn't been processed yet
    const pendingPayments = paymentsResult.rows.filter((p: any) => p.status === 'pending')
    
    for (const pendingPayment of pendingPayments) {
      const reference = pendingPayment.m_payment_id || pendingPayment.pf_payment_id
      if (reference) {
        try {
          // Verify transaction with Paystack
          const verifiedTransaction = await PaystackAPIClient.verifyTransaction(reference)
          
          // If transaction is successful, update status in database
          if (verifiedTransaction.status === 'success') {
            const paymentDate = verifiedTransaction.paid_at ? new Date(verifiedTransaction.paid_at) : new Date()
            
            // Update transaction status
            await secureDb.db
              .update(schema.paymentTransactions)
              .set({
                status: 'completed',
                paymentDate: paymentDate,
                pfPaymentId: verifiedTransaction.id?.toString() || reference,
                gatewayResponse: verifiedTransaction
              })
              .where(eq(schema.paymentTransactions.id, pendingPayment.id))
            
            // Update the payment object for this iteration
            pendingPayment.status = 'completed'
            pendingPayment.paymentDate = paymentDate
          }
        } catch (verifyError) {
          // If verification fails, transaction might still be pending or failed
          // Keep it as pending - webhook will eventually process it
        }
      }
    }
    
    // Transform payments to invoices
    // Only include completed payments and the most recent pending payment
    const completedPayments = paymentsResult.rows.filter((p: any) => p.status === 'completed')
    const stillPendingPayments = paymentsResult.rows.filter((p: any) => p.status === 'pending')
    const mostRecentPending = stillPendingPayments.length > 0 ? [stillPendingPayments[0]] : []
    
    const allRelevantPayments = [...completedPayments, ...mostRecentPending]
    
    const invoices = allRelevantPayments.map((payment: any) => ({
      id: payment.pf_payment_id || payment.m_payment_id || payment.id,
      date: payment.created_at,
      amount: Number(payment.amount),
      status: payment.status === 'completed' ? 'paid' : 'pending',
      description: `Varsity Nest Monthly Subscription - ${new Date(payment.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}`,
      paymentMethod: 'paystack' // Paystack payment gateway
    }))

    const provider = {
      id: providerData.id,
      email: providerData.email,
      businessName: providerData.business_name,
      contactPerson: providerData.contact_person,
      subscriptionToken: providerData.subscription_token || null,
      billingInfo: {
        planId: activePlan.id,
        planName: activePlan.name,
        planDescription: activePlan.description,
        planPrice: activePlan.price,
        planLimit: activePlan.maxProperties,
        monthlyFee: activePlan.price,
        nextPaymentDate: providerData.next_payment_date ? new Date(providerData.next_payment_date).toISOString() : nextPaymentDate.toISOString(),
        subscriptionStatus: subscriptionSummary.status,
        subscriptionStartDate: subscriptionStartDate.toISOString(),
        trialStartDate: trialStartDate ? trialStartDate.toISOString() : null,
        trialEndDate: trialEndDate ? trialEndDate.toISOString() : null,
        isInTrial: subscriptionSummary.isInTrial,
        isFirstTimeUser: subscriptionSummary.isEligibleForTrial,
        publishedCount: subscriptionSummary.publishedCount,
        totalProperties: subscriptionSummary.totalCount,
        canCreateMore: subscriptionSummary.canCreateMore,
        canPublishMore: subscriptionSummary.canPublishMore,
      }
    }

    return NextResponse.json({
      provider,
      invoices,
      plans: Object.values(SUBSCRIPTION_PLANS),
      subscriptionSummary: subscriptionSummary
    })

  } catch (error) {
    // Log full error and capture for Sentry/monitoring
    console.error('[PROVIDER BILLING] Fatal error fetching billing data:', error instanceof Error ? error.stack || error.message : String(error))
    try {
      const { captureException } = await import('@/lib/logging/config')
      captureException(error instanceof Error ? error : new Error(String(error)), { component: 'provider-billing' })
    } catch (e) {
      // ignore logging errors
      console.warn('[PROVIDER BILLING] Failed to capture exception to logging service', String(e))
    }

    // Return generic error to client
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch billing data" },
      { status: 500 }
    )
  }
}
