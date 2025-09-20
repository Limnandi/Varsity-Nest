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
  await redis.setex(key, 300, otp) // 5 minutes expiry
  await redis.setex(`${key}:attempts`, 300, "0") // Track attempts
}

export async function getOTP(
  email: string,
  type: "registration" | "password_reset" = "registration",
): Promise<string | null> {
  const key = `otp:${type}:${email}`
  return await redis.get(key)
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
  await redis.expire(key, 300) // Reset expiry
  return attempts
}

export async function getOTPAttempts(
  email: string,
  type: "registration" | "password_reset" = "registration",
): Promise<number> {
  const key = `otp:${type}:${email}:attempts`
  const attempts = await redis.get(key)
  return attempts ? Number.parseInt(attempts as string) : 0
}
