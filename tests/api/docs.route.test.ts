import { describe, it, expect } from 'vitest'

describe('API docs generator', () => {
  it('should generate a spec with server URL', async () => {
    const mod = await import('@/lib/api-documentation')
    const spec = (mod as any).ApiDocumentation.generateApiSpec()
    expect(spec.servers?.[0]?.url).toBeDefined()
  })
})


