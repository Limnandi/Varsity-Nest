"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStackApp } from "@stackframe/stack"

export default function LogoutPage() {
  const router = useRouter()
  const app = useStackApp()

  useEffect(() => {
    const run = async () => {
      try {
        // Clear localStorage session data
        localStorage.removeItem('varsityNestSession')
        
        // Logout from StackAuth
        await app.logout()
      } catch (e) {
        // ignore
      } finally {
        router.replace("/")
      }
    }
    run()
  }, [app, router])

  return null
}


