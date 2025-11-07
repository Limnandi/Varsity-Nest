import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/stackauth"
import { secureDb } from "@/lib/database-secure"
import * as schema from "@/lib/schema"
import { eq, desc } from "drizzle-orm"

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

    // Get provider ID from database based on user ID
    const userId = session.user.id
    
    const [provider] = await secureDb.db
      .select({ id: schema.providers.id })
      .from(schema.providers)
      .where(eq(schema.providers.userId, userId))
      .limit(1)

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    const providerId = provider.id

    // Find the most recent payment transaction (pending or completed)
    // If user was redirected from Payfast success page, payment is likely successful but webhook hasn't been called yet
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
        eq(schema.paymentTransactions.providerId, providerId)
      )
      .orderBy(desc(schema.paymentTransactions.createdAt))
      .limit(1)

    if (!latestPayment) {
      return NextResponse.json({ 
        error: "No payment found",
        message: "No payment transactions found"
      }, { status: 404 })
    }

    // If payment is still pending but user was redirected from Payfast success page, mark it as completed
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
    const [currentProvider] = await secureDb.db
      .select({
        subscriptionStatus: schema.providers.subscriptionStatus,
        nextPaymentDate: schema.providers.nextPaymentDate,
      })
      .from(schema.providers)
      .where(eq(schema.providers.id, providerId))
      .limit(1)

    if (currentProvider?.subscriptionStatus === 'active') {
      return NextResponse.json({ 
        message: "Subscription already active",
        subscriptionStatus: 'active'
      })
    }

    // Activate subscription based on completed payment
    const paymentDate = completedPayment.paymentDate || completedPayment.createdAt
    const nextPaymentDate = new Date(paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from payment
    
    const [updatedProvider] = await secureDb.db
      .update(schema.providers)
      .set({
        subscriptionStatus: 'active',
        lastPaymentDate: paymentDate,
        nextPaymentDate: nextPaymentDate,
      })
      .where(eq(schema.providers.id, providerId))
      .returning({ 
        id: schema.providers.id,
        subscriptionStatus: schema.providers.subscriptionStatus,
        nextPaymentDate: schema.providers.nextPaymentDate,
        lastPaymentDate: schema.providers.lastPaymentDate
      })

    if (!updatedProvider) {
      return NextResponse.json({ error: "Failed to activate subscription" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Subscription activated successfully",
      subscriptionStatus: updatedProvider.subscriptionStatus,
      nextPaymentDate: updatedProvider.nextPaymentDate?.toISOString(),
      lastPaymentDate: updatedProvider.lastPaymentDate?.toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to activate subscription", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

