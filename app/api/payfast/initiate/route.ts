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
    if (!session || session.user.role !== 'provider') {
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

    const { amount, itemName, customData } = validationResult.data

    // Validate PayFast configuration
    if (!env.PAYFAST_MERCHANT_ID || !env.PAYFAST_MERCHANT_KEY || !env.PAYFAST_PASSPHRASE) {
      captureMessage('PayFast configuration missing', { level: 'error', component: 'payment-initiation' })
      return NextResponse.json({ error: "Payment system not configured" }, { status: 500 })
    }

    // Resolve provider from session (server-side validation)
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

    const providerId = providerRow.id

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
      const [result] = await secureDb.db
        .select({ count: count(schema.accommodations.id) })
        .from(schema.accommodations)
        .where(eq(schema.accommodations.providerId, providerId))
      
      const accommodationsCount = Number(result?.count || 0)
      const wantsFeatured = Boolean(customData?.wantsFeatured)
      finalAmount = calculateProviderSubscriptionPrice({ accommodationsCount, wantsFeatured })
    }

    // Check for duplicate payments
    const duplicateCheck = await PaymentReconciliationService.detectDuplicatePayments(providerId, finalAmount)
    if (duplicateCheck.isDuplicate) {
      captureMessage('Duplicate payment attempt detected', { level: 'warning', component: 'payment-initiation', providerId, amount: finalAmount, duplicateTransactions: duplicateCheck.duplicateTransactions.map(t => t.id) })
      return NextResponse.json({ 
        error: "Duplicate payment detected. Please wait before retrying." 
      }, { status: 409 })
    }

    // Generate secure payment ID
    const paymentId = PaymentSecurityService.generateSecurePaymentId()

    // Create server-side custom data (prevent client tampering)
    const serverCustomData = {
      ...customData,
      providerId,
      paymentId,
      timestamp: Date.now(),
      userId: session.user.id
    }

    const effectiveEmail = providerRow.contactEmail || session.user.email
    const effectiveName = providerRow.contactPerson || session.user.name || 'Provider'

    // Create PayFast payment data
    const paymentData = createPayFastPayment(
      finalAmount,
      effectiveEmail,
      effectiveName,
      itemName,
      serverCustomData
    )

    // Record pending transaction with comprehensive validation
    try {
      await secureDb.db.transaction(async (tx: any) => {
        // Insert payment transaction
        const [transaction] = await tx
          .insert(schema.paymentTransactions)
          .values({
            providerId,
            amount: finalAmount.toString(),
            currency: 'ZAR',
            mPaymentId: paymentData.m_payment_id,
            status: 'pending',
            gatewayResponse: { 
              initiated_at: new Date().toISOString(),
              user_agent: request.headers.get('user-agent'),
              ip_address: request.headers.get('x-forwarded-for') || 'unknown'
            }
          })
          .returning({ id: schema.paymentTransactions.id })

        // Log payment initiation
        await PaymentAuditService.logAuditEvent(transaction.id, 'created', {
          amount: finalAmount,
          providerId,
          reason: 'Payment initiated via PayFast',
          metadata: { 
            itemName,
            customData: serverCustomData,
            paymentId
          }
        })
      })
    } catch (dbError) {
      captureException(dbError instanceof Error ? dbError : new Error(String(dbError)), { component: 'payment-initiation', providerId, amount: finalAmount, paymentId })
      return NextResponse.json({ error: "Unable to create transaction" }, { status: 500 })
    }

    // Log successful payment initiation
    captureMessage('Payment initiated successfully', { level: 'info', component: 'payment-initiation', providerId, amount: finalAmount, paymentId, itemName })

    return NextResponse.json({ 
      paymentData,
      transactionId: paymentId,
      amount: finalAmount
    })
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { component: 'payment-initiation', userId: 'unknown', providerId: 'unknown' })
     console.error("PayFast initiate error:", error)
     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
   }
 }


