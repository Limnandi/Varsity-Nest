import * as Sentry from "@sentry/nextjs"

// Initialize Sentry without importing server-only env into client bundles.
// - Server: reads from process.env.SENTRY_DSN (already validated by lib/env at startup elsewhere)
// - Client: reads from process.env.NEXT_PUBLIC_SENTRY_DSN (optional; Sentry disabled if not set)
const isServer = typeof window === "undefined"
const environment = process.env.NODE_ENV || "development"
const dsn = isServer ? process.env.SENTRY_DSN : process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  environment,
  tracesSampleRate: environment === "production" ? 0.1 : 1.0,
  debug: environment === "development",
})

export { Sentry }
