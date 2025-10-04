import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { query } from "@/lib/database"

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

    // Fetch provider details
    const providerResult = await query`
      SELECT 
        p.id,
        p.business_name,
        p.contact_person,
        p.contact_email,
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
    const nextPaymentDate = new Date()
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)
    
    // Default monthly fee (can be customized based on plan)
    const monthlyFee = 499.00

    // Fetch payment history from payment_transactions table
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
      ORDER BY pt.created_at DESC
      LIMIT 50
    `

    // Transform payments to invoices
    const invoices = paymentsResult.rows.map((payment: any) => ({
      id: payment.pf_payment_id || payment.m_payment_id || payment.id,
      date: payment.created_at,
      amount: Number(payment.amount),
      status: payment.status === 'completed' ? 'paid' : 
              payment.status === 'failed' ? 'failed' :
              payment.status === 'cancelled' ? 'refunded' : 'pending',
      description: `Varsity Nest Monthly Subscription - ${new Date(payment.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}`,
      paymentMethod: 'PayFast' // Default to PayFast since that's the payment gateway
    }))

    // Determine subscription status
    const hasRecentPayment = invoices.some((inv: any) => {
      const paymentDate = new Date(inv.date)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return inv.status === 'paid' && paymentDate > thirtyDaysAgo
    })

    const subscriptionStatus = hasRecentPayment ? 'active' : 
                               invoices.length === 0 ? 'trial' : 'inactive'

    const provider = {
      id: providerData.id,
      email: providerData.email,
      businessName: providerData.business_name,
      contactPerson: providerData.contact_person,
      billingInfo: {
        monthlyFee,
        nextPaymentDate: nextPaymentDate.toISOString(),
        subscriptionStatus,
        subscriptionStartDate: subscriptionStartDate.toISOString()
      }
    }

    return NextResponse.json({
      provider,
      invoices
    })

  } catch (error) {
    console.error("Billing API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch billing data" },
      { status: 500 }
    )
  }
}
