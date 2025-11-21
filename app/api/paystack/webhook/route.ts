import { type NextRequest, NextResponse } from "next/server"
import { PaystackWebhookSchema, PaystackSubscriptionDataSchema, PaystackInvoiceDataSchema, PaystackChargeSuccessDataSchema } from "@/lib/schemas/payment"
import { PaymentSecurityService } from "@/lib/services/payment-security"
import { PaymentAuditService } from "@/lib/services/payment-audit"
import { PaymentReconciliationService } from "@/lib/services/payment-reconciliation"
import { captureMessage, captureException } from '@/lib/logging/config'
import { secureDb } from "@/lib/database-secure"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { convertFromKobo } from "@/lib/paystack"
import { PaystackAPIClient } from "@/lib/paystack-api-client"
import { inferPlanFromAmount, SubscriptionPlanId } from "@/lib/subscription-plans"

/**
 * Extract planId from payment transaction's gatewayResponse or customData
 * Falls back to inferring from amount if not found
 */
function extractPlanIdFromPayment(
  gatewayResponse: any,
  amount: number
): SubscriptionPlanId | null {
  // Try to get planId from gatewayResponse.customData
  const customData = gatewayResponse?.customData || gatewayResponse?.custom_data
  if (customData?.planId) {
    const planId = customData.planId as string
    if (planId === 'starter' || planId === 'growth' || planId === 'scale') {
      return planId as SubscriptionPlanId
    }
  }

  // Try to get from metadata
  if (gatewayResponse?.metadata?.planId) {
    const planId = gatewayResponse.metadata.planId as string
    if (planId === 'starter' || planId === 'growth' || planId === 'scale') {
      return planId as SubscriptionPlanId
    }
  }

  // Fallback: infer from amount
  const inferredPlan = inferPlanFromAmount(amount)
  return inferredPlan.id
}

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
        
        console.log('[WEBHOOK] Provider subscriptionToken updated from subscription.create webhook (post-update check):', {
          providerId: provider.id,
          updatedSubscriptionCode: subscriptionCode || 'NULL'
        })
        // verify persisted value and log
        try {
          const [updatedProvider] = await secureDb.db
            .select({ id: schema.providers.id, subscriptionToken: schema.providers.subscriptionToken, subscriptionStatus: schema.providers.subscriptionStatus })
            .from(schema.providers)
            .where(eq(schema.providers.id, provider.id))
            .limit(1)

          console.log('[WEBHOOK] Provider record after update:', {
            providerId: updatedProvider?.id,
            subscriptionToken: updatedProvider?.subscriptionToken || 'NULL',
            subscriptionStatus: updatedProvider?.subscriptionStatus || 'NULL'
          })
        } catch (pErr) {
          console.warn('[WEBHOOK] Could not read back provider after update:', String(pErr))
        }
        
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

          console.log('[WEBHOOK] Agent subscriptionToken updated from subscription.create webhook (post-update check):', {
            agentId: agent.id,
            updatedSubscriptionCode: subscriptionCode || 'NULL'
          })
          try {
            const [updatedAgent] = await secureDb.db
              .select({ id: schema.agents.id, subscriptionToken: schema.agents.subscriptionToken })
              .from(schema.agents)
              .where(eq(schema.agents.id, agent.id))
              .limit(1)

            console.log('[WEBHOOK] Agent record after update:', {
              agentId: updatedAgent?.id,
              subscriptionToken: updatedAgent?.subscriptionToken || 'NULL'
            })
          } catch (aErr) {
            console.warn('[WEBHOOK] Could not read back agent after update:', String(aErr))
          }
          
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
    const paymentDate = chargeData.paid_at
      ? new Date(chargeData.paid_at)
      : (chargeData.paidAt
        ? new Date(chargeData.paidAt)
        : (chargeData.created_at
          ? new Date(chargeData.created_at)
          : new Date()))

    const metadata = typeof chargeData.metadata === 'object' && chargeData.metadata !== null && !Array.isArray(chargeData.metadata)
      ? chargeData.metadata as Record<string, any>
      : {}
    const entityId = metadata.entity_id || metadata.custom_fields?.find((f: any) => f.variable_name === 'entity_id')?.value
    const entityType = metadata.entity_type || (entityId ? 'provider' : 'agent')

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

    // Preserve and merge stored gatewayResponse (don't overwrite scheduled trial metadata)
    const storedGateway = (pending.gatewayResponse || {}) as Record<string, any>

    // Determine planCode and trial metadata from stored gatewayResponse or incoming metadata
    const planCode = storedGateway.planCode || storedGateway.plan_code || metadata.plan_code || metadata.planCode || storedGateway.planCode
    const trialEndISO = storedGateway.trialEndDate || storedGateway.trial_end_date || storedGateway.trialEnd || storedGateway.trialEndDate
    const storedIsTokenization = storedGateway.isTokenization === true || storedGateway.is_tokenization === true || metadata?.is_tokenization === 'true' || metadata?.is_tokenization === true

    // Robust tokenization detection
    const isTokenization = (amount === 1.00 && (storedIsTokenization || !!planCode || storedGateway.trialActivated === true)) || (storedGateway.isTokenization === true && amount === 1.00)

    // Validate normal payment amounts (allow tokenization R1.00)
    if (!isTokenization && !PaymentSecurityService.validatePaymentAmount(amount, Number(pending.amount))) {
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

    // Merge incoming Paystack charge data into gatewayResponse rather than overwrite
    const mergedGateway: Record<string, any> = {
      ...storedGateway,
      // keep a copy of incoming charge under `charge` to avoid clobbering existing fields
      charge: chargeData,
      // keep top-level commonly used fields for quick inspection
      lastSeen: new Date().toISOString()
    }

    // Persist transaction as completed and attach merged gateway (we will update gateway again below after subscription/refund attempts)
    await secureDb.db
      .update(schema.paymentTransactions)
      .set({
        pfPaymentId: transactionId,
        status: 'completed',
        paymentDate: paymentDate,
        subscriptionToken: chargeData.authorization?.authorization_code || undefined,
        gatewayResponse: mergedGateway
      })
      .where(eq(schema.paymentTransactions.id, pending.id))

    // Determine actual entity
    const actualEntityId = pending.providerId || pending.agentId || entityId
    const actualEntityType = pending.providerId ? 'provider' : (pending.agentId ? 'agent' : entityType)

    // Variables to persist about subscription creation
    let subscriptionCode: string | undefined = undefined
    const subscriptionCreationMeta: any = { attempted: false }
    const refundMeta: any = { attempted: false }

    // If tokenization for a scheduled trial (we rely on the stored gatewayResponse for plan & trial info), attempt subscription creation
    if (isTokenization && planCode && trialEndISO && chargeData.authorization?.authorization_code) {
      subscriptionCreationMeta.attempted = true
      try {
        const authCode = chargeData.authorization.authorization_code
        // Format start date as YYYY-MM-DD
        const trialStartDateObj = new Date(trialEndISO)
        const startDate = trialStartDateObj.toISOString().split('T')[0]

        console.log('[WEBHOOK] Attempting to create subscription from tokenization using stored transaction metadata', { pendingId: pending.id, planCode, startDate, authCode })
        captureMessage('Attempting to create subscription from tokenization', {
          level: 'info',
          component: 'paystack-webhook',
          paymentTransactionId: pending.id,
          planCode,
          startDate
        })

        const customerEmail = storedGateway.customerEmail || chargeData.customer?.email || storedGateway.contactEmail || undefined

        const subscription = await PaystackAPIClient.createSubscription(
          customerEmail || '',
          planCode,
          authCode,
          startDate
        )

        subscriptionCreationMeta.response = subscription
        subscriptionCreationMeta.success = !!subscription?.subscription_code
        subscriptionCode = subscription?.subscription_code

        captureMessage('Subscription.create API response', {
          level: 'info',
          component: 'paystack-webhook',
          paymentTransactionId: pending.id,
          subscriptionResponse: subscription
        })

        // Attempt refund of tokenization charge
        try {
          refundMeta.attempted = true
          const refundResponse = await PaystackAPIClient.createRefund(
            reference,
            1.00,
            'ZAR',
            'Refund of tokenization charge for free trial setup',
            `Tokenization refund for transaction ${reference}`
          )

          refundMeta.response = refundResponse
          refundMeta.success = true

          captureMessage('Tokenization refund created', {
            level: 'info',
            component: 'paystack-webhook',
            paymentTransactionId: pending.id,
            refundId: refundResponse.id,
            refundStatus: refundResponse.status
          })
        } catch (rErr) {
          refundMeta.success = false
          refundMeta.error = String(rErr)
          captureException(rErr instanceof Error ? rErr : new Error(String(rErr)), {
            component: 'paystack-webhook',
            action: 'refundTokenizationCharge',
            paymentTransactionId: pending.id,
            reference
          })
        }

      } catch (subErr) {
        subscriptionCreationMeta.attempted = true
        subscriptionCreationMeta.error = {
          message: subErr instanceof Error ? subErr.message : String(subErr),
          stack: subErr instanceof Error ? subErr.stack : undefined
        }

        captureException(subErr instanceof Error ? subErr : new Error(String(subErr)), {
          component: 'paystack-webhook',
          action: 'createTrialSubscription',
          paymentTransactionId: pending.id,
          planCode
        })

        // Do not flip provider state; persist authorization_code for later retry
      }
    }

    // Attach subscription/refund metadata to mergedGateway and persist
    mergedGateway.subscriptionCreation = subscriptionCreationMeta
    mergedGateway.refund = refundMeta

    try {
      await secureDb.db
        .update(schema.paymentTransactions)
        .set({ gatewayResponse: mergedGateway })
        .where(eq(schema.paymentTransactions.id, pending.id))
    } catch (persistErr) {
      captureException(persistErr instanceof Error ? persistErr : new Error(String(persistErr)), {
        component: 'paystack-webhook',
        action: 'persistSubscriptionMeta',
        paymentTransactionId: pending.id
      })
    }

    // Update provider/agent records conservatively
    if (actualEntityType === 'provider' && actualEntityId) {
      // Read current provider row
      
      // Final token to persist: prefer subscriptionCode from createSubscription, otherwise authorization_code
      const finalSubscriptionToken = subscriptionCode || chargeData.authorization?.authorization_code || undefined

      // Extract planId from payment transaction
      const extractedPlanId = extractPlanIdFromPayment(mergedGateway, amount)

      // If we created a subscription (subscriptionCode), set subscriptionToken to subscriptionCode and set subscriptionStatus to 'trial' (subscription starts at trialEndDate)
      // If subscription not created but we have an authorization_code, persist it so a reconciliation job can retry
      const updates: any = {
        subscriptionToken: finalSubscriptionToken
      }

      if (subscriptionCode) {
        // Trial subscription created
        updates.subscriptionStatus = 'trial'
        updates.nextPaymentDate = new Date(trialEndISO)
        updates.planId = 'starter' // Trial is always Starter plan
      } else if (!isTokenization && extractedPlanId) {
        // Regular payment (not tokenization) - activate subscription and set plan_id
        updates.subscriptionStatus = 'active'
        updates.lastPaymentDate = paymentDate
        updates.nextPaymentDate = new Date(paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from payment
        updates.planId = extractedPlanId
      } else if (extractedPlanId) {
        // Tokenization without subscription - just set plan_id for future reference
        updates.planId = extractedPlanId
      }

      await secureDb.db
        .update(schema.providers)
        .set(updates)
        .where(eq(schema.providers.id, actualEntityId))

      // Read back provider and log persisted values
      try {
        const [refreshedProvider] = await secureDb.db
          .select({ id: schema.providers.id, subscriptionToken: schema.providers.subscriptionToken, subscriptionStatus: schema.providers.subscriptionStatus })
          .from(schema.providers)
          .where(eq(schema.providers.id, actualEntityId))
          .limit(1)

        console.log('[WEBHOOK] Refreshed provider after updating subscription:', {
          providerId: refreshedProvider?.id,
          subscriptionToken: refreshedProvider?.subscriptionToken || 'NULL',
          subscriptionStatus: refreshedProvider?.subscriptionStatus || 'NULL'
        })
      } catch (readErr) {
        console.warn('[WEBHOOK] Could not read back provider after setting subscription:', String(readErr))
      }

    } else if (actualEntityType === 'agent' && actualEntityId) {
      // For agents we only persist authorization_code or subscription_code
      await secureDb.db
        .update(schema.agents)
        .set({ subscriptionToken: chargeData.authorization?.authorization_code || undefined })
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
          
          // Get gatewayResponse to extract planId
          const [txnWithGateway] = await secureDb.db
            .select({ gatewayResponse: schema.paymentTransactions.gatewayResponse })
            .from(schema.paymentTransactions)
            .where(eq(schema.paymentTransactions.id, pending.id))
            .limit(1)
          
          const storedGateway = (txnWithGateway?.gatewayResponse || {}) as Record<string, any>
          const extractedPlanId = extractPlanIdFromPayment(storedGateway, amount)
          
          await secureDb.db
            .update(schema.paymentTransactions)
            .set({
              status: 'completed',
              paymentDate: paymentDate,
              gatewayResponse: invoiceData
            })
            .where(eq(schema.paymentTransactions.id, pending.id))
          
          // Update provider next payment date and plan_id
          if (pending.providerId && invoiceData.subscription?.next_payment_date) {
            const providerUpdates: any = {
              nextPaymentDate: new Date(invoiceData.subscription.next_payment_date),
              lastPaymentDate: paymentDate,
              subscriptionStatus: 'active'
            }
            
            // Set plan_id if extracted
            if (extractedPlanId) {
              providerUpdates.planId = extractedPlanId
            }
            
            await secureDb.db
              .update(schema.providers)
              .set(providerUpdates)
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

