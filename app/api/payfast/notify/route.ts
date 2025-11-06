import { type NextRequest, NextResponse } from "next/server"
import { PayFastWebhookSchema } from "@/lib/schemas/payment"
import { PaymentSecurityService } from "@/lib/services/payment-security"
import { PaymentAuditService } from "@/lib/services/payment-audit"
import { PaymentReconciliationService } from "@/lib/services/payment-reconciliation"
import { captureMessage, captureException } from '@/lib/logging/config'
import { secureDb } from "@/lib/database-secure"
import { eq, count } from "drizzle-orm"
import * as schema from "@/lib/schema"

export async function POST(request: NextRequest) {
  try {
    // Enhanced IP validation using PayFast's official IP ranges
    const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                    request.headers.get("x-real-ip") || 
                    (request as any).ip || ""
    
    if (!PaymentSecurityService.validatePayFastIP(clientIP)) {
      captureMessage('PayFast webhook from unauthorized IP', { level: 'error', component: 'payfast-webhook', clientIP })
      return new Response("FORBIDDEN", { status: 403, headers: { "Content-Type": "text/plain" } })
    }

    const formData = await request.formData()
    const rawData: any = {}
    const fieldOrder: string[] = []

    // Parse form data with field order tracking
    formData.forEach((value, key) => {
      rawData[key] = value.toString()
      fieldOrder.push(key)
    })

    // Validate webhook data structure with Zod schema
    const validationResult = PayFastWebhookSchema.safeParse(rawData)
    if (!validationResult.success) {
      captureMessage('Invalid PayFast webhook data structure', { level: 'error', component: 'payfast-webhook', errors: validationResult.error.issues, pfPaymentId: rawData.pf_payment_id })
      return NextResponse.json({ 
        error: "Invalid webhook data structure", 
        details: validationResult.error.issues 
      }, { status: 400 })
    }

    const data = validationResult.data

    // Enhanced signature verification with timing-safe comparison
    if (!PaymentSecurityService.verifyPayFastSignature(data, data.signature)) {
      captureMessage('Invalid PayFast webhook signature', { level: 'error', component: 'payfast-webhook', pfPaymentId: data.pf_payment_id, clientIP })
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Validate merchant ID
    const { env } = await import('@/lib/env')
    if (data.merchant_id !== env.PAYFAST_MERCHANT_ID) {
      captureMessage('Merchant ID mismatch in PayFast webhook', { level: 'error', component: 'payfast-webhook', merchantId: data.merchant_id, pfPaymentId: data.pf_payment_id })
      return new Response("MERCHANT_MISMATCH", { status: 400, headers: { "Content-Type": "text/plain" } })
    }

    // Log webhook receipt with sanitized data
    const sanitizedData = PaymentSecurityService.sanitizePaymentData(data)
    console.log("PayFast webhook received", {
      pfPaymentId: data.pf_payment_id,
      paymentStatus: data.payment_status,
      amount: data.amount_gross,
      clientIP
    })

    // Extract and validate payment details
    const entityId = data.custom_str1 // Can be providerId or agentId
    const amount = Number.parseFloat(data.amount_gross)
    const transactionId = data.pf_payment_id
    const merchantPaymentId = data.m_payment_id
    const idempotencyKey = data.custom_str5
    const status = data.payment_status
    const paymentDate = new Date()

    // Validate required fields
    if (!entityId || !amount || !transactionId || !merchantPaymentId) {
      captureMessage('Missing required payment fields in webhook', { level: 'error', component: 'payfast-webhook', entityId, amount, transactionId, merchantPaymentId })
      return NextResponse.json({ error: "Missing required payment fields" }, { status: 400 })
    }

    // Check for existing transaction by idempotency key first (idempotency check)
    let pending: any = null
    if (idempotencyKey) {
      const existingByKey = await secureDb.db
        .select({ 
          id: schema.paymentTransactions.id,
          amount: schema.paymentTransactions.amount, 
          providerId: schema.paymentTransactions.providerId,
          agentId: schema.paymentTransactions.agentId,
          status: schema.paymentTransactions.status,
          mPaymentId: schema.paymentTransactions.mPaymentId
        })
        .from(schema.paymentTransactions)
        .where(eq(schema.paymentTransactions.idempotencyKey, idempotencyKey))
        .limit(1)

      if (existingByKey.length > 0) {
        pending = existingByKey[0]
        captureMessage('Idempotent webhook request - transaction already processed', { 
          level: 'info', 
          component: 'payfast-webhook', 
          idempotencyKey, 
          existingTransactionId: pending.id,
          status: pending.status,
          pfPaymentId: transactionId
        })
        
        // If transaction is already completed, return OK without processing
        if (pending.status === 'completed' || pending.status === 'failed' || pending.status === 'cancelled') {
          return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } })
        }
      }
    }

    // If not found by idempotency key, try to find by merchant payment ID
    if (!pending) {
      const existingByMerchantId = await secureDb.db
        .select({ 
          id: schema.paymentTransactions.id,
          amount: schema.paymentTransactions.amount, 
          providerId: schema.paymentTransactions.providerId,
          agentId: schema.paymentTransactions.agentId,
          status: schema.paymentTransactions.status,
          mPaymentId: schema.paymentTransactions.mPaymentId
        })
        .from(schema.paymentTransactions)
        .where(eq(schema.paymentTransactions.mPaymentId, merchantPaymentId))
        .limit(1)

      if (existingByMerchantId.length > 0) {
        pending = existingByMerchantId[0]
      }
    }

    if (!pending) {
      captureMessage('No pending transaction found for webhook', { level: 'error', component: 'payfast-webhook', merchantPaymentId, pfPaymentId: transactionId, idempotencyKey })
      return NextResponse.json({ error: "Transaction not found" }, { status: 400 })
    }

    // Enhanced security validation - check provider or agent ID
    const pendingEntityId = pending.providerId || pending.agentId
    if (pendingEntityId && String(pendingEntityId) !== String(entityId)) {
      captureMessage('Entity ID mismatch in webhook', { level: 'error', component: 'payfast-webhook', expected: pendingEntityId, received: entityId, merchantPaymentId, pfPaymentId: transactionId })
      return new Response("ENTITY_MISMATCH", { status: 400, headers: { "Content-Type": "text/plain" } })
    }

    // Validate amount with tolerance
    if (!PaymentSecurityService.validatePaymentAmount(amount, Number(pending.amount))) {
      captureMessage('Amount mismatch in webhook', { level: 'error', component: 'payfast-webhook', expected: pending.amount, received: amount, merchantPaymentId, pfPaymentId: transactionId })
      return new Response("AMOUNT_MISMATCH", { status: 400, headers: { "Content-Type": "text/plain" } })
    }

    // Check for duplicate payments (only for providers, agents use idempotency key)
    if (pending.providerId) {
      const duplicateCheck = await PaymentReconciliationService.detectDuplicatePayments(pending.providerId, amount)
      if (duplicateCheck.isDuplicate) {
        captureMessage('Duplicate payment detected', { level: 'warning', component: 'payfast-webhook', providerId: pending.providerId, amount, merchantPaymentId, duplicateTransactions: duplicateCheck.duplicateTransactions.map(t => t.id) })
        // Log but don't block - let the reconciliation service handle it
      }
    }

    // Process payment based on status with comprehensive audit logging
    try {
      switch (status) {
        case "COMPLETE":
          await processSuccessfulPayment(pending.id, pending.providerId || pending.agentId, amount, transactionId, merchantPaymentId, paymentDate, data, pending.providerId ? 'provider' : 'agent')
          break
          
        case "PENDING":
          await processPendingPayment(pending.id, pending.providerId || pending.agentId, amount, transactionId, merchantPaymentId, paymentDate, data)
          break
          
        case "FAILED":
          await processFailedPayment(pending.id, pending.providerId || pending.agentId, amount, transactionId, merchantPaymentId, paymentDate, data)
          break
          
        case "CANCELLED":
          await processCancelledPayment(pending.id, pending.providerId || pending.agentId, amount, transactionId, merchantPaymentId, paymentDate, data)
          break
          
        default:
          captureMessage('Unknown payment status in webhook', { level: 'warning', component: 'payfast-webhook', status, pfPaymentId: transactionId, merchantPaymentId })
           console.warn("Unknown payment status:", status, "for payment:", transactionId)
      }

      // Log successful webhook processing
      await PaymentAuditService.logAuditEvent(pending.id, 'updated', {
        oldStatus: pending.status,
        newStatus: status.toLowerCase(),
        amount,
        providerId: pending.providerId || undefined,
        reason: `Webhook processed: ${status}`,
        metadata: { webhookData: sanitizedData, agentId: pending.agentId || undefined }
      })

      // Return success to PayFast in plain text as per recommendations
      return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } })
    } catch (processingError) {
      captureException(processingError instanceof Error ? processingError : new Error(String(processingError)), { component: 'payfast-webhook', status, pfPaymentId: transactionId, merchantPaymentId, entityId })
      
      // Log processing error
      await PaymentAuditService.logAuditEvent(pending.id, 'failed', {
        oldStatus: pending.status,
        newStatus: 'failed',
        amount,
        providerId: pending.providerId || undefined,
        reason: `Webhook processing error: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`,
        metadata: { webhookData: sanitizedData, error: processingError, agentId: pending.agentId || undefined }
      })
      
      // Return 500 to trigger PayFast retry mechanism
      return new Response("ERROR", { status: 500, headers: { "Content-Type": "text/plain" } })
    }

  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)))
    console.error("PayFast notification error:", error)
    
    // Return 500 to trigger PayFast retry mechanism
    return new Response("ERROR", { status: 500, headers: { "Content-Type": "text/plain" } })
  }
}

async function processSuccessfulPayment(
  transactionDbId: string,
  entityId: string, 
  amount: number, 
  transactionId: string,
  _merchantPaymentId: string, 
  paymentDate: Date,
  webhookData: any,
  entityType: 'provider' | 'agent' = 'provider'
) {
  try {
    // Start transaction for atomicity
    await secureDb.db.transaction(async (tx: any) => {
      // Update payment transaction
      await tx
        .update(schema.paymentTransactions)
        .set({
          pfPaymentId: transactionId,
          status: 'completed',
          paymentDate: paymentDate,
          gatewayResponse: webhookData
        })
        .where(eq(schema.paymentTransactions.id, transactionDbId))

      // Update provider or agent subscription status
      if (entityType === 'provider') {
        await tx
          .update(schema.providers)
          .set({
            subscriptionStatus: 'active',
            lastPaymentDate: paymentDate,
            nextPaymentDate: new Date(paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000)
          })
          .where(eq(schema.providers.id, entityId))

        // Handle featured status if requested (only for providers)
        if (webhookData?.custom_str4 === "featured_true" || webhookData?.custom_str2 === "featured") {
          const [featuredResult] = await tx
            .select({ count: count(schema.providers.id) })
            .from(schema.providers)
            .where(eq(schema.providers.isFeatured, true))
          
          const featuredCount = Number(featuredResult?.count || 0)
          if (featuredCount < 5) {
            await tx
              .update(schema.providers)
              .set({ isFeatured: true })
              .where(eq(schema.providers.id, entityId))
          }
        }
      } else if (entityType === 'agent') {
        // For agents, we can add subscription status updates here if needed in the future
        // Currently agents use the same payment flow as providers
      }
    })

    // Log successful payment
    await PaymentAuditService.logAuditEvent(transactionDbId, 'completed', {
      oldStatus: 'pending',
      newStatus: 'completed',
      amount,
      providerId: entityType === 'provider' ? entityId : undefined,
      reason: 'Payment completed successfully via PayFast',
      metadata: { 
        pfPaymentId: transactionId,
        paymentDate: paymentDate.toISOString(),
        featured: webhookData?.custom_str4 === "featured_true",
        agentId: entityType === 'agent' ? entityId : undefined
      }
    })

    // Perform reconciliation
    await PaymentReconciliationService.reconcilePayment(transactionDbId, webhookData)

    console.log(`Payment successful for ${entityType} ${entityId}: ${transactionId}`)
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { component: 'payment-processing', transactionId, entityId, entityType, amount, action: 'processSuccessfulPayment' })
    throw error
  }
}

async function processPendingPayment(
  transactionDbId: string,
  providerId: string, 
  amount: number, 
  transactionId: string, 
  _merchantPaymentId: string,
  _paymentDate: Date,
  webhookData: any
) {
  try {
    await secureDb.db
      .update(schema.paymentTransactions)
      .set({
        pfPaymentId: transactionId,
        status: 'pending',
        gatewayResponse: webhookData
      })
      .where(eq(schema.paymentTransactions.id, transactionDbId))

    // Log pending payment
    await PaymentAuditService.logAuditEvent(transactionDbId, 'updated', {
      oldStatus: 'pending',
      newStatus: 'pending',
      amount,
      providerId,
      reason: 'Payment status updated to pending via PayFast webhook',
      metadata: { pfPaymentId: transactionId }
    })

    console.log(`Payment pending for provider ${providerId}: ${transactionId}`)
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { component: 'payment-processing', transactionId, providerId, amount, action: 'processPendingPayment' })
    throw error
  }
}

async function processFailedPayment(
  transactionDbId: string,
  providerId: string, 
  amount: number, 
  transactionId: string, 
  _merchantPaymentId: string,
  _paymentDate: Date,
  webhookData: any
) {
  try {
    await secureDb.db
      .update(schema.paymentTransactions)
      .set({
        pfPaymentId: transactionId,
        status: 'failed',
        gatewayResponse: webhookData
      })
      .where(eq(schema.paymentTransactions.id, transactionDbId))

    // Log failed payment
    await PaymentAuditService.logAuditEvent(transactionDbId, 'failed', {
      oldStatus: 'pending',
      newStatus: 'failed',
      amount,
      providerId,
      reason: 'Payment failed via PayFast',
      metadata: { 
        pfPaymentId: transactionId,
        webhookData: PaymentSecurityService.sanitizePaymentData(webhookData)
      }
    })

    console.log(`Payment failed for provider ${providerId}: ${transactionId}`)
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { component: 'payment-processing', transactionId, providerId, amount, action: 'processFailedPayment' })
    throw error
  }
}

async function processCancelledPayment(
  transactionDbId: string,
  providerId: string, 
  amount: number, 
  transactionId: string, 
  _merchantPaymentId: string,
  _paymentDate: Date,
  webhookData: any
) {
  try {
    await secureDb.db
      .update(schema.paymentTransactions)
      .set({
        pfPaymentId: transactionId,
        status: 'cancelled',
        gatewayResponse: webhookData
      })
      .where(eq(schema.paymentTransactions.id, transactionDbId))

    // Log cancelled payment
    await PaymentAuditService.logAuditEvent(transactionDbId, 'cancelled', {
      oldStatus: 'pending',
      newStatus: 'cancelled',
      amount,
      providerId,
      reason: 'Payment cancelled via PayFast',
      metadata: { 
        pfPaymentId: transactionId,
        webhookData: PaymentSecurityService.sanitizePaymentData(webhookData)
      }
    })

    console.log(`Payment cancelled for provider ${providerId}: ${transactionId}`)
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { component: 'payment-processing', transactionId, providerId, amount, action: 'processCancelledPayment' })
    throw error
  }
}
