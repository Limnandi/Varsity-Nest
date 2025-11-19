/**
 * Check and handle expired trial subscriptions
 * This endpoint should be called periodically (e.g., via cron job) to:
 * 1. Check for providers with expired trials
 * 2. Update subscription status to inactive if trial expired without payment
 * 3. Send notifications if needed
 */

import { NextRequest, NextResponse } from "next/server"
import { secureDb } from "@/lib/database-secure"
import { eq, and, lte } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { captureMessage, captureException } from '@/lib/logging/config'

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization for cron job
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    
    // Find providers with expired trials (trial_end_date is in the past and status is still 'trial')
    const expiredTrials = await secureDb.db
      .select({
        id: schema.providers.id,
        subscriptionStatus: schema.providers.subscriptionStatus,
        trialEndDate: schema.providers.trialEndDate,
        nextPaymentDate: schema.providers.nextPaymentDate
      })
      .from(schema.providers)
      .where(
        and(
          eq(schema.providers.subscriptionStatus, 'trial'),
          lte(schema.providers.trialEndDate, now)
        )
      )

    console.log(`[TRIAL CHECK] Found ${expiredTrials.length} expired trial(s)`)

    const results = []

    for (const provider of expiredTrials) {
      try {
        // Check if there's a pending payment transaction (user set up payment during trial)
        const [pendingPayment] = await secureDb.db
          .select({
            id: schema.paymentTransactions.id,
            status: schema.paymentTransactions.status,
            mPaymentId: schema.paymentTransactions.mPaymentId
          })
          .from(schema.paymentTransactions)
          .where(
            and(
              eq(schema.paymentTransactions.providerId, provider.id),
              eq(schema.paymentTransactions.status, 'pending')
            )
          )
          .limit(1)

        if (pendingPayment) {
          // Payment was set up - wait for Paystack webhook to process it
          console.log(`[TRIAL CHECK] Provider ${provider.id} has pending payment - waiting for webhook`)
          results.push({
            providerId: provider.id,
            action: 'pending_payment',
            message: 'Payment transaction pending - waiting for Paystack webhook'
          })
          continue
        }

        // No pending payment - mark subscription as inactive
        await secureDb.db
          .update(schema.providers)
          .set({
            subscriptionStatus: 'inactive',
            nextPaymentDate: null
          })
          .where(eq(schema.providers.id, provider.id))

        captureMessage('Trial subscription expired - marked as inactive', {
          level: 'info',
          component: 'trial-check',
          providerId: provider.id,
          trialEndDate: provider.trialEndDate?.toISOString()
        })

        results.push({
          providerId: provider.id,
          action: 'expired',
          message: 'Trial expired - subscription marked as inactive'
        })

        console.log(`[TRIAL CHECK] Provider ${provider.id} trial expired - marked as inactive`)
      } catch (error) {
        captureException(
          error instanceof Error ? error : new Error(String(error)),
          { component: 'trial-check', providerId: provider.id }
        )
        results.push({
          providerId: provider.id,
          action: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      checkedAt: now.toISOString(),
      expiredTrialsCount: expiredTrials.length,
      results
    })
  } catch (error) {
    captureException(
      error instanceof Error ? error : new Error(String(error)),
      { component: 'trial-check' }
    )
    return NextResponse.json(
      { error: 'Failed to check trials', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// GET endpoint for manual checking (for testing)
export async function GET(_request: NextRequest) {
  try {
    const now = new Date()
    
    const expiredTrials = await secureDb.db
      .select({
        id: schema.providers.id,
        subscriptionStatus: schema.providers.subscriptionStatus,
        trialEndDate: schema.providers.trialEndDate
      })
      .from(schema.providers)
      .where(
        and(
          eq(schema.providers.subscriptionStatus, 'trial'),
          lte(schema.providers.trialEndDate, now)
        )
      )

    return NextResponse.json({
      checkedAt: now.toISOString(),
      expiredTrialsCount: expiredTrials.length,
      expiredTrials: expiredTrials.map((p: { id: string; trialEndDate: Date | null }) => ({
        id: p.id,
        trialEndDate: p.trialEndDate?.toISOString()
      }))
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check trials', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

