const secretKey = process.env.NEXTAUTH_SECRET
if (!secretKey) {
  throw new Error('NEXTAUTH_SECRET environment variable is required')
}

export const encodedKey: Uint8Array = new TextEncoder().encode(secretKey)

// TypeScript declaration
export {}