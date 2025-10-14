import { StackClientApp, StackServerApp } from "@stackframe/stack"
import { publicEnv } from "@/lib/env.client"

// Singletons for client and server apps
let clientApp: InstanceType<typeof StackClientApp> | null = null
let serverApp: InstanceType<typeof StackServerApp> | null = null

//Design pattern: Singleton
export function getStackClientApp() {
  if (!clientApp) {
    clientApp = new StackClientApp({
      projectId: publicEnv.STACK_PROJECT_ID,
      publishableClientKey: publicEnv.STACK_PUBLISHABLE_CLIENT_KEY,
      tokenStore: "cookie",
      redirectMethod: "nextjs",
    })
  }
  return clientApp
}

//Design pattern: Singleton
export function getStackServerApp() {
  if (!serverApp) {
    // Only import server env on server side
    if (typeof window === 'undefined') {
      const { env } = require("@/lib/env")
      serverApp = new StackServerApp({
        projectId: publicEnv.STACK_PROJECT_ID,
        secretServerKey: env.STACK_SECRET_SERVER_KEY as string,
        tokenStore: "nextjs-cookie",
        oauthScopesOnSignIn: {
          // Request basic profile/email scopes so Google identity can be linked seamlessly
          google: ["openid", "email", "profile"],
        },
        urls: {
          oauthCallback: "/handler/oauth-callback",
          error: "/handler/error",
          signIn: "/auth/login",
          signUp: "/auth/register",
          afterSignIn: "/auth/redirect",
          afterSignUp: "/auth/check-email",
          // After email verification, redirect to dedicated success page
          emailVerification: "/auth/email-verified",
        },
      })
    } else {
      throw new Error("getStackServerApp() can only be called on the server side")
    }
  }
  return serverApp
}


