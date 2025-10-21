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
