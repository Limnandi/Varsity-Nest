/**
 * PayFast Recurring Notification (RRN) Webhook Handler
 * 
 * Handles recurring billing notifications from PayFast
 * This endpoint receives notifications for:
 * - Successful recurring payments
 * - Failed recurring payments
 * - Subscription cancellations
 * - Subscription updates
 * 
 * Documentation: https://developers.payfast.co.za/documentation/#recurring-billing
 */

import { type NextRequest, NextResponse } from "next/server"
import { PaymentSecurityService } from "@/lib/services/payment-security"
import { PaymentAuditService } from "@/lib/services/payment-audit"
import { captureMessage, captureException } from '@/lib/logging/config'
import { secureDb } from "@/lib/database-secure"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { z } from "zod"

/**
 * PayFast Recurring Notification Schema
 */
const RecurringNotificationSchema = z.object({
  subscription_id: z.string().min(1),
  token: z.string().min(1), // Subscription token
  cycle_status: z.string(), // Status of the billing cycle
  billing_date: z.string(), // Date of billing
  amount_gross: z.string().regex(/^\d+\.\d{2}$/, "Amount must be in format 0.00"),
  custom_str1: z.string().optional(), // providerId or agentId
  custom_str2: z.string().optional(),
  custom_str3: z.string().optional(),
  custom_str4: z.string().optional(),
  custom_str5: z.string().optional(), // idempotencyKey
  signature: z.string().min(1),
  merchant_id: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    // Enhanced IP validation using PayFast's official IP ranges
    const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                    request.headers.get("x-real-ip") || 
                    (request as any).ip || ""
    
    if (!PaymentSecurityService.validatePayFastIP(clientIP)) {
      captureMessage('PayFast RRN webhook from unauthorized IP', { 
        level: 'error', 
        component: 'payfast-rrn-webhook', 
        clientIP 
      })
      return new Response("FORBIDDEN", { status: 403, headers: { "Content-Type": "text/plain" } })
    }

    const formData = await request.formData()
    const rawData: any = {}

    // Parse form data
    formData.forEach((value, key) => {
      rawData[key] = value.toString()
    })

    // Validate webhook data structure
    const validationResult = RecurringNotificationSchema.safeParse(rawData)
    if (!validationResult.success) {
      captureMessage('Invalid PayFast RRN webhook data structure', { 
        level: 'error', 
        component: 'payfast-rrn-webhook', 
        errors: validationResult.error.issues,
        subscriptionId: rawData.subscription_id 
      })
      return NextResponse.json({ 
        error: "Invalid webhook data structure", 
        details: validationResult.error.issues 
      }, { status: 400 })
    }

    const data = validationResult.data

    // Enhanced signature verification
    // Note: RRN webhook has different structure than ITN, but signature verification works the same way
    if (!PaymentSecurityService.verifyPayFastSignature(data as Record<string, any>, data.signature)) {
      captureMessage('Invalid PayFast RRN webhook signature', { 
        level: 'error', 
        component: 'payfast-rrn-webhook', 
        subscriptionId: data.subscription_id,
        clientIP 
      })
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Validate merchant ID
    const { env } = await import('@/lib/env')
    if (data.merchant_id !== env.PAYFAST_MERCHANT_ID) {
      captureMessage('Merchant ID mismatch in PayFast RRN webhook', { 
        level: 'error', 
        component: 'payfast-rrn-webhook', 
        merchantId: data.merchant_id,
        subscriptionId: data.subscription_id 
      })
      return new Response("MERCHANT_MISMATCH", { status: 400, headers: { "Content-Type": "text/plain" } })
    }

    // Extract and validate payment details
    const entityId = data.custom_str1 // Can be providerId or agentId
    const amount = Number.parseFloat(data.amount_gross)
    const subscriptionToken = data.token
    const cycleStatus = data.cycle_status
    const billingDate = new Date(data.billing_date)

    // Validate required fields
    if (!entityId || !amount || !subscriptionToken) {
      captureMessage('Missing required fields in RRN webhook', { 
        level: 'error', 
        component: 'payfast-rrn-webhook', 
        entityId, 
        amount, 
        subscriptionToken 
      })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Determine entity type by checking providers and agents tables
    const [provider] = await secureDb.db
      .select({ id: schema.providers.id })
      .from(schema.providers)
      .where(eq(schema.providers.id, entityId))
      .limit(1)

    const entityType = provider ? 'provider' : 'agent'

    // Process recurring notification based on cycle status
    try {
      if (cycleStatus === 'COMPLETE' || cycleStatus === 'SUCCESS') {
        // Successful recurring payment
        await processSuccessfulRecurringPayment(
          entityId,
          entityType,
          amount,
          subscriptionToken,
          billingDate,
          data
        )
      } else if (cycleStatus === 'FAILED' || cycleStatus === 'FAILURE') {
        // Failed recurring payment
        await processFailedRecurringPayment(
          entityId,
          entityType,
          amount,
          subscriptionToken,
          billingDate,
          data
        )
      } else {
        // Other statuses (e.g., CANCELLED, UPDATED)
        captureMessage('Unhandled RRN cycle status', { 
          level: 'info', 
          component: 'payfast-rrn-webhook', 
          cycleStatus,
          subscriptionId: data.subscription_id 
        })
      }

      // Log successful webhook processing
      await PaymentAuditService.logAuditEvent(entityId, 'updated', {
        oldStatus: 'pending',
        newStatus: cycleStatus.toLowerCase(),
        amount,
        providerId: entityType === 'provider' ? entityId : undefined,
        reason: `Recurring payment notification: ${cycleStatus}`,
        metadata: { 
          subscriptionToken,
          subscriptionId: data.subscription_id,
          billingDate: billingDate.toISOString(),
          agentId: entityType === 'agent' ? entityId : undefined
        }
      })

      // Return success to PayFast
      return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } })
    } catch (processingError) {
      captureException(
        processingError instanceof Error ? processingError : new Error(String(processingError)), 
        { 
          component: 'payfast-rrn-webhook', 
          cycleStatus,
          subscriptionId: data.subscription_id,
          entityId,
          entityType
        }
      )
      
      // Return 500 to trigger PayFast retry mechanism
      return new Response("ERROR", { status: 500, headers: { "Content-Type": "text/plain" } })
    }

  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)))
    console.error("PayFast RRN notification error:", error)
    
    // Return 500 to trigger PayFast retry mechanism
    return new Response("ERROR", { status: 500, headers: { "Content-Type": "text/plain" } })
  }
}

/**
 * Process successful recurring payment
 */
async function processSuccessfulRecurringPayment(
  entityId: string,
  entityType: 'provider' | 'agent',
  amount: number,
  subscriptionToken: string,
  billingDate: Date,
  webhookData: any
) {
  try {
    await secureDb.db.transaction(async (tx: any) => {
      // Update provider or agent subscription status
      if (entityType === 'provider') {
        await tx
          .update(schema.providers)
          .set({
            subscriptionStatus: 'active',
            lastPaymentDate: billingDate,
            nextPaymentDate: new Date(billingDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
            subscriptionToken: subscriptionToken
          })
          .where(eq(schema.providers.id, entityId))
      } else {
        // For agents, update subscription token if needed
        await tx
          .update(schema.agents)
          .set({
            subscriptionToken: subscriptionToken
          })
          .where(eq(schema.agents.id, entityId))
      }

      // Create payment transaction record for recurring payment
      const transactionId = `vn_rrn_${Date.now()}_${Math.random().toString(36).substring(7)}`
      await tx.insert(schema.paymentTransactions).values({
        id: transactionId,
        providerId: entityType === 'provider' ? entityId : undefined,
        agentId: entityType === 'agent' ? entityId : undefined,
        amount: amount.toString(),
        currency: 'ZAR',
        mPaymentId: `rrn_${subscriptionToken}_${billingDate.toISOString()}`,
        pfPaymentId: webhookData.subscription_id,
        subscriptionToken: subscriptionToken,
        status: 'completed',
        paymentDate: billingDate,
        gatewayResponse: webhookData
      })
    })

    console.log(`Recurring payment successful for ${entityType} ${entityId}: ${subscriptionToken}`)
  } catch (error) {
    captureException(
      error instanceof Error ? error : new Error(String(error)), 
      { 
        component: 'payment-processing', 
        subscriptionToken,
        entityId,
        entityType,
        amount,
        action: 'processSuccessfulRecurringPayment' 
      }
    )
    throw error
  }
}

/**
 * Process failed recurring payment
 */
async function processFailedRecurringPayment(
  entityId: string,
  entityType: 'provider' | 'agent',
  amount: number,
  subscriptionToken: string,
  billingDate: Date,
  webhookData: any
) {
  try {
    if (entityType === 'provider') {
      await secureDb.db
        .update(schema.providers)
        .set({
          subscriptionStatus: 'past_due'
        })
        .where(eq(schema.providers.id, entityId))
    }

    // Log failed recurring payment
    const transactionId = `vn_rrn_failed_${Date.now()}_${Math.random().toString(36).substring(7)}`
    await secureDb.db.insert(schema.paymentTransactions).values({
      id: transactionId,
      providerId: entityType === 'provider' ? entityId : undefined,
      agentId: entityType === 'agent' ? entityId : undefined,
      amount: amount.toString(),
      currency: 'ZAR',
      mPaymentId: `rrn_failed_${subscriptionToken}_${billingDate.toISOString()}`,
      pfPaymentId: webhookData.subscription_id,
      subscriptionToken: subscriptionToken,
      status: 'failed',
      paymentDate: billingDate,
      gatewayResponse: webhookData
    })

    console.log(`Recurring payment failed for ${entityType} ${entityId}: ${subscriptionToken}`)
  } catch (error) {
    captureException(
      error instanceof Error ? error : new Error(String(error)), 
      { 
        component: 'payment-processing', 
        subscriptionToken,
        entityId,
        entityType,
        amount,
        action: 'processFailedRecurringPayment' 
      }
    )
    throw error
  }
}

