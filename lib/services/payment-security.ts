import crypto from "crypto"
import { PaymentSecurity } from "@/lib/schemas/payment"
import { captureException, captureMessage } from '@/lib/logging/config'
import { env } from "@/lib/env"

export class PaymentSecurityService {
  /**
   * Validate Paystack webhook signature using HMAC SHA512
   * Paystack signs webhooks with HMAC SHA512 using the secret key
   */
  static verifyPaystackSignature(payload: string, signature: string): boolean {
    try {
      const hash = crypto
        .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
        .update(payload)
        .digest('hex')
      
      return crypto.timingSafeEqual(
        Buffer.from(hash, 'hex'),
        Buffer.from(signature, 'hex')
      )
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), { 
        action: 'paystack-signature-verification', 
        component: 'payment-security' 
      })
      return false
    }
  }

  /**
   * Legacy PayFast IP ranges (kept for reference, not used for Paystack)
   * Paystack uses HMAC signatures instead of IP validation
   */
  private static readonly LEGACY_IP_RANGES = [
    '197.97.102.0/24', // Primary PayFast IP range
    '41.74.179.0/24',
    '41.74.180.0/24', 
    '41.74.181.0/24',
    '41.74.182.0/24',
    '41.74.183.0/24',
    '41.74.184.0/24',
    '41.74.185.0/24',
    '41.74.186.0/24',
    '41.74.187.0/24',
    '41.74.188.0/24',
    '41.74.189.0/24',
    '41.74.190.0/24',
    '41.74.191.0/24',
    '41.74.192.0/24',
    '41.74.193.0/24',
    '41.74.194.0/24',
    '41.74.195.0/24',
    '41.74.196.0/24',
    '41.74.197.0/24',
    '41.74.198.0/24',
    '41.74.199.0/24',
    '41.74.200.0/24',
    '41.74.201.0/24',
    '41.74.202.0/24',
    '41.74.203.0/24',
    '41.74.204.0/24',
    '41.74.205.0/24',
    '41.74.206.0/24',
    '41.74.207.0/24',
    '41.74.208.0/24',
    '41.74.209.0/24',
    '41.74.210.0/24',
    '41.74.211.0/24',
    '41.74.212.0/24',
    '41.74.213.0/24',
    '41.74.214.0/24',
    '41.74.215.0/24',
    '41.74.216.0/24',
    '41.74.217.0/24',
    '41.74.218.0/24',
    '41.74.219.0/24',
    '41.74.220.0/24',
    '41.74.221.0/24',
    '41.74.222.0/24',
    '41.74.223.0/24',
    '41.74.224.0/24',
    '41.74.225.0/24',
    '41.74.226.0/24',
    '41.74.227.0/24',
    '41.74.228.0/24',
    '41.74.229.0/24',
    '41.74.230.0/24',
    '41.74.231.0/24',
    '41.74.232.0/24',
    '41.74.233.0/24',
    '41.74.234.0/24',
    '41.74.235.0/24',
    '41.74.236.0/24',
    '41.74.237.0/24',
    '41.74.238.0/24',
    '41.74.239.0/24',
    '41.74.240.0/24',
    '41.74.241.0/24',
    '41.74.242.0/24',
    '41.74.243.0/24',
    '41.74.244.0/24',
    '41.74.245.0/24',
    '41.74.246.0/24',
    '41.74.247.0/24',
    '41.74.248.0/24',
    '41.74.249.0/24',
    '41.74.250.0/24',
    '41.74.251.0/24',
    '41.74.252.0/24',
    '41.74.253.0/24',
    '41.74.254.0/24',
    '41.74.255.0/24'
  ]

  /**
   * Legacy PayFast signature verification (kept for backward compatibility if needed)
   * @deprecated Use verifyPaystackSignature for new implementations
   */
  static verifyPayFastSignature(_data: Record<string, any>, _signature: string): boolean {
    // Legacy method - no longer used with Paystack
    return false
  }

  /**
   * Legacy PayFast IP validation (kept for reference)
   * Paystack uses HMAC signatures instead of IP validation
   * @deprecated Not used for Paystack
   */
  static validatePayFastIP(_ipAddress: string): boolean {
    // Legacy method - Paystack doesn't require IP validation
    return true
  }

  /**
   * Check if IP is in CIDR range
   */
  private static isIPInRange(ip: string, cidr: string): boolean {
    const [range, bits] = cidr.split('/')
    const mask = -1 << (32 - parseInt(bits))
    const ipNum = this.ipToNumber(ip)
    const rangeNum = this.ipToNumber(range)
    return (ipNum & mask) === (rangeNum & mask)
  }

  /**
   * Convert IP address to number
   */
  private static ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0
  }

  /**
   * Validate payment security context
   */
  static validatePaymentSecurity(security: PaymentSecurity): boolean {
    try {
      // Check timestamp (prevent replay attacks)
      const now = Date.now()
      const requestTime = security.timestamp.getTime()
      const timeDiff = Math.abs(now - requestTime)
      
      // Allow 5 minutes tolerance
      if (timeDiff > 5 * 60 * 1000) {
        captureMessage('Payment request timestamp too old', { level: 'warning', component: 'payment-security', timeDiff, ipAddress: security.ipAddress })
        return false
      }

      // Validate merchant ID (if provided - Paystack uses secret key instead)
      // This is kept for backward compatibility
      if (security.merchantId && !env.PAYSTACK_SECRET_KEY) {
        captureMessage('Payment gateway not configured', { level: 'error', component: 'payment-security', ipAddress: security.ipAddress })
        return false
      }

      return true
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), { action: 'security-validation', component: 'payment-security' })
      return false
    }
  }

  /**
   * Generate secure payment ID
   */
  static generateSecurePaymentId(): string {
    const timestamp = Date.now().toString(36)
    const random = crypto.randomBytes(8).toString('hex')
    return `vn_${timestamp}_${random}`
  }

  /**
   * Validate payment amount (prevent manipulation)
   */
  static validatePaymentAmount(amount: number, expectedAmount: number, tolerance: number = 0.01): boolean {
    return Math.abs(amount - expectedAmount) <= tolerance
  }

  /**
   * Sanitize payment data for logging (remove sensitive info)
   */
  static sanitizePaymentData(data: any): any {
    const sanitized = { ...data }
    
    // Remove sensitive fields
    delete sanitized.signature
    delete sanitized.token
    delete sanitized.passphrase
    
    // Mask email addresses
    if (sanitized.email_address) {
      const [local, domain] = sanitized.email_address.split('@')
      sanitized.email_address = `${local.slice(0, 2)}***@${domain}`
    }
    
    return sanitized
  }
}
