import { describe, it, expect } from 'vitest'

describe('Student register API', () => {
  it('returns 400 when required fields are missing', async () => {
    const mod = await import('../../app/api/auth/register/student/route')
    const handler = (mod as any).POST
    // Create a minimal Request-like object with an empty payload
    const req = new Request('http://localhost/api/auth/register/student', { method: 'POST', body: JSON.stringify({}) })
    const res = await handler(req as any)
    const status = typeof (res?.status) === 'number' ? res.status : 500
    // Expect a 400 response for missing required fields
    expect(status).toBe(400)
  })
})
