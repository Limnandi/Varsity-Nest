import { describe, it, expect } from 'vitest'

describe('payment-security', () => {
  it('generates and verifies PayFast signature (happy path)', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test'
    process.env.CLOUDINARY_CLOUD_NAME = 'test'
    process.env.CLOUDINARY_API_KEY = 'test'
    process.env.CLOUDINARY_API_SECRET = 'test'
    process.env.RESEND_API_KEY = 'test'
    process.env.PAYFAST_MERCHANT_ID = 'merchant'
    process.env.PAYFAST_MERCHANT_KEY = 'key'
    process.env.PAYFAST_PASSPHRASE = 'pass'
    process.env.RECAPTCHA_SECRET_KEY = 'test'
    process.env.UPSTASH_REDIS_REST_URL = 'https://www.varsitynest.space'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test'

    const { PaymentSecurityService } = await import('@/lib/services/payment-security')
    const data = {
      amount_gross: '100.00',
      item_name: 'Test',
      merchant_id: 'merchant',
    } as any

    // Build string the same way as in service and sign it
    const sortedKeys = Object.keys(data).sort()
    let paramString = ''
    for (const key of sortedKeys) {
      const value = (data as any)[key]
      if (value !== undefined && value !== '' && key !== 'signature') {
        paramString += `${key}=${encodeURIComponent(String(value))}&`
      }
    }
    paramString = paramString.slice(0, -1)
    paramString += `&passphrase=${encodeURIComponent('pass')}`
    const crypto = await import('crypto')
    const signature = crypto.createHash('md5').update(paramString).digest('hex')

    expect(PaymentSecurityService.verifyPayFastSignature(data, signature)).toBe(true)
    expect(PaymentSecurityService.verifyPayFastSignature(data, 'deadbeef')).toBe(false)
  })
})



