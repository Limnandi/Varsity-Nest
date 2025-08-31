import { createStackAuth } from "@stackframe/stack"
import { createNextAuth } from "@stackframe/stack/nextjs"

export const { auth, signIn, signOut, getSession } = createStackAuth({
  projectId: process.env.STACK_PROJECT_ID!,
  secret: process.env.STACK_SECRET!,
  providers: [
    {
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Import the database function dynamically to avoid circular imports
          const { authenticateUser } = await import("./database")
          
          const user = await authenticateUser(credentials.email, credentials.password)
          
          if (user && user.isActive) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role
            }
          }
          
          return null
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      }
    }
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/register",
    error: "/auth/error"
  }
})

export const { handlers: { GET, POST } } = createNextAuth(auth)
