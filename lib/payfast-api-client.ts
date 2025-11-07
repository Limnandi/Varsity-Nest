/**
 * PayFast API Client
 * 
 * Comprehensive client for interacting with PayFast's REST API
 * Implements subscription management, refunds, transaction queries, and status checks
 * 
 * Documentation: https://developers.payfast.co.za/documentation
 * 
 * This client follows PayFast's API requirements:
 * - All requests require merchant-id, version, timestamp, and signature headers
 * - Signature is MD5 hash of alphabetized variables + passphrase
 * - Responses are JSON-encoded with standard HTTP status codes
 */

import crypto from "crypto"
import { env } from "@/lib/env"
import { captureException, captureMessage } from "@/lib/logging/config"

/**
 * PayFast API base URLs
 */
const PAYFAST_API_BASE = {
  production: "https://api.payfast.co.za",
  sandbox: "https://sandbox.payfast.co.za",
}

/**
 * Get the appropriate PayFast API base URL based on environment
 */
function getPayFastBaseUrl(): string {
  return env.NODE_ENV === "production" 
    ? PAYFAST_API_BASE.production 
    : PAYFAST_API_BASE.sandbox
}

/**
 * Generate ISO-8601 formatted timestamp with timezone
 * Format: YYYY-MM-DDTHH:MM:SS+HHMM
 * Default timezone: GMT+2 (SAST)
 */
function generateTimestamp(): string {
  const now = new Date()
  const offset = -now.getTimezoneOffset() // Minutes offset from UTC
  const hours = Math.floor(Math.abs(offset) / 60)
  const minutes = Math.abs(offset) % 60
  const sign = offset >= 0 ? "+" : "-"
  const timezone = `${sign}${String(hours).padStart(2, "0")}${String(minutes).padStart(2, "0")}`
  
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours24 = String(now.getHours()).padStart(2, "0")
  const mins = String(now.getMinutes()).padStart(2, "0")
  const secs = String(now.getSeconds()).padStart(2, "0")
  
  return `${year}-${month}-${day}T${hours24}:${mins}:${secs}${timezone}`
}

/**
 * Generate PayFast API signature
 * 
 * According to PayFast documentation:
 * 1. Sort all submitted variables (header, body, query string parameters, and passphrase) in alphabetical order
 * 2. Create a string by concatenating all non-empty, sorted variables, using & as separator
 * 3. Each value should be URL-encoded
 * 4. Ensure there is no trailing &
 * 5. MD5 hash the resulting string
 * 
 * @param data - Object containing all variables to include in signature
 * @returns MD5 hash signature in lowercase
 */
function generateAPISignature(data: Record<string, string | number | boolean | undefined>): string {
  // Filter out undefined and empty values, exclude signature itself
  const filtered: Record<string, string> = {}
  for (const [key, value] of Object.entries(data)) {
    if (key !== "signature" && value !== undefined && value !== "" && value !== null) {
      filtered[key] = String(value)
    }
  }

  // Add passphrase
  filtered.passphrase = env.PAYFAST_PASSPHRASE

  // Sort keys alphabetically
  const sortedKeys = Object.keys(filtered).sort()

  // Build query string with URL-encoded values
  const paramString = sortedKeys
    .map((key) => `${key}=${encodeURIComponent(filtered[key])}`)
    .join("&")

  // Generate MD5 hash
  return crypto.createHash("md5").update(paramString).digest("hex").toLowerCase()
}

/**
 * Build PayFast API headers
 * 
 * @param body - Request body data (optional)
 * @returns Headers object with merchant-id, version, timestamp, and signature
 */
function buildAPIHeaders(body?: Record<string, any>): Record<string, string> {
  const timestamp = generateTimestamp()
  const headers: Record<string, string> = {
    "merchant-id": env.PAYFAST_MERCHANT_ID,
    version: "v1",
    timestamp,
  }

  // Include body data in signature if provided
  const signatureData: Record<string, any> = { ...headers }
  if (body) {
    Object.assign(signatureData, body)
  }

  headers.signature = generateAPISignature(signatureData)

  return headers
}

/**
 * PayFast API Response structure
 */
interface PayFastAPIResponse<T = any> {
  code: number
  status: "success" | "failed"
  data?: T
  message?: string
}

/**
 * Make a request to PayFast API
 */
async function payFastRequest<T = any>(
  method: "GET" | "POST" | "PUT",
  endpoint: string,
  body?: Record<string, any>
): Promise<PayFastAPIResponse<T>> {
  try {
    const baseUrl = getPayFastBaseUrl()
    const url = `${baseUrl}${endpoint}`
    const headers = buildAPIHeaders(body)

    const requestOptions: RequestInit = {
      method,
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    }

    if (body && (method === "POST" || method === "PUT")) {
      requestOptions.body = JSON.stringify(body)
    }

    const response = await fetch(url, requestOptions)
    const data = await response.json()

    if (!response.ok) {
      captureMessage("PayFast API request failed", {
        level: "error",
        component: "payfast-api-client",
        endpoint,
        method,
        status: response.status,
        response: data,
      })
    }

    return data
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), {
      component: "payfast-api-client",
      endpoint,
      method,
    })
    throw error
  }
}

/**
 * Subscription object from PayFast
 */
export interface PayFastSubscription {
  token: string
  status: "active" | "paused" | "cancelled"
  cycles: number
  frequency: number // 1=Daily, 2=Weekly, 3=Monthly, 4=Quarterly, 5=Biannual, 6=Annual
  amount: number
  item_name: string
  item_description: string
  billing_date: string
  next_run_date: string
  is_active: boolean
  is_paused: boolean
  is_cancelled: boolean
  custom_str1?: string
  custom_str2?: string
  custom_str3?: string
  custom_str4?: string
  custom_str5?: string
}

/**
 * PayFast API Client Class
 */
export class PayFastAPIClient {
  /**
   * Ping PayFast API to check if it's responding
   * 
   * @returns "Payfast API" (production) or "v1" (sandbox)
   */
  static async ping(): Promise<string> {
    try {
      const baseUrl = getPayFastBaseUrl()
      const response = await fetch(`${baseUrl}/ping`)
      return await response.text()
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        component: "payfast-api-client",
        action: "ping",
      })
      throw error
    }
  }

  /**
   * Get subscription details by token
   * 
   * @param token - PayFast subscription token
   * @returns Subscription object
   */
  static async getSubscription(token: string): Promise<PayFastSubscription> {
    const response = await payFastRequest<PayFastSubscription>(
      "GET",
      `/subscriptions/token/${token}`
    )

    if (response.code !== 200 || response.status !== "success") {
      throw new Error(`Failed to get subscription: ${response.message || "Unknown error"}`)
    }

    return response.data!
  }

  /**
   * Pause a subscription
   * 
   * @param token - PayFast subscription token
   * @param cycles - Number of cycles to pause for (default: 0 = indefinite)
   * @returns Updated subscription object
   */
  static async pauseSubscription(token: string, cycles: number = 0): Promise<PayFastSubscription> {
    const response = await payFastRequest<PayFastSubscription>(
      "PUT",
      `/subscriptions/token/${token}/pause`,
      cycles > 0 ? { cycles } : undefined
    )

    if (response.code !== 200 || response.status !== "success") {
      throw new Error(`Failed to pause subscription: ${response.message || "Unknown error"}`)
    }

    return response.data!
  }

  /**
   * Unpause a subscription
   * 
   * @param token - PayFast subscription token
   * @returns Updated subscription object
   */
  static async unpauseSubscription(token: string): Promise<PayFastSubscription> {
    const response = await payFastRequest<PayFastSubscription>(
      "PUT",
      `/subscriptions/token/${token}/unpause`
    )

    if (response.code !== 200 || response.status !== "success") {
      throw new Error(`Failed to unpause subscription: ${response.message || "Unknown error"}`)
    }

    return response.data!
  }

  /**
   * Cancel a subscription
   * 
   * @param token - PayFast subscription token
   * @returns Updated subscription object
   */
  static async cancelSubscription(token: string): Promise<PayFastSubscription> {
    const response = await payFastRequest<PayFastSubscription>(
      "PUT",
      `/subscriptions/token/${token}/cancel`
    )

    if (response.code !== 200 || response.status !== "success") {
      throw new Error(`Failed to cancel subscription: ${response.message || "Unknown error"}`)
    }

    return response.data!
  }

  /**
   * Update a subscription
   * 
   * @param token - PayFast subscription token
   * @param updates - Subscription update parameters
   * @returns Updated subscription object
   */
  static async updateSubscription(
    token: string,
    updates: {
      cycles?: number
      frequency?: number // 1=Daily, 2=Weekly, 3=Monthly, 4=Quarterly, 5=Biannual, 6=Annual
      end_date?: string // YYYY-MM-DD
      amount?: number // Amount in cents (ZAR)
    }
  ): Promise<PayFastSubscription> {
    const response = await payFastRequest<PayFastSubscription>(
      "PUT",
      `/subscriptions/token/${token}/update`,
      updates
    )

    if (response.code !== 200 || response.status !== "success") {
      throw new Error(`Failed to update subscription: ${response.message || "Unknown error"}`)
    }

    return response.data!
  }

  /**
   * Charge a tokenized payment (one-time charge against stored card)
   * 
   * @param token - Credit card token
   * @param amount - Amount in cents (ZAR)
   * @param itemName - Name of the item
   * @param itemDescription - Description of the item (optional)
   * @param customData - Custom data fields (optional)
   * @returns Payment response with pf_payment_id
   */
  static async chargeTokenizedPayment(
    token: string,
    amount: number,
    itemName: string,
    itemDescription?: string,
    customData?: {
      custom_str1?: string
      custom_str2?: string
      custom_str3?: string
      custom_str4?: string
      custom_str5?: string
    }
  ): Promise<{ pf_payment_id: string; amount: number; message: string }> {
    const body: Record<string, any> = {
      amount,
      item_name: itemName,
    }

    if (itemDescription) {
      body.item_description = itemDescription
    }

    if (customData) {
      Object.assign(body, customData)
    }

    const response = await payFastRequest<{ pf_payment_id: string; amount: number; message: string }>(
      "POST",
      `/subscriptions/token/${token}/charge`,
      body
    )

    if (response.code !== 200 || response.status !== "success") {
      throw new Error(`Failed to charge tokenized payment: ${response.message || "Unknown error"}`)
    }

    return response.data!
  }

  /**
   * Query a credit card transaction
   * 
   * @param id - PayFast Payment ID (pf_payment_id) or subscription token
   * @returns Transaction status information
   */
  static async queryTransaction(id: string): Promise<{
    cc_status: string
    cc_message: string
    [key: string]: any
  }> {
    const response = await payFastRequest(
      "GET",
      `/process/query/${id}`
    )

    if (response.code !== 200 || response.status !== "success") {
      throw new Error(`Failed to query transaction: ${response.message || "Unknown error"}`)
    }

    return response.data!
  }

  /**
   * Get transaction history
   * 
   * @param from - Start date (YYYY-MM-DD)
   * @param to - End date (YYYY-MM-DD)
   * @param limit - Maximum number of records (default: 1000)
   * @param offset - Number of records to skip (default: 0)
   * @returns CSV string of transaction history
   */
  static async getTransactionHistory(
    from?: string,
    to?: string,
    limit: number = 1000,
    offset: number = 0
  ): Promise<string> {
    const queryParams: string[] = []
    if (from) queryParams.push(`from=${from}`)
    if (to) queryParams.push(`to=${to}`)
    if (limit) queryParams.push(`limit=${limit}`)
    if (offset) queryParams.push(`offset=${offset}`)

    const endpoint = `/transactions/history${queryParams.length > 0 ? `?${queryParams.join("&")}` : ""}`
    const response = await payFastRequest<{ response: string }>("GET", endpoint)

    if (response.code !== 200 || response.status !== "success") {
      throw new Error(`Failed to get transaction history: ${response.message || "Unknown error"}`)
    }

    return response.data!.response
  }

  /**
   * Get transaction history for a specific period
   * 
   * @param timeframe - "daily", "weekly", or "monthly"
   * @param date - Date in format YYYY-MM-DD (daily/weekly) or YYYY-MM (monthly)
   * @param limit - Maximum number of records (default: 1000)
   * @param offset - Number of records to skip (default: 0)
   * @returns CSV string of transaction history
   */
  static async getTransactionHistoryByPeriod(
    timeframe: "daily" | "weekly" | "monthly",
    date: string,
    limit: number = 1000,
    offset: number = 0
  ): Promise<string> {
    const queryParams: string[] = []
    queryParams.push(`date=${date}`)
    if (limit) queryParams.push(`limit=${limit}`)
    if (offset) queryParams.push(`offset=${offset}`)

    const endpoint = `/transactions/history/${timeframe}?${queryParams.join("&")}`
    const response = await payFastRequest<{ response: string }>("GET", endpoint)

    if (response.code !== 200 || response.status !== "success") {
      throw new Error(`Failed to get transaction history: ${response.message || "Unknown error"}`)
    }

    return response.data!.response
  }

  /**
   * Create a refund
   * 
   * @param paymentToken - PayFast payment token from original transaction
   * @param amount - Amount to refund (in cents, ZAR)
   * @param reason - Reason for refund (optional)
   * @param metadata - Custom metadata (optional)
   * @returns Refund token
   */
  static async createRefund(
    paymentToken: string,
    amount: number,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<{ token: string; amount: number; status: string }> {
    const body: Record<string, any> = {
      payment_token: paymentToken,
      amount,
    }

    if (reason) {
      body.reason = reason
    }

    if (metadata) {
      body.metadata = metadata
    }

    const response = await payFastRequest<{ token: string; amount: number; status: string }>(
      "POST",
      "/refunds",
      body
    )

    if (response.code !== 200 || response.status !== "success") {
      throw new Error(`Failed to create refund: ${response.message || "Unknown error"}`)
    }

    return response.data!
  }

  /**
   * Get refund details
   * 
   * @param token - Refund token
   * @returns Refund details
   */
  static async getRefund(token: string): Promise<{
    token: string
    payment_token: string
    amount: number
    status: string
    reason?: string
    metadata?: Record<string, any>
  }> {
    const response = await payFastRequest("GET", `/refunds/${token}`)

    if (response.code !== 200 || response.status !== "success") {
      throw new Error(`Failed to get refund: ${response.message || "Unknown error"}`)
    }

    return response.data!
  }

  /**
   * Get PayFast system status summary
   * 
   * @returns Status summary with overall status, incidents, and maintenance
   */
  static async getStatusSummary(): Promise<{
    overall_status: "operational" | "degraded" | "maintenance"
    active_incidents: number
    scheduled_maintenance: number
  }> {
    const response = await payFastRequest("GET", "/status/summary")

    if (response.code !== 200 || response.status !== "success") {
      throw new Error(`Failed to get status summary: ${response.message || "Unknown error"}`)
    }

    return response.data!
  }

  /**
   * Get PayFast system status
   * 
   * @returns Detailed system status
   */
  static async getStatus(): Promise<{
    status: "operational" | "degraded" | "maintenance"
    [key: string]: any
  }> {
    const response = await payFastRequest("GET", "/status")

    if (response.code !== 200 || response.status !== "success") {
      throw new Error(`Failed to get status: ${response.message || "Unknown error"}`)
    }

    return response.data!
  }

  /**
   * Get PayFast component statuses
   * 
   * @returns Component statuses (payment gateway, ITN service, etc.)
   */
  static async getComponentStatuses(): Promise<{
    [component: string]: "operational" | "degraded" | "maintenance"
  }> {
    const response = await payFastRequest("GET", "/status/components")

    if (response.code !== 200 || response.status !== "success") {
      throw new Error(`Failed to get component statuses: ${response.message || "Unknown error"}`)
    }

    return response.data!
  }
}

