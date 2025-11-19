import { z } from "zod"

/**
  Centralized, validated server-side environment configuration.
  This module validates all required environment variables at startup
  and provides a single source of truth for configuration values.
 */

const baseSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // App / URLs
  NEXT_PUBLIC_APP_URL: z.string().url({ message: "NEXT_PUBLIC_APP_URL must be a valid URL" }),
  API_BASE_URL: z.string().url({ message: "API_BASE_URL must be a valid URL" }).optional(),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Redis (support either Upstash naming or KV aliases; normalize later)
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  KV_REST_API_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  KV_REST_API_TOKEN: z.string().optional(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),

  // Email
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),

  // Security / Auth
  NEXTAUTH_SECRET: z.string().optional(),
  STACK_SECRET_SERVER_KEY: z.string().optional(),
  STACK_SECRET: z.string().optional(),

  // Paystack
  PAYSTACK_SECRET_KEY: z.string().min(1, "PAYSTACK_SECRET_KEY is required"),
  PAYSTACK_PUBLIC_KEY: z.string().min(1, "PAYSTACK_PUBLIC_KEY is required"),

  // Sentry
  SENTRY_DSN: z.string().url().optional(),

  // reCAPTCHA
  RECAPTCHA_SECRET_KEY: z.string().min(1, "RECAPTCHA_SECRET_KEY is required"),

  // CORS / Security
  ALLOWED_ORIGINS: z.string().optional(), // comma-separated
})

const parsed = baseSchema.safeParse(process.env)

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("\n")
  // Fail fast with clear message
  throw new Error(`Invalid environment configuration:\n${formatted}`)
}

const envRaw = parsed.data

// Normalize Redis configuration from supported variable names
const REDIS_URL = envRaw.UPSTASH_REDIS_REST_URL || envRaw.KV_REST_API_URL
const REDIS_TOKEN = envRaw.UPSTASH_REDIS_REST_TOKEN || envRaw.KV_REST_API_TOKEN

if (!REDIS_URL || !REDIS_TOKEN) {
  throw new Error("Redis configuration is missing: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL and KV_REST_API_TOKEN)")
}

// In production, enforce stricter requirements
if (envRaw.NODE_ENV === "production") {
  // Sentry is strongly recommended in production
  if (!envRaw.SENTRY_DSN) {
    throw new Error("SENTRY_DSN is required in production")
  }

  // Require explicit CORS origins
  if (!envRaw.ALLOWED_ORIGINS || envRaw.ALLOWED_ORIGINS.trim().length === 0) {
    throw new Error("ALLOWED_ORIGINS is required in production (comma-separated list)")
  }
}

// Derive commonly used config values
const APP_URL = envRaw.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
const API_URL = (envRaw.API_BASE_URL || `${APP_URL}/api`).replace(/\/$/, "")
const ALLOWED_ORIGIN_LIST = (envRaw.ALLOWED_ORIGINS || "").split(",").map((v) => v.trim()).filter(Boolean)

export const env = {
  NODE_ENV: envRaw.NODE_ENV,
  APP_URL,
  API_URL,

  // Database
  DATABASE_URL: envRaw.DATABASE_URL,

  // Redis
  REDIS_URL,
  REDIS_TOKEN,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: envRaw.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: envRaw.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: envRaw.CLOUDINARY_API_SECRET,

  // Email
  RESEND_API_KEY: envRaw.RESEND_API_KEY,

  // Auth
  NEXTAUTH_SECRET: envRaw.NEXTAUTH_SECRET,
  STACK_SECRET_SERVER_KEY: envRaw.STACK_SECRET_SERVER_KEY || envRaw.STACK_SECRET,

  // Paystack
  PAYSTACK_SECRET_KEY: envRaw.PAYSTACK_SECRET_KEY,
  PAYSTACK_PUBLIC_KEY: envRaw.PAYSTACK_PUBLIC_KEY,

  // Sentry
  SENTRY_DSN: envRaw.SENTRY_DSN,

  // reCAPTCHA
  RECAPTCHA_SECRET_KEY: envRaw.RECAPTCHA_SECRET_KEY,

  // Security
  ALLOWED_ORIGINS: ALLOWED_ORIGIN_LIST,
} as const


