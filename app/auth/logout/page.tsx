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


