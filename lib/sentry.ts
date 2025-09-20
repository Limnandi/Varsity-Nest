import * as Sentry from "@sentry/nextjs"
import { env } from "@/lib/env"

Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.NODE_ENV,
  tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
  debug: env.NODE_ENV === "development",
})

export { Sentry }
