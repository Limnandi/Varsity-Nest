import { NextResponse } from "next/server"
import { createPayFastPayment } from "@/lib/payfast"
import { calculateProviderSubscriptionPrice } from "@/lib/payments"
import { query } from "@/lib/database"
import { getSession } from "@/lib/stackauth"

export async function POST(request: Request) {
  try {
    // Enforce authenticated provider and bind providerId server-side
    const session = await getSession()
    if (!session || session.user.role !== 'provider') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const { amount, itemName, customData } = body || {}

    if (!itemName) {
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
      const res = await query`SELECT COUNT(*) AS c FROM accommodations WHERE provider_id = ${customData.providerId}`
      const accommodationsCount = Number.parseInt(res.rows?.[0]?.c ?? '0') || 0
      const wantsFeatured = Boolean(customData?.wantsFeatured)
      parsedAmount = calculateProviderSubscriptionPrice({ accommodationsCount, wantsFeatured })
    }

    // Resolve provider id from session to prevent client tampering
    const providerRow = await query`
      SELECT id, contact_email, contact_person FROM providers WHERE user_id = ${session.user.id} LIMIT 1
    `
    const providerId: string | null = providerRow.rows?.[0]?.id ?? null

    if (!providerId) {
      return NextResponse.json({ error: "Provider account not found" }, { status: 403 })
    }

    // Create signed payload (server-generated m_payment_id)
    const serverCustomData = {
      ...customData,
      providerId,
      paymentId: `vn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    }

    const effectiveEmail = providerRow.rows?.[0]?.contact_email || session.user.email
    const effectiveName = providerRow.rows?.[0]?.contact_person || session.user.name || 'Provider'

    const paymentData = createPayFastPayment(
      parsedAmount,
      effectiveEmail,
      effectiveName,
      itemName,
      serverCustomData
    )

    // Record a pending transaction for idempotency and amount verification
    try {
      await query`
        INSERT INTO payment_transactions (provider_id, amount, currency, m_payment_id, status, payment_date, gateway_response)
        VALUES (${providerId}, ${parsedAmount}, 'ZAR', ${paymentData.m_payment_id}, 'pending', ${new Date().toISOString()}, ${JSON.stringify({ initiated_at: new Date().toISOString() })}::jsonb)
        ON CONFLICT (m_payment_id) DO NOTHING
      `
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


