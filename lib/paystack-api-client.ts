/**
 * Paystack API Client
 * 
 * Comprehensive client for interacting with Paystack's REST API
 * Uses the official @paystack/paystack-sdk package
 * 
 * Documentation: https://paystack.com/docs/api
 */

import Paystack from "@paystack/paystack-sdk"
import { env } from "@/lib/env"
import { captureException } from "@/lib/logging/config"
import { convertToKobo } from "@/lib/paystack"

/**
 * Initialize Paystack client
 */
const paystack = new Paystack(env.PAYSTACK_SECRET_KEY, {
  hostname: env.NODE_ENV === "production" ? "api.paystack.co" : "api.paystack.co" // Paystack uses same API for test/live, controlled by secret key
})

/**
 * Paystack API Client Class
 */
export class PaystackAPIClient {
  /**
   * Initialize a transaction
   * 
   * @param email - Customer email
   * @param amount - Amount in ZAR (will be converted to kobo)
   * @param reference - Unique transaction reference
   * @param callbackUrl - Callback URL after payment
   * @param metadata - Additional metadata
   * @param planCode - Optional plan code for subscriptions
   * @returns Transaction initialization response
   */
  static async initializeTransaction(
    email: string,
    amount: number,
    reference: string,
    callbackUrl?: string,
    metadata?: Record<string, any>,
    planCode?: string
  ) {
    try {
      const response = await paystack.transaction.initialize({
        email,
        amount: convertToKobo(amount),
        currency: "ZAR",
        reference,
        callback_url: callbackUrl,
        metadata,
        ...(planCode && { plan: planCode })
      })

      if (!response.status) {
        throw new Error(response.message || "Failed to initialize transaction")
      }

      return response.data
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        component: "paystack-api-client",
        action: "initializeTransaction",
        email,
        amount
      })
      throw error
    }
  }

  /**
   * Verify a transaction
   * 
   * @param reference - Transaction reference
   * @returns Transaction verification response
   */
  static async verifyTransaction(reference: string) {
    try {
      const response = await paystack.transaction.verify(reference)

      if (!response.status) {
        throw new Error(response.message || "Failed to verify transaction")
      }

      return response.data
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        component: "paystack-api-client",
        action: "verifyTransaction",
        reference
      })
      throw error
    }
  }

  /**
   * Create a plan
   * 
   * @param name - Plan name
   * @param amount - Amount in ZAR (will be converted to kobo)
   * @param interval - Billing interval
   * @param description - Plan description
   * @param invoiceLimit - Number of invoices (0 = unlimited)
   * @returns Plan creation response
   */
  static async createPlan(
    name: string,
    amount: number,
    interval: "hourly" | "daily" | "weekly" | "monthly" | "quarterly" | "biannually" | "annually" = "monthly",
    description?: string,
    invoiceLimit: number = 0
  ) {
    try {
      const response = await paystack.plan.create({
        name,
        amount: convertToKobo(amount),
        interval,
        currency: "ZAR",
        description: description || `Varsity Nest - ${name}`,
        invoice_limit: invoiceLimit,
        send_invoices: true,
        send_sms: false
      })

      if (!response.status) {
        throw new Error(response.message || "Failed to create plan")
      }

      return response.data
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        component: "paystack-api-client",
        action: "createPlan",
        name,
        amount
      })
      throw error
    }
  }

  /**
   * Update a plan
   * 
   * @param planCode - Plan code or ID
   * @param updates - Plan updates
   * @returns Updated plan response
   */
  static async updatePlan(
    planCode: string,
    updates: {
      name?: string
      amount?: number // Amount in ZAR
      interval?: "hourly" | "daily" | "weekly" | "monthly" | "quarterly" | "biannually" | "annually"
      description?: string
      invoice_limit?: number
      send_invoices?: boolean
      send_sms?: boolean
      update_existing_subscriptions?: boolean
    }
  ) {
    try {
      const updateData: any = {}
      
      if (updates.name) updateData.name = updates.name
      if (updates.amount !== undefined) updateData.amount = convertToKobo(updates.amount)
      if (updates.interval) updateData.interval = updates.interval
      if (updates.description) updateData.description = updates.description
      if (updates.invoice_limit !== undefined) updateData.invoice_limit = updates.invoice_limit
      if (updates.send_invoices !== undefined) updateData.send_invoices = updates.send_invoices
      if (updates.send_sms !== undefined) updateData.send_sms = updates.send_sms
      if (updates.update_existing_subscriptions !== undefined) {
        updateData.update_existing_subscriptions = updates.update_existing_subscriptions
      }

      const response = await paystack.plan.update(planCode, updateData)

      if (!response.status) {
        throw new Error(response.message || "Failed to update plan")
      }

      return response.data
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        component: "paystack-api-client",
        action: "updatePlan",
        planCode
      })
      throw error
    }
  }

  /**
   * Get plan details
   * 
   * @param planCode - Plan code or ID
   * @returns Plan details
   */
  static async getPlan(planCode: string) {
    try {
      const response = await paystack.plan.fetch(planCode)

      if (!response.status) {
        throw new Error(response.message || "Failed to fetch plan")
      }

      return response.data
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        component: "paystack-api-client",
        action: "getPlan",
        planCode
      })
      throw error
    }
  }

  /**
   * Create a subscription
   * 
   * @param customer - Customer email or customer code
   * @param planCode - Plan code
   * @param authorizationCode - Optional authorization code if customer has multiple
   * @param startDate - Optional start date (ISO 8601) for first debit
   * @returns Subscription creation response
   */
  static async createSubscription(
    customer: string,
    planCode: string,
    authorizationCode?: string,
    startDate?: string
  ) {
    try {
      const subscriptionData: any = {
        customer,
        plan: planCode
      }

      if (authorizationCode) {
        subscriptionData.authorization = authorizationCode
      }

      if (startDate) {
        subscriptionData.start_date = startDate
      }

      const response = await paystack.subscription.create(subscriptionData)

      if (!response.status) {
        throw new Error(response.message || "Failed to create subscription")
      }

      return response.data
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        component: "paystack-api-client",
        action: "createSubscription",
        customer,
        planCode
      })
      throw error
    }
  }

  /**
   * Get subscription details
   * 
   * @param subscriptionCode - Subscription code or ID
   * @returns Subscription details
   */
  static async getSubscription(subscriptionCode: string) {
    try {
      const response = await paystack.subscription.fetch(subscriptionCode)

      if (!response.status) {
        throw new Error(response.message || "Failed to fetch subscription")
      }

      return response.data
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        component: "paystack-api-client",
        action: "getSubscription",
        subscriptionCode
      })
      throw error
    }
  }

  /**
   * List subscriptions
   * 
   * @param options - Query options
   * @returns List of subscriptions
   */
  static async listSubscriptions(options?: {
    perPage?: number
    page?: number
    customer?: number
    plan?: number
  }) {
    try {
      const response = await paystack.subscription.list(options)

      if (!response.status) {
        throw new Error(response.message || "Failed to list subscriptions")
      }

      return response.data
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        component: "paystack-api-client",
        action: "listSubscriptions"
      })
      throw error
    }
  }

  /**
   * Enable a subscription
   * 
   * @param subscriptionCode - Subscription code
   * @param emailToken - Email token
   * @returns Enable response
   */
  static async enableSubscription(subscriptionCode: string, emailToken: string) {
    try {
      const response = await paystack.subscription.enable({
        code: subscriptionCode,
        token: emailToken
      })

      if (!response.status) {
        throw new Error(response.message || "Failed to enable subscription")
      }

      return response.data
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        component: "paystack-api-client",
        action: "enableSubscription",
        subscriptionCode
      })
      throw error
    }
  }

  /**
   * Disable a subscription
   * 
   * @param subscriptionCode - Subscription code
   * @param emailToken - Email token
   * @returns Disable response
   */
  static async disableSubscription(subscriptionCode: string, emailToken: string) {
    try {
      const response = await paystack.subscription.disable({
        code: subscriptionCode,
        token: emailToken
      })

      if (!response.status) {
        throw new Error(response.message || "Failed to disable subscription")
      }

      return response.data
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        component: "paystack-api-client",
        action: "disableSubscription",
        subscriptionCode
      })
      throw error
    }
  }

  /**
   * Generate subscription management link
   * 
   * @param subscriptionCode - Subscription code
   * @returns Management link
   */
  static async generateSubscriptionManagementLink(subscriptionCode: string) {
    try {
      // Paystack SDK might not have this method, using direct API call
      const response = await fetch(`https://api.paystack.co/subscription/${subscriptionCode}/manage/link`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      })

      const data = await response.json()

      if (!data.status) {
        throw new Error(data.message || "Failed to generate management link")
      }

      return data.data
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        component: "paystack-api-client",
        action: "generateSubscriptionManagementLink",
        subscriptionCode
      })
      throw error
    }
  }

  /**
   * Send subscription management email
   * 
   * @param subscriptionCode - Subscription code
   * @returns Email send response
   */
  static async sendSubscriptionManagementEmail(subscriptionCode: string) {
    try {
      // Note: Paystack SDK might not have this method, using direct API call
      const response = await fetch(`https://api.paystack.co/subscription/${subscriptionCode}/manage/email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      })

      const data = await response.json()

      if (!data.status) {
        throw new Error(data.message || "Failed to send management email")
      }

      return data
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        component: "paystack-api-client",
        action: "sendSubscriptionManagementEmail",
        subscriptionCode
      })
      throw error
    }
  }

  /**
   * Create a refund for a transaction
   * 
   * @param transaction - Transaction reference or ID
   * @param amount - Optional amount to refund in ZAR (will be converted to kobo). If not provided, full amount is refunded
   * @param currency - Optional currency (defaults to ZAR)
   * @param customerNote - Optional note for customer
   * @param merchantNote - Optional note for merchant
   * @returns Refund creation response
   */
  static async createRefund(
    transaction: string,
    amount?: number,
    currency: string = "ZAR",
    customerNote?: string,
    merchantNote?: string
  ) {
    try {
      const refundData: any = {
        transaction
      }

      if (amount !== undefined) {
        refundData.amount = convertToKobo(amount)
      }

      if (currency) {
        refundData.currency = currency
      }

      if (customerNote) {
        refundData.customer_note = customerNote
      }

      if (merchantNote) {
        refundData.merchant_note = merchantNote
      }

      // Paystack SDK might not have refund method, using direct API call
      const response = await fetch("https://api.paystack.co/refund", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(refundData)
      })

      const data = await response.json()

      if (!data.status) {
        throw new Error(data.message || "Failed to create refund")
      }

      return data.data
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        component: "paystack-api-client",
        action: "createRefund",
        transaction,
        amount
      })
      throw error
    }
  }

  /**
   * Retry a refund with customer account details
   * Used when refund status is "needs-attention"
   * 
   * @param refundId - The ID of the previously initiated refund
   * @param refundAccountDetails - Customer's account details for refund
   * @returns Retry refund response
   */
  static async retryRefundWithCustomerDetails(
    refundId: number,
    refundAccountDetails: {
      currency: string
      account_number: string
      bank_id: string
    }
  ) {
    try {
      const response = await fetch(`https://api.paystack.co/refund/retry_with_customer_details/${refundId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          refund_account_details: refundAccountDetails
        })
      })

      const data = await response.json()

      if (!data.status) {
        throw new Error(data.message || "Failed to retry refund")
      }

      return data.data
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        component: "paystack-api-client",
        action: "retryRefundWithCustomerDetails",
        refundId
      })
      throw error
    }
  }
}

