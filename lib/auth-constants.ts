import { env } from "@/lib/env"

// In production we require an explicit NEXTAUTH_SECRET. In non-production
// environments (dev/test) we allow a deterministic fallback to avoid
// crashing developer machines or CI where a secret may not be set.
if (!env.NEXTAUTH_SECRET && env.NODE_ENV === 'production') {
  throw new Error('NEXTAUTH_SECRET environment variable is required in production')
}

const secretForEncoding = env.NEXTAUTH_SECRET ?? 'dev-secret-placeholder-please-set'

if (!env.NEXTAUTH_SECRET) {
  // eslint-disable-next-line no-console
  console.warn('WARNING: NEXTAUTH_SECRET is not set. Using a development fallback secret. Do NOT use this in production.')
}

export const encodedKey: Uint8Array = new TextEncoder().encode(secretForEncoding)

// TypeScript declaration
export {}