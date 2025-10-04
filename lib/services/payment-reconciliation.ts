import { PaymentReconciliation, PaymentTransaction } from "@/lib/schemas/payment"
import { secureDb } from "@/lib/database-secure"
import { eq, and, gte, lte, desc } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { captureException } from '@/lib/logging/config'
import { PaymentAuditService } from "./payment-audit"

export class PaymentReconciliationService {
  /**
   * Reconcile payment with PayFast records
   */
  static async reconcilePayment(
    transactionId: string,
    payfastData: any
  ): Promise<PaymentReconciliation> {
    try {
      // Get the transaction from our database
      const [transaction] = await secureDb.db
        .select()
        .from(schema.paymentTransactions)
        .where(eq(schema.paymentTransactions.id, transactionId))
        .limit(1)

      if (!transaction) {
        throw new Error(`Transaction ${transactionId} not found`)
      }

      const expectedAmount = Number(transaction.amount)
      const actualAmount = Number(payfastData.amount_gross)
      const status = this.determineReconciliationStatus(
        expectedAmount,
        actualAmount,
        payfastData.payment_status
      )

      const reconciliation: Omit<PaymentReconciliation, 'reconciliationDate'> = {
        transactionId,
        expectedAmount,
        actualAmount,
        status,
        notes: this.generateReconciliationNotes(expectedAmount, actualAmount, payfastData)
      }

      // Log reconciliation event
      await PaymentAuditService.logAuditEvent(transactionId, 'reconciled', {
        amount: actualAmount,
        providerId: transaction.providerId,
        reason: `Reconciled with PayFast. Status: ${status}`,
        metadata: { payfastData }
      })

      return {
        ...reconciliation,
        reconciliationDate: new Date()
      }
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), { component: 'payment-reconciliation', transactionId })
      throw error
    }
  }

  /**
   * Determine reconciliation status
   */
  private static determineReconciliationStatus(
    expectedAmount: number,
    actualAmount: number,
    paymentStatus: string
  ): PaymentReconciliation['status'] {
    const tolerance = 0.01 // 1 cent tolerance

    if (paymentStatus !== 'COMPLETE') {
      return 'mismatch'
    }

    if (Math.abs(expectedAmount - actualAmount) <= tolerance) {
      return 'matched'
    }

    return 'mismatch'
  }

  /**
   * Generate reconciliation notes
   */
  private static generateReconciliationNotes(
    expectedAmount: number,
    actualAmount: number,
    _payfastData: any
  ): string {
    const amountDiff = Math.abs(expectedAmount - actualAmount)
    
    if (amountDiff <= 0.01) {
      return 'Amounts match within tolerance'
    }

    return `Amount discrepancy: expected R${expectedAmount.toFixed(2)}, received R${actualAmount.toFixed(2)} (diff: R${amountDiff.toFixed(2)})`
  }

  /**
   * Detect duplicate payments
   */
  static async detectDuplicatePayments(providerId: string, amount: number, timeWindow: number = 300000): Promise<{
    isDuplicate: boolean
    duplicateTransactions: PaymentTransaction[]
  }> {
    try {
      const startTime = new Date(Date.now() - timeWindow)
      
      const recentTransactions = await secureDb.db
        .select()
        .from(schema.paymentTransactions)
        .where(
          and(
            eq(schema.paymentTransactions.providerId, providerId),
            gte(schema.paymentTransactions.createdAt, startTime)
          )
        )
        .orderBy(desc(schema.paymentTransactions.createdAt))

      const duplicateTransactions = recentTransactions.filter((t: typeof schema.paymentTransactions.$inferSelect) => 
        Math.abs(Number(t.amount) - amount) <= 0.01 && 
        t.status === 'completed'
      )

      return {
        isDuplicate: duplicateTransactions.length > 0,
        duplicateTransactions
      }
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), { component: 'payment-reconciliation', providerId, amount })
      throw error
    }
  }

  /**
   * Reconcile all pending transactions
   */
  static async reconcileAllPendingTransactions(): Promise<{
    reconciled: number
    mismatched: number
    errors: number
  }> {
    try {
      const pendingTransactions = await secureDb.db
        .select()
        .from(schema.paymentTransactions)
        .where(eq(schema.paymentTransactions.status, 'pending'))
        .orderBy(desc(schema.paymentTransactions.createdAt))

      let reconciled = 0
      let mismatched = 0
      let errors = 0

      for (const transaction of pendingTransactions) {
        try {
          // Check if transaction is older than 24 hours and still pending
          const age = Date.now() - transaction.createdAt.getTime()
          if (age > 24 * 60 * 60 * 1000) {
            // Mark as failed if too old
            await secureDb.db
              .update(schema.paymentTransactions)
              .set({ status: 'failed' })
              .where(eq(schema.paymentTransactions.id, transaction.id))

            await PaymentAuditService.logAuditEvent(transaction.id, 'failed', {
              oldStatus: 'pending',
              newStatus: 'failed',
              amount: Number(transaction.amount),
              providerId: transaction.providerId,
              reason: 'Transaction timeout - no response from PayFast within 24 hours'
            })

            mismatched++
          }
        } catch (error) {
          captureException(error instanceof Error ? error : new Error(String(error)), { component: 'payment-reconciliation', transactionId: transaction.id })
          errors++
        }
      }

      return { reconciled, mismatched, errors }
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), { component: 'payment-reconciliation' })
      throw error
    }
  }

  /**
   * Get reconciliation report
   */
  static async getReconciliationReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalTransactions: number
    matchedTransactions: number
    mismatchedTransactions: number
    totalExpectedAmount: number
    totalActualAmount: number
    discrepancies: Array<{
      transactionId: string
      expectedAmount: number
      actualAmount: number
      difference: number
      status: string
    }>
  }> {
    try {
      const transactions = await secureDb.db
        .select()
        .from(schema.paymentTransactions)
        .where(
          and(
            gte(schema.paymentTransactions.createdAt, startDate),
            lte(schema.paymentTransactions.createdAt, endDate)
          )
        )
        .orderBy(desc(schema.paymentTransactions.createdAt))

      const completedTransactions = transactions.filter((t: typeof schema.paymentTransactions.$inferSelect) => t.status === 'completed')
      const totalExpectedAmount = completedTransactions.reduce((sum: number, t: typeof schema.paymentTransactions.$inferSelect) => sum + Number(t.amount), 0)
      
      // For this report, we'll assume all completed transactions are matched
      // In a real implementation, you'd compare with PayFast records
      const matchedTransactions = completedTransactions.length
      const mismatchedTransactions = transactions.length - matchedTransactions

      const discrepancies = transactions
        .filter((t: typeof schema.paymentTransactions.$inferSelect) => t.status === 'failed' || t.status === 'cancelled')
        .map((t: typeof schema.paymentTransactions.$inferSelect) => ({
          transactionId: t.id,
          expectedAmount: Number(t.amount),
          actualAmount: 0,
          difference: -Number(t.amount),
          status: t.status
        }))

      return {
        totalTransactions: transactions.length,
        matchedTransactions,
        mismatchedTransactions,
        totalExpectedAmount,
        totalActualAmount: totalExpectedAmount, // Assuming all completed are matched
        discrepancies
      }
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), { component: 'payment-reconciliation', startDate, endDate })
      throw error
    }
  }
}
