/**
 * Idempotency Key Generation Utility
 * Generates unique idempotency keys for payment requests
 * 
 * This utility ensures that payment requests can be safely retried without
 * creating duplicate charges. Each key is unique and tied to a specific user.
 */

/**
 * Generates a unique idempotency key for payment requests
 * Format: {userId}_{timestamp}_{random}
 * 
 * The key format ensures uniqueness through:
 * - User ID: Identifies the requester
 * - Timestamp: Provides temporal uniqueness
 * - Random string: Adds additional entropy
 * 
 * @param userId - The user ID (provider or agent)
 * @returns A unique idempotency key string
 * @throws {Error} If userId is empty or invalid
 */
export function generateIdempotencyKey(userId: string): string {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new Error('Invalid userId: userId must be a non-empty string')
  }

  const sanitizedUserId = userId.trim().replace(/[^a-zA-Z0-9_-]/g, '_')
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  
  return `${sanitizedUserId}_${timestamp}_${random}`
}

/**
 * Validates an idempotency key format
 * 
 * Validates that the key follows the expected format:
 * - Minimum length: 10 characters
 * - Maximum length: 255 characters (database constraint)
 * - Format: {userId}_{timestamp}_{random}
 * - Contains at least 3 parts separated by underscores
 * - First part (userId) is non-empty
 * - Second part (timestamp) is a valid number
 * 
 * @param key - The idempotency key to validate
 * @returns true if the key format is valid, false otherwise
 */
export function isValidIdempotencyKey(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false
  }

  const trimmedKey = key.trim()
  
  if (trimmedKey.length < 10 || trimmedKey.length > 255) {
    return false
  }

  const parts = trimmedKey.split('_')
  
  if (parts.length < 3) {
    return false
  }

  const userId = parts[0]
  const timestamp = parts[1]

  if (!userId || userId.length === 0) {
    return false
  }

  const timestampNum = Number(timestamp)
  if (isNaN(timestampNum) || timestampNum <= 0) {
    return false
  }

  return true
}

