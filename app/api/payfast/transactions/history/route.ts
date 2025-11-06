/**
 * PayFast Transaction History API Endpoint
 * 
 * Retrieves transaction history from PayFast for providers and agents
 * Documentation: https://developers.payfast.co.za/documentation/#transaction-history
 */

import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { PayFastAPIClient } from "@/lib/payfast-api-client"
import { captureException } from "@/lib/logging/config"

/**
 * Parse CSV transaction history into structured JSON
 */
function parseTransactionHistory(csv: string): any[] {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const transactions = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const transaction: any = {}
    
    headers.forEach((header, index) => {
      transaction[header] = values[index] || ''
    })
    
    transactions.push(transaction)
  }

  return transactions
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    let user = await getCurrentUserFromRequest(request)
    if (!user) {
      user = await getCurrentUserFromStackAuth()
    }
    
    if (!user || (user.role !== 'provider' && user.role !== 'agent')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!user.isActive) {
      return NextResponse.json({ error: 'Account deactivated' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from") || undefined // YYYY-MM-DD
    const to = searchParams.get("to") || undefined // YYYY-MM-DD
    const timeframe = searchParams.get("timeframe") as "daily" | "weekly" | "monthly" | undefined
    const date = searchParams.get("date") || undefined
    const limit = parseInt(searchParams.get("limit") || "1000")
    const offset = parseInt(searchParams.get("offset") || "0")

    let csvHistory: string

    if (timeframe && date) {
      // Get transaction history for a specific period
      csvHistory = await PayFastAPIClient.getTransactionHistoryByPeriod(timeframe, date, limit, offset)
    } else {
      // Get transaction history for a date range
      csvHistory = await PayFastAPIClient.getTransactionHistory(from, to, limit, offset)
    }

    // Parse CSV into structured JSON
    const transactions = parseTransactionHistory(csvHistory)

    // Filter transactions by custom_str1 (providerId or agentId)
    // Note: PayFast returns all transactions, so we filter server-side by custom_str1
    const { secureDb } = await import('@/lib/database-secure')
    const { eq } = await import('drizzle-orm')
    const schema = await import('@/lib/schema')
    
    let entityId: string | undefined
    if (user.role === 'provider') {
      const [provider] = await secureDb.db
        .select({ id: schema.providers.id })
        .from(schema.providers)
        .where(eq(schema.providers.userId, user.id))
        .limit(1)
      entityId = provider?.id
    } else {
      const [agent] = await secureDb.db
        .select({ id: schema.agents.id })
        .from(schema.agents)
        .where(eq(schema.agents.userId, user.id))
        .limit(1)
      entityId = agent?.id
    }

    // Filter transactions by entityId (custom_str1 field in PayFast response)
    const filteredTransactions = entityId
      ? transactions.filter(t => t['custom str1'] === entityId || t['custom_str1'] === entityId)
      : transactions

    return NextResponse.json({
      success: true,
      transactions: filteredTransactions,
      count: filteredTransactions.length,
      limit,
      offset
    })
  } catch (error) {
    captureException(
      error instanceof Error ? error : new Error(String(error)),
      { component: 'payfast-transaction-history' }
    )
    
    return NextResponse.json(
      { error: 'Failed to get transaction history', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

