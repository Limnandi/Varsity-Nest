import { type NextRequest, NextResponse } from "next/server"
import { PayFastWebhookSchema } from "@/lib/schemas/payment"
import { PaymentSecurityService } from "@/lib/services/payment-security"
import { PaymentAuditService } from "@/lib/services/payment-audit"
import { PaymentReconciliationService } from "@/lib/services/payment-reconciliation"
import { Sentry } from "@/lib/sentry"
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
      Sentry.captureMessage('PayFast webhook from unauthorized IP', {
        level: 'error',
        tags: { component: 'payfast-webhook' },
        extra: { clientIP }
      })
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
      Sentry.captureMessage('Invalid PayFast webhook data structure', {
        level: 'error',
        tags: { component: 'payfast-webhook' },
        extra: { errors: validationResult.error.errors, pfPaymentId: rawData.pf_payment_id }
      })
      return NextResponse.json({ 
        error: "Invalid webhook data structure", 
        details: validationResult.error.errors 
      }, { status: 400 })
    }

    const data = validationResult.data

    // Enhanced signature verification with timing-safe comparison
    if (!PaymentSecurityService.verifyPayFastSignature(data, data.signature)) {
      Sentry.captureMessage('Invalid PayFast webhook signature', {
        level: 'error',
        tags: { component: 'payfast-webhook' },
        extra: { pfPaymentId: data.pf_payment_id, clientIP }
      })
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Validate merchant ID
    if (data.merchant_id !== process.env.PAYFAST_MERCHANT_ID) {
      Sentry.captureMessage('Merchant ID mismatch in PayFast webhook', {
        level: 'error',
        tags: { component: 'payfast-webhook' },
        extra: { merchantId: data.merchant_id, pfPaymentId: data.pf_payment_id }
      })
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
    const providerId = data.custom_str1
    const amount = Number.parseFloat(data.amount_gross)
    const transactionId = data.pf_payment_id
    const merchantPaymentId = data.m_payment_id
    const status = data.payment_status
    const paymentDate = new Date()

    // Validate required fields
    if (!providerId || !amount || !transactionId || !merchantPaymentId) {
      Sentry.captureMessage('Missing required payment fields in webhook', {
        level: 'error',
        tags: { component: 'payfast-webhook' },
        extra: { providerId, amount, transactionId, merchantPaymentId }
      })
      return NextResponse.json({ error: "Missing required payment fields" }, { status: 400 })
    }

    // Fetch the pending transaction with enhanced validation
    const [pending] = await secureDb.db
      .select({ 
        id: schema.paymentTransactions.id,
        amount: schema.paymentTransactions.amount, 
        providerId: schema.paymentTransactions.providerId,
        status: schema.paymentTransactions.status
      })
      .from(schema.paymentTransactions)
      .where(eq(schema.paymentTransactions.mPaymentId, merchantPaymentId))
      .limit(1)

    if (!pending) {
      Sentry.captureMessage('No pending transaction found for webhook', {
        level: 'error',
        tags: { component: 'payfast-webhook' },
        extra: { merchantPaymentId, pfPaymentId: transactionId }
      })
      return NextResponse.json({ error: "Transaction not found" }, { status: 400 })
    }

    // Enhanced security validation
    if (pending.providerId && String(pending.providerId) !== String(providerId)) {
      Sentry.captureMessage('Provider ID mismatch in webhook', {
        level: 'error',
        tags: { component: 'payfast-webhook' },
        extra: { 
          expected: pending.providerId, 
          received: providerId, 
          merchantPaymentId,
          pfPaymentId: transactionId
        }
      })
      return new Response("PROVIDER_MISMATCH", { status: 400, headers: { "Content-Type": "text/plain" } })
    }

    // Validate amount with tolerance
    if (!PaymentSecurityService.validatePaymentAmount(amount, Number(pending.amount))) {
      Sentry.captureMessage('Amount mismatch in webhook', {
        level: 'error',
        tags: { component: 'payfast-webhook' },
        extra: { 
          expected: pending.amount, 
          received: amount, 
          merchantPaymentId,
          pfPaymentId: transactionId
        }
      })
      return new Response("AMOUNT_MISMATCH", { status: 400, headers: { "Content-Type": "text/plain" } })
    }

    // Check for duplicate payments
    const duplicateCheck = await PaymentReconciliationService.detectDuplicatePayments(providerId, amount)
    if (duplicateCheck.isDuplicate) {
      Sentry.captureMessage('Duplicate payment detected', {
        level: 'warning',
        tags: { component: 'payfast-webhook' },
        extra: { 
          providerId, 
          amount, 
          merchantPaymentId,
          duplicateTransactions: duplicateCheck.duplicateTransactions.map(t => t.id)
        }
      })
      // Log but don't block - let the reconciliation service handle it
    }

    // Process payment based on status with comprehensive audit logging
    try {
      switch (status) {
        case "COMPLETE":
          await processSuccessfulPayment(pending.id, providerId, amount, transactionId, merchantPaymentId, paymentDate, data)
          break
          
        case "PENDING":
          await processPendingPayment(pending.id, providerId, amount, transactionId, merchantPaymentId, paymentDate, data)
          break
          
        case "FAILED":
          await processFailedPayment(pending.id, providerId, amount, transactionId, merchantPaymentId, paymentDate, data)
          break
          
        case "CANCELLED":
          await processCancelledPayment(pending.id, providerId, amount, transactionId, merchantPaymentId, paymentDate, data)
          break
          
        default:
          Sentry.captureMessage('Unknown payment status in webhook', {
            level: 'warning',
            tags: { component: 'payfast-webhook' },
            extra: { status, pfPaymentId: transactionId, merchantPaymentId }
          })
          console.warn("Unknown payment status:", status, "for payment:", transactionId)
      }

      // Log successful webhook processing
      await PaymentAuditService.logAuditEvent(pending.id, 'updated', {
        oldStatus: pending.status,
        newStatus: status.toLowerCase(),
        amount,
        providerId,
        reason: `Webhook processed: ${status}`,
        metadata: { webhookData: sanitizedData }
      })

      // Return success to PayFast in plain text as per recommendations
      return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } })
    } catch (processingError) {
      Sentry.captureException(processingError, {
        tags: { component: 'payfast-webhook' },
        extra: { 
          status, 
          pfPaymentId: transactionId, 
          merchantPaymentId,
          providerId 
        }
      })
      
      // Log processing error
      await PaymentAuditService.logAuditEvent(pending.id, 'failed', {
        oldStatus: pending.status,
        newStatus: 'failed',
        amount,
        providerId,
        reason: `Webhook processing error: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`,
        metadata: { webhookData: sanitizedData, error: processingError }
      })
      
      // Return 500 to trigger PayFast retry mechanism
      return new Response("ERROR", { status: 500, headers: { "Content-Type": "text/plain" } })
    }

  } catch (error) {
    Sentry.captureException(error)
    console.error("PayFast notification error:", error)
    
    // Return 500 to trigger PayFast retry mechanism
    return new Response("ERROR", { status: 500, headers: { "Content-Type": "text/plain" } })
  }
}

async function processSuccessfulPayment(
  transactionDbId: string,
  providerId: string, 
  amount: number, 
  transactionId: string,
  merchantPaymentId: string, 
  paymentDate: Date,
  webhookData: any
) {
  try {
    // Start transaction for atomicity
    await secureDb.db.transaction(async (tx) => {
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

      // Update provider subscription status
      await tx
        .update(schema.providers)
        .set({
          subscriptionStatus: 'active',
          lastPaymentDate: paymentDate,
          nextPaymentDate: new Date(paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        })
        .where(eq(schema.providers.id, providerId))

      // Handle featured status if requested
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
            .where(eq(schema.providers.id, providerId))
        }
      }
    })

    // Log successful payment
    await PaymentAuditService.logAuditEvent(transactionDbId, 'completed', {
      oldStatus: 'pending',
      newStatus: 'completed',
      amount,
      providerId,
      reason: 'Payment completed successfully via PayFast',
      metadata: { 
        pfPaymentId: transactionId,
        paymentDate: paymentDate.toISOString(),
        featured: webhookData?.custom_str4 === "featured_true"
      }
    })

    // Perform reconciliation
    await PaymentReconciliationService.reconcilePayment(transactionDbId, webhookData)

    console.log(`Payment successful for provider ${providerId}: ${transactionId}`)
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'payment-processing' },
      extra: { 
        transactionId, 
        providerId, 
        amount,
        action: 'processSuccessfulPayment'
      }
    })
    throw error
  }
}

async function processPendingPayment(
  transactionDbId: string,
  providerId: string, 
  amount: number, 
  transactionId: string, 
  merchantPaymentId: string,
  paymentDate: Date,
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
    Sentry.captureException(error, {
      tags: { component: 'payment-processing' },
      extra: { transactionId, providerId, amount, action: 'processPendingPayment' }
    })
    throw error
  }
}

async function processFailedPayment(
  transactionDbId: string,
  providerId: string, 
  amount: number, 
  transactionId: string, 
  merchantPaymentId: string,
  paymentDate: Date,
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
    Sentry.captureException(error, {
      tags: { component: 'payment-processing' },
      extra: { transactionId, providerId, amount, action: 'processFailedPayment' }
    })
    throw error
  }
}

async function processCancelledPayment(
  transactionDbId: string,
  providerId: string, 
  amount: number, 
  transactionId: string, 
  merchantPaymentId: string,
  paymentDate: Date,
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
    Sentry.captureException(error, {
      tags: { component: 'payment-processing' },
      extra: { transactionId, providerId, amount, action: 'processCancelledPayment' }
    })
    throw error
  }
}
