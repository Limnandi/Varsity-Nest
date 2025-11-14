import { type NextRequest, NextResponse } from "next/server"
import { PaystackWebhookSchema, PaystackSubscriptionDataSchema, PaystackInvoiceDataSchema, PaystackChargeSuccessDataSchema } from "@/lib/schemas/payment"
import { PaymentSecurityService } from "@/lib/services/payment-security"
import { PaymentAuditService } from "@/lib/services/payment-audit"
import { PaymentReconciliationService } from "@/lib/services/payment-reconciliation"
import { captureMessage, captureException } from '@/lib/logging/config'
import { secureDb } from "@/lib/database-secure"
import { eq, count } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { convertFromKobo } from "@/lib/paystack"
import { PaystackAPIClient } from "@/lib/paystack-api-client"

export async function POST(request: NextRequest) {
  try {
    console.log("\n" + "=".repeat(80))
    console.log("[PAYSTACK WEBHOOK] ===== WEBHOOK RECEIVED =====")
    console.log("[PAYSTACK WEBHOOK] Timestamp:", new Date().toISOString())
    console.log("[PAYSTACK WEBHOOK] URL:", request.url)
    console.log("=".repeat(80))
    
    // Get client IP for validation
    const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                    request.headers.get("x-real-ip") || 
                    (request as any).ip || ""
    
    console.log("[PAYSTACK WEBHOOK] Client IP:", clientIP)
    
    // Parse webhook body
    const body = await request.json()
    console.log("[PAYSTACK WEBHOOK] Event:", body.event)
    console.log("[PAYSTACK WEBHOOK] Data keys:", Object.keys(body.data || {}))

    // Validate webhook structure
    const validationResult = PaystackWebhookSchema.safeParse(body)
    if (!validationResult.success) {
      console.error("[PAYSTACK WEBHOOK] ERROR: Invalid webhook structure:", validationResult.error.issues)
      captureMessage('Invalid Paystack webhook structure', { level: 'error', component: 'paystack-webhook', errors: validationResult.error.issues })
      return NextResponse.json({ 
        error: "Invalid webhook structure", 
        details: validationResult.error.issues 
      }, { status: 400 })
    }

    const { event, data } = validationResult.data

    // Log webhook receipt
    const sanitizedData = PaymentSecurityService.sanitizePaymentData(data)
    console.log("[PAYSTACK WEBHOOK] Webhook data:", {
      event,
      dataKeys: Object.keys(data),
      clientIP
    })

    // Process webhook based on event type
    try {
      switch (event) {
        case "subscription.create":
          await handleSubscriptionCreate(data)
          break
          
        case "charge.success":
          await handleChargeSuccess(data)
          break
          
        case "invoice.create":
          await handleInvoiceCreate(data)
          break
          
        case "invoice.payment_failed":
          await handleInvoicePaymentFailed(data)
          break
          
        case "invoice.update":
          await handleInvoiceUpdate(data)
          break
          
        case "subscription.disable":
          await handleSubscriptionDisable(data)
          break
          
        case "subscription.not_renew":
          await handleSubscriptionNotRenew(data)
          break
          
        default:
          console.warn(`[PAYSTACK WEBHOOK] WARNING: Unhandled event type: ${event}`)
          captureMessage('Unhandled Paystack webhook event', { level: 'warning', component: 'paystack-webhook', event })
      }

      console.log(`[PAYSTACK WEBHOOK] ✓ Webhook processing completed successfully`)
      console.log("=".repeat(80) + "\n")

      // Return success to Paystack
      return NextResponse.json({ received: true }, { status: 200 })
    } catch (processingError) {
      console.error(`[PAYSTACK WEBHOOK] ERROR: Failed to process webhook:`, processingError)
      console.error(`[PAYSTACK WEBHOOK] Error stack:`, processingError instanceof Error ? processingError.stack : 'No stack')
      captureException(processingError instanceof Error ? processingError : new Error(String(processingError)), { 
        component: 'paystack-webhook', 
        event,
        clientIP 
      })
      
      console.log("=".repeat(80) + "\n")
      
      // Return 500 to trigger Paystack retry mechanism
      return NextResponse.json({ error: "Processing failed" }, { status: 500 })
    }

  } catch (error) {
    console.error("\n" + "=".repeat(80))
    console.error("[PAYSTACK WEBHOOK] CRITICAL ERROR:", error)
    console.error("[PAYSTACK WEBHOOK] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[PAYSTACK WEBHOOK] Error stack:", error instanceof Error ? error.stack : 'No stack')
    console.error("=".repeat(80) + "\n")
    
    captureException(error instanceof Error ? error : new Error(String(error)))
    
    // Return 500 to trigger Paystack retry mechanism
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Handle subscription.create event
 * This is sent when a subscription is created for a customer
 */
async function handleSubscriptionCreate(data: any) {
  try {
    const subscriptionData = PaystackSubscriptionDataSchema.parse(data)
    console.log(`[PAYSTACK WEBHOOK] Processing subscription.create for subscription: ${subscriptionData.subscription_code}`)
    
    // Extract metadata from customer or subscription
    const customerEmail = subscriptionData.customer?.email
    const subscriptionCode = subscriptionData.subscription_code
    const amount = convertFromKobo(subscriptionData.amount)
    
    // Find transaction by reference (stored in mPaymentId)
    // We need to find the transaction that created this subscription
    // The reference should be in the transaction metadata
    
    // For now, log the subscription creation
    captureMessage('Subscription created via Paystack', {
      level: 'info',
      component: 'paystack-webhook',
      subscriptionCode,
      customerEmail,
      amount
    })
    
    // Update provider/agent with subscription code if we can find them
    if (customerEmail) {
      // Try to find provider or agent by email
      const [provider] = await secureDb.db
        .select({ id: schema.providers.id })
        .from(schema.providers)
        .where(eq(schema.providers.contactEmail, customerEmail))
        .limit(1)
      
      if (provider) {
        await secureDb.db
          .update(schema.providers)
          .set({
            subscriptionToken: subscriptionCode
          })
          .where(eq(schema.providers.id, provider.id))
      } else {
        const [agent] = await secureDb.db
          .select({ id: schema.agents.id })
          .from(schema.agents)
          .where(eq(schema.agents.contactEmail, customerEmail))
          .limit(1)
        
        if (agent) {
          await secureDb.db
            .update(schema.agents)
            .set({
              subscriptionToken: subscriptionCode
            })
            .where(eq(schema.agents.id, agent.id))
        }
      }
    }
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { 
      component: 'paystack-webhook', 
      action: 'handleSubscriptionCreate' 
    })
    throw error
  }
}

/**
 * Handle charge.success event
 * This is sent when a payment is successful
 */
async function handleChargeSuccess(data: any) {
  try {
    const chargeData = PaystackChargeSuccessDataSchema.parse(data)
    console.log(`[PAYSTACK WEBHOOK] Processing charge.success for reference: ${chargeData.reference}`)
    
    const reference = chargeData.reference
    const amount = convertFromKobo(chargeData.amount)
    const transactionId = chargeData.id?.toString() || chargeData.reference
    const paymentDate = new Date(chargeData.transaction_date)
    
    // Extract metadata
    const metadata = chargeData.metadata || {}
    const entityId = metadata.entity_id || metadata.custom_fields?.find((f: any) => f.variable_name === 'entity_id')?.value
    const entityType = metadata.entity_type || (entityId ? 'provider' : 'agent') // Default to provider if entityId exists
    
    // Find transaction by reference
    const [pending] = await secureDb.db
      .select({
        id: schema.paymentTransactions.id,
        amount: schema.paymentTransactions.amount,
        providerId: schema.paymentTransactions.providerId,
        agentId: schema.paymentTransactions.agentId,
        status: schema.paymentTransactions.status,
        gatewayResponse: schema.paymentTransactions.gatewayResponse
      })
      .from(schema.paymentTransactions)
      .where(eq(schema.paymentTransactions.mPaymentId, reference))
      .limit(1)
    
    if (!pending) {
      console.error(`[PAYSTACK WEBHOOK] ERROR: Transaction not found for reference: ${reference}`)
      captureMessage('Transaction not found for charge.success', { 
        level: 'error', 
        component: 'paystack-webhook', 
        reference 
      })
      return
    }
    
    // Check if this is a trial tokenization charge (R1.00 for card tokenization)
    const gatewayResponse = pending.gatewayResponse as Record<string, any> | null
    const isTokenization = gatewayResponse?.isTokenization === true || metadata.is_tokenization === "true"
    const isTrialSetup = gatewayResponse?.trialActivated === true || gatewayResponse?.trial_payment_setup === true
    const planCode = gatewayResponse?.planCode || metadata.plan_code
    
    // Validate amount (allow R1.00 for tokenization, or exact match for regular payments)
    if (isTokenization && amount !== 1.00) {
      // Tokenization should be exactly R1.00
      console.warn(`[PAYSTACK WEBHOOK] Tokenization amount mismatch: expected 1.00, got ${amount}`)
    } else if (!isTokenization && !PaymentSecurityService.validatePaymentAmount(amount, Number(pending.amount))) {
      captureMessage('Amount mismatch in charge.success', { 
        level: 'error', 
        component: 'paystack-webhook', 
        expected: pending.amount, 
        received: amount, 
        reference 
      })
      return
    }
    
    // If already completed, skip
    if (pending.status === 'completed') {
      console.log(`[PAYSTACK WEBHOOK] Transaction ${pending.id} already completed, skipping`)
      return
    }
    
    // Update transaction
    await secureDb.db
      .update(schema.paymentTransactions)
      .set({
        pfPaymentId: transactionId,
        status: 'completed',
        paymentDate: paymentDate,
        subscriptionToken: chargeData.authorization?.authorization_code || undefined,
        gatewayResponse: chargeData
      })
      .where(eq(schema.paymentTransactions.id, pending.id))
    
    // Update provider or agent subscription status
    const actualEntityId = pending.providerId || pending.agentId || entityId
    const actualEntityType = pending.providerId ? 'provider' : (pending.agentId ? 'agent' : entityType)
    
    if (actualEntityType === 'provider' && actualEntityId) {
      const [providerBeforeUpdate] = await secureDb.db
        .select({
          subscriptionStatus: schema.providers.subscriptionStatus,
          trialEndDate: schema.providers.trialEndDate,
          contactEmail: schema.providers.contactEmail
        })
        .from(schema.providers)
        .where(eq(schema.providers.id, actualEntityId))
        .limit(1)
      
      const isTrialToPaidTransition = providerBeforeUpdate?.subscriptionStatus === 'trial' && amount > 1.00 // More than tokenization
      const isTrialTokenization = providerBeforeUpdate?.subscriptionStatus === 'trial' && isTokenization && amount === 1.00 && planCode
      
      let subscriptionCode: string | undefined = undefined
      
      // If this is a trial tokenization charge, create subscription with start_date = trial end date
      if (isTrialTokenization && planCode && chargeData.authorization?.authorization_code && providerBeforeUpdate?.trialEndDate) {
        try {
          const trialEndDate = new Date(providerBeforeUpdate.trialEndDate)
          const startDate = trialEndDate.toISOString().split('T')[0] // Format: YYYY-MM-DD
          
          console.log(`[PAYSTACK WEBHOOK] Creating trial subscription with authorization_code: ${chargeData.authorization.authorization_code}, plan: ${planCode}, start_date: ${startDate}`)
          
          const subscription = await PaystackAPIClient.createSubscription(
            providerBeforeUpdate.contactEmail || chargeData.customer?.email || '',
            planCode,
            chargeData.authorization.authorization_code,
            startDate
          )
          
          subscriptionCode = subscription.subscription_code
          console.log(`[PAYSTACK WEBHOOK] Created trial subscription: ${subscriptionCode}, starts: ${startDate}`)
          
          captureMessage('Trial subscription created successfully', {
            level: 'info',
            component: 'paystack-webhook',
            providerId: actualEntityId,
            subscriptionCode: subscriptionCode,
            startDate,
            authorizationCode: chargeData.authorization.authorization_code
          })
          
          // Optionally refund the R1.00 tokenization charge
          // You can implement refund here if desired, or credit it back to user's account value
          // For now, we'll just log it - you can add refund logic later
          console.log(`[PAYSTACK WEBHOOK] Tokenization charge of R1.00 can be refunded or credited to user account`)
          
        } catch (subError) {
          captureException(subError instanceof Error ? subError : new Error(String(subError)), {
            component: 'paystack-webhook',
            action: 'createTrialSubscription',
            providerId: actualEntityId,
            planCode,
            authorizationCode: chargeData.authorization?.authorization_code
          })
          // Continue with normal flow even if subscription creation fails
        }
      }
      
      const nextPaymentDate = isTrialTokenization 
        ? new Date(providerBeforeUpdate?.trialEndDate || paymentDate) 
        : new Date(paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from payment
      
      await secureDb.db
        .update(schema.providers)
        .set({
          subscriptionStatus: isTrialTokenization ? 'trial' : 'active',
          lastPaymentDate: isTrialTokenization ? null : paymentDate, // Don't set lastPaymentDate for tokenization
          nextPaymentDate: nextPaymentDate,
          subscriptionToken: subscriptionCode || (isTrialTokenization ? undefined : (chargeData.authorization?.authorization_code || undefined)),
          ...(isTrialToPaidTransition ? {
            trialStartDate: null,
            trialEndDate: null
          } : {})
        })
        .where(eq(schema.providers.id, actualEntityId))
      
      // Handle featured status if requested
      const wantsFeatured = metadata.wants_featured === "true" || metadata.custom_fields?.find((f: any) => f.variable_name === 'wants_featured')?.value === "true"
      if (wantsFeatured) {
        const [featuredResult] = await secureDb.db
          .select({ count: count(schema.providers.id) })
          .from(schema.providers)
          .where(eq(schema.providers.isFeatured, true))
        
        const featuredCount = Number(featuredResult?.count || 0)
        if (featuredCount < 5) {
          await secureDb.db
            .update(schema.providers)
            .set({ isFeatured: true })
            .where(eq(schema.providers.id, actualEntityId))
        }
      }
    } else if (actualEntityType === 'agent' && actualEntityId) {
      await secureDb.db
        .update(schema.agents)
        .set({
          subscriptionToken: chargeData.authorization?.authorization_code || undefined
        })
        .where(eq(schema.agents.id, actualEntityId))
    }
    
    // Log successful payment
    await PaymentAuditService.logAuditEvent(pending.id, 'completed', {
      oldStatus: pending.status,
      newStatus: 'completed',
      amount,
      providerId: pending.providerId || undefined,
      reason: 'Payment completed successfully via Paystack',
      metadata: {
        reference,
        transactionId,
        paymentDate: paymentDate.toISOString(),
        agentId: pending.agentId || undefined
      }
    })
    
    // Perform reconciliation
    await PaymentReconciliationService.reconcilePayment(pending.id, chargeData)
    
    console.log(`[PAYSTACK WEBHOOK] Payment successful for ${actualEntityType} ${actualEntityId}: ${reference}`)
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { 
      component: 'paystack-webhook', 
      action: 'handleChargeSuccess' 
    })
    throw error
  }
}

/**
 * Handle invoice.create event
 * Sent 3 days before the next payment date
 */
async function handleInvoiceCreate(data: any) {
  try {
    const invoiceData = PaystackInvoiceDataSchema.parse(data)
    console.log(`[PAYSTACK WEBHOOK] Processing invoice.create for invoice: ${invoiceData.invoice_code}`)
    
    // Log invoice creation for monitoring
    captureMessage('Invoice created via Paystack', {
      level: 'info',
      component: 'paystack-webhook',
      invoiceCode: invoiceData.invoice_code,
      amount: convertFromKobo(invoiceData.amount),
      subscriptionCode: invoiceData.subscription?.subscription_code
    })
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { 
      component: 'paystack-webhook', 
      action: 'handleInvoiceCreate' 
    })
    throw error
  }
}

/**
 * Handle invoice.payment_failed event
 * Sent when a subscription charge attempt fails
 */
async function handleInvoicePaymentFailed(data: any) {
  try {
    const invoiceData = PaystackInvoiceDataSchema.parse(data)
    console.log(`[PAYSTACK WEBHOOK] Processing invoice.payment_failed for invoice: ${invoiceData.invoice_code}`)
    
    const subscriptionCode = invoiceData.subscription?.subscription_code
    if (!subscriptionCode) {
      console.error("[PAYSTACK WEBHOOK] ERROR: No subscription code in invoice.payment_failed")
      return
    }
    
    // Find provider or agent with this subscription code
    const [provider] = await secureDb.db
      .select({ id: schema.providers.id })
      .from(schema.providers)
      .where(eq(schema.providers.subscriptionToken, subscriptionCode))
      .limit(1)
    
    if (provider) {
      // Update provider status to attention
      await secureDb.db
        .update(schema.providers)
        .set({
          subscriptionStatus: 'attention'
        })
        .where(eq(schema.providers.id, provider.id))
    }
    
    captureMessage('Invoice payment failed via Paystack', {
      level: 'warning',
      component: 'paystack-webhook',
      invoiceCode: invoiceData.invoice_code,
      subscriptionCode,
      providerId: provider?.id
    })
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { 
      component: 'paystack-webhook', 
      action: 'handleInvoicePaymentFailed' 
    })
    throw error
  }
}

/**
 * Handle invoice.update event
 * Sent after a charge attempt with final status
 */
async function handleInvoiceUpdate(data: any) {
  try {
    const invoiceData = PaystackInvoiceDataSchema.parse(data)
    console.log(`[PAYSTACK WEBHOOK] Processing invoice.update for invoice: ${invoiceData.invoice_code}`)
    
    if (invoiceData.status === "success" && invoiceData.paid) {
      // Payment succeeded - similar to charge.success
      const reference = invoiceData.transaction?.reference
      if (reference) {
        // Find and update transaction
        const [pending] = await secureDb.db
          .select({
            id: schema.paymentTransactions.id,
            amount: schema.paymentTransactions.amount,
            providerId: schema.paymentTransactions.providerId,
            agentId: schema.paymentTransactions.agentId,
            status: schema.paymentTransactions.status
          })
          .from(schema.paymentTransactions)
          .where(eq(schema.paymentTransactions.mPaymentId, reference))
          .limit(1)
        
        if (pending && pending.status !== 'completed') {
          const amount = convertFromKobo(invoiceData.amount)
          const paymentDate = invoiceData.paid_at ? new Date(invoiceData.paid_at) : new Date()
          
          await secureDb.db
            .update(schema.paymentTransactions)
            .set({
              status: 'completed',
              paymentDate: paymentDate,
              gatewayResponse: invoiceData
            })
            .where(eq(schema.paymentTransactions.id, pending.id))
          
          // Update provider next payment date
          if (pending.providerId && invoiceData.subscription?.next_payment_date) {
            await secureDb.db
              .update(schema.providers)
              .set({
                nextPaymentDate: new Date(invoiceData.subscription.next_payment_date),
                lastPaymentDate: paymentDate,
                subscriptionStatus: 'active'
              })
              .where(eq(schema.providers.id, pending.providerId))
          }
          
          await PaymentAuditService.logAuditEvent(pending.id, 'completed', {
            oldStatus: pending.status,
            newStatus: 'completed',
            amount,
            providerId: pending.providerId || undefined,
            reason: 'Payment completed via invoice.update',
            metadata: { invoiceCode: invoiceData.invoice_code }
          })
        }
      }
    }
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { 
      component: 'paystack-webhook', 
      action: 'handleInvoiceUpdate' 
    })
    throw error
  }
}

/**
 * Handle subscription.disable event
 * Sent when a subscription is cancelled or completed
 */
async function handleSubscriptionDisable(data: any) {
  try {
    const subscriptionData = PaystackSubscriptionDataSchema.parse(data)
    console.log(`[PAYSTACK WEBHOOK] Processing subscription.disable for subscription: ${subscriptionData.subscription_code}`)
    
    const subscriptionCode = subscriptionData.subscription_code
    const status = subscriptionData.status // "complete" or "cancelled"
    
    // Find provider or agent with this subscription code
    const [provider] = await secureDb.db
      .select({ id: schema.providers.id })
      .from(schema.providers)
      .where(eq(schema.providers.subscriptionToken, subscriptionCode))
      .limit(1)
    
    if (provider) {
      await secureDb.db
        .update(schema.providers)
        .set({
          subscriptionStatus: status === "complete" ? "completed" : "cancelled"
        })
        .where(eq(schema.providers.id, provider.id))
    } else {
      const [agent] = await secureDb.db
        .select({ id: schema.agents.id })
        .from(schema.agents)
        .where(eq(schema.agents.subscriptionToken, subscriptionCode))
        .limit(1)
      
      // Agents don't have subscription status, just log
    }
    
    captureMessage('Subscription disabled via Paystack', {
      level: 'info',
      component: 'paystack-webhook',
      subscriptionCode,
      status,
      providerId: provider?.id
    })
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { 
      component: 'paystack-webhook', 
      action: 'handleSubscriptionDisable' 
    })
    throw error
  }
}

/**
 * Handle subscription.not_renew event
 * Sent when a subscription is set to not renew
 */
async function handleSubscriptionNotRenew(data: any) {
  try {
    const subscriptionData = PaystackSubscriptionDataSchema.parse(data)
    console.log(`[PAYSTACK WEBHOOK] Processing subscription.not_renew for subscription: ${subscriptionData.subscription_code}`)
    
    const subscriptionCode = subscriptionData.subscription_code
    
    // Find provider with this subscription code
    const [provider] = await secureDb.db
      .select({ id: schema.providers.id })
      .from(schema.providers)
      .where(eq(schema.providers.subscriptionToken, subscriptionCode))
      .limit(1)
    
    if (provider) {
      await secureDb.db
        .update(schema.providers)
        .set({
          subscriptionStatus: 'non-renewing'
        })
        .where(eq(schema.providers.id, provider.id))
    }
    
    captureMessage('Subscription set to not renew via Paystack', {
      level: 'info',
      component: 'paystack-webhook',
      subscriptionCode,
      providerId: provider?.id
    })
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { 
      component: 'paystack-webhook', 
      action: 'handleSubscriptionNotRenew' 
    })
    throw error
  }
}

