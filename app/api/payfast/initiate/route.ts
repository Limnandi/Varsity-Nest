import { NextResponse } from "next/server"
import { createPayFastPayment } from "@/lib/payfast"
import { calculateProviderSubscriptionPrice } from "@/lib/payments"
import { postgrest } from "@/lib/postgrest"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { amount, userEmail, userName, itemName, customData } = body || {}

    if (!userEmail || !userName || !itemName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Basic server-side validation
    let parsedAmount = amount !== undefined ? Number.parseFloat(String(amount)) : NaN

    if (!process.env.PAYFAST_MERCHANT_ID || !process.env.PAYFAST_MERCHANT_KEY) {
      return NextResponse.json({ error: "PayFast not configured" }, { status: 500 })
    }

    // Compute amount if not valid
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      if (!customData?.providerId) {
        return NextResponse.json({ error: "Missing providerId for amount calculation" }, { status: 400 })
      }
      const accommodationsCount = await postgrest.count("accommodations", { provider_id: customData.providerId })
      const wantsFeatured = Boolean(customData?.wantsFeatured)
      parsedAmount = calculateProviderSubscriptionPrice({ accommodationsCount, wantsFeatured })
    }

    // Create signed payload (server-generated m_payment_id)
    const serverCustomData = {
      ...customData,
      paymentId: `vn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    }

    const paymentData = createPayFastPayment(
      parsedAmount,
      userEmail,
      userName,
      itemName,
      serverCustomData
    )

    // Record a pending transaction for idempotency and amount verification
    try {
      await postgrest.post("payment_transactions", {
        provider_id: serverCustomData?.providerId ?? null,
        amount: parsedAmount,
        currency: "ZAR",
        m_payment_id: paymentData.m_payment_id,
        status: "pending",
        payment_date: new Date().toISOString(),
        gateway_response: { initiated_at: new Date().toISOString() }
      }, { on_conflict: "m_payment_id", resolution: "ignore-duplicates" })
    } catch (e) {
      console.error("Failed to record pending transaction", e)
      // Fail closed: do not proceed without DB record in production
      return NextResponse.json({ error: "Unable to create transaction" }, { status: 500 })
    }

    return NextResponse.json({ paymentData })
  } catch (error) {
    console.error("PayFast initiate error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


