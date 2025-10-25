"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
var zod_1 = require("zod");
/**
  Centralized, validated server-side environment configuration.
  This module validates all required environment variables at startup
  and provides a single source of truth for configuration values.
 */
var baseSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    // App / URLs
    NEXT_PUBLIC_APP_URL: zod_1.z.string().url({ message: "NEXT_PUBLIC_APP_URL must be a valid URL" }),
    API_BASE_URL: zod_1.z.string().url({ message: "API_BASE_URL must be a valid URL" }).optional(),
    // Database
    DATABASE_URL: zod_1.z.string().min(1, "DATABASE_URL is required"),
    // Redis (support either Upstash naming or KV aliases; normalize later)
    UPSTASH_REDIS_REST_URL: zod_1.z.string().optional(),
    KV_REST_API_URL: zod_1.z.string().optional(),
    UPSTASH_REDIS_REST_TOKEN: zod_1.z.string().optional(),
    KV_REST_API_TOKEN: zod_1.z.string().optional(),
    // Cloudinary
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
    CLOUDINARY_API_KEY: zod_1.z.string().min(1, "CLOUDINARY_API_KEY is required"),
    CLOUDINARY_API_SECRET: zod_1.z.string().min(1, "CLOUDINARY_API_SECRET is required"),
    // Email
    RESEND_API_KEY: zod_1.z.string().min(1, "RESEND_API_KEY is required"),
    // Security / Auth
    NEXTAUTH_SECRET: zod_1.z.string().optional(),
    STACK_SECRET_SERVER_KEY: zod_1.z.string().optional(),
    STACK_SECRET: zod_1.z.string().optional(),
    // PayFast
    PAYFAST_MERCHANT_ID: zod_1.z.string().min(1, "PAYFAST_MERCHANT_ID is required"),
    PAYFAST_MERCHANT_KEY: zod_1.z.string().min(1, "PAYFAST_MERCHANT_KEY is required"),
    PAYFAST_PASSPHRASE: zod_1.z.string().min(1, "PAYFAST_PASSPHRASE is required"),
    // Sentry
    SENTRY_DSN: zod_1.z.string().url().optional(),
    // reCAPTCHA
    RECAPTCHA_SECRET_KEY: zod_1.z.string().min(1, "RECAPTCHA_SECRET_KEY is required"),
    // CORS / Security
    ALLOWED_ORIGINS: zod_1.z.string().optional(), // comma-separated
});
var parsed = baseSchema.safeParse(process.env);
if (!parsed.success) {
    var formatted = parsed.error.issues
        .map(function (i) { return "".concat(i.path.join("."), ": ").concat(i.message); })
        .join("\n");
    // Fail fast with clear message
    throw new Error("Invalid environment configuration:\n".concat(formatted));
}
var envRaw = parsed.data;
// Normalize Redis configuration from supported variable names
var REDIS_URL = envRaw.UPSTASH_REDIS_REST_URL || envRaw.KV_REST_API_URL;
var REDIS_TOKEN = envRaw.UPSTASH_REDIS_REST_TOKEN || envRaw.KV_REST_API_TOKEN;
if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error("Redis configuration is missing: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL and KV_REST_API_TOKEN)");
}
// In production, enforce stricter requirements
if (envRaw.NODE_ENV === "production") {
    // Sentry is strongly recommended in production
    if (!envRaw.SENTRY_DSN) {
        throw new Error("SENTRY_DSN is required in production");
    }
    // Require explicit CORS origins
    if (!envRaw.ALLOWED_ORIGINS || envRaw.ALLOWED_ORIGINS.trim().length === 0) {
        throw new Error("ALLOWED_ORIGINS is required in production (comma-separated list)");
    }
}
// Derive commonly used config values
var APP_URL = envRaw.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
var API_URL = (envRaw.API_BASE_URL || "".concat(APP_URL, "/api")).replace(/\/$/, "");
var ALLOWED_ORIGIN_LIST = (envRaw.ALLOWED_ORIGINS || "").split(",").map(function (v) { return v.trim(); }).filter(Boolean);
exports.env = {
    NODE_ENV: envRaw.NODE_ENV,
    APP_URL: APP_URL,
    API_URL: API_URL,
    // Database
    DATABASE_URL: envRaw.DATABASE_URL,
    // Redis
    REDIS_URL: REDIS_URL,
    REDIS_TOKEN: REDIS_TOKEN,
    // Cloudinary
    CLOUDINARY_CLOUD_NAME: envRaw.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: envRaw.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: envRaw.CLOUDINARY_API_SECRET,
    // Email
    RESEND_API_KEY: envRaw.RESEND_API_KEY,
    // Auth
    NEXTAUTH_SECRET: envRaw.NEXTAUTH_SECRET,
    STACK_SECRET_SERVER_KEY: envRaw.STACK_SECRET_SERVER_KEY || envRaw.STACK_SECRET,
    // PayFast
    PAYFAST_MERCHANT_ID: envRaw.PAYFAST_MERCHANT_ID,
    PAYFAST_MERCHANT_KEY: envRaw.PAYFAST_MERCHANT_KEY,
    PAYFAST_PASSPHRASE: envRaw.PAYFAST_PASSPHRASE,
    // Sentry
    SENTRY_DSN: envRaw.SENTRY_DSN,
    // reCAPTCHA
    RECAPTCHA_SECRET_KEY: envRaw.RECAPTCHA_SECRET_KEY,
    // Security
    ALLOWED_ORIGINS: ALLOWED_ORIGIN_LIST,
};
