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
    console.log('[WEBHOOK] Paystack webhook endpoint called')
    
    // Get client IP for validation
    const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                    request.headers.get("x-real-ip") || 
                    (request as any).ip || ""
    
    console.log('[WEBHOOK] Client IP:', clientIP)
    
    // Optional: Validate IP address (additional security layer)
    // Note: This may fail behind proxies/ngrok, so we'll log but not block
    const isValidIP = PaymentSecurityService.validatePaystackIP(clientIP)
    if (!isValidIP && clientIP) {
      console.warn('[WEBHOOK] IP address not in Paystack whitelist:', clientIP)
      captureMessage('Paystack webhook from non-whitelisted IP', { 
        level: 'warning', 
        component: 'paystack-webhook', 
        clientIP,
        note: 'Continuing with signature validation'
      })
    }
    
    // Read raw body as text for signature verification
    const rawBody = await request.text()
    console.log('[WEBHOOK] Raw webhook body received (length):', rawBody.length)
    
    // Get signature from header
    const signature = request.headers.get("x-paystack-signature")
    console.log('[WEBHOOK] Signature header present:', !!signature)
    
    // Verify signature before processing (REQUIRED)
    if (!signature) {
      console.error('[WEBHOOK] Missing x-paystack-signature header')
      captureMessage('Missing Paystack webhook signature', { level: 'error', component: 'paystack-webhook', clientIP })
      return NextResponse.json({ error: "Missing signature" }, { status: 401 })
    }
    
    const isValidSignature = PaymentSecurityService.verifyPaystackSignature(rawBody, signature)
    if (!isValidSignature) {
      console.error('[WEBHOOK] Invalid webhook signature')
      captureMessage('Invalid Paystack webhook signature', { level: 'error', component: 'paystack-webhook', clientIP })
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
    
    console.log('[WEBHOOK] Signature verified successfully')
    
    // Parse webhook body
    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('[WEBHOOK] Failed to parse JSON body:', parseError)
      captureMessage('Failed to parse Paystack webhook body', { level: 'error', component: 'paystack-webhook', clientIP })
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }
    
    console.log('[WEBHOOK] Webhook body parsed:', {
      hasEvent: !!body.event,
      event: body.event || 'NOT_FOUND',
      hasData: !!body.data,
      bodyKeys: Object.keys(body)
    })

    // Validate webhook structure
    // Basic validation - check for event and data fields
    if (!body || typeof body !== 'object' || !body.event || !body.data) {
      console.error('[WEBHOOK] Invalid webhook structure - missing event or data')
      captureMessage('Invalid Paystack webhook structure', { level: 'error', component: 'paystack-webhook', body: JSON.stringify(body) })
      return NextResponse.json({ 
        error: "Invalid webhook structure", 
        details: "Missing event or data field"
      }, { status: 400 })
    }
    
    // Validate event type
    const validationResult = PaystackWebhookSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('[WEBHOOK] Invalid webhook event type:', validationResult.error.issues)
      captureMessage('Invalid Paystack webhook event type', { level: 'error', component: 'paystack-webhook', errors: validationResult.error.issues })
      return NextResponse.json({ 
        error: "Invalid webhook event type", 
        details: validationResult.error.issues 
      }, { status: 400 })
    }

    const { event, data } = validationResult.data
    
    console.log('[WEBHOOK] Webhook validated successfully:', {
      event: event || 'NOT_FOUND',
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : []
    })

    // Log webhook receipt (sanitized for security)
    PaymentSecurityService.sanitizePaymentData(data)

    // Process webhook based on event type
    try {
      console.log('[WEBHOOK] Processing webhook event:', event)
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
          
        case "refund.processed":
        case "refund.processing":
        case "refund.pending":
        case "refund.failed":
          // Log refund events but don't process them (they're informational)
          console.log(`[WEBHOOK] Refund event received: ${event}`, JSON.stringify(data, null, 2))
          captureMessage(`Refund event received: ${event}`, { 
            level: 'info', 
            component: 'paystack-webhook', 
            event,
            refundData: data 
          })
          break
          
        default:
          console.warn('[WEBHOOK] Unhandled webhook event:', event)
          captureMessage('Unhandled Paystack webhook event', { level: 'warning', component: 'paystack-webhook', event })
      }

      console.log('[WEBHOOK] Webhook processed successfully, returning 200')
      // Return success to Paystack
      return NextResponse.json({ received: true }, { status: 200 })
    } catch (processingError) {
      console.error('[WEBHOOK] Error processing webhook:', {
        event,
        error: processingError instanceof Error ? processingError.message : String(processingError),
        stack: processingError instanceof Error ? processingError.stack : undefined
      })
      captureException(processingError instanceof Error ? processingError : new Error(String(processingError)), { 
        component: 'paystack-webhook', 
        event,
        clientIP 
      })
      
      // Return 500 to trigger Paystack retry mechanism
      return NextResponse.json({ error: "Processing failed" }, { status: 500 })
    }

  } catch (error) {
    console.error('[WEBHOOK] Fatal error in webhook handler:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
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
    console.log('[WEBHOOK] subscription.create webhook received:', JSON.stringify(data, null, 2))
    captureMessage('subscription.create webhook received', {
      level: 'info',
      component: 'paystack-webhook',
      rawData: JSON.stringify(data)
    })
    
    const subscriptionData = PaystackSubscriptionDataSchema.parse(data)
    
    // Extract metadata from customer or subscription
    const customerEmail = subscriptionData.customer?.email
    const subscriptionCode = subscriptionData.subscription_code
    const amount = convertFromKobo(subscriptionData.amount)
    
    console.log('[WEBHOOK] Subscription created via Paystack webhook:', {
      subscriptionCode: subscriptionCode || 'NOT_FOUND',
      customerEmail: customerEmail || 'NOT_FOUND',
      amount,
      hasSubscriptionCode: !!subscriptionCode,
      hasCustomerEmail: !!customerEmail
    })
    captureMessage('Subscription created via Paystack webhook', {
      level: 'info',
      component: 'paystack-webhook',
      subscriptionCode: subscriptionCode || 'NOT_FOUND',
      customerEmail: customerEmail || 'NOT_FOUND',
      amount,
      hasSubscriptionCode: !!subscriptionCode,
      hasCustomerEmail: !!customerEmail
    })
    
    // Update provider/agent with subscription code if we can find them
    if (customerEmail) {
      // Try to find provider or agent by email
      const [provider] = await secureDb.db
        .select({ id: schema.providers.id, subscriptionToken: schema.providers.subscriptionToken })
        .from(schema.providers)
        .where(eq(schema.providers.contactEmail, customerEmail))
        .limit(1)
      
      if (provider) {
        console.log('[WEBHOOK] Found provider for subscription.create webhook:', {
          providerId: provider.id,
          currentSubscriptionToken: provider.subscriptionToken || 'NULL',
          newSubscriptionCode: subscriptionCode || 'NULL',
          willUpdate: !!subscriptionCode
        })
        captureMessage('Found provider for subscription.create webhook', {
          level: 'info',
          component: 'paystack-webhook',
          providerId: provider.id,
          currentSubscriptionToken: provider.subscriptionToken || 'NULL',
          newSubscriptionCode: subscriptionCode || 'NULL',
          willUpdate: !!subscriptionCode
        })
        
        await secureDb.db
          .update(schema.providers)
          .set({
            subscriptionToken: subscriptionCode
          })
          .where(eq(schema.providers.id, provider.id))
        
        console.log('[WEBHOOK] Provider subscriptionToken updated from subscription.create webhook:', {
          providerId: provider.id,
          subscriptionToken: subscriptionCode || 'NULL'
        })
        captureMessage('Provider subscriptionToken updated from subscription.create webhook', {
          level: 'info',
          component: 'paystack-webhook',
          providerId: provider.id,
          subscriptionToken: subscriptionCode || 'NULL'
        })
      } else {
        const [agent] = await secureDb.db
          .select({ id: schema.agents.id, subscriptionToken: schema.agents.subscriptionToken })
          .from(schema.agents)
          .where(eq(schema.agents.contactEmail, customerEmail))
          .limit(1)
        
        if (agent) {
          captureMessage('Found agent for subscription.create webhook', {
            level: 'info',
            component: 'paystack-webhook',
            agentId: agent.id,
            currentSubscriptionToken: agent.subscriptionToken || 'NULL',
            newSubscriptionCode: subscriptionCode || 'NULL',
            willUpdate: !!subscriptionCode
          })
          
          await secureDb.db
            .update(schema.agents)
            .set({
              subscriptionToken: subscriptionCode
            })
            .where(eq(schema.agents.id, agent.id))
          
          captureMessage('Agent subscriptionToken updated from subscription.create webhook', {
            level: 'info',
            component: 'paystack-webhook',
            agentId: agent.id,
            subscriptionToken: subscriptionCode || 'NULL'
          })
        } else {
          console.warn('[WEBHOOK] No provider or agent found for subscription.create webhook:', {
            customerEmail,
            subscriptionCode
          })
          captureMessage('No provider or agent found for subscription.create webhook', {
            level: 'warning',
            component: 'paystack-webhook',
            customerEmail,
            subscriptionCode
          })
        }
      }
    } else {
      console.warn('[WEBHOOK] No customer email in subscription.create webhook:', {
        subscriptionCode
      })
      captureMessage('No customer email in subscription.create webhook', {
        level: 'warning',
        component: 'paystack-webhook',
        subscriptionCode
      })
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
    
    const reference = chargeData.reference
    const amount = convertFromKobo(chargeData.amount)
    const transactionId = chargeData.id?.toString() || chargeData.reference
    // Use paid_at if available, otherwise created_at, otherwise current date
    const paymentDate = chargeData.paid_at 
      ? new Date(chargeData.paid_at) 
      : (chargeData.paidAt 
        ? new Date(chargeData.paidAt) 
        : (chargeData.created_at 
          ? new Date(chargeData.created_at) 
          : new Date()))
    
    // Extract metadata (can be object, number, or string)
    const metadata = typeof chargeData.metadata === 'object' && chargeData.metadata !== null && !Array.isArray(chargeData.metadata)
      ? chargeData.metadata as Record<string, any>
      : {}
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
    const planCode = gatewayResponse?.planCode || metadata.plan_code
    
    // Validate amount (allow R1.00 for tokenization, or exact match for regular payments)
    if (isTokenization && amount !== 1.00) {
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
          
          console.log('[WEBHOOK] Attempting to create trial subscription:', {
            providerId: actualEntityId,
            planCode,
            authorizationCode: chargeData.authorization.authorization_code,
            startDate,
            customerEmail: providerBeforeUpdate.contactEmail || chargeData.customer?.email || ''
          })
          captureMessage('Attempting to create trial subscription', {
            level: 'info',
            component: 'paystack-webhook',
            providerId: actualEntityId,
            planCode,
            authorizationCode: chargeData.authorization.authorization_code,
            startDate,
            customerEmail: providerBeforeUpdate.contactEmail || chargeData.customer?.email || ''
          })
          
          const subscription = await PaystackAPIClient.createSubscription(
            providerBeforeUpdate.contactEmail || chargeData.customer?.email || '',
            planCode,
            chargeData.authorization.authorization_code,
            startDate
          )
          
          console.log('[WEBHOOK] Subscription creation response received:', {
            providerId: actualEntityId,
            hasSubscriptionCode: !!subscription?.subscription_code,
            subscriptionCodeValue: subscription?.subscription_code || 'NOT_FOUND',
            fullResponse: JSON.stringify(subscription, null, 2)
          })
          captureMessage('Subscription creation response received', {
            level: 'info',
            component: 'paystack-webhook',
            providerId: actualEntityId,
            subscriptionResponse: subscription,
            hasSubscriptionCode: !!subscription?.subscription_code,
            subscriptionCodeValue: subscription?.subscription_code || 'NOT_FOUND'
          })
          
          subscriptionCode = subscription.subscription_code
          
          console.log('[WEBHOOK] Trial subscription created successfully:', {
            providerId: actualEntityId,
            subscriptionCode: subscriptionCode,
            startDate,
            authorizationCode: chargeData.authorization.authorization_code
          })
          captureMessage('Trial subscription created successfully', {
            level: 'info',
            component: 'paystack-webhook',
            providerId: actualEntityId,
            subscriptionCode: subscriptionCode,
            startDate,
            authorizationCode: chargeData.authorization.authorization_code
          })
          
          // Refund the R1.00 tokenization charge as per Paystack trial workaround
          // This refunds the tokenization amount back to the customer
          try {
            const refundResponse = await PaystackAPIClient.createRefund(
              reference, // Transaction reference
              1.00, // R1.00 tokenization amount
              "ZAR",
              "Refund of tokenization charge for free trial setup",
              `Tokenization refund for provider ${actualEntityId} - trial subscription setup`
            )
            
            captureMessage('Tokenization charge refunded successfully', {
              level: 'info',
              component: 'paystack-webhook',
              providerId: actualEntityId,
              refundId: refundResponse.id,
              refundStatus: refundResponse.status,
              transactionReference: reference
            })
          } catch (refundError) {
            // Log refund error but don't fail the webhook - subscription is already created
            captureException(refundError instanceof Error ? refundError : new Error(String(refundError)), {
              component: 'paystack-webhook',
              action: 'refundTokenizationCharge',
              providerId: actualEntityId,
              transactionReference: reference,
              note: 'Refund failed but subscription was created successfully'
            })
          }
          
        } catch (subError) {
          console.error('[WEBHOOK] Failed to create trial subscription:', {
            providerId: actualEntityId,
            planCode,
            authorizationCode: chargeData.authorization?.authorization_code,
            error: subError instanceof Error ? subError.message : String(subError),
            stack: subError instanceof Error ? subError.stack : undefined
          })
          captureException(subError instanceof Error ? subError : new Error(String(subError)), {
            component: 'paystack-webhook',
            action: 'createTrialSubscription',
            providerId: actualEntityId,
            planCode,
            authorizationCode: chargeData.authorization?.authorization_code,
            errorMessage: subError instanceof Error ? subError.message : String(subError),
            errorStack: subError instanceof Error ? subError.stack : undefined
          })
          // Continue with normal flow even if subscription creation fails
        }
      }
      
      const nextPaymentDate = isTrialTokenization 
        ? new Date(providerBeforeUpdate?.trialEndDate || paymentDate) 
        : new Date(paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from payment
      
      const finalSubscriptionToken = subscriptionCode || (isTrialTokenization ? undefined : (chargeData.authorization?.authorization_code || undefined))
      
      console.log('[WEBHOOK] Setting subscriptionToken in database:', {
        providerId: actualEntityId,
        subscriptionToken: finalSubscriptionToken || 'NULL',
        subscriptionCode: subscriptionCode || 'NULL',
        isTrialTokenization: !!isTrialTokenization,
        authorizationCode: chargeData.authorization?.authorization_code || 'NULL',
        subscriptionStatus: isTrialTokenization ? 'trial' : 'active'
      })
      captureMessage('Setting subscriptionToken in database', {
        level: 'info',
        component: 'paystack-webhook',
        providerId: actualEntityId,
        subscriptionToken: finalSubscriptionToken || 'NULL',
        subscriptionCode: subscriptionCode || 'NULL',
        isTrialTokenization,
        authorizationCode: chargeData.authorization?.authorization_code || 'NULL',
        subscriptionStatus: isTrialTokenization ? 'trial' : 'active'
      })
      
      await secureDb.db
        .update(schema.providers)
        .set({
          subscriptionStatus: isTrialTokenization ? 'trial' : 'active',
          lastPaymentDate: isTrialTokenization ? null : paymentDate, // Don't set lastPaymentDate for tokenization
          nextPaymentDate: nextPaymentDate,
          subscriptionToken: finalSubscriptionToken,
          ...(isTrialToPaidTransition ? {
            trialStartDate: null,
            trialEndDate: null
          } : {})
        })
        .where(eq(schema.providers.id, actualEntityId))
      
      console.log('[WEBHOOK] Provider subscriptionToken updated in database:', {
        providerId: actualEntityId,
        subscriptionToken: finalSubscriptionToken || 'NULL',
        subscriptionStatus: isTrialTokenization ? 'trial' : 'active'
      })
      captureMessage('Provider subscriptionToken updated in database', {
        level: 'info',
        component: 'paystack-webhook',
        providerId: actualEntityId,
        subscriptionToken: finalSubscriptionToken || 'NULL',
        subscriptionStatus: isTrialTokenization ? 'trial' : 'active'
      })
      
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
    
    const subscriptionCode = invoiceData.subscription?.subscription_code
    if (!subscriptionCode) {
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
    
    const subscriptionCode = subscriptionData.subscription_code
    const status = subscriptionData.status as string // Paystack status: "active", "cancelled", "completed", "non-renewing", "attention"
    
    // Find provider or agent with this subscription code
    const [provider] = await secureDb.db
      .select({ id: schema.providers.id })
      .from(schema.providers)
      .where(eq(schema.providers.subscriptionToken, subscriptionCode))
      .limit(1)
    
    if (provider) {
      // Map Paystack status to our database status
      let dbStatus: "inactive" | "trial" | "active" | "past_due" | "canceled" = "canceled"
      if (status === "active" || status === "completed") {
        dbStatus = "active"
      } else if (status === "cancelled" || status === "non-renewing") {
        dbStatus = "canceled"
      }
      
      await secureDb.db
        .update(schema.providers)
        .set({
          subscriptionStatus: dbStatus
        })
        .where(eq(schema.providers.id, provider.id))
    }
    
    // Agents don't have subscription status, just log
    
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
          subscriptionStatus: 'canceled'
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

