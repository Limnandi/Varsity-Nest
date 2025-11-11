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
    console.log("\n" + "=".repeat(80))
    console.log("[PAYFAST ITN] ===== WEBHOOK RECEIVED =====")
    console.log("[PAYFAST ITN] Timestamp:", new Date().toISOString())
    console.log("[PAYFAST ITN] URL:", request.url)
    console.log("=".repeat(80))
    
    // Enhanced IP validation using PayFast's official IP ranges
    const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                    request.headers.get("x-real-ip") || 
                    (request as any).ip || ""
    
    console.log("[PAYFAST ITN] Client IP:", clientIP)
    
    if (!PaymentSecurityService.validatePayFastIP(clientIP)) {
      console.error("[PAYFAST ITN] ERROR: Unauthorized IP address:", clientIP)
      captureMessage('PayFast webhook from unauthorized IP', { level: 'error', component: 'payfast-webhook', clientIP })
      return new Response("FORBIDDEN", { status: 403, headers: { "Content-Type": "text/plain" } })
    }

    console.log("[PAYFAST ITN] IP validation passed")
    
    const formData = await request.formData()
    const rawData: any = {}
    const fieldOrder: string[] = []

    // Parse form data with field order tracking
    formData.forEach((value, key) => {
      rawData[key] = value.toString()
      fieldOrder.push(key)
    })

    console.log("[PAYFAST ITN] Raw data received:", Object.keys(rawData).sort())
    console.log("[PAYFAST ITN] Field order:", fieldOrder)

    // Validate webhook data structure with Zod schema
    const validationResult = PayFastWebhookSchema.safeParse(rawData)
    if (!validationResult.success) {
      console.error("[PAYFAST ITN] ERROR: Invalid webhook data structure:", validationResult.error.issues)
      captureMessage('Invalid PayFast webhook data structure', { level: 'error', component: 'payfast-webhook', errors: validationResult.error.issues, pfPaymentId: rawData.pf_payment_id })
      return NextResponse.json({ 
        error: "Invalid webhook data structure", 
        details: validationResult.error.issues 
      }, { status: 400 })
    }

    const data = validationResult.data

    // Build ITN payload string for testing (alphabetical order for ITN)
    const { env } = await import('@/lib/env')
    const itnPayloadData: Record<string, string> = {}
    for (const key in data) {
      const value = data[key as keyof typeof data]
      if (value !== undefined && value !== "" && key !== "signature") {
        itnPayloadData[key] = String(value)
      }
    }
    
    // Sort alphabetically for ITN signature (different from form submission)
    const sortedKeys = Object.keys(itnPayloadData).sort()
    let itnPayloadString = ""
    for (const key of sortedKeys) {
      const encodedValue = encodeURIComponent(itnPayloadData[key])
      itnPayloadString += `${key}=${encodedValue}&`
    }
    itnPayloadString = itnPayloadString.slice(0, -1) // Remove trailing &
    
    // Add passphrase for ITN signature
    if (env.PAYFAST_PASSPHRASE) {
      itnPayloadString += `&passphrase=${encodeURIComponent(env.PAYFAST_PASSPHRASE)}`
    }
    
    console.log("\n" + "=".repeat(80))
    console.log("[PAYFAST ITN] ===== COPY THIS FOR ITN TESTER =====")
    console.log("=".repeat(80))
    console.log(itnPayloadString)
    console.log("=".repeat(80))
    console.log("[PAYFAST ITN] ===== END OF ITN PAYLOAD STRING =====")
    console.log("[PAYFAST ITN] Payload length:", itnPayloadString.length)
    console.log("[PAYFAST ITN] NOTE: ITN uses alphabetical ordering (different from form submission)")
    console.log("[PAYFAST ITN] NOTE: passphrase IS included in ITN payload string")
    console.log("=".repeat(80) + "\n")

    // Enhanced signature verification with timing-safe comparison
    const signatureValid = PaymentSecurityService.verifyPayFastSignature(data, data.signature)
    console.log("[PAYFAST ITN] Signature verification:", signatureValid ? "PASSED" : "FAILED")
    console.log("[PAYFAST ITN] Received signature:", data.signature)
    
    if (!signatureValid) {
      console.error("[PAYFAST ITN] ERROR: Invalid signature!")
      captureMessage('Invalid PayFast webhook signature', { level: 'error', component: 'payfast-webhook', pfPaymentId: data.pf_payment_id, clientIP })
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Validate merchant ID
    if (data.merchant_id !== env.PAYFAST_MERCHANT_ID) {
      console.error("[PAYFAST ITN] ERROR: Merchant ID mismatch!")
      console.error("[PAYFAST ITN] Expected:", env.PAYFAST_MERCHANT_ID)
      console.error("[PAYFAST ITN] Received:", data.merchant_id)
      captureMessage('Merchant ID mismatch in PayFast webhook', { level: 'error', component: 'payfast-webhook', merchantId: data.merchant_id, pfPaymentId: data.pf_payment_id })
      return new Response("MERCHANT_MISMATCH", { status: 400, headers: { "Content-Type": "text/plain" } })
    }

    console.log("[PAYFAST ITN] Merchant ID validation passed")
    
    // Log webhook receipt with sanitized data
    const sanitizedData = PaymentSecurityService.sanitizePaymentData(data)
    console.log("[PAYFAST ITN] Webhook data:", {
      pfPaymentId: data.pf_payment_id,
      paymentStatus: data.payment_status,
      amount: data.amount_gross,
      mPaymentId: data.m_payment_id,
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
    console.log(`[PAYFAST ITN] Processing payment with status: ${status}`)
    try {
      switch (status) {
        case "COMPLETE":
          console.log(`[PAYFAST ITN] Processing COMPLETE payment for ${pending.providerId ? 'provider' : 'agent'} ${pending.providerId || pending.agentId}`)
          await processSuccessfulPayment(pending.id, pending.providerId || pending.agentId, amount, transactionId, merchantPaymentId, paymentDate, data, pending.providerId ? 'provider' : 'agent')
          console.log(`[PAYFAST ITN] ✓ Payment processed successfully - subscription activated`)
          break
          
        case "PENDING":
          console.log(`[PAYFAST ITN] Processing PENDING payment`)
          await processPendingPayment(pending.id, pending.providerId || pending.agentId, amount, transactionId, merchantPaymentId, paymentDate, data)
          break
          
        case "FAILED":
          console.log(`[PAYFAST ITN] Processing FAILED payment`)
          await processFailedPayment(pending.id, pending.providerId || pending.agentId, amount, transactionId, merchantPaymentId, paymentDate, data)
          break
          
        case "CANCELLED":
          console.log(`[PAYFAST ITN] Processing CANCELLED payment`)
          await processCancelledPayment(pending.id, pending.providerId || pending.agentId, amount, transactionId, merchantPaymentId, paymentDate, data)
          break
          
        default:
          console.warn(`[PAYFAST ITN] WARNING: Unknown payment status: ${status}`)
          captureMessage('Unknown payment status in webhook', { level: 'warning', component: 'payfast-webhook', status, pfPaymentId: transactionId, merchantPaymentId })
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

      console.log(`[PAYFAST ITN] ✓ Webhook processing completed successfully`)
      console.log("=".repeat(80) + "\n")

      // Return success to PayFast in plain text as per recommendations
      return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } })
    } catch (processingError) {
      console.error(`[PAYFAST ITN] ERROR: Failed to process payment:`, processingError)
      console.error(`[PAYFAST ITN] Error stack:`, processingError instanceof Error ? processingError.stack : 'No stack')
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
      
      console.log("=".repeat(80) + "\n")
      
      // Return 500 to trigger PayFast retry mechanism
      return new Response("ERROR", { status: 500, headers: { "Content-Type": "text/plain" } })
    }

  } catch (error) {
    console.error("\n" + "=".repeat(80))
    console.error("[PAYFAST ITN] CRITICAL ERROR:", error)
    console.error("[PAYFAST ITN] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[PAYFAST ITN] Error stack:", error instanceof Error ? error.stack : 'No stack')
    console.error("=".repeat(80) + "\n")
    
    captureException(error instanceof Error ? error : new Error(String(error)))
    
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
    console.log(`[PAYFAST NOTIFY] Processing successful payment for ${entityType} ${entityId}, transaction: ${transactionId}`)
    
    // Extract payment_token and subscription_token from webhook data if available
    const paymentToken = webhookData?.token || webhookData?.payment_token
    const subscriptionToken = webhookData?.subscription_token || webhookData?.token // For recurring payments, token is subscription token
    
    // Update payment transaction (neon-http doesn't support transactions, so we do sequential operations)
    console.log(`[PAYFAST NOTIFY] Updating payment transaction ${transactionDbId} to completed`)
    await secureDb.db
      .update(schema.paymentTransactions)
      .set({
        pfPaymentId: transactionId,
        status: 'completed',
        paymentDate: paymentDate,
        paymentToken: paymentToken || undefined,
        subscriptionToken: subscriptionToken || undefined,
        gatewayResponse: webhookData
      })
      .where(eq(schema.paymentTransactions.id, transactionDbId))

    // Update provider or agent subscription status
    if (entityType === 'provider') {
      console.log(`[PAYFAST NOTIFY] Activating subscription for provider ${entityId}`)
      
      // Check if this is a trial-to-paid transition
      const [providerBeforeUpdate] = await secureDb.db
        .select({
          subscriptionStatus: schema.providers.subscriptionStatus,
          trialEndDate: schema.providers.trialEndDate
        })
        .from(schema.providers)
        .where(eq(schema.providers.id, entityId))
        .limit(1)
      
      const isTrialToPaidTransition = providerBeforeUpdate?.subscriptionStatus === 'trial'
      const nextPaymentDate = new Date(paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from payment
      
      // Update provider subscription status - verify it actually updated
      const [updatedProvider] = await secureDb.db
        .update(schema.providers)
        .set({
          subscriptionStatus: 'active',
          lastPaymentDate: paymentDate,
          nextPaymentDate: nextPaymentDate,
          subscriptionToken: subscriptionToken || undefined, // Store subscription token for recurring billing management
          // Clear trial dates when transitioning to paid
          ...(isTrialToPaidTransition ? {
            trialStartDate: null,
            trialEndDate: null
          } : {})
        })
        .where(eq(schema.providers.id, entityId))
        .returning({ 
          id: schema.providers.id,
          subscriptionStatus: schema.providers.subscriptionStatus,
          nextPaymentDate: schema.providers.nextPaymentDate,
          lastPaymentDate: schema.providers.lastPaymentDate
        })

      if (!updatedProvider) {
        console.error(`[PAYFAST NOTIFY] CRITICAL: Failed to update provider ${entityId} - provider not found!`)
        throw new Error(`Provider ${entityId} not found - cannot activate subscription`)
      }

      console.log(`[PAYFAST NOTIFY] Provider ${entityId} subscription activated successfully:`, {
        subscriptionStatus: updatedProvider.subscriptionStatus,
        nextPaymentDate: updatedProvider.nextPaymentDate?.toISOString(),
        lastPaymentDate: updatedProvider.lastPaymentDate?.toISOString(),
        isTrialToPaidTransition: isTrialToPaidTransition
      })

      // Handle featured status if requested (only for providers)
      if (webhookData?.custom_str4 === "featured_true" || webhookData?.custom_str2 === "featured") {
        const [featuredResult] = await secureDb.db
          .select({ count: count(schema.providers.id) })
          .from(schema.providers)
          .where(eq(schema.providers.isFeatured, true))
        
        const featuredCount = Number(featuredResult?.count || 0)
        if (featuredCount < 5) {
          await secureDb.db
            .update(schema.providers)
            .set({ isFeatured: true })
            .where(eq(schema.providers.id, entityId))
        }
      }
    } else if (entityType === 'agent') {
      // Store subscription token for agents
      await secureDb.db
        .update(schema.agents)
        .set({
          subscriptionToken: subscriptionToken || undefined // Store subscription token for recurring billing management
        })
        .where(eq(schema.agents.id, entityId))
    }

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
