import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest'
// We'll test the internal send flow by importing the route handler and mocking
// external dependencies: '@/lib/stack' and '@/lib/email-resend'.

// Create mock functions that will be used in the tests
const mockSendEmail = vi.fn()
const mockResend = vi.fn()

// Mock the modules at the top level
vi.mock('@/lib/stack', () => ({
  getStackServerApp: () => ({
    sendEmail: mockSendEmail,
  }),
}))

vi.mock('@/lib/email-resend', () => ({ 
  sendVerificationEmailResend: mockResend 
}))

// Mock secureDb to avoid real DB calls in test
vi.mock('@/lib/database-secure', () => {
  const selectMock = () => ({ from: () => ({ where: () => ({ limit: () => [] }) }) })
  const insertMock = () => ({ values: () => ({ onConflictDoUpdate: () => ({ returning: () => [{ id: 'u-mock' }] }) }) })
  const updateMock = () => ({ set: () => ({ where: () => ({}) }) })
  return {
    secureDb: {
      db: {
        select: selectMock,
        insert: insertMock,
        update: updateMock,
      },
    },
  }
})

describe('provider registration email send fallbacks', () => {
  let originalConsoleLog: any

  beforeEach(() => {
    originalConsoleLog = console.log
    vi.resetModules()
    vi.restoreAllMocks()
    
    // Reset mock implementations
    mockSendEmail.mockResolvedValue({ status: 'error', error: { code: 'REQUIRES_CUSTOM_EMAIL_SERVER' } })
    mockResend.mockResolvedValue({ ok: true, data: { id: 'resend-1' } })

    // Ensure Resend fallback is enabled in this test
    process.env.RESEND_API_KEY = 'test-resend-key'

    console.log('[TEST] Mocking getStackServerApp and sendVerificationEmailResend');
    console.log('[TEST] Setting process.env.RESEND_API_KEY to:', process.env.RESEND_API_KEY);
  })

  afterEach(() => {
    console.log = originalConsoleLog
  })

  it('falls back to Resend when app.sendEmail returns REQUIRES_CUSTOM_EMAIL_SERVER', async () => {
    // Import the helper directly to test send fallback behavior without DB
    const { sendVerificationForProvider } = await import('../../lib/email-verification')

    // Call the helper directly; it should attempt app.sendEmail and then invoke resend fallback
    console.log('[TEST] Calling sendVerificationForProvider with mock data');
    console.log('[TEST] Mock app.sendEmail:', mockSendEmail);
    await sendVerificationForProvider({
      email: 'provider@example.com',
      firstName: 'Provider',
      lastName: 'Example',
      userId: 'u-mock',
      providerId: 'p-mock',
    })

    expect(mockResend).toHaveBeenCalled()
  })
})
