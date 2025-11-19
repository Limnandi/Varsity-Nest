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
    let user = await getCurrentUserFromRequest(request)
    
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
    
    if (user.role !== 'agent') {
      return NextResponse.json(
        { error: "Access denied. Agent role required." },
        { status: 403 }
      )
    }

    const agentResult = await query`
      SELECT 
        a.id,
        a.business_name,
        a.contact_person,
        a.contact_email,
        a.subscription_token,
        u.email,
        a.created_at
      FROM agents a
      JOIN users u ON a.user_id = u.id
      WHERE a.user_id = ${user.id}
      LIMIT 1
    `

    if (agentResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Agent profile not found. Please complete your agent registration." },
        { status: 404 }
      )
    }

    const agentData = agentResult.rows[0]
    
    const subscriptionStartDate = new Date(agentData.created_at)
    const nextPaymentDate = new Date()
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)
    
    // Calculate monthly fee based on active accommodations count
    const accommodationsResult = await query`
      SELECT COUNT(id) as count
      FROM accommodations
      WHERE agent_id = ${agentData.id} AND is_active = true
    `
    const accommodationsCount = Number(accommodationsResult.rows[0]?.count || 0)
    
    // Calculate monthly fee using pricing function
    const monthlyFee = calculateProviderSubscriptionPrice({
      accommodationsCount: accommodationsCount || 1, // Default to 1 if no accommodations
      wantsFeatured: false
    })

    const paymentsResult = await query`
      SELECT 
        pt.id, 
        pt.amount, 
        pt.status, 
        pt.created_at, 
        pt.m_payment_id,
        pt.pf_payment_id
      FROM payment_transactions pt
      WHERE pt.agent_id = ${agentData.id}
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

    const invoices = paymentsResult.rows.map((payment: any) => ({
      id: payment.pf_payment_id || payment.m_payment_id || payment.id,
      date: payment.created_at,
      amount: Number(payment.amount),
      status: payment.status === 'completed' ? 'paid' : 
              payment.status === 'failed' ? 'failed' :
              payment.status === 'cancelled' ? 'refunded' : 'pending',
      description: `Varsity Nest Monthly Subscription - ${new Date(payment.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}`,
      paymentMethod: 'paystack'
    }))

    const hasRecentPayment = invoices.some((inv: any) => {
      const paymentDate = new Date(inv.date)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return inv.status === 'paid' && paymentDate > thirtyDaysAgo
    })

    const subscriptionStatus = hasRecentPayment ? 'active' : 
                               invoices.length === 0 ? 'trial' : 'inactive'

    const agent = {
      id: agentData.id,
      email: agentData.email,
      businessName: agentData.business_name,
      contactPerson: agentData.contact_person,
      subscriptionToken: agentData.subscription_token || null,
      billingInfo: {
        monthlyFee,
        nextPaymentDate: nextPaymentDate.toISOString(),
        subscriptionStatus,
        subscriptionStartDate: subscriptionStartDate.toISOString()
      }
    }

    return NextResponse.json({
      agent,
      invoices
    })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch billing data" },
      { status: 500 }
    )
  }
}

