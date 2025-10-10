import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Import the route handler using relative path (Vitest + TS path mapping may differ)
import * as route from '../app/api/auth/resend-verification/route'

vi.mock('../lib/stack', () => ({
  getStackServerApp: () => ({
    getUser: async (id: string) => ({ id, primaryEmail: 'test@example.com', listContactChannels: async () => [{ type: 'email', value: 'test@example.com' }] }),
  }),
}))

vi.mock('../lib/email-resend', () => ({
  sendVerificationEmailResend: async (email: string, callbackUrl: string) => ({ ok: true, provider: 'resend', email }),
}))

vi.mock('../lib/email-template', () => ({ renderVerificationEmail: (callbackUrl: string) => `<a href="${callbackUrl}">Verify</a>` }))
vi.mock('../lib/json-logger', () => ({ jsonLog: () => {} }))

describe('resend-verification route', () => {
  it('returns 400 when no userId or email is provided', async () => {
    const req = {
      json: async () => ({ userId: null, email: null }),
    } as unknown as NextRequest

    const res = await route.POST(req)
    expect(res.status).toBe(400)
  })

  it('falls back to Resend when sendEmail returns REQUIRES_CUSTOM_EMAIL_SERVER', async () => {
    // Create a mock app where sendEmail returns REQUIRES_CUSTOM_EMAIL_SERVER
    const sendEmailMock = vi.fn(async (opts: any) => ({ status: 'error', error: { code: 'REQUIRES_CUSTOM_EMAIL_SERVER' } }))
    const mockApp = {
      getUser: async (id: string) => ({ id, listContactChannels: async () => [{ type: 'email', value: 'test@example.com' }] }),
      sendEmail: sendEmailMock,
    }

    // Spy on the module and replace getStackServerApp to return our mock
    const stackMod = await import('../lib/stack')
    vi.spyOn(stackMod, 'getStackServerApp').mockImplementation(() => mockApp as any)

    // Ensure Resend fallback path is enabled
    const prevKey = process.env.RESEND_API_KEY
    process.env.RESEND_API_KEY = 'test-key'

    const req = {
      json: async () => ({ userId: 'u-1' }),
    } as unknown as NextRequest

    const res = await route.POST(req)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.fallback).toBe('resend')

    // restore env
    process.env.RESEND_API_KEY = prevKey
  })
})
