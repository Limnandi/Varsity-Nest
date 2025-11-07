/**
 * PayFast Payment Failure Notification (PFN) Webhook Handler
 * 
 * Handles payment failure notifications from PayFast
 * This endpoint receives notifications when:
 * - A payment fails due to insufficient funds
 * - A payment fails due to card expiry
 * - A payment fails due to card cancellation
 * - Other payment failure scenarios
 * 
 * Documentation: https://developers.payfast.co.za/documentation/#webhooks
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
 * PayFast Payment Failure Notification Schema
 */
const PaymentFailureNotificationSchema = z.object({
  pf_payment_id: z.string().min(1),
  m_payment_id: z.string().min(1),
  payment_status: z.string(),
  amount_gross: z.string().regex(/^\d+\.\d{2}$/, "Amount must be in format 0.00"),
  failure_reason: z.string().optional(),
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
      captureMessage('PayFast PFN webhook from unauthorized IP', { 
        level: 'error', 
        component: 'payfast-pfn-webhook', 
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
    const validationResult = PaymentFailureNotificationSchema.safeParse(rawData)
    if (!validationResult.success) {
      captureMessage('Invalid PayFast PFN webhook data structure', { 
        level: 'error', 
        component: 'payfast-pfn-webhook', 
        errors: validationResult.error.issues,
        pfPaymentId: rawData.pf_payment_id 
      })
      return NextResponse.json({ 
        error: "Invalid webhook data structure", 
        details: validationResult.error.issues 
      }, { status: 400 })
    }

    const data = validationResult.data

    // Enhanced signature verification
    // Note: PFN webhook has different structure than ITN, but signature verification works the same way
    if (!PaymentSecurityService.verifyPayFastSignature(data as Record<string, any>, data.signature)) {
      captureMessage('Invalid PayFast PFN webhook signature', { 
        level: 'error', 
        component: 'payfast-pfn-webhook', 
        pfPaymentId: data.pf_payment_id,
        clientIP 
      })
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Validate merchant ID
    const { env } = await import('@/lib/env')
    if (data.merchant_id !== env.PAYFAST_MERCHANT_ID) {
      captureMessage('Merchant ID mismatch in PayFast PFN webhook', { 
        level: 'error', 
        component: 'payfast-pfn-webhook', 
        merchantId: data.merchant_id,
        pfPaymentId: data.pf_payment_id 
      })
      return new Response("MERCHANT_MISMATCH", { status: 400, headers: { "Content-Type": "text/plain" } })
    }

    // Extract and validate payment details
    const entityId = data.custom_str1 // Can be providerId or agentId
    const amount = Number.parseFloat(data.amount_gross)
    const transactionId = data.pf_payment_id
    const merchantPaymentId = data.m_payment_id
    const failureReason = data.failure_reason || "Payment failed"

    // Validate required fields
    if (!entityId || !amount || !transactionId || !merchantPaymentId) {
      captureMessage('Missing required fields in PFN webhook', { 
        level: 'error', 
        component: 'payfast-pfn-webhook', 
        entityId, 
        amount, 
        transactionId,
        merchantPaymentId
      })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Find existing transaction
    const [existingTransaction] = await secureDb.db
      .select({ 
        id: schema.paymentTransactions.id,
        providerId: schema.paymentTransactions.providerId,
        agentId: schema.paymentTransactions.agentId,
        status: schema.paymentTransactions.status
      })
      .from(schema.paymentTransactions)
      .where(eq(schema.paymentTransactions.mPaymentId, merchantPaymentId))
      .limit(1)

    if (!existingTransaction) {
      captureMessage('Transaction not found for PFN webhook', { 
        level: 'warning', 
        component: 'payfast-pfn-webhook', 
        merchantPaymentId,
        pfPaymentId: transactionId
      })
      // Still return OK to PayFast to prevent retries
      return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } })
    }

    const entityType = existingTransaction.providerId ? 'provider' : 'agent'

    // Process payment failure
    try {
      // Update transaction status
      await secureDb.db
        .update(schema.paymentTransactions)
        .set({
          pfPaymentId: transactionId,
          status: 'failed',
          gatewayResponse: data
        })
        .where(eq(schema.paymentTransactions.id, existingTransaction.id))

      // Update provider subscription status if applicable
      if (entityType === 'provider') {
        await secureDb.db
          .update(schema.providers)
          .set({
            subscriptionStatus: 'past_due'
          })
          .where(eq(schema.providers.id, entityId))
      }

      // Log payment failure
      await PaymentAuditService.logAuditEvent(existingTransaction.id, 'failed', {
        oldStatus: existingTransaction.status || 'pending',
        newStatus: 'failed',
        amount,
        providerId: entityType === 'provider' ? entityId : undefined,
        reason: `Payment failure notification: ${failureReason}`,
        metadata: { 
          pfPaymentId: transactionId,
          failureReason,
          agentId: entityType === 'agent' ? entityId : undefined
        }
      })

      // TODO: Send notification email to user about payment failure
      // This can be implemented using your email service (Resend)

      console.log(`Payment failure processed for ${entityType} ${entityId}: ${transactionId}`)

      // Return success to PayFast
      return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } })
    } catch (processingError) {
      captureException(
        processingError instanceof Error ? processingError : new Error(String(processingError)), 
        { 
          component: 'payfast-pfn-webhook', 
          pfPaymentId: transactionId,
          entityId,
          entityType
        }
      )
      
      // Return 500 to trigger PayFast retry mechanism
      return new Response("ERROR", { status: 500, headers: { "Content-Type": "text/plain" } })
    }

  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)))
    console.error("PayFast PFN notification error:", error)
    
    // Return 500 to trigger PayFast retry mechanism
    return new Response("ERROR", { status: 500, headers: { "Content-Type": "text/plain" } })
  }
}

