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
          subscriptionStatus: schema.providers.subscriptionStatus
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


