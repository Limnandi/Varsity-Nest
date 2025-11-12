import { NextResponse } from "next/server"
import { PaymentInitiationSchema } from "@/lib/schemas/payment"
import { PaymentSecurityService } from "@/lib/services/payment-security"
import { PaymentAuditService } from "@/lib/services/payment-audit"
import { PaymentReconciliationService } from "@/lib/services/payment-reconciliation"
import { createPayFastPayment } from "@/lib/payfast"
import { calculateProviderSubscriptionPrice } from "@/lib/payments"
import { secureDb } from "@/lib/database-secure"
import { eq, count } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { getSession } from "@/lib/stackauth"
import { captureMessage, captureException } from '@/lib/logging/config'

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
        // Type-safe extraction of payment data from gateway response
        const gatewayResponse = existing.gatewayResponse as Record<string, unknown> | null
        const existingPaymentData = gatewayResponse && typeof gatewayResponse === 'object' && 'paymentData' in gatewayResponse
          ? gatewayResponse.paymentData as Record<string, unknown>
          : {}
        
        return NextResponse.json({ 
          paymentData: existingPaymentData,
          transactionId: existing.id,
          amount: Number(existing.amount),
          idempotent: true
        })
      }
    }

    // Validate PayFast configuration
    const { env } = await import('@/lib/env')
    if (!env.PAYFAST_MERCHANT_ID || !env.PAYFAST_MERCHANT_KEY || !env.PAYFAST_PASSPHRASE) {
      captureMessage('PayFast configuration missing', { level: 'error', component: 'payment-initiation' })
      return NextResponse.json({ error: "Payment system not configured" }, { status: 500 })
    }

    // Resolve provider or agent from session (server-side validation)
    let providerId: string | null = null
    let agentId: string | null = null
    let effectiveEmail: string = session.user.email
    let effectiveName: string = session.user.name || 'User'

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
      effectiveName = providerRow.contactPerson || session.user.name || 'Provider'

      // Check if provider is eligible for trial subscription
      const isEligibleForTrial = !providerRow.trialStartDate && 
                                  providerRow.subscriptionStatus !== 'trial' && 
                                  providerRow.subscriptionStatus !== 'active'
      
      if (isEligibleForTrial) {
        // Activate trial subscription (14 days free)
        const trialStartDate = new Date()
        const trialEndDate = new Date(trialStartDate.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
        const nextPaymentDate = new Date(trialEndDate.getTime()) // First payment due after trial ends
        const billingDate = trialEndDate.toISOString().split('T')[0] // Format: YYYY-MM-DD for PayFast

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

        captureMessage('Trial subscription activated, setting up PayFast payment', { 
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
        
        // PayFast requires recurring_amount minimum of 5.00 ZAR for subscriptions
        // Ensure we meet the minimum requirement
        if (calculatedAmount < 5.00) {
          calculatedAmount = 5.00
        }

        // Generate secure payment ID
        const paymentId = PaymentSecurityService.generateSecurePaymentId()

        // Create server-side custom data (prevent client tampering)
        const serverCustomDataForTrial = {
          ...customData,
          providerId: providerId || undefined,
          paymentId,
          idempotencyKey,
          timestamp: Date.now(),
          userId: session.user.id
        }

        // Create PayFast subscription with R0 initial amount and billing_date set to trial end date
        // Initial amount is 0 (R0) for trial, recurring_amount is what will be charged after trial
        const paymentData = createPayFastPayment(
          0, // R0 for trial - no charge upfront
          effectiveEmail,
          effectiveName,
          itemName,
          {
            ...serverCustomDataForTrial,
            subscriptionType: "monthly",
            billingDate: billingDate,
            recurringAmount: calculatedAmount, // This is what will be charged after trial ends
            cycles: 0 // Ongoing subscription
          }
        )

        // Log PayFast payload for debugging
        console.log("\n" + "=".repeat(80))
        console.log("[PAYFAST INITIATE] ===== PAYFAST PAYLOAD (TRIAL SETUP) =====")
        console.log("=".repeat(80))
        console.log("[PAYFAST INITIATE] Provider ID:", providerId)
        console.log("[PAYFAST INITIATE] Initial Amount (Trial):", 0)
        console.log("[PAYFAST INITIATE] Recurring Amount (After Trial):", calculatedAmount)
        console.log("[PAYFAST INITIATE] Billing Date:", billingDate)
        console.log("[PAYFAST INITIATE] Trial End Date:", trialEndDate.toISOString())
        console.log("[PAYFAST INITIATE] Full Payment Data:", JSON.stringify(paymentData, null, 2))
        console.log("=".repeat(80))
        
        // Build payload string in PayFast form field order for testing
        const { PAYFAST_FORM_FIELD_ORDER } = await import('@/lib/payfast')
        let payloadString = ""
        for (const key of PAYFAST_FORM_FIELD_ORDER) {
          const value = paymentData[key as keyof typeof paymentData]
          if (value !== undefined && value !== '' && key !== 'signature') {
            const encodedValue = encodeURIComponent(String(value))
            payloadString += `${key}=${encodedValue}&`
          }
        }
        // Add signature at the end
        if (paymentData.signature) {
          payloadString += `signature=${encodeURIComponent(paymentData.signature)}`
        } else {
          payloadString = payloadString.slice(0, -1) // Remove trailing &
        }
        
        console.log("\n[PAYFAST INITIATE] ===== COPY THIS FOR SANDBOX TESTING =====")
        console.log("=".repeat(80))
        console.log(payloadString)
        console.log("=".repeat(80))
        console.log("[PAYFAST INITIATE] ===== END OF PAYLOAD STRING =====")
        console.log("[PAYFAST INITIATE] Payload length:", payloadString.length)
        console.log("[PAYFAST INITIATE] Signature:", paymentData.signature)
        console.log("[PAYFAST INITIATE] NOTE: This uses PayFast form field order (not alphabetical)")
        console.log("[PAYFAST INITIATE] NOTE: passphrase is NOT included in form submission")
        console.log("=".repeat(80))
        
        // Generate sample ITN payload string for testing (alphabetical order, includes passphrase)
        const itnPayloadData: Record<string, string> = {}
        for (const key in paymentData) {
          const value = paymentData[key as keyof typeof paymentData]
          if (value !== undefined && value !== '' && key !== 'signature') {
            itnPayloadData[key] = String(value)
          }
        }
        
        // Add sample ITN fields that PayFast will send
        itnPayloadData.pf_payment_id = 'TEST_PAYMENT_ID_' + Date.now()
        itnPayloadData.payment_status = 'COMPLETE'
        itnPayloadData.item_name = paymentData.item_name || ''
        itnPayloadData.amount_gross = paymentData.amount || ''
        itnPayloadData.amount_fee = '0.00'
        itnPayloadData.amount_net = paymentData.amount || ''
        itnPayloadData.custom_str1 = paymentData.custom_str1 || ''
        itnPayloadData.custom_str2 = paymentData.custom_str2 || ''
        itnPayloadData.custom_str3 = paymentData.custom_str3 || ''
        
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
        
        console.log("\n[PAYFAST INITIATE] ===== SAMPLE ITN PAYLOAD (FOR TESTING) =====")
        console.log("[PAYFAST INITIATE] NOTE: This is a SAMPLE - actual ITN will come from PayFast webhook")
        console.log("[PAYFAST INITIATE] NOTE: ITN uses alphabetical ordering (different from form)")
        console.log("[PAYFAST INITIATE] NOTE: passphrase IS included in ITN payload string")
        console.log("=".repeat(80))
        console.log(itnPayloadString)
        console.log("=".repeat(80))
        console.log("[PAYFAST INITIATE] ===== END OF SAMPLE ITN PAYLOAD =====")
        console.log("[PAYFAST INITIATE] ITN Payload length:", itnPayloadString.length)
        console.log("=".repeat(80) + "\n")

        // Record pending transaction for future payment
        // Store recurring amount (what will be charged after trial) but initial payment is R0
        const transaction = await secureDb.db
          .insert(schema.paymentTransactions)
          .values({
            providerId: providerId!,
            amount: calculatedAmount, // Store recurring amount for future billing
            status: 'pending',
            idempotencyKey: idempotencyKey || null,
            mPaymentId: paymentId,
            gatewayResponse: { 
              paymentData, 
              trialActivated: true,
              initialAmount: 0,
              recurringAmount: calculatedAmount
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

        // Return payment data to redirect to PayFast for payment method setup
        // Amount is 0 for trial, but recurring_amount is set for post-trial billing
        return NextResponse.json({
          paymentData,
          transactionId: transaction[0]?.id,
          amount: 0, // R0 for trial
          recurringAmount: calculatedAmount, // Amount that will be charged after trial
          trialActivated: true,
          trialPaymentSetup: true,
          billingDate: billingDate,
          trialStartDate: trialStartDate.toISOString(),
          trialEndDate: trialEndDate.toISOString(),
          message: "Trial activated. Please add your payment details. You won't be charged until after your 14-day trial ends."
        })
      }

      // Check if provider is in trial period and trying to pay early
      if (providerRow.subscriptionStatus === 'trial' && providerRow.trialEndDate) {
        const trialEnd = new Date(providerRow.trialEndDate)
        const now = new Date()
        
        if (trialEnd > now) {
          // Still in trial - set up payment for after trial ends
          const billingDate = trialEnd.toISOString().split('T')[0] // Format: YYYY-MM-DD
          
          // Calculate amount for recurring subscription
          const [result] = await secureDb.db
            .select({ count: count(schema.accommodations.id) })
            .from(schema.accommodations)
            .where(eq(schema.accommodations.providerId, providerId!))
          
          const accommodationsCount = Number(result?.count || 0)
          const wantsFeatured = Boolean(customData?.wantsFeatured)
          let calculatedAmount = calculateProviderSubscriptionPrice({ accommodationsCount, wantsFeatured })
          
          // PayFast requires recurring_amount minimum of 5.00 ZAR for subscriptions
          // Ensure we meet the minimum requirement
          if (calculatedAmount < 5.00) {
            calculatedAmount = 5.00
          }

          // Generate secure payment ID
          const paymentId = PaymentSecurityService.generateSecurePaymentId()

          // Create server-side custom data (prevent client tampering)
          const serverCustomDataForTrial = {
            ...customData,
            providerId: providerId || undefined,
            paymentId,
            idempotencyKey,
            timestamp: Date.now(),
            userId: session.user.id
          }

          // Create PayFast subscription with R0 initial amount and billing_date set to trial end date
          // Initial amount is 0 (R0) since user is in trial, recurring_amount is what will be charged after trial
          const paymentData = createPayFastPayment(
            0, // R0 for trial - no charge upfront
            effectiveEmail,
            effectiveName,
            itemName,
            {
              ...serverCustomDataForTrial,
              subscriptionType: "monthly",
              billingDate: billingDate,
              recurringAmount: calculatedAmount, // This is what will be charged after trial ends
              cycles: 0 // Ongoing subscription
            }
          )

          // Record pending transaction for future payment
          const [transaction] = await secureDb.db
            .insert(schema.paymentTransactions)
            .values({
              providerId: providerId!,
              amount: calculatedAmount.toString(),
              currency: 'ZAR',
              mPaymentId: paymentData.m_payment_id,
              idempotencyKey: idempotencyKey,
              status: 'pending',
              gatewayResponse: { 
                initiated_at: new Date().toISOString(),
                trial_payment_setup: true,
                billing_date: billingDate,
                paymentData: paymentData
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
            paymentData,
            transactionId: transaction.id,
            amount: 0, // R0 for trial
            recurringAmount: calculatedAmount, // Amount that will be charged after trial
            trialPaymentSetup: true,
            billingDate: billingDate,
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
      effectiveName = agentRow.contactPerson || session.user.name || 'Agent'
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
    const serverCustomData = {
      ...customData,
      providerId: providerId || undefined,
      agentId: agentId || undefined,
      paymentId,
      idempotencyKey,
      timestamp: Date.now(),
      userId: session.user.id
    }

    // Create PayFast payment data
    const paymentData = createPayFastPayment(
      finalAmount,
      effectiveEmail,
      effectiveName,
      itemName,
      serverCustomData
    )

    // Log PayFast payload for debugging
    console.log("\n" + "=".repeat(80))
    console.log("[PAYFAST INITIATE] ===== PAYFAST PAYLOAD =====")
    console.log("=".repeat(80))
    console.log("[PAYFAST INITIATE] Entity Type:", providerId ? 'provider' : 'agent')
    console.log("[PAYFAST INITIATE] Entity ID:", providerId || agentId)
    console.log("[PAYFAST INITIATE] Amount:", finalAmount)
    console.log("[PAYFAST INITIATE] Full Payment Data:", JSON.stringify(paymentData, null, 2))
    console.log("=".repeat(80))
    
    // Build payload string in PayFast form field order for testing
    const { PAYFAST_FORM_FIELD_ORDER } = await import('@/lib/payfast')
    let payloadString = ""
    for (const key of PAYFAST_FORM_FIELD_ORDER) {
      const value = paymentData[key as keyof typeof paymentData]
      if (value !== undefined && value !== '' && key !== 'signature') {
        const encodedValue = encodeURIComponent(String(value))
        payloadString += `${key}=${encodedValue}&`
      }
    }
    // Add signature at the end
    if (paymentData.signature) {
      payloadString += `signature=${encodeURIComponent(paymentData.signature)}`
    } else {
      payloadString = payloadString.slice(0, -1) // Remove trailing &
    }
    
    console.log("\n[PAYFAST INITIATE] ===== COPY THIS FOR SANDBOX TESTING =====")
    console.log("=".repeat(80))
    console.log(payloadString)
    console.log("=".repeat(80))
    console.log("[PAYFAST INITIATE] ===== END OF PAYLOAD STRING =====")
    console.log("[PAYFAST INITIATE] Payload length:", payloadString.length)
    console.log("[PAYFAST INITIATE] Signature:", paymentData.signature)
    console.log("[PAYFAST INITIATE] NOTE: This uses PayFast form field order (not alphabetical)")
    console.log("[PAYFAST INITIATE] NOTE: passphrase is NOT included in form submission")
    console.log("=".repeat(80))
    
    // Generate sample ITN payload string for testing (alphabetical order, includes passphrase)
    const itnPayloadData: Record<string, string> = {}
    for (const key in paymentData) {
      const value = paymentData[key as keyof typeof paymentData]
      if (value !== undefined && value !== '' && key !== 'signature') {
        itnPayloadData[key] = String(value)
      }
    }
    
    // Add sample ITN fields that PayFast will send
    itnPayloadData.pf_payment_id = 'TEST_PAYMENT_ID_' + Date.now()
    itnPayloadData.payment_status = 'COMPLETE'
    itnPayloadData.item_name = paymentData.item_name || ''
    itnPayloadData.amount_gross = paymentData.amount || ''
    itnPayloadData.amount_fee = '0.00'
    itnPayloadData.amount_net = paymentData.amount || ''
    itnPayloadData.custom_str1 = paymentData.custom_str1 || ''
    itnPayloadData.custom_str2 = paymentData.custom_str2 || ''
    itnPayloadData.custom_str3 = paymentData.custom_str3 || ''
    
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
    
    console.log("\n[PAYFAST INITIATE] ===== SAMPLE ITN PAYLOAD (FOR TESTING) =====")
    console.log("[PAYFAST INITIATE] NOTE: This is a SAMPLE - actual ITN will come from PayFast webhook")
    console.log("[PAYFAST INITIATE] NOTE: ITN uses alphabetical ordering (different from form)")
    console.log("[PAYFAST INITIATE] NOTE: passphrase IS included in ITN payload string")
    console.log("=".repeat(80))
    console.log(itnPayloadString)
    console.log("=".repeat(80))
    console.log("[PAYFAST INITIATE] ===== END OF SAMPLE ITN PAYLOAD =====")
    console.log("[PAYFAST INITIATE] ITN Payload length:", itnPayloadString.length)
    console.log("=".repeat(80) + "\n")

    // Record pending transaction (neon-http doesn't support transactions, so we do sequential operations)
    try {
      // Insert payment transaction with idempotency key
      const [transaction] = await secureDb.db
        .insert(schema.paymentTransactions)
        .values({
          providerId: providerId || null,
          agentId: agentId || null,
          amount: finalAmount.toString(),
          currency: 'ZAR',
          mPaymentId: paymentData.m_payment_id,
          idempotencyKey: idempotencyKey,
          status: 'pending',
          gatewayResponse: { 
            initiated_at: new Date().toISOString(),
            user_agent: request.headers.get('user-agent'),
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
            paymentData: paymentData
          }
        })
        .returning({ id: schema.paymentTransactions.id })

      // Log payment initiation
      await PaymentAuditService.logAuditEvent(transaction.id, 'created', {
        amount: finalAmount,
        providerId: providerId || undefined,
        reason: 'Payment initiated via PayFast',
        metadata: { 
          itemName,
          customData: serverCustomData,
          paymentId,
          agentId: agentId || undefined
        }
      })
    } catch (dbError) {
      captureException(dbError instanceof Error ? dbError : new Error(String(dbError)), { component: 'payment-initiation', providerId: providerId || undefined, agentId: agentId || undefined, amount: finalAmount, paymentId })
      return NextResponse.json({ error: "Unable to create transaction", details: dbError instanceof Error ? dbError.message : String(dbError) }, { status: 500 })
    }

    // Log successful payment initiation
    captureMessage('Payment initiated successfully', { level: 'info', component: 'payment-initiation', providerId: providerId || undefined, agentId: agentId || undefined, amount: finalAmount, paymentId, itemName })

    return NextResponse.json({ 
      paymentData,
      transactionId: paymentId,
      amount: finalAmount
    })
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { component: 'payment-initiation', userId: 'unknown', providerId: 'unknown' })
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}


