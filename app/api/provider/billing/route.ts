import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { query } from "@/lib/database"
import { calculateProviderSubscriptionPrice } from "@/lib/payments"
import { PaystackAPIClient } from "@/lib/paystack-api-client"
import { secureDb } from "@/lib/database-secure"
import * as schema from "@/lib/schema"
import { eq } from "drizzle-orm"

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
    const isInTrial = providerData.subscription_status === 'trial' && trialEndDate && trialEndDate > new Date()
    
    // Calculate monthly fee based on active accommodations count
    const accommodationsResult = await query`
      SELECT COUNT(id) as count
      FROM accommodations
      WHERE provider_id = ${providerData.id} AND is_active = true
    `
    const accommodationsCount = Number(accommodationsResult.rows[0]?.count || 0)
    
    // Calculate monthly fee using pricing function
    const monthlyFee = calculateProviderSubscriptionPrice({
      accommodationsCount: accommodationsCount || 1, // Default to 1 if no accommodations
      wantsFeatured: false
    })

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
    
    // Check if provider is a first-time user (never had trial or payment)
    const hasNeverHadTrial = !providerData.trial_start_date && !providerData.trial_end_date
    const hasNeverHadPayment = !providerData.last_payment_date && completedPayments.length === 0
    const isFirstTimeUser = hasNeverHadTrial && hasNeverHadPayment && providerData.subscription_status === 'inactive'
    
    const invoices = allRelevantPayments.map((payment: any) => ({
      id: payment.pf_payment_id || payment.m_payment_id || payment.id,
      date: payment.created_at,
      amount: Number(payment.amount),
      status: payment.status === 'completed' ? 'paid' : 'pending',
      description: `Varsity Nest Monthly Subscription - ${new Date(payment.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}`,
      paymentMethod: 'paystack' // Paystack payment gateway
    }))

    // Determine subscription status (use database status if available, otherwise calculate)
    const hasRecentPayment = invoices.some((inv: any) => {
      const paymentDate = new Date(inv.date)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return inv.status === 'paid' && paymentDate > thirtyDaysAgo
    })

    // Use database subscription_status if available, otherwise calculate
    const subscriptionStatus = providerData.subscription_status || 
                               (hasRecentPayment ? 'active' : 
                               (invoices.length === 0 && !providerData.trial_start_date ? 'trial' : 'inactive'))

    const provider = {
      id: providerData.id,
      email: providerData.email,
      businessName: providerData.business_name,
      contactPerson: providerData.contact_person,
      subscriptionToken: providerData.subscription_token || null,
      billingInfo: {
        monthlyFee,
        nextPaymentDate: providerData.next_payment_date ? new Date(providerData.next_payment_date).toISOString() : nextPaymentDate.toISOString(),
        subscriptionStatus: subscriptionStatus,
        subscriptionStartDate: subscriptionStartDate.toISOString(),
        trialStartDate: trialStartDate ? trialStartDate.toISOString() : null,
        trialEndDate: trialEndDate ? trialEndDate.toISOString() : null,
        isInTrial: isInTrial,
        isFirstTimeUser: isFirstTimeUser
      }
    }

    return NextResponse.json({
      provider,
      invoices
    })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch billing data" },
      { status: 500 }
    )
  }
}
