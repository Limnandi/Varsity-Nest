import { NextResponse } from "next/server"
import { PaymentInitiationSchema } from "@/lib/schemas/payment"
import { PaymentSecurityService } from "@/lib/services/payment-security"
import { PaymentAuditService } from "@/lib/services/payment-audit"
import { PaymentReconciliationService } from "@/lib/services/payment-reconciliation"
import { PaystackAPIClient } from "@/lib/paystack-api-client"
import { createPaystackPayment } from "@/lib/paystack"
import { calculateProviderSubscriptionPrice } from "@/lib/payments"
import { secureDb } from "@/lib/database-secure"
import { eq, count } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { getSession } from "@/lib/stackauth"
import { captureMessage, captureException } from '@/lib/logging/config'
import { env } from "@/lib/env"

export async function POST(request: Request) {
  try {
    // Enhanced authentication and authorization
    const session = await getSession()
    if (!session || (session.user.role !== 'provider' && session.user.role !== 'agent')) {
      captureMessage('Unauthorized payment initiation attempt', { level: 'warning', component: 'payment-initiation', userRole: session?.user?.role, userId: session?.user?.id })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate request body with Zod schema
    const body = await request.json()
    const validationResult = PaymentInitiationSchema.safeParse(body)
    
    if (!validationResult.success) {
      captureMessage('Invalid payment initiation request', { level: 'warning', component: 'payment-initiation', errors: validationResult.error.issues, userId: session.user.id })
      return NextResponse.json({ 
        error: "Invalid request data", 
        details: validationResult.error.issues 
      }, { status: 400 })
    }

    const { amount, itemName, idempotencyKey, customData } = validationResult.data

    // Check for existing transaction with same idempotency key (idempotency check)
    if (idempotencyKey) {
      const existingTransaction = await secureDb.db
        .select({
          id: schema.paymentTransactions.id,
          status: schema.paymentTransactions.status,
          mPaymentId: schema.paymentTransactions.mPaymentId,
          amount: schema.paymentTransactions.amount,
          gatewayResponse: schema.paymentTransactions.gatewayResponse
        })
        .from(schema.paymentTransactions)
        .where(eq(schema.paymentTransactions.idempotencyKey, idempotencyKey))
        .limit(1)

      if (existingTransaction.length > 0) {
        const existing = existingTransaction[0]
        captureMessage('Idempotent payment request - returning existing transaction', { 
          level: 'info', 
          component: 'payment-initiation', 
          idempotencyKey, 
          existingTransactionId: existing.id,
          status: existing.status,
          userId: session.user.id 
        })
        
        // Return existing transaction data without processing
        const gatewayResponse = existing.gatewayResponse as Record<string, unknown> | null
        const existingPaymentData = gatewayResponse && typeof gatewayResponse === 'object' && 'authorizationUrl' in gatewayResponse
          ? { authorization_url: gatewayResponse.authorizationUrl }
          : {}
        
        return NextResponse.json({ 
          authorizationUrl: gatewayResponse && typeof gatewayResponse === 'object' && 'authorizationUrl' in gatewayResponse 
            ? gatewayResponse.authorizationUrl 
            : undefined,
          paymentData: existingPaymentData,
          transactionId: existing.id,
          amount: Number(existing.amount),
          idempotent: true
        })
      }
    }

    // Validate Paystack configuration
    if (!env.PAYSTACK_SECRET_KEY) {
      captureMessage('Paystack configuration missing', { level: 'error', component: 'payment-initiation' })
      return NextResponse.json({ error: "Payment system not configured" }, { status: 500 })
    }

    // Resolve provider or agent from session (server-side validation)
    let providerId: string | null = null
    let agentId: string | null = null
    let effectiveEmail: string = session.user.email

    if (session.user.role === 'provider') {
      const [providerRow] = await secureDb.db
        .select({ 
          id: schema.providers.id,
          contactEmail: schema.providers.contactEmail,
          contactPerson: schema.providers.contactPerson,
          subscriptionStatus: schema.providers.subscriptionStatus,
          trialStartDate: schema.providers.trialStartDate,
          trialEndDate: schema.providers.trialEndDate,
          createdAt: schema.providers.createdAt
        })
        .from(schema.providers)
        .where(eq(schema.providers.userId, session.user.id))
        .limit(1)

      if (!providerRow) {
        captureMessage('Provider account not found for payment initiation', { level: 'error', component: 'payment-initiation', userId: session.user.id })
        return NextResponse.json({ error: "Provider account not found" }, { status: 403 })
      }

      providerId = providerRow.id
      effectiveEmail = providerRow.contactEmail || session.user.email

      // Check if provider is eligible for trial subscription
      const isEligibleForTrial = !providerRow.trialStartDate && 
                                  providerRow.subscriptionStatus !== 'trial' && 
                                  providerRow.subscriptionStatus !== 'active'
      
      if (isEligibleForTrial) {
        // Activate trial subscription (14 days free)
        const trialStartDate = new Date()
        const trialEndDate = new Date(trialStartDate.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
        const nextPaymentDate = new Date(trialEndDate.getTime()) // First payment due after trial ends
        const billingDate = trialEndDate.toISOString() // ISO 8601 format for Paystack

        // Activate trial in database
        await secureDb.db
          .update(schema.providers)
          .set({
            subscriptionStatus: 'trial',
            trialStartDate: trialStartDate,
            trialEndDate: trialEndDate,
            nextPaymentDate: nextPaymentDate
          })
          .where(eq(schema.providers.id, providerId!))

        captureMessage('Trial subscription activated, setting up Paystack payment', { 
          level: 'info', 
          component: 'payment-initiation', 
          providerId, 
          trialStartDate: trialStartDate.toISOString(),
          trialEndDate: trialEndDate.toISOString(),
          billingDate
        })

        // Calculate amount for recurring subscription (will be charged after trial ends)
        const [result] = await secureDb.db
          .select({ count: count(schema.accommodations.id) })
          .from(schema.accommodations)
          .where(eq(schema.accommodations.providerId, providerId!))
        
        const accommodationsCount = Number(result?.count || 0)
        const wantsFeatured = Boolean(customData?.wantsFeatured)
        let calculatedAmount = calculateProviderSubscriptionPrice({ accommodationsCount, wantsFeatured })
        
        // Paystack minimum amount is 100 kobo (R1.00) for subscriptions
        if (calculatedAmount < 1.00) {
          calculatedAmount = 1.00
        }

        // Generate secure payment ID
        const paymentId = PaymentSecurityService.generateSecurePaymentId()

        // Create plan for subscription
        let planCode: string
        try {
          const plan = await PaystackAPIClient.createPlan(
            itemName,
            calculatedAmount,
            "monthly",
            `Varsity Nest - ${itemName}`,
            0 // 0 = unlimited until cancelled
          )
          planCode = plan.plan_code
        } catch (planError) {
          captureException(planError instanceof Error ? planError : new Error(String(planError)), { 
            component: 'payment-initiation', 
            action: 'createPlan',
            providerId,
            amount: calculatedAmount
          })
          return NextResponse.json({ error: "Failed to create subscription plan" }, { status: 500 })
        }

        // Create server-side custom data (prevent client tampering)
        // Exclude entityType from customData to prevent client tampering - always use session.user.role
        const customDataWithoutEntityType = customData ? (() => {
          const { entityType: _, ...rest } = customData as any
          return rest
        })() : {}
        // Always set entityType from session.user.role - never trust client data
        const entityTypeFromSession = session.user.role as 'provider' | 'agent'
        const serverCustomDataForTrial: {
          providerId?: string
          agentId?: string
          paymentId: string
          idempotencyKey: string
          timestamp: number
          userId: string
          planCode: string
          subscriptionType: string
          entityType: 'provider' | 'agent'
        } = {
          ...customDataWithoutEntityType,
          providerId: providerId || undefined,
          agentId: undefined, // Providers don't have agentId
          paymentId,
          idempotencyKey,
          timestamp: Date.now(),
          userId: session.user.id,
          planCode,
          subscriptionType: "monthly",
          entityType: entityTypeFromSession // Always from session, never from client
        }

        // For trial: Charge minimum R1.00 to tokenize the card (Paystack requirement)
        // This amount can be refunded or credited back to the user
        const tokenizationAmount = 1.00 // Minimum ZAR 1.00 for card tokenization
        
        // Initialize transaction for card tokenization (NOT a subscription yet)
        // We'll create the subscription after we get the authorization_code
        // entityType is already set in serverCustomDataForTrial from session.user.role
        // Create object directly - don't use type annotation to avoid type narrowing issues
        const customDataForPayment = {
          providerId: serverCustomDataForTrial.providerId,
          agentId: serverCustomDataForTrial.agentId,
          subscriptionType: serverCustomDataForTrial.subscriptionType,
          paymentId: serverCustomDataForTrial.paymentId,
          idempotencyKey: serverCustomDataForTrial.idempotencyKey,
          planCode: serverCustomDataForTrial.planCode,
          invoiceLimit: 0, // Unlimited
          entityType: serverCustomDataForTrial.entityType as 'provider' | 'agent' // CRITICAL: Explicitly preserve entityType with type assertion
        }
        const paymentRequest = createPaystackPayment(
          tokenizationAmount, // R1.00 for card tokenization
          effectiveEmail,
          `Card Tokenization - ${itemName}`, // itemName parameter
          customDataForPayment // customData parameter
        )

        // Initialize Paystack transaction for tokenization
        // Note: We're NOT passing planCode here - this is just to tokenize the card
        let transactionResponse
        try {
          transactionResponse = await PaystackAPIClient.initializeTransaction(
            effectiveEmail,
            tokenizationAmount, // R1.00 for tokenization
            paymentRequest.reference!,
            paymentRequest.callback_url,
            {
              custom_fields: paymentRequest.metadata?.custom_fields || [],
              entity_id: providerId,
              subscription_type: "monthly",
              payment_id: paymentId,
              wants_featured: wantsFeatured ? "true" : "false",
              idempotency_key: idempotencyKey,
              is_tokenization: "true", // Flag for tokenization
              plan_code: planCode // Store plan code in metadata for later use
            }
            // Don't pass planCode to initializeTransaction - this is just tokenization
          )
        } catch (initError) {
          captureException(initError instanceof Error ? initError : new Error(String(initError)), { 
            component: 'payment-initiation', 
            action: 'initializeTransaction',
            providerId,
            planCode
          })
          return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
        }

        // Record tokenization transaction
        const transaction = await secureDb.db
          .insert(schema.paymentTransactions)
          .values({
            providerId: providerId!,
            amount: tokenizationAmount.toString(), // R1.00 tokenization charge
            status: 'pending',
            idempotencyKey: idempotencyKey || null,
            mPaymentId: paymentRequest.reference!,
            gatewayResponse: { 
              authorizationUrl: transactionResponse.authorization_url,
              accessCode: transactionResponse.access_code,
              reference: transactionResponse.reference,
              planCode,
              trialActivated: true,
              isTokenization: true, // Flag as tokenization
              tokenizationAmount: tokenizationAmount,
              recurringAmount: calculatedAmount, // Amount that will be charged after trial
              billingDate: billingDate
            },
            createdAt: new Date()
          })
          .returning()

        captureMessage('Trial payment setup created', {
          level: 'info',
          component: 'payment-initiation',
          providerId: providerId!,
          transactionId: transaction[0]?.id,
          billingDate,
          amount: calculatedAmount
        })

        // Return payment data to redirect to Paystack for card tokenization
        return NextResponse.json({
          authorizationUrl: transactionResponse.authorization_url,
          transactionId: transaction[0]?.id,
          amount: tokenizationAmount, // R1.00 for card tokenization
          recurringAmount: calculatedAmount, // Amount that will be charged after trial
          trialActivated: true,
          trialPaymentSetup: true,
          isTokenization: true,
          billingDate: billingDate,
          trialStartDate: trialStartDate.toISOString(),
          trialEndDate: trialEndDate.toISOString(),
          planCode,
          message: `Trial activated. A R${tokenizationAmount.toFixed(2)} charge is required to verify your card. This amount will be credited back to your account. Your subscription will start after your 14-day trial ends.`
        })
      }

      // Check if provider is in trial period and trying to pay early
      if (providerRow.subscriptionStatus === 'trial' && providerRow.trialEndDate) {
        const trialEnd = new Date(providerRow.trialEndDate)
        const now = new Date()
        
        if (trialEnd > now) {
          // Still in trial - set up payment for after trial ends
          const billingDate = trialEnd.toISOString()
          
          // Calculate amount for recurring subscription
          const [result] = await secureDb.db
            .select({ count: count(schema.accommodations.id) })
            .from(schema.accommodations)
            .where(eq(schema.accommodations.providerId, providerId!))
          
          const accommodationsCount = Number(result?.count || 0)
          const wantsFeatured = Boolean(customData?.wantsFeatured)
          let calculatedAmount = calculateProviderSubscriptionPrice({ accommodationsCount, wantsFeatured })
          
          if (calculatedAmount < 1.00) {
            calculatedAmount = 1.00
          }

          // Generate secure payment ID
          const paymentId = PaymentSecurityService.generateSecurePaymentId()

          // Create plan for subscription
          let planCode: string
          try {
            const plan = await PaystackAPIClient.createPlan(
              itemName,
              calculatedAmount,
              "monthly",
              `Varsity Nest - ${itemName}`,
              0
            )
            planCode = plan.plan_code
          } catch (planError) {
            captureException(planError instanceof Error ? planError : new Error(String(planError)), { 
              component: 'payment-initiation', 
              action: 'createPlan',
              providerId,
              amount: calculatedAmount
            })
            return NextResponse.json({ error: "Failed to create subscription plan" }, { status: 500 })
          }

          // Create server-side custom data
          // Exclude entityType from customData to prevent client tampering - always use session.user.role
          const customDataWithoutEntityType = customData ? (() => {
            const { entityType: _, ...rest } = customData as any
            return rest
          })() : {}
          // Always set entityType from session.user.role - never trust client data
          const entityTypeFromSession = session.user.role as 'provider' | 'agent'
          const serverCustomDataForTrial: {
            providerId?: string
            agentId?: string
            paymentId: string
            idempotencyKey: string
            timestamp: number
            userId: string
            planCode: string
            subscriptionType: string
            entityType: 'provider' | 'agent'
          } = {
            ...customDataWithoutEntityType,
            providerId: providerId || undefined,
            agentId: undefined, // Providers don't have agentId
            paymentId,
            idempotencyKey,
            timestamp: Date.now(),
            userId: session.user.id,
            planCode,
            subscriptionType: "monthly",
            entityType: entityTypeFromSession // Always from session, never from client
          }

          // Initialize transaction with plan
          // entityType is already set in serverCustomDataForTrial from session.user.role
          // Create object directly - don't use type annotation to avoid type narrowing issues
          const customDataForPayment = {
            providerId: serverCustomDataForTrial.providerId,
            agentId: serverCustomDataForTrial.agentId,
            subscriptionType: serverCustomDataForTrial.subscriptionType,
            paymentId: serverCustomDataForTrial.paymentId,
            idempotencyKey: serverCustomDataForTrial.idempotencyKey,
            planCode: serverCustomDataForTrial.planCode,
            invoiceLimit: 0,
            entityType: serverCustomDataForTrial.entityType as 'provider' | 'agent' // CRITICAL: Explicitly preserve entityType with type assertion
          }
          const paymentRequest = createPaystackPayment(
            0, // R0 for trial
            effectiveEmail,
            itemName, // itemName parameter
            customDataForPayment // customData parameter
          )

          // Initialize Paystack transaction
          let transactionResponse
          try {
            transactionResponse = await PaystackAPIClient.initializeTransaction(
              effectiveEmail,
              0,
              paymentRequest.reference!,
              paymentRequest.callback_url,
              {
                custom_fields: paymentRequest.metadata?.custom_fields || [],
                entity_id: providerId,
                subscription_type: "monthly",
                payment_id: paymentId,
                wants_featured: wantsFeatured ? "true" : "false",
                idempotency_key: idempotencyKey
              },
              planCode
            )
          } catch (initError) {
            captureException(initError instanceof Error ? initError : new Error(String(initError)), { 
              component: 'payment-initiation', 
              action: 'initializeTransaction',
              providerId,
              planCode
            })
            return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
          }

          // Record pending transaction
          const [transaction] = await secureDb.db
            .insert(schema.paymentTransactions)
            .values({
              providerId: providerId!,
              amount: calculatedAmount.toString(),
              currency: 'ZAR',
              mPaymentId: paymentRequest.reference!,
              idempotencyKey: idempotencyKey,
              status: 'pending',
              gatewayResponse: { 
                initiated_at: new Date().toISOString(),
                authorizationUrl: transactionResponse.authorization_url,
                accessCode: transactionResponse.access_code,
                reference: transactionResponse.reference,
                trial_payment_setup: true,
                billing_date: billingDate,
                planCode
              }
            })
            .returning({ id: schema.paymentTransactions.id })

          await PaymentAuditService.logAuditEvent(transaction.id, 'created', {
            amount: calculatedAmount,
            providerId: providerId!,
            reason: 'Payment setup for post-trial subscription',
            metadata: { 
              itemName,
              trialEndDate: trialEnd.toISOString(),
              billingDate,
              customData: serverCustomDataForTrial
            }
          })

          return NextResponse.json({ 
            authorizationUrl: transactionResponse.authorization_url,
            transactionId: transaction.id,
            amount: 0, // R0 for trial
            recurringAmount: calculatedAmount,
            trialPaymentSetup: true,
            billingDate: billingDate,
            planCode,
            message: "Payment will be processed automatically after your trial ends."
          })
        }
      }
    } else if (session.user.role === 'agent') {
      const [agentRow] = await secureDb.db
        .select({ 
          id: schema.agents.id,
          contactEmail: schema.agents.contactEmail,
          contactPerson: schema.agents.contactPerson
        })
        .from(schema.agents)
        .where(eq(schema.agents.userId, session.user.id))
        .limit(1)

      if (!agentRow) {
        captureMessage('Agent account not found for payment initiation', { level: 'error', component: 'payment-initiation', userId: session.user.id })
        return NextResponse.json({ error: "Agent account not found" }, { status: 403 })
      }

      agentId = agentRow.id
      effectiveEmail = agentRow.contactEmail || session.user.email
    }

    // Calculate amount server-side (prevent client manipulation)
    let finalAmount: number
    if (amount && amount > 0) {
      // Validate provided amount is reasonable
      if (amount > 100000) { // R100,000 max
        return NextResponse.json({ error: "Amount too high" }, { status: 400 })
      }
      finalAmount = amount
    } else {
      // Calculate based on accommodations count
      const entityId = providerId || agentId
      if (!entityId) {
        return NextResponse.json({ error: "Account not found" }, { status: 403 })
      }

      const [result] = await secureDb.db
        .select({ count: count(schema.accommodations.id) })
        .from(schema.accommodations)
        .where(
          providerId 
            ? eq(schema.accommodations.providerId, providerId)
            : eq(schema.accommodations.agentId, agentId!)
        )
      
      const accommodationsCount = Number(result?.count || 0)
      const wantsFeatured = Boolean(customData?.wantsFeatured)
      finalAmount = calculateProviderSubscriptionPrice({ accommodationsCount, wantsFeatured })
    }

    // Check for duplicate payments (only for providers, agents use idempotency key)
    if (providerId) {
      const duplicateCheck = await PaymentReconciliationService.detectDuplicatePayments(providerId, finalAmount)
      if (duplicateCheck.isDuplicate) {
        captureMessage('Duplicate payment attempt detected', { level: 'warning', component: 'payment-initiation', providerId, amount: finalAmount, duplicateTransactions: duplicateCheck.duplicateTransactions.map(t => t.id) })
        return NextResponse.json({ 
          error: "Duplicate payment detected. Please wait before retrying." 
        }, { status: 409 })
      }
    }

    // Generate secure payment ID
    const paymentId = PaymentSecurityService.generateSecurePaymentId()

    // Create server-side custom data (prevent client tampering)
    // Exclude entityType from customData to prevent client tampering - always use session.user.role
    const customDataWithoutEntityType = customData ? (() => {
      const { entityType: _, ...rest } = customData as any
      return rest
    })() : {}
    // Always set entityType from session.user.role - never trust client data
    const entityTypeFromSession = session.user.role as 'provider' | 'agent'
    const serverCustomData: {
      providerId?: string
      agentId?: string
      paymentId: string
      idempotencyKey: string
      timestamp: number
      userId: string
      subscriptionType?: string
      planCode?: string
      invoiceLimit?: number
      entityType: 'provider' | 'agent'
    } = {
      ...customDataWithoutEntityType,
      providerId: providerId || undefined,
      agentId: agentId || undefined,
      paymentId,
      idempotencyKey,
      timestamp: Date.now(),
      userId: session.user.id,
      entityType: entityTypeFromSession // Always from session, never from client
    }

    // Determine if this is a subscription or one-time payment
    const isSubscription = customData?.subscriptionType === "monthly"
    let planCode: string | undefined
    let transactionResponse: any

    if (isSubscription) {
      // Create plan for subscription
      try {
        const plan = await PaystackAPIClient.createPlan(
          itemName,
          finalAmount,
          "monthly",
          `Varsity Nest - ${itemName}`,
          0 // Unlimited until cancelled
        )
        planCode = plan.plan_code
      } catch (planError) {
        captureException(planError instanceof Error ? planError : new Error(String(planError)), { 
          component: 'payment-initiation', 
          action: 'createPlan',
          providerId: providerId || undefined,
          agentId: agentId || undefined,
          amount: finalAmount
        })
        return NextResponse.json({ error: "Failed to create subscription plan" }, { status: 500 })
      }

      // Create payment request with plan
      // entityType is already set in serverCustomData from session.user.role
      // Create object directly - don't use type annotation to avoid type narrowing issues
      const customDataForPayment = {
        providerId: serverCustomData.providerId,
        agentId: serverCustomData.agentId,
        subscriptionType: "monthly",
        paymentId: serverCustomData.paymentId,
        idempotencyKey: serverCustomData.idempotencyKey,
        planCode,
        invoiceLimit: 0,
        entityType: serverCustomData.entityType as 'provider' | 'agent' // CRITICAL: Explicitly preserve entityType with type assertion
      }
      const paymentRequest = createPaystackPayment(
        finalAmount,
        effectiveEmail,
        itemName, // itemName parameter
        customDataForPayment // customData parameter
      )

      // Initialize transaction with plan
      try {
        transactionResponse = await PaystackAPIClient.initializeTransaction(
          effectiveEmail,
          finalAmount,
          paymentRequest.reference!,
          paymentRequest.callback_url,
          {
            custom_fields: paymentRequest.metadata?.custom_fields || [],
            entity_id: providerId || agentId,
            subscription_type: "monthly",
            payment_id: paymentId,
            wants_featured: Boolean(customData?.wantsFeatured) ? "true" : "false",
            idempotency_key: idempotencyKey
          },
          planCode
        )
      } catch (initError) {
        captureException(initError instanceof Error ? initError : new Error(String(initError)), { 
          component: 'payment-initiation', 
          action: 'initializeTransaction',
          providerId: providerId || undefined,
          agentId: agentId || undefined,
          planCode
        })
        return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
      }
    } else {
      // One-time payment
      // entityType is already set in serverCustomData from session.user.role
      // Create object directly - don't use type annotation to avoid type narrowing issues
      const customDataForPayment = {
        providerId: serverCustomData.providerId,
        agentId: serverCustomData.agentId,
        subscriptionType: serverCustomData.subscriptionType,
        paymentId: serverCustomData.paymentId,
        idempotencyKey: serverCustomData.idempotencyKey,
        planCode: serverCustomData.planCode,
        invoiceLimit: serverCustomData.invoiceLimit,
        entityType: serverCustomData.entityType as 'provider' | 'agent' // CRITICAL: Explicitly preserve entityType with type assertion
      }
      const paymentRequest = createPaystackPayment(
        finalAmount,
        effectiveEmail,
        itemName, // itemName parameter
        customDataForPayment // customData parameter
      )

      // Initialize transaction
      try {
        transactionResponse = await PaystackAPIClient.initializeTransaction(
          effectiveEmail,
          finalAmount,
          paymentRequest.reference!,
          paymentRequest.callback_url,
          {
            custom_fields: paymentRequest.metadata?.custom_fields || [],
            entity_id: providerId || agentId,
            payment_id: paymentId,
            wants_featured: Boolean(customData?.wantsFeatured) ? "true" : "false",
            idempotency_key: idempotencyKey
          }
        )
      } catch (initError) {
        captureException(initError instanceof Error ? initError : new Error(String(initError)), { 
          component: 'payment-initiation', 
          action: 'initializeTransaction',
          providerId: providerId || undefined,
          agentId: agentId || undefined
        })
        return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
      }
    }

    // Record pending transaction
    try {
      const [transaction] = await secureDb.db
        .insert(schema.paymentTransactions)
        .values({
          providerId: providerId || null,
          agentId: agentId || null,
          amount: finalAmount.toString(),
          currency: 'ZAR',
          mPaymentId: transactionResponse.reference,
          idempotencyKey: idempotencyKey,
          status: 'pending',
          gatewayResponse: { 
            initiated_at: new Date().toISOString(),
            user_agent: request.headers.get('user-agent'),
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
            authorizationUrl: transactionResponse.authorization_url,
            accessCode: transactionResponse.access_code,
            reference: transactionResponse.reference,
            planCode: planCode || undefined
          }
        })
        .returning({ id: schema.paymentTransactions.id })

      // Log payment initiation
      await PaymentAuditService.logAuditEvent(transaction.id, 'created', {
        amount: finalAmount,
        providerId: providerId || undefined,
        reason: 'Payment initiated via Paystack',
        metadata: { 
          itemName,
          customData: serverCustomData,
          paymentId,
          agentId: agentId || undefined,
          planCode: planCode || undefined
        }
      })
    } catch (dbError) {
      captureException(dbError instanceof Error ? dbError : new Error(String(dbError)), { component: 'payment-initiation', providerId: providerId || undefined, agentId: agentId || undefined, amount: finalAmount, paymentId })
      return NextResponse.json({ error: "Unable to create transaction", details: dbError instanceof Error ? dbError.message : String(dbError) }, { status: 500 })
    }

    // Log successful payment initiation
    captureMessage('Payment initiated successfully', { level: 'info', component: 'payment-initiation', providerId: providerId || undefined, agentId: agentId || undefined, amount: finalAmount, paymentId, itemName, planCode })

    return NextResponse.json({ 
      authorizationUrl: transactionResponse.authorization_url,
      reference: transactionResponse.reference,
      accessCode: transactionResponse.access_code,
      transactionId: paymentId,
      amount: finalAmount,
      planCode: planCode || undefined
    })
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { component: 'payment-initiation', userId: 'unknown', providerId: 'unknown' })
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

