import { env } from "@/lib/env"

if (!env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required')
}

export const encodedKey: Uint8Array = new TextEncoder().encode(env.NEXTAUTH_SECRET)

// TypeScript declaration
export {}