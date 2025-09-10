import crypto from "crypto"
import { PayFastWebhook, PaymentSecurity } from "@/lib/schemas/payment"
import { Sentry } from "@/lib/sentry"

export class PaymentSecurityService {
  private static readonly PAYFAST_IP_RANGES = [
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
   * Validate PayFast webhook signature with enhanced security
   */
  static verifyPayFastSignature(data: PayFastWebhook, signature: string): boolean {
    try {
      // Create parameter string with sorted keys (PayFast requirement)
      let paramString = ""
      const sortedKeys = Object.keys(data).sort()

      for (const key of sortedKeys) {
        const value = data[key as keyof PayFastWebhook]
        // Only include non-empty values and exclude signature field
        if (value !== undefined && value !== "" && key !== "signature") {
          paramString += `${key}=${encodeURIComponent(String(value))}&`
        }
      }

      // Remove trailing &
      paramString = paramString.slice(0, -1)

      // Add passphrase for enhanced security
      const passphrase = process.env.PAYFAST_PASSPHRASE
      if (passphrase) {
        paramString += `&passphrase=${encodeURIComponent(passphrase)}`
      }

      // Generate MD5 hash (PayFast standard)
      const generatedSignature = crypto.createHash("md5").update(paramString).digest("hex")
      
      // Use timing-safe comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(generatedSignature, 'hex'),
        Buffer.from(signature, 'hex')
      )
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: 'payment-security' },
        extra: { action: 'signature-verification' }
      })
      return false
    }
  }

  /**
   * Validate PayFast webhook IP address
   */
  static validatePayFastIP(ipAddress: string): boolean {
    try {
      // Check if IP is in PayFast ranges
      return this.PAYFAST_IP_RANGES.some(range => this.isIPInRange(ipAddress, range))
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: 'payment-security' },
        extra: { action: 'ip-validation', ipAddress }
      })
      return false
    }
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
        Sentry.captureMessage('Payment request timestamp too old', {
          level: 'warning',
          tags: { component: 'payment-security' },
          extra: { timeDiff, ipAddress: security.ipAddress }
        })
        return false
      }

      // Validate merchant ID
      if (security.merchantId !== process.env.PAYFAST_MERCHANT_ID) {
        Sentry.captureMessage('Invalid merchant ID in payment request', {
          level: 'error',
          tags: { component: 'payment-security' },
          extra: { merchantId: security.merchantId, ipAddress: security.ipAddress }
        })
        return false
      }

      return true
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: 'payment-security' },
        extra: { action: 'security-validation' }
      })
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
