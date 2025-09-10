import { PaymentAuditLog, PaymentTransaction } from "@/lib/schemas/payment"
import { secureDb } from "@/lib/database-secure"
import { eq, desc, and, gte, lte } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { Sentry } from "@/lib/sentry"

export class PaymentAuditService {
  /**
   * Log payment audit event
   */
  static async logAuditEvent(
    transactionId: string,
    action: PaymentAuditLog['action'],
    details: {
      oldStatus?: string
      newStatus?: string
      amount?: number
      providerId?: string
      adminId?: string
      reason?: string
      metadata?: Record<string, any>
    }
  ): Promise<void> {
    try {
      const auditLog: Omit<PaymentAuditLog, 'id' | 'createdAt'> = {
        transactionId,
        action,
        oldStatus: details.oldStatus,
        newStatus: details.newStatus,
        amount: details.amount,
        providerId: details.providerId,
        adminId: details.adminId,
        reason: details.reason,
        metadata: details.metadata,
      }

      await secureDb.db.insert(schema.paymentAuditLogs).values({
        id: crypto.randomUUID(),
        ...auditLog,
        createdAt: new Date(),
      })

      // Also log to Sentry for critical events
      if (['failed', 'cancelled'].includes(action)) {
        Sentry.captureMessage(`Payment ${action}: ${transactionId}`, {
          level: 'warning',
          tags: { component: 'payment-audit', action },
          extra: { transactionId, ...details }
        })
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: 'payment-audit' },
        extra: { action, transactionId, details }
      })
      throw error
    }
  }

  /**
   * Get payment audit trail
   */
  static async getAuditTrail(transactionId: string): Promise<PaymentAuditLog[]> {
    try {
      const logs = await secureDb.db
        .select()
        .from(schema.paymentAuditLogs)
        .where(eq(schema.paymentAuditLogs.transactionId, transactionId))
        .orderBy(desc(schema.paymentAuditLogs.createdAt))

      return logs.map(log => ({
        id: log.id,
        transactionId: log.transactionId,
        action: log.action as PaymentAuditLog['action'],
        oldStatus: log.oldStatus,
        newStatus: log.newStatus,
        amount: log.amount,
        providerId: log.providerId,
        adminId: log.adminId,
        reason: log.reason,
        metadata: log.metadata,
        createdAt: log.createdAt,
      }))
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: 'payment-audit' },
        extra: { transactionId }
      })
      throw error
    }
  }

  /**
   * Get payment audit summary for provider
   */
  static async getProviderAuditSummary(providerId: string, days: number = 30): Promise<{
    totalTransactions: number
    successfulPayments: number
    failedPayments: number
    totalAmount: number
    lastPaymentDate: Date | null
  }> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const transactions = await secureDb.db
        .select()
        .from(schema.paymentTransactions)
        .where(
          and(
            eq(schema.paymentTransactions.providerId, providerId),
            gte(schema.paymentTransactions.createdAt, startDate)
          )
        )
        .orderBy(desc(schema.paymentTransactions.createdAt))

      const summary = {
        totalTransactions: transactions.length,
        successfulPayments: transactions.filter(t => t.status === 'completed').length,
        failedPayments: transactions.filter(t => t.status === 'failed').length,
        totalAmount: transactions
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + Number(t.amount), 0),
        lastPaymentDate: transactions.length > 0 ? transactions[0].createdAt : null,
      }

      return summary
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: 'payment-audit' },
        extra: { providerId, days }
      })
      throw error
    }
  }

  /**
   * Get payment audit summary for admin
   */
  static async getAdminAuditSummary(days: number = 30): Promise<{
    totalTransactions: number
    successfulPayments: number
    failedPayments: number
    pendingPayments: number
    totalRevenue: number
    averageTransactionValue: number
    topProviders: Array<{
      providerId: string
      transactionCount: number
      totalAmount: number
    }>
  }> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const transactions = await secureDb.db
        .select()
        .from(schema.paymentTransactions)
        .where(gte(schema.paymentTransactions.createdAt, startDate))
        .orderBy(desc(schema.paymentTransactions.createdAt))

      const successfulTransactions = transactions.filter(t => t.status === 'completed')
      const totalRevenue = successfulTransactions.reduce((sum, t) => sum + Number(t.amount), 0)

      // Group by provider
      const providerStats = new Map<string, { count: number; amount: number }>()
      successfulTransactions.forEach(t => {
        if (t.providerId) {
          const existing = providerStats.get(t.providerId) || { count: 0, amount: 0 }
          providerStats.set(t.providerId, {
            count: existing.count + 1,
            amount: existing.amount + Number(t.amount)
          })
        }
      })

      const topProviders = Array.from(providerStats.entries())
        .map(([providerId, stats]) => ({
          providerId,
          transactionCount: stats.count,
          totalAmount: stats.amount
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 10)

      return {
        totalTransactions: transactions.length,
        successfulPayments: successfulTransactions.length,
        failedPayments: transactions.filter(t => t.status === 'failed').length,
        pendingPayments: transactions.filter(t => t.status === 'pending').length,
        totalRevenue,
        averageTransactionValue: successfulTransactions.length > 0 
          ? totalRevenue / successfulTransactions.length 
          : 0,
        topProviders,
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: 'payment-audit' },
        extra: { days }
      })
      throw error
    }
  }

  /**
   * Detect suspicious payment patterns
   */
  static async detectSuspiciousActivity(providerId: string): Promise<{
    isSuspicious: boolean
    reasons: string[]
    riskScore: number
  }> {
    try {
      const reasons: string[] = []
      let riskScore = 0

      // Check for rapid successive payments
      const recentTransactions = await secureDb.db
        .select()
        .from(schema.paymentTransactions)
        .where(
          and(
            eq(schema.paymentTransactions.providerId, providerId),
            gte(schema.paymentTransactions.createdAt, new Date(Date.now() - 60 * 60 * 1000)) // Last hour
          )
        )
        .orderBy(desc(schema.paymentTransactions.createdAt))

      if (recentTransactions.length > 5) {
        reasons.push('High frequency of payment attempts')
        riskScore += 30
      }

      // Check for failed payment patterns
      const failedTransactions = recentTransactions.filter(t => t.status === 'failed')
      if (failedTransactions.length > 3) {
        reasons.push('Multiple failed payment attempts')
        riskScore += 25
      }

      // Check for unusual amounts
      const amounts = recentTransactions.map(t => Number(t.amount))
      const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length
      const maxAmount = Math.max(...amounts)
      if (maxAmount > avgAmount * 3) {
        reasons.push('Unusually high payment amount')
        riskScore += 20
      }

      // Check for duplicate payment IDs
      const paymentIds = recentTransactions.map(t => t.mPaymentId)
      const uniqueIds = new Set(paymentIds)
      if (paymentIds.length !== uniqueIds.size) {
        reasons.push('Duplicate payment IDs detected')
        riskScore += 40
      }

      return {
        isSuspicious: riskScore > 50,
        reasons,
        riskScore: Math.min(riskScore, 100)
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: 'payment-audit' },
        extra: { providerId }
      })
      throw error
    }
  }
}
