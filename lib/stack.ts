import { StackClientApp, StackServerApp } from "@stackframe/stack"

// Singletons for client and server apps
let clientApp: InstanceType<typeof StackClientApp> | null = null
let serverApp: InstanceType<typeof StackServerApp> | null = null

export function getStackClientApp() {
  if (!clientApp) {
    clientApp = new StackClientApp({
      projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID as string,
      publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY as string,
      tokenStore: "cookie",
      redirectMethod: "nextjs",
    })
  }
  return clientApp
}

export function getStackServerApp() {
  if (!serverApp) {
    serverApp = new StackServerApp({
      projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID as string,
      secretServerKey: (process.env.STACK_SECRET_SERVER_KEY || process.env.STACK_SECRET) as string,
      tokenStore: "nextjs-cookie",
      urls: {
        oauthCallback: "/handler/oauth-callback",
        error: "/handler/error",
        signIn: "/auth/login",
        signUp: "/auth/register",
        afterSignIn: "/auth/redirect",
        afterSignUp: "/auth/redirect",
      },
    })
  }
  return serverApp
}


