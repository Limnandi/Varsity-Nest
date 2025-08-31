import { type NextRequest, NextResponse } from "next/server"
import { verifyPayFastSignature, validatePayFastResponse } from "@/lib/payfast"
import { query } from "@/lib/database"
import { Sentry } from "@/lib/sentry"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const data: any = {}

    // Parse form data
    formData.forEach((value, key) => {
      data[key] = value.toString()
    })

    // Log incoming webhook for debugging (remove in production)
    console.log("PayFast webhook received:", {
      paymentId: data.pf_payment_id,
      status: data.payment_status,
      amount: data.amount_gross,
      timestamp: new Date().toISOString()
    })

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

    // Extract payment details
    const providerId = data.custom_str1
    const amount = Number.parseFloat(data.amount_gross)
    const transactionId = data.pf_payment_id
    const status = data.payment_status
    const paymentDate = new Date()

    // Process payment based on status
    switch (status) {
      case "COMPLETE":
        await processSuccessfulPayment(providerId, amount, transactionId, paymentDate, data)
        break
        
      case "PENDING":
        await processPendingPayment(providerId, amount, transactionId, paymentDate, data)
        break
        
      case "FAILED":
        await processFailedPayment(providerId, amount, transactionId, paymentDate, data)
        break
        
      case "CANCELLED":
        await processCancelledPayment(providerId, amount, transactionId, paymentDate, data)
        break
        
      default:
        console.warn("Unknown payment status:", status, "for payment:", transactionId)
    }

    // Return success to PayFast (important to prevent retries)
    return NextResponse.json({ success: true })

  } catch (error) {
    Sentry.captureException(error)
    console.error("PayFast notification error:", error)
    
    // Return 500 to trigger PayFast retry mechanism
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function processSuccessfulPayment(
  providerId: string, 
  amount: number, 
  transactionId: string, 
  paymentDate: Date,
  webhookData: any
) {
  try {
    // Update provider subscription status
    await query(
      `UPDATE service_providers 
       SET subscription_status = $1, 
           last_payment_date = $2, 
           next_payment_date = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [
        "active", 
        paymentDate, 
        new Date(paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
        providerId
      ]
    )

    // Record successful transaction
    await query(
      `INSERT INTO payment_transactions 
       (provider_id, amount, transaction_id, status, payment_date, gateway_response, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        providerId, 
        amount, 
        transactionId, 
        "completed", 
        paymentDate,
        JSON.stringify(webhookData)
      ]
    )

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
  paymentDate: Date,
  webhookData: any
) {
  try {
    // Record pending transaction
    await query(
      `INSERT INTO payment_transactions 
       (provider_id, amount, transaction_id, status, payment_date, gateway_response, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (transaction_id) DO UPDATE SET
       status = $4, updated_at = NOW()`,
      [
        providerId, 
        amount, 
        transactionId, 
        "pending", 
        paymentDate,
        JSON.stringify(webhookData)
      ]
    )

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
  paymentDate: Date,
  webhookData: any
) {
  try {
    // Record failed transaction
    await query(
      `INSERT INTO payment_transactions 
       (provider_id, amount, transaction_id, status, payment_date, gateway_response, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (transaction_id) DO UPDATE SET
       status = $4, updated_at = NOW()`,
      [
        providerId, 
        amount, 
        transactionId, 
        "failed", 
        paymentDate,
        JSON.stringify(webhookData)
      ]
    )

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
  paymentDate: Date,
  webhookData: any
) {
  try {
    // Record cancelled transaction
    await query(
      `INSERT INTO payment_transactions 
       (provider_id, amount, transaction_id, status, payment_date, gateway_response, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (transaction_id) DO UPDATE SET
       status = $4, updated_at = NOW()`,
      [
        providerId, 
        amount, 
        transactionId, 
        "cancelled", 
        paymentDate,
        JSON.stringify(webhookData)
      ]
    )

    console.log(`Payment cancelled for provider ${providerId}: ${transactionId}`)
  } catch (error) {
    console.error("Error processing cancelled payment:", error)
    throw error
  }
}
