import crypto from "crypto"
import { PaymentSecurity } from "@/lib/schemas/payment"
import { captureException, captureMessage } from '@/lib/logging/config'
import { env } from "@/lib/env"

export class PaymentSecurityService {
  /**
   * Validate Paystack webhook signature using HMAC SHA512
   * Paystack signs webhooks with HMAC SHA512 using the secret key
   * The signature is in the x-paystack-signature header
   */
  static verifyPaystackSignature(payload: string, signature: string): boolean {
    try {
      if (!signature || !payload) {
        return false
      }
      
      const hash = crypto
        .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
        .update(payload)
        .digest('hex')
      
      // Use timing-safe comparison to prevent timing attacks
      // Both must be same length for timingSafeEqual to work
      const hashBuffer = Buffer.from(hash, 'hex')
      const signatureBuffer = Buffer.from(signature, 'hex')
      
      if (hashBuffer.length !== signatureBuffer.length) {
        return false
      }
      
      return crypto.timingSafeEqual(hashBuffer, signatureBuffer)
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), { 
        action: 'paystack-signature-verification', 
        component: 'payment-security' 
      })
      return false
    }
  }

  /**
   * Validate Paystack webhook IP address
   * Paystack sends webhooks from these IP addresses:
   * - 52.31.139.75
   * - 52.49.173.169
   * - 52.214.14.220
   */
  static validatePaystackIP(clientIP: string): boolean {
    const allowedIPs = [
      '52.31.139.75',
      '52.49.173.169',
      '52.214.14.220'
    ]
    
    // Extract IP from x-forwarded-for (first IP in chain)
    const ip = clientIP.split(',')[0]?.trim() || clientIP
    
    return allowedIPs.includes(ip)
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
