import '@testing-library/jest-dom'

// Provide minimal env to avoid imports failing in tests by default
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://test:test@localhost:5432/test'
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'test'
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'test'
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'test'
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 'test'
process.env.PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'test'
process.env.PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || 'test'
process.env.RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || 'test'
process.env.CONTACT_RECIPIENT_EMAIL = process.env.CONTACT_RECIPIENT_EMAIL || 'support@varsitynest.space'
process.env.UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || 'https://www.varsitynest.space'
process.env.UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || 'test'



