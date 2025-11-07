import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/stackauth"
import { secureDb } from "@/lib/database-secure"
import * as schema from "@/lib/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get provider or agent ID from database based on user ID
    const userId = session.user.id
    
    // Find provider or agent record for this user
    const [provider] = await secureDb.db
      .select({ id: schema.providers.id })
      .from(schema.providers)
      .where(eq(schema.providers.userId, userId))
      .limit(1)
    
    const [agent] = await secureDb.db
      .select({ id: schema.agents.id })
      .from(schema.agents)
      .where(eq(schema.agents.userId, userId))
      .limit(1)

    const providerId = provider?.id
    const agentId = agent?.id

    if (!providerId && !agentId) {
      return NextResponse.json({ error: "No provider or agent ID found" }, { status: 400 })
    }

    // Get the most recent pending or completed transaction
    const conditions = providerId 
      ? eq(schema.paymentTransactions.providerId, providerId)
      : eq(schema.paymentTransactions.agentId, agentId)

    const [transaction] = await secureDb.db
      .select({
        id: schema.paymentTransactions.id,
        amount: schema.paymentTransactions.amount,
        currency: schema.paymentTransactions.currency,
        mPaymentId: schema.paymentTransactions.mPaymentId,
        pfPaymentId: schema.paymentTransactions.pfPaymentId,
        status: schema.paymentTransactions.status,
        paymentDate: schema.paymentTransactions.paymentDate,
        gatewayResponse: schema.paymentTransactions.gatewayResponse,
        createdAt: schema.paymentTransactions.createdAt,
      })
      .from(schema.paymentTransactions)
      .where(conditions)
      .orderBy(desc(schema.paymentTransactions.createdAt))
      .limit(1)

    if (!transaction) {
      return NextResponse.json({ error: "No transaction found" }, { status: 404 })
    }

    // Extract item name from gateway response if available
    const gatewayResponse = transaction.gatewayResponse as any
    const itemName = gatewayResponse?.paymentData?.item_name || "Subscription Payment"

    return NextResponse.json({
      paymentId: transaction.pfPaymentId || transaction.mPaymentId,
      status: transaction.status,
      amount: parseFloat(transaction.amount),
      currency: transaction.currency,
      itemName,
      paymentDate: transaction.paymentDate,
      createdAt: transaction.createdAt,
    })
  } catch (error) {
    console.error("[LATEST TRANSACTION] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch transaction", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

