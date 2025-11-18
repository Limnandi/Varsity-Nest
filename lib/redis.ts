import { Redis } from "@upstash/redis"
import { env } from "./env"

// Design pattern: Singleton
export const redis = new Redis({
  url: env.REDIS_URL,
  token: env.REDIS_TOKEN,
})

// OTP Management
export async function storeOTP(email: string, otp: string, type: "registration" | "password_reset" = "registration") {
  const key = `otp:${type}:${email}`
  await redis.set(key, otp, { ex: 1800 }) // 30 minutes expiry
  await redis.set(`${key}:attempts`, "0", { ex: 1800 }) // Track attempts
}

export async function getOTP(
  email: string,
  type: "registration" | "password_reset" = "registration",
): Promise<string | null> {
  const key = `otp:${type}:${email}`
  const value = await redis.get(key) as string | null
  return value
}

export async function deleteOTP(email: string, type: "registration" | "password_reset" = "registration") {
  const key = `otp:${type}:${email}`
  await redis.del(key)
  await redis.del(`${key}:attempts`)
}

export async function incrementOTPAttempts(
  email: string,
  type: "registration" | "password_reset" = "registration",
): Promise<number> {
  const key = `otp:${type}:${email}:attempts`
  const attempts = await redis.incr(key)
  // Reset expiry using expire
  try {
    await redis.expire(key, 1800) // Reset expiry (30 minutes)
  } catch (e) {
    // ignore if expire not supported
  }
  return Number(attempts ?? 0)
}

export async function getOTPAttempts(
  email: string,
  type: "registration" | "password_reset" = "registration",
): Promise<number> {
  const key = `otp:${type}:${email}:attempts`
  const attempts = await redis.get(key) as string | null
  return attempts ? Number.parseInt(attempts as string) : 0
}

// Session Management - Single Session Enforcement
export async function setUserSession(userId: string, sessionToken: string, expiresIn: number = 7 * 24 * 60 * 60): Promise<void> {
  const key = `user:${userId}:session`
  await redis.set(key, sessionToken, { ex: expiresIn })
}

export async function getUserSession(userId: string): Promise<string | null> {
  const key = `user:${userId}:session`
  const token = await redis.get(key) as string | null
  return token
}

export async function invalidateUserSession(userId: string): Promise<void> {
  const key = `user:${userId}:session`
  await redis.del(key)
}

// Token Blacklist - For instant logout
export async function blacklistToken(token: string, expiresIn: number = 24 * 60 * 60): Promise<void> {
  const key = `blacklist:${token}`
  await redis.set(key, '1', { ex: expiresIn })
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const key = `blacklist:${token}`
  const blacklisted = await redis.get(key)
  return blacklisted !== null
}

// Rate Limiting
export async function checkRateLimit(key: string, maxRequests: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
  const current = await redis.get(key)
  const count = current ? Number.parseInt(current as string) : 0
  
  if (count >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }
  
  await redis.incr(key)
  await redis.expire(key, windowSeconds)
  
  return { allowed: true, remaining: maxRequests - count - 1 }
}