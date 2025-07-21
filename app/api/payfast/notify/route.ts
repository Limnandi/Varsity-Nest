import { type NextRequest, NextResponse } from "next/server"
import { verifyPayFastSignature } from "@/lib/payfast"
import { query } from "@/lib/database"
import { Sentry } from "@/lib/sentry"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const data: any = {}

    formData.forEach((value, key) => {
      data[key] = value.toString()
    })

    // Verify signature
    const signature = data.signature
    delete data.signature

    if (!verifyPayFastSignature(data, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Process payment
    const providerId = data.custom_str1
    const amount = Number.parseFloat(data.amount_gross)
    const transactionId = data.pf_payment_id
    const status = data.payment_status

    if (status === "COMPLETE") {
      // Update provider subscription
      await query(
        "UPDATE service_providers SET subscription_status = $1, last_payment_date = $2, next_payment_date = $3 WHERE id = $4",
        ["active", new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), providerId],
      )

      // Record transaction
      await query(
        "INSERT INTO payment_transactions (provider_id, amount, transaction_id, status, payment_date) VALUES ($1, $2, $3, $4, $5)",
        [providerId, amount, transactionId, "completed", new Date()],
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    Sentry.captureException(error)
    console.error("PayFast notification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
