import { type NextRequest, NextResponse } from "next/server"
import { verifyPayFastSignature, validatePayFastResponse, verifyPayFastITNWithServer } from "@/lib/payfast"
import { Sentry } from "@/lib/sentry"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    // Optional: IP allowlist (configure via env PAYFAST_IP_ALLOWLIST as comma-separated list)
    const allowlist = (process.env.PAYFAST_IP_ALLOWLIST || "").split(",").map(s => s.trim()).filter(Boolean)
    if (allowlist.length > 0) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || (request as any).ip || ""
      if (!allowlist.includes(ip)) {
        console.error("Webhook IP not allowed", ip)
        return new Response("FORBIDDEN", { status: 403, headers: { "Content-Type": "text/plain" } })
      }
    }

    const formData = await request.formData()
    const data: any = {}
    const fieldOrder: string[] = []

    // Parse form data
    formData.forEach((value, key) => {
      data[key] = value.toString()
      fieldOrder.push(key)
    })

    // Minimal logging to reduce sensitive data exposure
    console.log("PayFast webhook received", data.pf_payment_id, data.payment_status)

    // Validate PayFast response structure
    const validation = validatePayFastResponse(data)
    if (!validation.isValid) {
      console.error("Invalid PayFast response:", validation.errors)
      return NextResponse.json({ 
        error: "Invalid response format", 
        details: validation.errors 
      }, { status: 400 })
    }

    // Verify signature for security
    const signature = data.signature
    delete data.signature

    if (!verifyPayFastSignature(data, signature)) {
      console.error("Invalid PayFast signature for payment:", data.pf_payment_id)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // ITN server-to-server verification with PayFast (defense in depth)
    const itnValid = await verifyPayFastITNWithServer(data, fieldOrder)
    if (!itnValid) {
      console.error("PayFast ITN server verification failed:", data.pf_payment_id)
      return NextResponse.json({ error: "ITN verification failed" }, { status: 400 })
    }

    // Merchant safety: ensure webhook includes our merchant credentials
    if (data.merchant_id !== process.env.PAYFAST_MERCHANT_ID) {
      console.error('Merchant id mismatch in webhook', data.merchant_id)
      return new Response("MERCHANT_MISMATCH", { status: 400, headers: { "Content-Type": "text/plain" } })
    }

    // Extract payment details
    const providerId = data.custom_str1
    const amount = Number.parseFloat(data.amount_gross)
    const transactionId = data.pf_payment_id
    const merchantPaymentId = data.m_payment_id
    const status = data.payment_status
    const paymentDate = new Date()

    // Fetch the pending transaction to verify amount and existence (idempotency)
    const pendingRes = await query`SELECT amount, provider_id FROM payment_transactions WHERE m_payment_id = ${merchantPaymentId} LIMIT 1`
    const pending = pendingRes.rows?.[0]

    if (!pending) {
      console.error("No pending transaction for m_payment_id:", merchantPaymentId)
      return NextResponse.json({ error: "Transaction not found" }, { status: 400 })
    }

    // Strict provider and amount checks
    if (pending.provider_id && String(pending.provider_id) !== String(providerId)) {
      console.error("Provider mismatch:", { expected: pending.provider_id, got: providerId, merchantPaymentId })
      return new Response("PROVIDER_MISMATCH", { status: 400, headers: { "Content-Type": "text/plain" } })
    }

    if (Number.parseFloat(pending.amount) !== amount) {
      console.error("Amount mismatch:", { expected: pending.amount, got: amount, merchantPaymentId })
      return new Response("AMOUNT_MISMATCH", { status: 400, headers: { "Content-Type": "text/plain" } })
    }

    // Process payment based on status
    switch (status) {
      case "COMPLETE":
        await processSuccessfulPayment(providerId, amount, transactionId, merchantPaymentId, paymentDate, data)
        break
        
      case "PENDING":
        await processPendingPayment(providerId, amount, transactionId, merchantPaymentId, paymentDate, data)
        break
        
      case "FAILED":
        await processFailedPayment(providerId, amount, transactionId, merchantPaymentId, paymentDate, data)
        break
        
      case "CANCELLED":
        await processCancelledPayment(providerId, amount, transactionId, merchantPaymentId, paymentDate, data)
        break
        
      default:
        console.warn("Unknown payment status:", status, "for payment:", transactionId)
    }

    // Return success to PayFast in plain text as per recommendations
    return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } })

  } catch (error) {
    Sentry.captureException(error)
    console.error("PayFast notification error:", error)
    
    // Return 500 to trigger PayFast retry mechanism
    return new Response("ERROR", { status: 500, headers: { "Content-Type": "text/plain" } })
  }
}

async function processSuccessfulPayment(
  providerId: string, 
  amount: number, 
  transactionId: string,
  merchantPaymentId: string, 
  paymentDate: Date,
  webhookData: any
) {
  try {
    // Idempotency: mark transaction as completed only once
    await query`UPDATE payment_transactions SET pf_payment_id = ${transactionId}, status = 'completed', payment_date = ${paymentDate.toISOString()}, gateway_response = ${JSON.stringify(webhookData)}::jsonb WHERE m_payment_id = ${merchantPaymentId} AND status <> 'completed'`

    // Update provider subscription status
    await query`UPDATE providers SET subscription_status = 'active', last_payment_date = ${paymentDate.toISOString()}, next_payment_date = ${new Date(paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()} WHERE id = ${providerId}`

    // If merchant requested featured, set it only if featured cap not exceeded (5)
    if (webhookData?.custom_str4 === "featured_true" || webhookData?.custom_str2 === "featured") {
      const featuredRes = await query`SELECT COUNT(*) AS c FROM providers WHERE is_featured = true`
      const featuredCount = Number.parseInt(featuredRes.rows?.[0]?.c ?? '0')
      if (featuredCount < 5) {
        await query`UPDATE providers SET is_featured = true WHERE id = ${providerId}`
      }
    }

    // Ensure provider_id and amount are set on transaction
    await query`UPDATE payment_transactions SET provider_id = ${providerId}, amount = ${amount} WHERE m_payment_id = ${merchantPaymentId}`

    console.log(`Payment successful for provider ${providerId}: ${transactionId}`)
  } catch (error) {
    console.error("Error processing successful payment:", error)
    throw error
  }
}

async function processPendingPayment(
  providerId: string, 
  amount: number, 
  transactionId: string, 
  merchantPaymentId: string,
  paymentDate: Date,
  webhookData: any
) {
  try {
    await query`UPDATE payment_transactions SET provider_id = ${providerId}, amount = ${amount}, pf_payment_id = ${transactionId}, status = 'pending', gateway_response = ${JSON.stringify(webhookData)}::jsonb WHERE m_payment_id = ${merchantPaymentId}`

    console.log(`Payment pending for provider ${providerId}: ${transactionId}`)
  } catch (error) {
    console.error("Error processing pending payment:", error)
    throw error
  }
}

async function processFailedPayment(
  providerId: string, 
  amount: number, 
  transactionId: string, 
  merchantPaymentId: string,
  paymentDate: Date,
  webhookData: any
) {
  try {
    await query`UPDATE payment_transactions SET provider_id = ${providerId}, amount = ${amount}, pf_payment_id = ${transactionId}, status = 'failed', gateway_response = ${JSON.stringify(webhookData)}::jsonb WHERE m_payment_id = ${merchantPaymentId}`

    console.log(`Payment failed for provider ${providerId}: ${transactionId}`)
  } catch (error) {
    console.error("Error processing failed payment:", error)
    throw error
  }
}

async function processCancelledPayment(
  providerId: string, 
  amount: number, 
  transactionId: string, 
  merchantPaymentId: string,
  paymentDate: Date,
  webhookData: any
) {
  try {
    await query`UPDATE payment_transactions SET provider_id = ${providerId}, amount = ${amount}, pf_payment_id = ${transactionId}, status = 'cancelled', gateway_response = ${JSON.stringify(webhookData)}::jsonb WHERE m_payment_id = ${merchantPaymentId}`

    console.log(`Payment cancelled for provider ${providerId}: ${transactionId}`)
  } catch (error) {
    console.error("Error processing cancelled payment:", error)
    throw error
  }
}
