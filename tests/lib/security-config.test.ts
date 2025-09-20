import { describe, it, expect } from 'vitest'

describe('security-config', () => {
  it('parses allowed origins from env in production', async () => {
    process.env.NODE_ENV = 'production'
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test'
    process.env.CLOUDINARY_CLOUD_NAME = 'test'
    process.env.CLOUDINARY_API_KEY = 'test'
    process.env.CLOUDINARY_API_SECRET = 'test'
    process.env.RESEND_API_KEY = 'test'
    process.env.PAYFAST_MERCHANT_ID = 'test'
    process.env.PAYFAST_MERCHANT_KEY = 'test'
    process.env.PAYFAST_PASSPHRASE = 'test'
    process.env.RECAPTCHA_SECRET_KEY = 'test'
    process.env.UPSTASH_REDIS_REST_URL = 'https://www.varsitynest.space'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test'
    process.env.SENTRY_DSN = 'https://www.varsitynest.space/123'
    process.env.ALLOWED_ORIGINS = 'https://www.varsitynest.space, https://app.varsitynest.space'

    const { defaultSecurityConfig } = await import('@/lib/security-config')
    expect(defaultSecurityConfig.cors.origin).toEqual([
      'https://www.varsitynest.space',
      'https://app.varsitynest.space'
    ])
  })
})



