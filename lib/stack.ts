import { StackClientApp, StackServerApp } from "@stackframe/stack"
import { publicEnv } from "@/lib/env.client"
import { env } from "@/lib/env"

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
    serverApp = new StackServerApp({
      projectId: publicEnv.STACK_PROJECT_ID,
      secretServerKey: env.STACK_SECRET_SERVER_KEY as string,
      tokenStore: "nextjs-cookie",
      urls: {
        oauthCallback: "/handler/oauth-callback",
        error: "/handler/error",
        signIn: "/auth/login",
        signUp: "/auth/register",
        afterSignIn: "/auth/redirect",
        afterSignUp: "/auth/check-email",
        emailVerification: "/auth/check-email",
      },
    })
  }
  return serverApp
}


